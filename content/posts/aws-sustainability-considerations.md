---
title: "Sustainability considerations for AWS infrastructure"
date: 2023-01-06
description: "What to do about sustainability while working with AWS infrastructure."
tags: [aws,climate]
draft: true
---

{{< imgh src="sustainability.jpg" alt="Top-down view of solar panels in a field" >}}

Climate change is here and we all need to think about the impact we have. A big part of the energy consumption is going to datacenters around the world. It was never a good idea to throw hardware at scaling or performance issues, but it's something we need to look at more closely now than even before. AWS introduced the [sustainability pillar](https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sustainability-pillar.html) to help you reduce your applications' carbon footprint. Below you will find 6 things to consider to help you finish the sustainablity pillar and reduce some costs in the process.

<!--more-->

## Is the software stack optimized and efficient?
## Are compute resources fully utilized and scaled upon user load?
## Are you implementing async architectures?
## Is there potential to optimize network traffic? E.g. payloads size, payloads compression
## Is there a data lifecycle policy?
## Do you have visibility on how data move across your org? Can it be optimized?