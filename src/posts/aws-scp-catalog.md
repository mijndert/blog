---
title: AWS SCP Catalog
date: 2026-03-31 14:05:00
summary: "An open-source Terraform and OpenTofu module for managing AWS Service Control Policies across your organization with reusable, pre-built SCPs"
tags:
  - aws
  - terraform
---

If you haven't worked with AWS before, or at least not to that extent, you might first want to know what Service Control Policies (SCPs) are. SCPs are a type of policy that you can apply on the organization level that allow or deny certain actions across all accounts that the SCP is applied to. This allows to deny certain actions, despite the fact that a role within a member account might have permissions to do so.

This is a great way to enforce certain security policies or to prevent certain actions from being taken, all managed from a single place.

At my job we use SCPs to disallow root logins, the deletion of EKS clusters, and some other things that we absolutely never want to happen. Of course we configure all of these things using OpenTofu (a fork of Terraform).

I however wanted to make it easy for anyone to use SCPs in their own AWS organization, and to that end I created a reusable module that I open sourced. You can find the module [on GitHub right here](https://github.com/mijndert/aws-scp-catalog).

The module I think is pretty straightforward to use and a few pre-built SCPs are included, but you can also easily extend the module by adding your own policies in the `policy_documents.tf` file. Each policy can be either attached to the root of the organization, specific organizational units, or specific member accounts.

The only slightly awkward part, and something I couldn't find a more elegant solution for, is that you have to import your existing AWS organization into the statefile before you can start applying SCPs to it. Only then can the module automatically enable the Service Control Policies feature.

To import your existing AWS organization into the statefile you can use the following command:

```bash
task run cmd=import -- aws_organizations_organization.this $(aws organizations describe-organization --query 'Organization.Id' --output text)
```

Of course you can also opt to enable the SCP feature manually in the AWS console, but I prefer to have everything managed through code.

Before using the module you should make sure to read through the entire [README file](https://github.com/mijndert/aws-scp-catalog/blob/main/README.md) and understand how it works. If you have any questions or suggestions for improvements, feel free to open an issue or a pull request on the GitHub repository.
