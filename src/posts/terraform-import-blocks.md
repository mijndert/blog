---
title: Saving time using Terraform import blocks
date: 2023-06-15 10:00:00
summary: Stop creating resources yourself, use import blocks instead. A new feature in Terraform 1.5.
---

Anyone who uses Terraform must be familiar with the `import` command; it allows you to gather existing resources and put them into your statefile. This way, existing resources which were previously not created using Terraform are now under management of your infrastructure as code.

You can import your resources in the terminal, but you still have to write the code for the resources you import. With Terraform version 1.5 there's a better solution: import blocks.

Let's take a DigitalOcean Spaces bucket as an example here.

Before [Terraform 1.5](https://www.hashicorp.com/blog/terraform-1-5-brings-config-driven-import-and-checks) you first had to import the resource into your statefile:

```bash
terraform import digitalocean_spaces_bucket.mybucket `region`,`name`
```

Now, using a bit of `terraform plan` trial and error, you could write the code for the resource until no changes were found anymore.

```hcl
resource "digitalocean_spaces_bucket" "mybucket" {
  name   = "mybucket"
  region = "ams3"
}
```

Using [import blocks](https://developer.hashicorp.com/terraform/tutorials/state/state-import) you can basically skip the last step for the most part. You can now import resources using code, and have a basic skeleton of the resource code be created for you.

First we get the DigitalOcean Terraform provider and define our first import block.

```hcl
terraform {
  required_providers {
    digitalocean = {
      source = "digitalocean/digitalocean"
    }
  }
}

import {
  id = "ams3,mybucket"
  to = digitalocean_spaces_bucket.mybucket
}
```

Using `terraform plan` with the `-generate-config-out` flag, Terraform will generate configuration for the resource and outputs the plan.

```bash
terraform plan -generate-config-out=generated.tf
```

Of course, the code it generates isn't perfect, but it's a very good starting point. Now, finally, we don't have to go back and forth between our code and `terraform plan` to guess the arguments of the resource. You can go ahead and take the output and put it in the correct place in your own codebase.

The above import block will generate something like this:

```hcl
resource "digitalocean_spaces_bucket" "mybucket" {
  acl           = null
  force_destroy = null
  name          = "mybucket"
  region        = "ams3"
  lifecycle_rule {
    abort_incomplete_multipart_upload_days = 0
    enabled                                = true
    prefix                                 = null
    expiration {
      date                         = null
      days                         = 7
      expired_object_delete_marker = false
    }
    noncurrent_version_expiration {
      days = 7
    }
  }
  versioning {
    enabled = false
  }
}
```
