---
title: Responsive images on a static Hugo website
date: 2022-12-06
summary: Serving optimized responsive images using Hugo
publish: true
---

For years and years I've been using [Jekyll](https://jekyllrb.com/) as my static site generator of choice, mostly because I like their templating engine and I'm a fan of Ruby as a programming language. I've been experimenting with Hugo as well, but it never really clicked for me. Well, until I found [the perfect theme](https://github.com/mavidser/hugo-rocinante) for my needs. The same theme is now used here and on the [toot.community blog](https://blog.toot.community/) so I wanted to set mine apart a little bit by adding banner images on some posts. Downloading an image from Unsplash and manually resizing it wasn't an option though - I need things to be frictionless when I want to add a blog entry.

I started looking for ways to automatically generate multiple sizes of an image and came across a lot of different solutions. Most didn't work anymore or were very convoluted. That's to say, until I found [Bryce Wray's entry](https://www.brycewray.com/posts/2022/06/responsive-optimized-images-hugo/).

I quickly adapted his code to my needs and had it working on no-time, you can see it in action [right here](/posts/scaling-mastodon-community/). 

Here's how I did it.

## Assets directory

In order to leverage the built-in image resizing capabilities of Hugo, you have to create an `assets/images` directory in the root of your project. Any other place doesn't work, unless of course you customize the directory. But I like using defaults to avoid breakage later down the line.

## Shortcodes

The following Hugo shortcode will generate multiple sizes of a given image and spit out .webp and .jpeg files.

Create a file called `/layouts/shortcodes/imgh.html` in the root of your project with the following contents.

```
{% raw %}{{- $respSizes := slice "960" "1280" "1920" -}}
{{- $imgBase := "images/" -}}
{{- $src := resources.Get (printf "%s%s" $imgBase (.Get "src")) -}}
{{- $alt := .Get "alt" -}}
{{- $divClass := "" -}}{{/* Init'g */}}
{{- $imgClass := "w-full h-auto animate-fade" -}}
{{- $dataSzes := "(min-width: 1024px) 100vw, 50vw" -}}
{{- $actualImg := $src.Resize "640x jpg" -}}
<picture>
  <source
    type="image/webp"
    srcset="
      {{- with $respSizes -}}
        {{- range $i, $e := . -}}
        {{- if ge $src.Width . -}}
          {{- if $i }}, {{ end -}}{{- ($src.Resize (printf "%sx%s" . " webp") ).RelPermalink }} {{ . }}w
        {{- end -}}
      {{- end -}}
    {{- end -}}"
    sizes="{{ $dataSzes }}"
  />
  <source
    type="image/jpeg"
    srcset="
      {{- with $respSizes -}}
        {{- range $i, $e := . -}}
          {{- if ge $src.Width . -}}
            {{- if $i }}, {{ end -}}{{- ($src.Resize (printf "%sx%s" . " jpg") ).RelPermalink }} {{ . }}w
          {{- end -}}
      {{- end -}}
    {{- end -}}"\
    sizes="{{ $dataSzes }}"
  />
  <img class="{{ $imgClass }}"
    src="{{ $actualImg.RelPermalink }}"
    width="{{ $src.Width }}"
    height="{{ $src.Height }}"
    alt="{{ $alt }}"
    loading="lazy"
  />
</picture>
</div>{% endraw %}
```

## Using the shortcode

Now in order to use the above shortcode you can simply drop an image into `/assets/images` and insert this line of code in your MarkDown file.

```
{% raw %}{{</* imgh src="my-example-file.jpeg" alt="My example file" */>}}{% endraw %}
```
