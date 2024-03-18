---
title: "Config-driven Terraform"
date: 2024-01-18
summary: "Some improvements in Terraform 1.7: Config-driven Remove and Import block for_each."
layout: layouts/page.html
tags:
  - post
publish: true
---

Some time ago I wrote about [config-driven import](https://mijndertstuij.nl/posts/terraform-import-blocks/) which became available in Terraform 1.5. Import blocks are a way to import existing resources into the statefile, which is useful when you have a bunch of infrastructure that was created manually. Yesterday [Terraform 1.7 was released](https://www.hashicorp.com/blog/terraform-1-7-adds-test-mocking-and-config-driven-remove) that extends this functionality with a `for_each` argument.

> Terraform 1.7 also includes an enhancement for config-driven import: the ability to expand import blocks using for_each loops. Previously you could target a particular instance of a resource in the to attribute of an import block, but you had to write a separate import block for each instance.

Expanding on my previous blogpost about Import blocks, here's a quick example of how to use the new `for_each` argument on a list to import multiple Digitalocean Spaces buckets at once.

```
terraform {
  required_providers {
    digitalocean = {
      source = "digitalocean/digitalocean"
    }
  }
}

locals {
  buckets = {
    "test" = "bucket-test"
    "staging" = "bucket-staging"
    "prod"    = "bucket-prod"
  }
}

import {
  for_each = local.buckets
  to       = digitalocean_spaces_bucket.mybucket[each.key]
}


resource "digitalocean_spaces_bucket" "mybucket" {
  for_each = local.buckets
  bucket   = each.value
}
```

Another great addition in Terraform 1.7 are Remove blocks. There are times when you need to remove a resource from your Statefile, optionally without removing the underlying resource itself. Of course there are CLI commands to accomplish this, but having it available as a Remove block means we can run `terraform apply` and check the changes before executing them.

> As an alternative to the terraform state rm command, the removed block addresses all of these challenges. Just like the moved and import blocks, state removal can now be performed in bulk and is plannable, so you can be confident that the operation will have the intended effect before modifying state. 

```
removed {
  from = digitalocean_spaces_bucket.mybucket

  # Instruct Terraform not to destroy the underlying resource
  lifecycle {
    destroy = false
  }
}
```

Both of these additions are great improvements to Terraform, and I'm looking forward to using them in my projects. They will ensure I'm much more confident in working with the Statefile which has always been a bit daunting. 