---
title: What I got wrong about fast terminals
date: 2026-06-08 15:39:00
summary: "A reader pushed back on my fast-terminal post, and they were right about more than I'd like. On benchmarking shells properly, modern zsh, and the difference between a shell that is fast and one that feels fast."
tags:
  - productivity
  - minimalism
---

A couple of days ago I published [Life is too short for a slow terminal](/posts/life-is-too-short-for-a-slow-terminal/). It got quite a bit of traffic, and someone sent me the kind of feedback you actually hope for.

The gist of it: A stripped-down config isn't the only way to a fast shell anymore. I simply didn't know about a lot of this stuff, I just worked with what I knew. Luckily, the Zsh community has a lot of smart people.

So here's where the post falls short, point by point, because a correction is more useful than a defense.

## I measured the wrong thing

This is the one that stings, because measurement was half the post. I led with this:

```shell
$ for i in {1..5}; do /usr/bin/time zsh -i -c exit; done
```

`time zsh -i -c exit` starts an interactive shell and immediately tears it down. It's the benchmark everyone reaches for, and [zsh-bench](https://github.com/romkatv/zsh-bench#how-not-to-benchmark) has a whole section on why it's the wrong one. It measures total init time plus teardown, but total init time isn't what you wait on. What you wait on is the prompt showing up, the first command running, and the latency of every keystroke after that. Those are different numbers, and a config can be slow on my benchmark while feeling faster than mine in practice.

[zsh-bench](https://github.com/romkatv/zsh-bench) measures the things you actually feel: time to first prompt, time until the first command runs, command lag, and input lag. If I were writing the measurement section again, that's what I'd point people at, not a `time` loop.

The bigger miss is [instant prompt](https://github.com/romkatv/zsh-bench#instant-prompt). It renders a cached prompt the moment the shell starts, before `.zshrc` has finished, so you're typing while the rest of init happens behind you. Once a shell does that, the exit-time number I was so proud of is close to irrelevant, because perceived startup is near zero regardless of what init costs. My 30ms shell and a 300ms shell with instant prompt feel the same at the only moment that matters: when you sit down to type.

## "Plugin managers add overhead" was too broad

I wrote that plugin managers "add their own overhead on top" and do "dependency resolution at startup." That's true of some of them, and it was lazy to apply it to the entire category.

[antidote](https://github.com/mattmc3/antidote) keeps a plain list of plugins and compiles it down to a single static script that you source. There's no resolution happening when you open a shell, you're sourcing one generated file, which is exactly the thing I praised about my own hand-rolled `source` lines. So the honest version of my claim is narrower: a heavy framework that resolves plugins on every startup is slow. A modern, static-bundling manager is not, and it'll manage updates for you, which my install script does by hand.

## I recommended the slow syntax highlighter

In a post about input latency, I source `zsh-syntax-highlighting`. That's a little embarrassing in hindsight, because it re-highlights the entire buffer on every keystroke, and on a long command line that's exactly the per-keystroke lag I warned about two sections later.

[Zsh-patina](https://github.com/michel-kraemer/zsh-patina) is a newer take worth a look. If you type long commands, it will be feel better than what I'm currently using.

## So what's actually left of the argument?

What I actually like is that I can read my entire `.zshrc` in one sitting. There's no framework deciding things for me, no plugin I didn't choose, nothing to bisect when a shell misbehaves. When something is slow I can find it, because there's so little there. That's a real preference, but it's a preference for _simplicity_, and simplicity happening to be fast is a side effect. You can absolutely have a fast, instant-feeling shell with all the features. There's just different ways of getting there.

So I'll stand by the minimal setup, just for honest reasons now: I keep it small because I want to understand it, not because it's the only road to going fast.

## Wrapping up

Thanks to the reader who took the time to write all this out instead of just scrolling past. This is the good version of being wrong on the internet. The [original post](/posts/life-is-too-short-for-a-slow-terminal/) still stands, with a note at the top pointing here, and the setup is still in [my dotfiles](https://github.com/mijndert/dotfiles), syntax highlighter and all.

I'll be updating some of my setup to use these more modern tools.
