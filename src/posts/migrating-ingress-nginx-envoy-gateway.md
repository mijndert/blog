---
title: Migrating from ingress-nginx to Envoy Gateway
date: 2026-05-18 14:05:00
summary: "Notes from migrating from ingress-nginx to Envoy Gateway with the Gateway API: shared Gateways, HTTPRoute patterns, ReferenceGrants, and the gotchas that slowed me down."
tags:
  - kubernetes
  - devops
---

If you're even remotely into Kubernetes, you've probably heard about the [ingress-nginx retirement](https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/). It's no longer maintained so it has to get replaced with something else. That something else is obviously something to do with [Gateway API](https://gateway-api.sigs.k8s.io/docs/introduction/) because it's the new hot thing everyone should be using.

I tried a bunch on a separate [EKS cluster](https://docs.aws.amazon.com/eks/), like HAProxy and Traefik, but eventually I landed on using [Envoy Gateway](https://gateway.envoyproxy.io/) since to me it felt like the most approachable and stable solution for our use case.

Since I started the migration I made a respectable number of mistakes. These are my notes.

## TL;DR

- Run one shared Gateway per audience (`shared-public`, `shared-private`), not one per service.
- The HTTPRoute itself is simple; the HTTPS redirect is a _second_ HTTPRoute attached to the `http` listener.
- nginx annotations don't map 1:1 — they split across `SecurityPolicy`, `BackendTrafficPolicy`, and `ClientTrafficPolicy`, and some live in the platform layer rather than the service chart.
- Cross-namespace TLS secrets need a `ReferenceGrant` in the secret's namespace.
- Argo Rollouts on Gateway API needs the `rollouts-plugin-trafficrouter-gatewayapi` plugin. Plan for it as a separate workstream.

## The shape of the migration

We use a monorepo of Helm charts for all of our in-house applications, which we deploy using ArgoCD. Each chart had an `Ingress` template which for the migration I guarded by `ingress.enabled`. Strategy:

1. Add an `HTTPRoute` template (and a `gateway:` values block) to every chart, opt-in via `gateway.enabled: true`.
2. Flip services to Envoy Gateway one at a time, staging first and production 1–2 weeks later. Yes, this is a DNS change.
3. Keep both the `Ingress` and `HTTPRoute` resources in the chart during the transition so I can flip back without a code change. Set `ingress.enabled: false` once the dust has settled.
4. Decommission `ingress-nginx` once everything is on Envoy Gateway.

## Lesson 1: don't give every application its own Gateway

The first version of the templates rendered a `Gateway` resource per chart:

```yaml
# what NOT to do — gateway per app
gateway:
  enabled: true
  gatewayClassName: envoy-gateway-private
  listeners:
    - name: example-app-http
      hostname: app.example.com
      port: 80
      protocol: HTTP
```

That works, but you end up with one LoadBalancer per service, separate TLS termination per app, and certs sprayed across namespaces. Within a month I deleted all of those and consolidated to two shared Gateways: `shared-public` and `shared-private` living in the `envoy-gateway-system` namespace. Service charts attach to them via `parentRef`:

```yaml
gateway:
  enabled: true
  parentRef:
    name: shared-public
    namespace: envoy-gateway-system
    sectionName: https
  hostnames:
    - app.example.com
```

If you're starting fresh: don't even render the `Gateway` resource from your service charts. Put it in a separate platform chart that the cluster owns. Service charts only own `HTTPRoute`.

## Lesson 2: the HTTPRoute is the easy part

Once the shared Gateways exist, the HTTPRoute template is almost embarrassingly simple:

{% raw %}

```yaml
{{- if .Values.gateway.enabled -}}
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: {{ .Values.appName }}-httproute
spec:
  parentRefs:
    - name: {{ .Values.gateway.parentRef.name }}
      namespace: {{ .Values.gateway.parentRef.namespace }}
      sectionName: {{ .Values.gateway.parentRef.sectionName }}
  hostnames:
    {{- range .Values.gateway.hostnames }}
    - {{ . | quote }}
    {{- end }}
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: {{ .Values.appName }}
          port: 3000
{{- end }}
```

{% endraw %}

That's it. No annotations, no controller-specific knobs, no `nginx.ingress.kubernetes.io/*` configuration mini-language (more on that later). It's the cleanest part of the move.

## Lesson 3: HTTPS redirect is a second resource

If you're used to `nginx.ingress.kubernetes.io/ssl-redirect: "true"`, the Gateway API equivalent is a _second_ HTTPRoute attached to the `http` listener that 301s to https:

{% raw %}

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: {{ .Values.appName }}-https-redirect
spec:
  parentRefs:
    - name: {{ .Values.gateway.parentRef.name }}
      namespace: {{ .Values.gateway.parentRef.namespace }}
      sectionName: {{ .Values.gateway.httpsRedirect.sectionName }}  # http
  hostnames: {{ .Values.gateway.hostnames }}
  rules:
    - filters:
        - type: RequestRedirect
          requestRedirect:
            scheme: https
            statusCode: 301
```

{% endraw %}

It's a route doing redirects so it's conceptually cleaner, but it doubles the number of resources to remember per public-facing service. I gated it behind a `gateway.httpsRedirect.enabled` flag so it's completely optional. Most of our services run on HTTPS only anyway.

## Lesson 4: sectionName will burn you

This is the single thing that's bitten me hardest. `parentRef.sectionName` selects which listener on the shared Gateway your route attaches to, typically `http` (port 80) or `https` (port 443). Get it wrong and:

- Your HTTPRoute attaches successfully (status reports `Accepted: True`).
- The route exists, the configuration looks good.
- The application just doesn't work.

I shipped `sectionName: http` to an HTTPRoute that was supposed to serve HTTPS, watched it get accepted, and had to correct it in a follow-up commit. Nothing in the schema or the gateway status told me it was wrong; the listener just silently didn't match what the workload was expecting.

Something that would've saved me: a linter / pre-commit hook that checks `sectionName` against the known listeners on `shared-public` / `shared-private`.

## Lesson 5: run Ingress and HTTPRoute in parallel

I kept the `Ingress` template in every chart, gated by `ingress.enabled`. Flipping a service means flipping DNS from the nginx ingress hostname to the Envoy Gateway hostname, then setting `ingress.enabled: false` once I've watched it for a day. The chart carries both resources for as long as the migration takes, which adds another task on the backlog (cleaning it all up) but is operationally reassuring.

Every chart now has two templates and two values blocks for the same logical thing. Once Envoy Gateway is in its steady state and the dust has settled, all the old code will be ripped out.

## Lesson 6: not everything translates

When I migrated the first nginx Ingress, I tried to mentally map each annotation to a Gateway API field. That's not quite how it works. The annotations land in three different Envoy Gateway resource types, and one of them isn't even owned by the service chart:

| nginx Ingress annotation                    | Envoy Gateway equivalent              | Where it lives       |
| ------------------------------------------- | ------------------------------------- | -------------------- |
| `auth-type: basic` + `auth-secret`          | `SecurityPolicy.spec.basicAuth`       | Service chart        |
| `enable-cors` + `cors-*`                    | `SecurityPolicy.spec.cors`            | Service chart        |
| `proxy-read-timeout` / `proxy-send-timeout` | `BackendTrafficPolicy.spec.timeout`   | Service chart        |
| `proxy-body-size`                           | `ClientTrafficPolicy` on the listener | Platform (Terraform) |
| `rewrite-target`                            | `HTTPRoute` URLRewrite filter         | Service chart        |
| `configuration-snippet`                     | (no equivalent — refactor or drop)    | —                    |

As a concrete example, this is what basic auth looks like now:

```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: SecurityPolicy
metadata:
  name: example-app-basic-auth
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: example-app-httproute
  basicAuth:
    users:
      name: example-app-auth # Secret with htpasswd entries
```

The secret format matches the nginx convention (htpasswd-style entries), so existing credentials work unchanged.

Timeouts and body size are split across two different policy types, which surprised me. `BackendTrafficPolicy` covers upstream timeouts (request, connection-idle, TCP connect), that goes in the service chart, attached to the `HTTPRoute`. `ClientTrafficPolicy` covers listener-level things like max request body size, that goes on the Gateway listener, which we manage in Terraform along with the rest of the platform.

## Lesson 7: cross-namespace TLS secrets need a ReferenceGrant

The shared Gateway lives in `envoy-gateway-system`. The TLS cert secret lives in a different namespace. By default Gateway API forbids cross-namespace references to secrets for the obvious reason that any random Gateway in any namespace shouldn't be able to read any secret it likes.

The fix is a `ReferenceGrant` in the namespace that owns the secret, explicitly allowing Gateway resources in `envoy-gateway-system` to read that one specific secret:

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: ReferenceGrant
metadata:
  name: domain-cert-grant
  namespace: default # where the cert secret lives
spec:
  from:
    - group: gateway.networking.k8s.io
      kind: Gateway
      namespace: envoy-gateway-system
  to:
    - group: ""
      kind: Secret
      name: domain-cert
```

We manage this as a Terraform resource (`domain_cert_reference_grant`) so the grant is provisioned alongside the cert it refers to. Losing the grant would break TLS on every public hostname at once — the kind of thing you really want represented as managed infrastructure rather than a one-off kubectl apply.

A few things that aren't obvious from the docs:

- The ReferenceGrant lives in the target namespace, not the source. It's the secret's namespace giving consent, not the Gateway's namespace requesting access.
- Scope it to named secrets. You can omit `to.name` to allow any Secret, but don't — it defeats the point.
- The Gateway's status condition tells you about ref failures. If your Gateway shows `ResolvedRefs: False`, this is the first place to look. Took me longer than it should have.

## Lesson 8: canary rollouts are a different project altogether

We run a handful of services using Argo Rollouts for canary deployments.

Argo Rollouts has built-in support for nginx traffic routing. It clones the stable Ingress, puts `nginx.ingress.kubernetes.io/canary: "true"` annotations on it, and modulates the weight as the Rollout progresses. There's no equivalent built-in for Gateway API; you need the [`rollouts-plugin-trafficrouter-gatewayapi`](https://github.com/argoproj-labs/rollouts-plugin-trafficrouter-gatewayapi) plugin, installed as an init container in the Rollouts controller, plus an HTTPRoute with two `backendRefs` (stable + canary) whose weights the plugin mutates at runtime.

That last part, a controller mutating an ArgoCD managed resource at runtime, also means you need ArgoCD `ignore-differences` rules for the weight fields, or you fight your reconciler. The plugin helpfully adds a label while a rollout is in flight to make this easier.

I haven't done that migration yet. For now, the plan is: ship the Rollouts plugin once everything else is on Envoy Gateway, migrate the holdout service last, then turn the nginx controller off.

## A clear separation between platform and application

The Gateway is a platform concern. It's managed in Terraform, lives in `envoy-gateway-system`, and there's one shared LB per audience (public/private). TLS termination, listener ports, ALB target group bindings, the `ReferenceGrant` for the cert secret, all of that lives in the platform repo, owned by the platform team.

The route is an application concern. The chart for a service ships an `HTTPRoute` (sometimes two, sometimes a `SecurityPolicy` for auth or CORS), and that's it. Whoever owns the service doesn't need to know which port their listener runs on or how TLS terminates; they just attach to the right section.

That split is what makes the final step, turning off `ingress-nginx`, feel like a deletion rather than a migration.
