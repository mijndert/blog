---
title: A minimalist take on Vim
date: 2022-04-15
summary: How I use Vim without any (well, almost) plugins.
---

I've been a Vim user for as long as I can remember, but in the last few years VS Code kind of took over as the defacto choice for us DevOps engineers. VS Code is great at offering all kinds of plugins that should, in theory, make life a little easier. It's funny actually, because plugins are the sole reason I never quite got into using Vim fulltime. To me, plugins in Vim just added to the complexity of remembering all of the keyboard shortcuts and quite frankly, the many ways of installing a plugin didn't help me make sense of things either.

But then Vim 8 was released.

[Vim 8](https://github.com/vim/vim/releases/tag/v8.0.0000) introduced a really simple _pack_ system for installing plugins. You can just drop a directory in the designated pack directory and Vim will automatically load everything that's there. When you `git clone` a plugin it's quite easy to update it whenever a new version is released.

That's not to say I've gone crazy and I'm now running 20 plugins. I only have a plugin for working with [Terraform](https://www.terraform.io/) and one for loading [EditorConfig](https://editorconfig.org/) files installed. And for me that's more than enough. Not because I can't handle complexity but mostly because Vim can do so much out of the box that most people are not aware of.

Let's dig deeper into my setup.

## Installing plugins

Installing [vim-terraform](https://github.com/hashivim/vim-terraform) and [editorconfig-vim](https://github.com/editorconfig/editorconfig-vim) is as easy as cloning their repositories into the pack directory.

```
git clone https://github.com/hashivim/vim-terraform.git ~/.vim/pack/plugins/start/vim-terraform
git clone https://github.com/editorconfig/editorconfig-vim.git ~/.vim/pack/plugins/start/editorconfig-vim
```

Within Vim you can execute `:scriptnames` to list all loaded plugins.

## My .vimrc

My .vimrc is exactly what I need and nothing more.

```vim
syntax on                           # enable syntax highlighting
set tabstop=2                       # set 1 tab to 2 spaces
set shiftwidth=2                    # set an indent to 2 spaces
set expandtab                       # convert tabs to spaces
set ai                              # automatic indentation
set number                          # enable line numbers
set hlsearch                        # highlight search matches
set ruler                           # show current row and column position
set backspace=2                     # fix backspace behaviour
set wildmenu                        # enable autocompletion
set path=$PWD/**                    # set search path
set wildmode=longest:list,full      # set autocompletion mode
set pastetoggle=<leader>p           # toggle paste mode using \p
set nuw=3                           # set left margin
set noswapfile                       # disable swapfiles
set clipboard=unnamed               # copy to system clipboard
highlight LineNr ctermfg=DarkGrey   # set linenumbers to grey
nnoremap <esc><esc> :noh<return>    # clear search results using esc-esc
colorscheme nord                    # set colorscheme to nord
```

## Keyboard shortcuts

Some of the common ones I use are **i** for insert mode and **v** for visual mode. Then there's **u** for undo, **y** for copy (yank), **d** for delete, and **aB** for selecting a block with accolades. And of course a bunch more, but I think you're good to go with just these ones.

Even after years of use and some amount of muscle memory, it still feels like I've only touched the surface of what's possible. When you're just starting out I highly recommend keeping a cheatsheet at hand, like [this one](https://vim.rtorr.com/).
