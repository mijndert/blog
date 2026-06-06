---
title: Life is too short for a slow terminal
date: 2026-06-06 13:59:00
summary: "I do all my work in the terminal, so it has to be quick. How my zsh starts in 30 milliseconds without a framework, and how to measure where your own shell spends its time."
tags:
  - productivity
  - development
---

Practically all of my work happens inside a terminal. Git, kubectl, tmux, ssh'ing into a server, open practically the entire day. Something I use that much has to be fast. Any lag in opening a new tab, typing a character or hitting tab for a completion is something I feel hundreds of times a day. It's death by a thousand cuts.

My shell starts in about 30 milliseconds:

```shell
$ for i in {1..5}; do /usr/bin/time zsh -i -c exit; done
0.03 real  0.02 user  0.01 sys
0.03 real  0.02 user  0.01 sys
...
```

That's a fully loaded interactive shell with completions, syntax highlighting, autosuggestions, fzf and direnv, in less time than a single frame at 30fps. A new tab is instant. There was never some big optimization project behind this either; I've just always kept my shell minimal and fast and over the years that turned into a habit. Here's how I go about it, and all of it can be found in [my dotfiles](https://github.com/mijndert/dotfiles).

## No framework

The single biggest win is what's _not_ there: no oh-my-zsh, no prezto or plugin manager. I've honestly never understood the appeal of these frameworks. People install oh-my-zsh with its hundreds of plugins and themes, end up using maybe 5% of what it offers, and then pay (with their time and compute resources) for the other 95% every single time they open a shell. And plugin managers add their own overhead on top of that.

I use exactly three plugins, git-cloned once by my install script and sourced from `.zshrc`:

```shell
source ~/.zsh/fzf-tab/fzf-tab.plugin.zsh
source ~/.zsh/zsh-autosuggestions/zsh-autosuggestions.zsh
source ~/.zsh/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
```

There's no plugin manager doing dependency resolution at startup, and a `source` of a file that's already on disk is practically free.

## Caching completions

`compinit` is one of the most expensive things in a typical `.zshrc`. By default it does a security audit of every completion file, every single time you open a shell. The fix is to only do the full run if the cache (`.zcompdump`) is older than 24 hours, and otherwise skip the check with `-C`:

```shell
autoload -Uz compinit
if [[ -n ~/.zcompdump(#qNmh-24) ]]; then
  compinit -C
else
  compinit
fi
```

That glob qualifier (`#qNmh-24`) reads as "exists and was modified within the last 24 hours". So one full `compinit` per day, and cached reads the rest of the time.

## Lazy-loading

nvm is probably the most notorious shell startup killer out there; sourcing it eagerly can easily add half a second. But I don't need nvm in every shell, I need it when I type `nvm`. So I wrap it in a function that replaces itself on first use:

```shell
export NVM_DIR="$HOME/.nvm"
nvm() {
  unset -f nvm
  [ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh" --no-use
  [ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"
  nvm "$@"
}
```

The first `nvm` call deletes the stub, sources the real thing (with `--no-use` so it doesn't resolve a node version either), and forwards the arguments.

Same idea for kubectl completions, which shell out to the `kubectl` binary to generate the completion script. I only load them after the first time I actually run kubectl:

```shell
kubectl() {
    command kubectl "$@"
    local ret=$?
    if [[ -z $KUBECTL_COMPLETE ]]; then
        source <(command kubectl completion zsh)
        KUBECTL_COMPLETE=1
    fi
    return $ret
}
```

This pattern works for a lot of things: anything that tells you to put `eval "$(tool init zsh)"` in your `.zshrc` is a candidate for lazy loading, because each of those forks a process and evaluates its output at startup. I keep `direnv` and `fzf` eager because they're fast and I use them constantly. Be strict about what you actually use a lot.

## A non-blocking prompt

A prompt that runs `git status` synchronously will lag in any decently sized repo. That's the kind of lag you feel on every single Enter press, which is arguably worse than a slow startup. I use [pure](https://github.com/sindresorhus/pure), which renders the prompt immediately and fills in the git info asynchronously when it's ready. I briefly tried replacing it with zsh's built-in `vcs_info`, but pure's async behavior is just... better. You can do async git status in your own prompt as well, but pure wraps it rather nicely for my use-case.

## The terminal itself

Shell startup is only half the story, because the emulator adds its own input latency. I use [Ghostty](https://ghostty.org), which is GPU-accelerated and native, and my config is just seven lines long. Combined with a `tmux new -A -s main` alias (`t`), a fresh terminal window drops me right back into my existing session.

## Measuring your own shell performance

You don't have to take my word for any of this, you can measure where the time goes in your own terminal. There are three kinds of lag to look for: startup time, prompt lag, and input latency.

Run this a few times (the first run is always slower because of cold caches):

```shell
time zsh -i -c exit
```

I think anything under 100ms is fine, and under 50ms is great. If you're seeing 500ms or more you have some work to do.

For proper statistics, use [hyperfine](https://github.com/sharkdp/hyperfine):

```shell
hyperfine --warmup 3 'zsh -i -c exit'
```

Zsh also ships with a profiler. Put this at the very top of your `.zshrc`:

```shell
zmodload zsh/zprof
```

and this at the very bottom:

```shell
zprof
```

Open a new shell and you get a sorted table of exactly where the time went. The top entries are usually `compinit`, an `nvm.sh` source, or some `eval "$(...)"`. Fix the top one, re-run, repeat. Remove both lines when you're done.

If zprof isn't granular enough, you can trace the whole startup with timestamps:

```shell
zsh -ixc exit 2>&1 | ts -i '%.s' | sort -rn | head -20
```

<aside>`set -x` prints each trace line _before_ running the command, so `ts -i` pins a command's duration on the line after it. The slow command is the one right above the big number in the original trace.</aside>

Or set {% raw %}`PS4='+%D{%s.%6.}: '`{% endraw %} and run `zsh -ixc exit 2> startup.log`, then look for the big jumps between lines.

Startup can be fast while every prompt redraw is slow. `cd` into your biggest git repo and press Enter; if there's a delay before the next prompt appears, your prompt is doing synchronous work slowing it down. You can either switch to using an async prompt, or opt to strip out the Git functionality.

## Wrapping up

Most of these optimizations are about leaving stuff out. It's about being intentional and only adding things you're going to use. Every one of the dozens of sessions I open per day is instant, and my terminal feels like an extension of my brain instead of an application I'm waiting on. For a tool I use the entire day that's non-negotiable for me.

All of the above lives in [my dotfiles repo](https://github.com/mijndert/dotfiles) if you want to steal anything.
