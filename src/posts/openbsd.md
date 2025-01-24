---
title: OpenBSD
date: 2021-11-01 10:00:00
summary: Getting to know OpenBSD after 22+ years of using Linux.
tags: openbsd
---

I've been an avid user of various Linux distributions for 22+ years now and I will forever love everything about it and what it brought me. I have my entire carreer built on Linux and open source software. I've also known about BSD for about as long, but I never quite got into it, until now. I'm as much a minimalist as I am a nerd and I love simple software that does one thing well. I want all of my software to Just Work, no hassle or needless features added. After coming across [OpenBSD.ams](https://openbsd.amsterdam/) I decided to read up on OpenBSD and its [goals](https://www.openbsd.org/goals.html).

Long story short, I'm currently in the process of moving some workloads from Linux VM's to OpenBSD ones. It's been quite a journey so far because unlearning 22 years of Linux experience is... hard. Luckily the community is awesome and the available documentation even more so. But what makes OpenBSD such a joy to use are the sane defaults and the completely empty config files that are just there for me to fill out as I see fit. It feels like the system was designed to fit whatever purpose I have in mind without ever getting in the way. Stuff like [httpd(8)](https://man.openbsd.org/httpd.8), [relayd(8)](https://man.openbsd.org/relayd.8), [acme-client(1)](https://man.openbsd.org/acme-client.1) and [pf(4)](https://man.openbsd.org/pf.4) make the entire system feel very robust and well thought out.

Over in the Linux world everything just seems to be strung together with little sense of direction. It always felt like a pile of software that happens to sometimes work together. OpenBSD is the opposite of that and I love it. I just wish I could run it on my laptop as well, with all the bells and whistles working. But that's a bit of a pipe dream as bluetooth support is currently completely missing.

For now it's a great operating system for servers for me. If you also want to play around with OpenBSD and indirectly [support the foundation](https://www.openbsdfoundation.org/) I would highly recommend getting a VM over at [OpenBSD.ams](https://openbsd.amsterdam/).
