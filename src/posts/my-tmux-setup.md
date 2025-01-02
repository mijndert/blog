---
title: My Tmux setup
date: 2020-04-16 10:00:00
summary: A quick Tmux tutorial.
---

[Tmux](https://github.com/tmux/tmux/wiki) is a terminal multiplexer. It lets you switch between several programs through windows and panes, detach your session and reattach to it on a different computer. I reckon it's mostly used on servers where people have long running jobs and such running in a tmux session.

The learning curve is what always withheld me from just diving in and giving Tmux a chance to get integrated into my workflow. I wanted to share some of the small changes I made to [my Tmux configuration](https://github.com/mijndert/dotfiles) to make life a little easier.

<!--more-->

I now work in Tmux fulltime and I'm loving everything about it. Mostly because Tmux can be configured just the way I like it and because I can have this exact same configuration on all of my computers and servers.

And when I'm stuck there's always the [Tmux cheat sheet](https://tmuxcheatsheet.com/).

## Meta key

One thing I struggled with is getting my meta key right. The meta key is the prefix you use before issuing other commands that control Tmux. Commands such as creating and closing windows, splitting panes, moving between panes, etc. I finally landed on `ctrl + a` for my meta key, but you can pick anything you like really.

```
unbind C-b
set -g prefix C-a
bind-key C-a send-prefix
```

## The status bar

By default the Tmux status bar is green. This hurt my eyes so I figured out a way to change its colors a little bit. You can put all kinds of stuff in the status bar like your load averages, battery status, and much more. I like to keep it clean though.

```
set -g status-bg '#666666'
set -g status-fg 'white'
set -g status-left ''
set -g status-right ''
setw -g window-status-current-style 'fg=white bg=colour19'
```

## Count from 1

The status bar shows your currently open windows. One minor annoyance I faced was that it counted from zero and wouldn't rearrange its count as I closed windows. I change that behaviour so it's much easier to switch between windows using `ctrl + a` and the number of the window that I want to switch to.

```
set -g base-index 1
set -g renumber-windows on
```

## Start new windows in the same path

When I open a new window I usually want to start off in the same directory as the window I came from. Or at least close to it.

```
bind c new-window -c "#{pane_current_path}"
```

## Easier window splits

How to split a window into two different panes has quite the learning curve as, for me, the defaults were a little hard to work with. Now I can split windows using the `|` and `-` keys.

```
unbind '"'
unbind %
bind | split-window -h
bind - split-window -v
```
