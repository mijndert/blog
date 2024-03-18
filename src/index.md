---
title: 'Vision'
layout: 'layouts/page.html'
---

Hi there!

<ul role="list">
  {%- for post in collections.post | head(-5) | reverse -%}
  <h2><a href="{{ post.url }}">{{ post.data.title }}</a></h2>
  <time datetime="{{ post.date | w3DateFilter }}" class="small">
    {{ post.date | dateFilter }}
  </time>
  <p class="font-serif">{{ post.data.summary }}</p>
  {%- endfor -%}
</ul>

[![Netlify Status](https://api.netlify.com/api/v1/badges/a0bb883b-9b5c-4235-93f0-ab66ce0651b8/deploy-status)](https://app.netlify.com/sites/mijndert-vision/deploys)

[rss feed](/feed.xml)