---
title: Responsive images in Hugo using Render Hooks
date: 2026-04-09 16:32:00
summary: "Replace Hugo shortcodes with Render Hooks for automatic responsive image generation — a modern approach using WebP-first srcset with JPEG fallback"
tags:
  - hugo
  - development
---

Back in 2022 I [wrote about automatically generating responsive images](https://mijndertstuij.nl/posts/hugo-responsive-images/) in both JPEG and WebP formats using Hugo shortcodes. In those days, browser support for WebP was still quite spotty so we had to generate both formats and do a little magic to let the browser fall back to JPEG if needed.

Fast forward to 2026 and WebP is now well supported in all major browsers, and Hugo has also evolved beyond shortcodes in favor of [Render Hooks](https://gohugo.io/render-hooks/).

## The render hook

The actual render hook that generates the resized JPEG and WebP files looks pretty similar to the shortcode, but works slightly differently.

Create a file in `layouts/_default/_markup/render-image.html` with the following contents:

```html
{% raw %}{{- $src := .Destination -}}
{{- $alt := .Text -}}
{{- $img := .Page.Resources.GetMatch $src -}}
{{- if not $img -}}
  {{- $img = resources.Get $src -}}
{{- end -}}
{{- if $img -}}
  {{- $widths := slice 480 768 1024 1366 1920 -}}
  {{- $origWidth := $img.Width -}}
  {{- $origHeight := $img.Height -}}
  {{- $srcsetEntries := slice -}}
  {{- range $w := $widths -}}
    {{- if le $w $origWidth -}}
      {{- $resized := $img.Process (printf "resize %dx webp q85" $w) -}}
      {{- $srcsetEntries = $srcsetEntries | append (printf "%s %dw" $resized.RelPermalink $w) -}}
    {{- end -}}
  {{- end -}}
  {{- $fallbackWidth := 1024 -}}
  {{- if lt $origWidth 1024 -}}
    {{- $fallbackWidth = $origWidth -}}
  {{- end -}}
  {{- $fallback := $img.Process (printf "resize %dx jpg q85" $fallbackWidth) -}}
  <img
    src="{{ $fallback.RelPermalink }}"
    {{- if $srcsetEntries }}
    srcset="{{ delimit $srcsetEntries ", " }}"
    sizes="(max-width: 768px) 100vw, 720px"
    {{- end }}
    alt="{{ $alt }}"
    width="{{ $origWidth }}"
    height="{{ $origHeight }}"
    {{- if eq .Ordinal 0 }}
    fetchpriority="high"
    {{- else }}
    loading="lazy"
    decoding="async"
    {{- end }}>
{{- else -}}
  <img src="{{ $src }}" alt="{{ $alt }}">
{{- end -}}{% endraw %}
```

As you can see, the `<picture>` element is no longer used, and instead we directly generate the `srcset` attribute for the `<img>` tag and reference the WebP file, with a fallback to the JPEG file in the event the browser doesn't support WebP.

## The post and image files

Then in a blog post, likely a Markdown file, you can reference the image like any other and the Render Hook will take care of the rest:

```markdown
{% raw %}![A random landscape photo](landscape.jpg){% endraw %}
```

My previous post suggested to put the images in the `/assets/images/` directory, but with the Render Hook in place and using the latest Hugo version, you can use something called page bundles. This means you put the images right next to the Markdown file in the same directory.

```
content/posts/my-post/
    index.md
    hero.jpg
```

## Setting WebP image quality

In your Hugo configuration file, you can set the default quality for WebP images using the `imaging` configuration. For example:

```toml
[imaging]
  quality = 85

[imaging.webp]
  quality = 85
```

## Wrapping up

Compared to the shortcode approach this is a nice simplification. Gone is the `<picture>` element, the shortcode is gone, just standard Markdown and a single modern Render Hook. Page bundles also make it easier to keep things organized since images live right next to the content.
