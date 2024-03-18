---
title: "Dynamic blocks are the key to reusable Terraform modules"
date: 2022-12-08
summary: "Stop repeating yourself and use Dynamic blocks in your Terraform resources"
layout: layouts/page.html
tags:
  - post
publish: true
---

In the realm of Amazon Web Services there's this thing called a [Landing Zone](https://docs.aws.amazon.com/prescriptive-guidance/latest/migration-aws-environment/understanding-landing-zones.html), a set of infrastructure as code modules built to deploy new environments faster. You can build a Landing Zone using [CloudFormation](https://aws.amazon.com/cloudformation/), [CDK](https://aws.amazon.com/cdk/), [Terraform](https://www.terraform.io), or any other tool you like. The point is that you have a starting point for as many use-cases as possible. For a Landing Zone to work you have to write reusable generalized code that could work for any client and any combination of infrastructure.

While trying to create a Landing Zone in Terraform I found that it's very hard to make them follow the [DRY principle](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) (Don't Repeat Yourself). After a while the code started to be really hard to maintain. But then I found Dynamic blocks.

Terraform provides [Dynamic blocks](https://developer.hashicorp.com/terraform/language/expressions/dynamic-blocks) as a way to create repeatable nested code within a resource, it's kind of similar to a for loop but for stuff within a resource. But Dynamic blocks also allow you to conditionally create certain properties on a resource.

As an example, let's take the [platform code for toot.community](https://github.com/toot-community/platform).

Here I wanted to create multiple [Digitalocean Spaces](https://www.digitalocean.com/products/spaces), one for storing user files, one for backups, one for Terraform state management, etc. On some of these Spaces I want to create a lifecycle rule to automatically delete files older than a given threshold. But of course I don't want to apply that same lifecycle policy to everything; it would be a stupid idea to delete Terraform statefiles after all. At the same time, I really want to define the Digitalocean Spaces resource only once, for DRY reasons.

In this example you see a Dynamic block for the property `lifecycle_rule`. There's a `for_each` that needs the variable `expiration_enabled` to be set to `true`, else the `for_each` loop will be empty and the property will not be created.

```
resource "digitalocean_spaces_bucket" "this" {
  name   = var.spaces_name
  region = var.region
  acl    = "private"

  dynamic "lifecycle_rule" {
    for_each = var.expiration_enabled == true ? [1] : []
    content {
      id      = "${var.spaces_name}-lifecycle-rule"
      enabled = true
      expiration {
        days = 7
      }
      noncurrent_version_expiration {
        days = 7
      }
    }
  }
}
```

Now if I don't specify the variable `expiration_enabled` the `lifecycle_rule` property isn't created and I just get a standard `digitalocean_spaces_bucket`. I don't have to repeat myself anymore and it makes my module a lot cleaner.

A word of warning though, overuse of Dynamic blocks will eventually lead to code being unreadable and not very easy to understand. Only use Dynamic blocks if there's no other way to avoid repeating the same code. If you have to repeat a few lines once or twice, stop and think if you really need a Dynamic block or if you can live with it in that instance.

Speaking of Terraform modules, that's something I want to talk about in another blog post as well. A question I get asked a lot is "how do I organize my environments and modules?". More on that later. If you want to get notified of new posts you can import the [RSS feed](https://mijndertstuij.nl/feed.xml) for this website in your reader.
