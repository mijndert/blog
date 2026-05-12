---
title: Fixing headline-only RSS feeds with rss-fulltext
date: 2026-05-12 14:42:00
summary: "Introducing rss-fulltext, a self-hosted tool that takes headline-only RSS feeds and rebuilds them with the full article text using readability."
tags:
  - development
---

RSS feeds are really great and I use them a lot for keeping up with personal blogs, corporate tech blogs and what's new at AWS. I don't think there's any other medium, apart from maybe email, that's so scalable, easy to understand and has such a rich ecosystem of readers and other tools.

That said, there's nothing worse than an RSS feed that just returns a headline and the first paragraph of the article. Or sometimes you don't even get that, sometimes it's just a short description of the article. That sucks when reading offline, but also because you have to click through to the website to read the article. This exposes you to ads, trackers and other needless crap.

I wanted to solve this issue for myself first and foremost and to that end I created [rss-fulltext](https://github.com/mijndert/rss-fulltext).

RSS-fulltext downloads the RSS feed, and for each link it will try and pull out the article using readability, clean the output a little bit, and then create and serve a new RSS feed with the full text included. Like Instapaper, but for RSS.

It's completely open source and you can self-host it using the docker compose file and the included config file. I recommend you put it behind your own reverse proxy or a Cloudflare tunnel to expose it to the outside world, so you can reach it in your RSS reader.

In the near future I might add an option to export an OPML file, downloading of inline images for true offline usage, exposing Atom and JSON feeds, and maybe a combined "all feeds" output. That's for later though. I'd love to get your feedback!
