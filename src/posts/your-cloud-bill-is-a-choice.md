---
title: The cloud isn't inherently expensive
date: 2026-06-09 09:30:00
summary: "The cloud isn't inherently expensive. Most of the scary AWS bills I've seen come from running the cloud like it's a datacenter, and almost all of it is avoidable."
tags:
  - aws
  - finops
  - devops
---

Every few months someone posts the same chart. "We left AWS and saved 60%." It does the rounds on LinkedIn, the comments fill up with people nodding along, and for a week everyone is suddenly a datacenter person again.

I'm not going to tell you they're lying. For a steady, predictable workload that never really changes shape, a rack of your own machines can absolutely be cheaper per unit of compute.

But it's also not the interesting question. The interesting question is why so many AWS bills are enormous in the first place, and in my experience the answer is almost never "the cloud." It's that we took a datacenter mindset and ran it on someone else's hardware, kept all the bad habits, and then acted surprised at the invoice.

The cloud doesn't have to be expensive. Most of the time the bill is a choice, and we keep choosing wrong.

## You're not paying for compute

Here's the reframe I keep coming back to. When you buy a server, you pay for it whether you use it or not. You buy for peak, you buy for "just in case," and then it sits there at 8% utilization for three years until the lease is up. You pay for the rack, the power, the cooling, the redundancy, the person who drives to the datacenter at 2 AM to swap a dead disk, and the over-provisioning you did because ordering more hardware takes six weeks.

In the cloud you're not really buying compute. You're buying the right to _not_ do any of that. You're paying for elasticity, for the ability to be wrong about capacity and fix it in an afternoon, for managed services that replace a chunk of headcount you'd otherwise be hiring.

That's the whole deal. And every single one of those affordances is also a way to spend less, if you actually use them:

- You can **scale to zero**. The cheapest resource is the one that isn't running. I put our [non-prod clusters to sleep overnight with KEDA](/posts/scale-to-zero-keda-cron-scaler/) and that alone is a third of the week the bill simply doesn't accrue.
- You can run on **Spot** and take instances at up to ~90% off, as long as your workload can handle being interrupted. Most batch and stateless stuff can.
- You can move to **Graviton** and get roughly 20% better price/performance for the cost of changing one line in a launch template.
- You can **commit** with Savings Plans and Reserved Instances and knock well north of 50% off on the baseline you were always going to run anyway.

None of this exists on-prem. The on-prem comparison is real, but it's comparing your worst cloud habits against their best case. Do the cloud properly and the gap closes fast, often the other way.

## Where it actually goes wrong

I've reviewed a lot of AWS accounts over 17 years, and the expensive ones are expensive for boringly similar reasons. It's almost never one big mistake. It's a hundred small ones nobody owns. The greatest hits:

- **NAT Gateways eating the budget.** They charge per hour _and_ per gigabyte processed. Run everything through a NAT in another AZ, skip the free gateway endpoints for S3 and DynamoDB, and you pay a toll on traffic that never needed to leave your VPC.
- **Non-prod running 24/7.** Dev, QA and staging sitting at full size on a Sunday night, doing absolutely nothing, for nobody. This is the single easiest win in most accounts.
- **gp2 volumes everywhere.** gp3 is cheaper, faster, and lets you dial IOPS and throughput separately. There is no good reason to still be on gp2, and yet.
- **CloudWatch Logs set to never expire.** Ingestion costs money, storage costs money, and "retain forever" is the default nobody changes. You're paying rent on logs from 2021 that no one will ever read.
- **Orphaned everything.** Unattached EBS volumes, snapshots of instances that died long ago, Elastic IPs that cost money precisely _because_ they're not attached to anything. Sprawl with no tags and no owner.
- **On-demand for steady-state workloads.** Paying the full sticker price for the database that has run continuously for two years and will run for two more.
- **Over-provisioned RDS and oversized nodes.** A db.r6g doing the work of a db.t4g.medium because someone sized it for a launch spike that happened once.
- **A load balancer per service.** Each one a fixed monthly cost plus capacity units, when a [shared ingress would have done the job](/posts/avoid-using-internal-load-balancers/) for a fraction.

