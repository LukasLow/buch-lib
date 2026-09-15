# AGENTS.md — buch-lib

This repository contains **content only** (buchs under `.buch/`). Nothing here
runs by itself; the `buch` CLI is a separate project.

## Rules

- **Never install, build, vendor, clone or copy the `buch` CLI into this
  repository.** This repo is content only. The CLI lives in its own project.
- **Never run a `buch` binary.** The only sanctioned invocation is:
  `go run github.com/LukasLow/buch/cmd/buch@latest <args>`
  — never `buch`, never a downloaded/built binary, never a local clone.
- **Never write into or modify the CLI source repository**
  (`github.com/LukasLow/buch`, or any local checkout of it). It is read-only
  for this project. The one exception is `go run …@latest` fetching it into the
  Go module cache — that is fine.
- **Scratch work stays outside the repo.** Temporary clones, builds and
  experiments go under `/tmp`, never inside the working tree.

## Why

A nested checkout inside the working tree pollutes diffs and can be committed
by accident.
