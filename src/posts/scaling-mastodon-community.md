---
title: Scaling a Mastodon community to 27k people
date: 2022-12-04 10:00:00
summary: Scaling a Mastodon community to 27k people using Kubernetes and Digitalocean.
tags: mastodon
---

Tomorrow marks the first full month of my move to [toot.community](https://toot.community/), a Mastodon instance initially set up by my friend [Jorijn](https://jorijn.com/). My move to Mastodon wasn't motivated by what's going at Twitter right now, but rather the technical challenges of scaling the shit out of it. In the first week we welcomed thousands of people and we certainly had to put out a fire or two, but most of the time we had the time to focus on optimization.

If you look at the `#MastoAdmin` hashtag on Mastodon you'll see a lot of messages from other admins sharing scaling tips and tricks. There I got the idea to [open source everything](https://blog.toot.community/posts/open-sourcing-toot-community/) we were doing so that others could hopefully benefit from it. Open source software has shaped my carreer and giving back is the least I could do. While we were working on making the scaling of toot.community fully event-driven, I got to work to write [Terraform code for the infrastructure](https://github.com/toot-community/platform). Since I have a lot of experience with Terraform, I made sure to create modules for every part of the platform so we can easily rip out and replace every part of it without any hassle at all.

At the same time we were also working on a [fully event-driven scaling setup](https://github.com/toot-community/kubernetes) on top of Kubernetes. Currently we run between 3 and 7 nodes in the Kubernetes cluster depending on the requests to the web server and the amount of messages in the queues. This way we're never overspending on infrastructure, something that's incredibly important while running a Mastodon community because it's fully supported by donations. Of course we don't want to squander the money so we're constantly optimizing and tweaking to be able to handle more people on the same amount of infrastructure; now at 27k people we're paying about the same amount of money per month as we were at 15k people.

We now have an event-driven, self-healing Mastodon instance that can basically scale into infinity given enough funds. That doesn't mean we sit back and relax however, we still have a ton of ideas to optimize further. Some things we want to do over the coming months include: getting our CloudFlare setup into Terraform, turning the screws on security, more visibility into key metrics, and database optimizations.

On the [toot.community blog](https://blog.toot.community) we will publish updates on financials and some deepdives into the technical implementation of it all. There's an RSS feed it you want to follow along.
