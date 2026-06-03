---
title: Scale Kubernetes deployments to zero using KEDA
date: 2026-06-03 19:55:00
summary: "Notes from using KEDA's cron scaler to put dev, QA and staging clusters to sleep overnight: the ArgoCD gotchas (CRDs, kube-system RoleBinding, replica drift), and what you give up in exchange."
tags:
  - kubernetes
  - devops
---

If you have a multi-cluster EKS deployment for your development, QA and staging environments, those generally don't need to run at 3AM. No one is using any of that, except for maybe a few cronjobs to refresh data. Everything else is wasted idle compute.

The math is simple. A dev cluster running 24/7 bills for 168 hours a week. Trim it to office hours, weekdays only, and you're down to roughly 55. That's about two thirds of the compute spend on every environment nobody actively uses, and it stacks per cluster. For us that's dev, QA and staging.

The stock HPA can't really help with this; it scales on load, and its hard floor is one replica. It can't take your workloads to zero.

There are multiple ways to scale down your deployments to zero to make sure you don't waste that money. Recently I started using KEDA and a cron scaler to do the work for me.

KEDA is short for [Kubernetes Event-Driven Autoscaling](https://keda.sh/). It's an intelligent autoscaler that can integrate with Prometheus, VictoriaMetrics and many other more [specialized scalers](https://keda.sh/docs/2.19/scalers/) which allows it to scale based on, among many others, Kafka lag, queue depth, Prometheus queries, and the one we want: **cron**.

You install KEDA on your cluster once, and then define scaling intent using a `scaledObject`.

## Before you start

A few versions and assumptions to check:

- ArgoCD 2.5 or newer, so the `ServerSideApply=true` sync option exists.
- Your target Deployments should not pin `replicas:` in their Helm chart. If they do, ArgoCD will set it back on every sync and the `ignoreDifferences` rule below won't save you. Drop the field and let the HPA own it.

## Deploying KEDA using ArgoCD

KEDA ships an [official Helm chart](https://keda.sh/docs/2.19/deploy/) and installing it using ArgoCD is just one `Application` away:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: keda
  namespace: argocd
spec:
  project: platform
  destination:
    server: https://kubernetes.default.svc
    namespace: keda
  source:
    repoURL: https://kedacore.github.io/charts
    chart: keda
    targetRevision: 2.20.0
    helm:
      values: |
        crds:
          install: true
  syncPolicy:
    automated:
      selfHeal: true
      prune: false
    syncOptions:
      - CreateNamespace=true
      - ServerSideApply=true
```

That `syncOptions` block is doing a bit of heavy lifting. A few gotchas to go through:

### Gotcha 1: CRDs need server-side apply

KEDA installs a handful of CRDs (`ScaledObject`, `ScaledJob`, `TriggerAuthentication`). Argo CD's default client-side apply puts a `last-applied-configuration` field into an annotation, and chunky CRDs can blow past Kubernetes' 256 KB annotation limit causing your sync to fail with `metadata.annotations: Too long`. `ServerSideApply=true` sidesteps it entirely by letting the API server own field merging.

### Gotcha 2: The kube-system RoleBinding that breaks restrictive projects

KEDA's metrics adapter (`keda-operator-metrics-apiserver`) is an aggregated API server; it serves `external.metrics.k8s.io`, which is how the HPA reads KEDA's computed metrics. Per the Kubernetes aggregation-layer contract, every extension API server must read the `extension-apiserver-authentication` ConfigMap in `kube-system`. So the chart creates exactly one resource there:

```yaml
kind: RoleBinding
metadata:
  name: keda-operator-auth-reader
  namespace: kube-system
roleRef:
  kind: Role
  name: extension-apiserver-authentication-reader
```

If your `AppProject` restricts destination namespaces (and it should), the sync fails:

```yaml
namespace kube-system is not permitted in project '...'
```

The tempting fix is to add `kube-system` to your shared application project. But then every application can write to `kube-system` so instead, give platform-specific charts their own, more privileged project:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: platform
  namespace: argocd
spec:
  description: Cluster platform applications with elevated NS access.
  sourceRepos:
    - https://kedacore.github.io/charts
  destinations:
    - server: https://kubernetes.default.svc
      namespace: keda
    - server: https://kubernetes.default.svc
      namespace: kube-system
  clusterResourceWhitelist:
    - group: "*"
      kind: "*"
```

### Gotcha 3: Stop ArgoCD from fighting KEDA

Once KEDA scales your deployments to a set amount based on metrics or in this case a cron schedule, by default ArgoCD will try to reconcile with the known state. The fix is to add an `ignoreDifferences` rule on the `Application` (or templated in your `ApplicationSet`) for the replica field:

```yaml
ignoreDifferences:
  - group: apps
    kind: Deployment
    jsonPointers:
      - /spec/replicas
```

## The cron scaler

A cron trigger defines a window. Inside it you get `desiredReplicas`; outside every window, KEDA scales the target to `minReplicaCount`. Set that to `0` and the workload disappears when idle:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: internal-dashboard
  namespace: default
spec:
  scaleTargetRef:
    name: internal-dashboard # the Deployment
  minReplicaCount: 0 # enables scale-to-zero
  maxReplicaCount: 1
  cooldownPeriod: 300 # wait 5 min after a window ends
  triggers:
    - type: cron
      metadata:
        timezone: Europe/Amsterdam
        start: "0 7 * * 1-5" # Mon–Fri 07:00 → wake up
        end: "0 19 * * 1-5" # Mon–Fri 19:00 → sleep
        desiredReplicas: "1"
```

The generated HPA says `Min replicas: 1` which is correct. A normal HPA can't go below 1, so KEDA splits the job: the operator handles `0 ↔ 1`, the HPA handles `1 → max`. When the workload is asleep you'll see:

```yaml
Min replicas: 1
Deployment pods: 0 current / 0 desired
ScalingActive: False # "scaling is disabled since the replica count of the target is zero"
```

`ScalingActive: False` and a `<unknown>` metric value look alarming, but they're normal at zero. There are no pods to read metrics from. The proof it works is `0 current / 0 desired`.

Timezone is evaluated in the zone you name, not the cluster's clock. Nodes typically log in UTC, so a `07:00 Europe/Amsterdam` scale-up shows up in UTC in the logs. Set `timezone` explicitly and KEDA handles the conversion.

## What you give up

Scale-to-zero isn't free. The first request after `start:` hits an empty deployment, so you pay the cold-start cost: image pull if the layer cache has been evicted, pod start, readiness probe. For a typical Go or Node service that's usually under a minute. JVM workloads or anything loading a large model on boot will be slower.

A few ways to take the edge off:

- Set `start:` a few minutes before your earliest user shows up. If the office is in by 09:00, scaling up at 08:45 gets you a warm pod by the time anyone tries to log in.
- Run a second cron trigger to pre-warm a minute before peak load, e.g. just before a known batch job kicks off.
- Accept the delay. For internal dashboards and staging environments, nobody really cares about a 30 second cold start on the first hit of the day.

## When to use this

- Internal dashboards and admin tools.
- Development, QA and staging environments overnight and on weekends.
- Scheduled batch processors.
- Anything where "nobody touches this outside business hours" applies.

## When NOT to use this

- Anything serving real user traffic with an SLA. The cold start alone will eat your error budget.
- Stateful workloads that need to be around to flush state or hold connections open.
- Services with sticky sessions or long-lived in-flight requests you can't cleanly terminate.
- Workloads with slow warmup (JVMs with big classpaths, services that hydrate caches on boot, ML model loading) unless you're fine with a multi-minute first-request delay.
- Anything another team owns and depends on without knowing about the schedule. The surprise at 07:01 on a Saturday isn't worth the savings.
