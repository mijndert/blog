---
title: 'Mijndert Stuij'
layout: 'layouts/page.html'
---

test test test.... lalal la lalala



{%- for post in collections.post | reverse -%}
  <div class="post">
    <a class="title" href="{{ post.url }}">{{ post.data.title }}</a>
    <span class="meta">
      <time datetime="{{ post.date | w3DateFilter }}" class="small">
        {{ post.date | dateFilter }}
      </time>
      &#183; {{ post.content | readingTime }}. read
    </span>
    <p>{{ post.data.summary }}</p>
  </div>
{%- endfor -%}