Look at that list. None of it is the cloud being expensive. All of it is us not using the affordances we're paying a premium for.

## Make the cheap path the default

This is where it stops being a finance problem and becomes a platform engineering problem, which is the part I actually care about.

You will never win FinOps by sending people Slack messages asking them to please use gp3. Engineers don't reach for the expensive option on purpose, they reach for the default. So your entire job is to make the cheap, sensible thing _be_ the default, baked into the golden path so the right choice is also the path of least resistance.

That means your Terraform modules ship with the good decisions already made:

```hcl
resource "aws_ebs_volume" "this" {
  availability_zone = var.az
  size              = var.size
  type              = "gp3" # not gp2, ever
}
```

Graviton in the default instance family. S3 buckets with a lifecycle policy and Intelligent-Tiering out of the box. Log groups created with a sane retention period instead of "forever." A right-sized RDS default that people have to consciously scale _up_, rather than a huge one they never bother to scale down.

And you put guardrails around it so the expensive mistakes are hard to make by accident. This is exactly what Service Control Policies are for. I keep a [catalogue of reusable SCPs](/posts/aws-scp-catalog/) for precisely this kind of thing: require cost-allocation tags on resources, deny launches into the wrong regions, block the instance families you don't want people reaching for. Make the cheap path easy and the expensive path require a deliberate decision.

## Automate it or it won't happen

FinOps you do by hand is a chore that stops happening the week you get busy. FinOps you automate is just a feature of the platform. The goal is that nobody has to _remember_ to care.

A few things that have earned their keep:

- **Enforce tags at creation, not after.** A tag policy or SCP that rejects untagged resources means your cost reports actually add up to something. Untagged spend is unaccountable spend, and unaccountable spend never gets cut.
- **Budgets and anomaly detection on by default.** AWS Budgets per account or per team, plus Cost Anomaly Detection so a runaway resource pings you in hours instead of surfacing on next month's invoice.
- **Put cost in the pull request.** This is my favourite one. Run something like Infracost in CI and the diff comments with "this change adds $340/month" _before_ it merges. You move the decision to the moment someone can still cheaply change their mind.
- **Let the robots clean up.** A scheduled Lambda that hunts down unattached volumes, stale snapshots and idle Elastic IPs is an afternoon of work and pays for itself more or less immediately.
- **Let the platform right-size itself.** Lean on Compute Optimizer and Trusted Advisor for the recommendations, and Karpenter consolidation plus Spot on EKS so the cluster keeps packing itself down to what it actually needs.
- **Automate the commitments.** Review Savings Plans coverage on a schedule so your discounts track your real baseline instead of a guess you made a year ago.

The pattern is always the same: turn the thing you'd otherwise nag people about into something the system does on its own.

## It's not just engineering's problem

Here's the part platform engineers tend to get wrong, myself included for a long time. You can automate everything above and still lose, because the people generating most of the cost can't see any of it.

Cost has to be visible to the team that creates it. If you've done the tagging properly you get this almost for free: a per-team showback view where each team sees their own spend, their own trend, their own anomalies. The moment a team can see their bill, they start caring about it, and they make better calls than you ever could from the outside because they actually understand their workload.

You also need finance in the room, and not as the enemy. Their job is to forecast and explain the spend, yours is to translate "we moved the data pipeline to Spot" into "that's why the line went down." When those two languages connect, FinOps stops being a witch hunt and starts being a shared scoreboard.

And you don't need a big engineering org to do any of this. I've seen this work at companies with a handful of engineers and no platform team at all. Tags, a budget per team, anomaly alerts, and a fifteen-minute look at the cost dashboard once a month will get you 90% of the way there. The tooling is the easy part. The habit is the whole thing.

The platform team's job, in the end, is the same as it always is: make the right thing the easy thing, give everyone visibility into the consequences of their choices, and then get out of the way.
