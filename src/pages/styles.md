---
title: Styles
layout: layouts/page.html
summary: A page to test all the commonly used elements in a page.
permalink: /styles/
---

# H1 header
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sit amet dignissim elit, non varius nulla. Vestibulum vehicula, velit non consequat faucibus, turpis diam fermentum magna, vestibulum tempor lacus sem eu tortor. Suspendisse id efficitur orci. Suspendisse ullamcorper eleifend neque, id efficitur quam. Ut porta libero orci, at faucibus diam rhoncus id. 

## H2 header
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sit amet dignissim elit, non varius nulla. Vestibulum vehicula, velit non consequat faucibus, turpis diam fermentum magna, vestibulum tempor lacus sem eu tortor. Suspendisse id efficitur orci. Suspendisse ullamcorper eleifend neque, id efficitur quam. Ut porta libero orci, at faucibus diam rhoncus id. 

### H3 header
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sit amet dignissim elit, non varius nulla. Vestibulum vehicula, velit non consequat faucibus, turpis diam fermentum magna, vestibulum tempor lacus sem eu tortor. Suspendisse id efficitur orci. Suspendisse ullamcorper eleifend neque, id efficitur quam. Ut porta libero orci, at faucibus diam rhoncus id. 

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sit amet dignissim elit, non varius nulla. Vestibulum vehicula, velit non consequat faucibus, turpis diam fermentum magna, vestibulum tempor lacus sem eu tortor. Suspendisse id efficitur orci. Suspendisse ullamcorper eleifend neque, id efficitur quam. Ut porta libero orci, at faucibus diam rhoncus id. 

- Item 1
- Item 2
- Item 3

![My messy desk with a bunch of cables and my Kobo e-reader](/img/week-notes-19.jpeg)
*Image caption.*

> This is a blockquote. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sit amet dignissim elit, non varius nulla. Vestibulum vehicula, velit non consequat faucibus, turpis diam fermentum magna, vestibulum tempor lacus sem eu tortor. Suspendisse id efficitur orci. Suspendisse ullamcorper eleifend neque, id efficitur quam. Ut porta libero orci, at faucibus diam rhoncus id.

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = "us-east-1"
}

# Create a VPC
resource "aws_vpc" "example" {
  cidr_block = "10.0.0.0/16"
}
```