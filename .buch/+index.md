---
id: buch-lib
title: Buch Library
description: A public collection of buchs — practical knowledge for humans, teams and AI agents.
language: en
tags: [library, knowledge, buch]
---

# Buch Library

This is the `buch-lib` library: a public collection of **buchs**. A
buch is a small, versioned package of Markdown knowledge that humans read in
VS Code or Obsidian and AI agents load page by page or section by section.

Everything here is plain text. The `buch` CLI is a separate project; this
repository contains content only and runs nothing by itself.

## What is here

| Buch | Purpose |
|---|---|
| [`buch-authoring`](buch-authoring.buch/+index.md) | How to author a buch: structure, frontmatter, dynamic values, actions, distribution and good practices. |

Start with `buch-authoring` if you want to write your own buch.

## Using this library

```sh
buch lib add git github.com/LukasLow/buch-lib
buch list
buch read buch-authoring/structure
buch read buch-authoring/dynamic-values
```

A git library is untrusted until you grant it. Key rendering and action
execution are separate gates:

```sh
buch trust github.com/LukasLow/buch-lib           # allow keys to render
buch trust github.com/LukasLow/buch-lib --actions # allow actions to run
```

## Data statement

Local-only, no telemetry. Syncing goes to the git hosts you configure; their
policies apply.
