# Installing Mojo

Mojo is distributed as a package, not as a standalone installer. The official
statement is: "Mojo installs exactly like a Python or Conda package on macOS and
Linux" ([install guide](https://mojolang.org/install/)). The
[system requirements](supported-platforms.md) are separate from the install
procedure and must be met for the compiler to run.

The FAQ states the same thing from the SDK side: "You can get Mojo and all the
developer tools by installing `mojo` with any Python or Conda package manager"
([FAQ](https://mojolang.org/docs/faq/)).

This page covers the stable channel first, then the nightly channel, then the
two packages you can actually install, then GPU installs and post-install
tooling. It ends with the open documentation gaps you must not paper over.

## Install with `uv` (Python package manager)

`uv` is one of the two officially documented install paths. Install `uv` itself
first if needed:

```sh
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Then install Mojo into the current environment:

```sh
uv pip install mojo
```

Or create a project and add Mojo as a dependency:

```sh
uv init hello-world
cd hello-world
uv add mojo
```

Because `mojo` is a wheel on PyPI, any `pip`-compatible tool works, but the
official install page demonstrates `uv`.

## Install with `pixi` (conda package manager)

The conda path uses the `conda.modular.com` channels. Install `pixi` itself
first if needed:

```sh
curl -fsSL https://pixi.sh/install.sh | sh
```

Create a project that already knows the Modular channels, then add Mojo:

```sh
pixi init hello-world \
  -c https://conda.modular.com/max/ -c conda-forge
cd hello-world
pixi add mojo
```

Two things to remember about this path:

- The channel `https://conda.modular.com/max/` is the **stable** channel. The
  nightly channel is different (next section).
- `conda-forge` is required alongside it; the Modular channel does not carry
  every general-purpose dependency.

## Install the nightly channel

The stable `install` page links to a separate nightly page
([nightly install](https://mojolang.org/nightly/install/)). The nightly build
"includes new features, but isn't complete and might have new bugs"
([releases](https://mojolang.org/releases/)).

With `uv`, the nightly wheel index is `https://whl.modular.com/nightly/simple/`
and prereleases must be allowed explicitly:

```sh
uv pip install mojo \
  --index https://whl.modular.com/nightly/simple/ \
  --prerelease allow
```

Or in a project:

```sh
uv init hello-world
cd hello-world
uv add mojo \
  --index https://whl.modular.com/nightly/simple/ \
  --prerelease allow
```

With `pixi`, swap the stable channel for the nightly channel
`https://conda.modular.com/max-nightly/`:

```sh
pixi init hello-world \
  -c https://conda.modular.com/max-nightly/ -c conda-forge
cd hello-world
pixi add mojo
```

At the time of writing, the current nightly is
`mojo==1.1.0.dev2026091005` (Sep 10, 2026)
([releases](https://mojolang.org/releases/)).

> **Pitfall — the `.md` rendering of the install page drops the code blocks.**
> Reading `https://mojolang.org/install.md` returns a page whose tabs
> (`uv` / `pixi`) are stripped by the version-conditional rendering, so the
> commands above are taken from the rendered page
> ([install guide](https://mojolang.org/install/)) and the
> [nightly install page](https://mojolang.org/nightly/install/). Do not treat
> the empty `.md` output as "the install page has no commands".

## The two Mojo packages: `mojo` and `mojo-compiler`

The FAQ is explicit: "We actually offer two Mojo packages: `mojo` and
`mojo-compiler`" ([FAQ](https://mojolang.org/docs/faq/)).

**`mojo` — the full SDK.** It "gives you everything you need for Mojo
development":

| Included component | What it is |
|--------------------|------------|
| `mojo` CLI | Includes the Mojo compiler |
| Mojo standard library | The official stdlib (`std.*`) |
| `mojo` Python package | Lets Python import Mojo modules |
| Mojo language server (LSP) | IDE/editor integration |
| Mojo debugger | Includes LLDB |
| Mojo code formatter | `mojo format` |
| Mojo REPL | `mojo repl` |

**`mojo-compiler` — the smaller package.** It "is smaller and is useful for
environments where you only need to call or build existing Mojo code. For
example, this is good if you're running Mojo in a production environment or if
you're programming in Python and calling a Mojo package—situations where you
don't need the LSP and debugger tools" ([FAQ](https://mojolang.org/docs/faq/)).
It contains exactly:

| Included component |
|--------------------|
| `mojo` CLI (includes the Mojo compiler) |
| Mojo standard library |
| `mojo` Python package |

### When to choose which

| Situation | Package |
|-----------|---------|
| Interactive development, editing, debugging | `mojo` |
| You need the LSP for an editor | `mojo` |
| You need to step through code in LLDB / VS Code | `mojo` |
| You need `mojo format` or `mojo repl` | `mojo` |
| CI job that only compiles and runs existing Mojo code | `mojo-compiler` |
| Production container that only builds/runs Mojo | `mojo-compiler` |
| Python process that only imports a Mojo module | `mojo-compiler` |
| Community conda package author | `mojo-compiler` (see below) |

The last row is not just preference. The official packaging guide tells package
authors to pin `mojo-compiler` in the build and host requirements, because
precompiled `.mojoc` files "compile against a specific compiler version and
might not be compatible with other versions":
`pin_compatible('mojo-compiler')`
([packaging](https://mojolang.org/docs/tools/packaging/)). The
[community packages page](https://mojolang.org/packages/) adds that community
packages are distributed as conda packages through the `modular-community`
channel.

> **Open question — there is no documented install command for
> `mojo-compiler`.** The install page only ever shows `uv`/`pixi` commands for
> `mojo`, while the FAQ documents `mojo-compiler` as a package you can choose.
> The official docs never spell out `uv pip install mojo-compiler` or
> `pixi add mojo-compiler` as an install instruction; the closest is the
> packaging guide, which pins `mojo-compiler =25.5.0` as a build requirement.
> Whether `mojo-compiler` is meant to be installed directly by end users, or
> only as a dependency of precompiled packages, is not stated.

## Installing for GPU programming

GPU programming is optional and lives in the `max` package, not in `mojo`:

> "If you're interested in GPU programming, install the `max` package, which
> includes the MAX framework and Mojo."
> — [FAQ](https://mojolang.org/docs/faq/)

On the notebook path this is shown concretely: stable is `pip install max`,
nightly is
`pip install --pre max --extra-index-url https://whl.modular.com/nightly/simple/`
([notebooks](https://mojolang.org/docs/tools/notebooks/)). The same page notes
that for most notebook work "the `mojo` package is all you need" — `max` is
installed there only because the GPU examples import MAX libraries.

> **Open question — `max[all]` is not documented on mojolang.org.** Do not
> teach `max[all]` from any source in this buch. The 1.0.0 install page, the
> FAQ, the nightly install page, the notebooks page and the packages page never
> show an extras form; the documented GPU install is plain "install the `max`
> package" ([FAQ](https://mojolang.org/docs/faq/),
> [install](https://mojolang.org/install/),
> [nightly install](https://mojolang.org/nightly/install/)). The `[all]` form
> appears only in MAX documentation on the separate `max.modular.com` domain.
> The official Mojo sources therefore neither confirm nor deny it.
> Verified 2026-09-15.

## Post-install: editor extension

The official Mojo extension for Visual Studio Code (and VS Code-compatible
editors) provides "syntax highlighting, code completion, and debugging support".
It is published on two registries:

- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=modular-mojotools.vscode-mojo)
- [Open VSX Registry](https://open-vsx.org/extension/modular-mojotools/vscode-mojo)

The FAQ adds that it "works seamlessly with remote-ssh and dev containers"
([FAQ](https://mojolang.org/docs/faq/)). The debugger page notes that the
extension "relies on the Python extension for locating your Python environment"
and that if the SDK cannot be found you should run the
`Python: Set Project Environment` command
([debugging](https://mojolang.org/docs/tools/debugging/)).

## Post-install: official agent skills

Mojo ships official agent skills for AI coding assistants:

```sh
npx skills add modular/skills
```

The docs motivate them precisely for the problem this book exists to solve:
"Many AI models are trained on older versions of Mojo and MAX. They aren't
updated as quickly as the language evolves, so they often generate code that
doesn't compile or reflects outdated usage"
([skills](https://mojolang.org/docs/tools/skills/)). Individual skills can be
installed with `npx skills add modular/skills --skill mojo-syntax`, and skills
are licensed under Apache 2.0.

## License

The official license statement is unambiguous:

> "The Mojo SDK is licensed under the Apache License v2.0 with LLVM
> Exceptions."
> — [FAQ](https://mojolang.org/docs/faq/)

The same page repeats it for the language itself: "Mojo is open source under
the Apache License v2.0 with LLVM Exceptions." The canonical license file is
`https://github.com/modular/modular/blob/main/LICENSE`.

## Verifying the installation

A minimal, source-backed check sequence:

1. Confirm the compiler answers. The 1.0.0b1 release notes state that
   `mojo --version` "now prints a semantic Mojo version (for example,
   `1.0.0...`) instead of an internal build identifier"
   ([v1.0.0b1](https://mojolang.org/releases/v1.0.0b1/)).
2. Confirm the interpreter runs: `mojo run hello.mojo` with a `def main():`
   entry point. `mojo run` performs ahead-of-time compilation
   ([FAQ](https://mojolang.org/docs/faq/)).
3. For GPU machines, confirm detection with the program on the
   [requirements page](https://mojolang.org/docs/requirements/): build a
   `DeviceContext` and print its name.

## Troubleshooting: the `modular` package contradiction

> **Open question — the `modular` package is documented inconsistently for
> 1.0.** The official sources disagree, so do not assert its retirement as a
> fact; quote the contradiction instead.
>
> - **v25.5 (2025-08-05)** said the interop package was still `modular` and
>   would move: "To use Python to Mojo interoperability in v25.5, you must
>   install the `modular` package. This will move to the `mojo` package in a
>   future release."
>   ([v0.25.5](https://mojolang.org/releases/v0.25.5/))
> - **The 1.0.0 FAQ** lists only two packages and never mentions `modular`:
>   "We actually offer two Mojo packages: `mojo` and `mojo-compiler`."
>   ([FAQ](https://mojolang.org/docs/faq/))
> - **A current 1.0.0 manual page** still tells users to install it: "install
>   the `mojo` package—or, if you're developing for the MAX framework, install
>   the `modular` package, which includes the `mojo` package."
>   ([debugging](https://mojolang.org/docs/tools/debugging/))
>
> No 1.0.0 release note announces the `modular` package's retirement. The
> practical rule: install `mojo` (or `max` for GPU), and treat the `modular`
> instruction on the debugging page as stale until an official release note
> says otherwise.

## Other documented facts worth knowing

- **Older versions are no longer available to install** for the stable
  channel; the releases index keeps only the current window
  ([releases](https://mojolang.org/releases/)).
- **The version number is channel-dependent.** The same 2025 release appears as
  conda `25.5` and as PyPI `0.25.5`. See
  [version history](version-history.md#the-channel-ambiguity-conda-255-vs-pypi-0256)
  for the full explanation and the exact official wording.
- **Third-party Mojo packages are conda packages.** "You can install and
  distribute Mojo packages as conda packages"; the community channel is
  `modular-community`, and its `pixi.toml` uses
  `https://repo.prefix.dev/modular-community`
  ([packages](https://mojolang.org/packages/)).

## Sources

- https://mojolang.org/install/
- https://mojolang.org/nightly/install/
- https://mojolang.org/docs/faq/
- https://mojolang.org/docs/requirements/
- https://mojolang.org/docs/tools/notebooks/
- https://mojolang.org/docs/tools/skills/
- https://mojolang.org/docs/tools/debugging/
- https://mojolang.org/docs/tools/packaging/
- https://mojolang.org/packages/
- https://mojolang.org/releases/
- https://mojolang.org/releases/v0.25.5/
- https://mojolang.org/releases/v1.0.0b1/
- https://github.com/modular/modular/blob/main/LICENSE
