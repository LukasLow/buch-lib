# Pixi

Pixi is the conda-based environment manager Modular recommends for Mojo
development. This page is the practical guide, taken from the official
[Pixi basics](https://mojolang.org/docs/pixi/) page, plus the Mojo-specific
touches on the install, notebooks, get-started and packaging pages.

## What Pixi is and why Mojo uses it

> Pixi is a CLI tool [from Prefix.dev](https://prefix.dev/blog/launching_pixi)
> that we recommend you use to manage your package dependencies and virtual
> environments when developing with the Modular Platform and Mojo language.

Source: <https://mojolang.org/docs/pixi/>.

The page also records the tool's history, which is useful context but not a
command:

> We like Pixi so much, we created a fork called Magic, but [Magic is now
> deprecated](https://forum.modular.com/t/migrating-from-magic-to-pixi/1530)
> because Pixi can do everything we need.

Source: <https://mojolang.org/docs/pixi/>.

Why it matters for reproducibility:

> All our [GitHub code
> examples](https://github.com/modular/modular/tree/max/v26.5/mojo/examples)
> include a `pixi.toml` file. This file configures the environment to make sure
> we all use the same packages and get the same results—you just need to install
> `pixi`.

Source: <https://mojolang.org/docs/pixi/>.

## Install Pixi

```sh
curl -fsSL https://pixi.sh/install.sh | bash
```

Then enable auto-completion:

**bash:**

```sh
eval "$(pixi completion --shell bash)"
```

**zsh:**

```sh
autoload -Uz compinit && compinit  # redundant with Oh My Zsh
eval "$(pixi completion --shell zsh)"
```

**fish:**

```sh
pixi completion --shell fish | source
```

Update Pixi with:

```sh
pixi self-update
```

> **Caution — package-manager installs need the matching updater.** "If you've
> used a package manager like brew, mamba, conda, paru etc. to install pixi you
> must use the built-in update mechanism." For example `brew upgrade pixi`.
> Source: <https://mojolang.org/docs/pixi/>.

## Create a project and environment

Two documented paths:

### Option A — set default channels once, then `pixi init`

> Normally, you must use the `--channel` argument to specify where to get
> packages. Instead, we recommend you set default channels in your user config
> file (`$HOME/.pixi/config.toml`).

```sh
mkdir -p $HOME/.pixi
echo 'default-channels = ["https://conda.modular.com/max-nightly", "conda-forge"]' \
  >> $HOME/.pixi/config.toml
```

```sh
pixi init example-project
cd example-project
pixi add mojo
pixi run mojo --version
```

Source: <https://mojolang.org/docs/pixi/>.

### Option B — pass the channels explicitly to `pixi init`

The install page and the notebooks page use this form:

```sh
pixi init hello-world \
  -c https://conda.modular.com/max/ -c conda-forge
cd hello-world
pixi add mojo
```

The get-started tutorial uses the same shape (the version-conditional rendering
of its install page hides the exact command, but the surrounding text says it
"creates a project directory named `life`, adds the Modular conda package
channel, and navigates into the directory"). Sources:
<https://mojolang.org/install/>,
<https://mojolang.org/docs/manual/get-started/>,
<https://mojolang.org/docs/tools/notebooks/>.

### Stable vs nightly channels

| Channel | URL |
|---------|-----|
| Stable | `https://conda.modular.com/max/` |
| Nightly | `https://conda.modular.com/max-nightly/` |
| Community packages | `https://repo.prefix.dev/modular-community` |
| General tooling | `conda-forge` |

Sources: <https://mojolang.org/install/>,
<https://mojolang.org/docs/pixi/>,
<https://mojolang.org/docs/tools/notebooks/>,
<https://mojolang.org/packages/>.

## Manage packages

Dependencies live in the project's `pixi.toml`. Add a package with `pixi add`,
optionally with a version specifier:

```sh
pixi add "mojo~=1.0.0" "numpy<2.0"
pixi add "mojo=*"
```

Update and remove:

```sh
pixi update mojo
pixi remove mojo
```

Source: <https://mojolang.org/docs/pixi/>.

### Pin the Python version

The Python version is controlled like any other package:

```sh
pixi add "python==3.11"
pixi run python --version
```

```output
Python 3.11.0
```

Source: <https://mojolang.org/docs/pixi/>.

Mojo's own Python-interoperability requirement is Python **3.10–3.14** per the
system-requirements page (<https://mojolang.org/docs/requirements/>); pinning a
version in that range is the safe choice when a project uses Python interop. See
[install](../intro/install.md) for the full prerequisite.

## Run commands in the environment

```sh
pixi run mojo --version
```

or open a shell:

```sh
pixi shell
mojo --version
exit
```

Source: <https://mojolang.org/docs/pixi/>.

`pixi run` executes a command in the project's virtual environment; the
get-started tutorial uses it to verify the installed Mojo version
(<https://mojolang.org/docs/manual/get-started/>).

## Clean up

```sh
pixi clean
```

> This removes everything in the Pixi environment, including cached data and
> built packages. This is particularly useful when iterating on graph builds, as
> it will clear the MEF cache from the graph compiler.

**Caution:** "`pixi clean` removes more than just the MEF cache—it removes the
entire Pixi environment. You'll need to reinstall packages after running this
command." Source: <https://mojolang.org/docs/pixi/>.

## The `pixi.lock` file

> Although the project manifest file (`pixi.toml`) defines your project
> dependencies, it doesn't define the transitive dependencies … The transitive
> dependencies and the actually-installed versions are specified in the
> `pixi.lock` file, which is automatically generated—you should not edit this
> file by hand. This file is crucial to ensure that you can reliably reproduce
> your environment across different machines.

Source: <https://mojolang.org/docs/pixi/>. The get-started tutorial reinforces
it: "Never edit the lock file directly. The `pixi` command automatically updates
the lock file if you edit the manifest file" (<https://mojolang.org/docs/manual/get-started/>).

## Pixi and Mojo packages

- **`pixi add mojo`** installs the full Mojo SDK (compiler, stdlib, LSP,
  debugger, formatter, REPL) — see [install](../intro/install.md) and
  <https://mojolang.org/docs/faq/>.
- **`pixi add max`** installs the GPU/MAX stack (`mojo` included), for GPU work.
  The notebooks page explains that it installs `max` there "because it includes
  the Mojo compiler—so `%%mojo` cells behave exactly the same—and it adds the
  MAX accelerator library" (<https://mojolang.org/docs/tools/notebooks/>).
- **Community Mojo packages** come from the `modular-community` channel; add it
  to `pixi.toml`:

  ```toml
  [workspace]
  channels = [
    "https://conda.modular.com/max-nightly",
    "https://repo.prefix.dev/modular-community",
    "conda-forge",
  ]
  ```

  Source: <https://mojolang.org/packages/>.

- **Packaging your own package** is done with `rattler-build`, and the guide
  recommends installing it through Pixi: `pixi global install rattler-build`
  (<https://mojolang.org/docs/tools/packaging/>). See
  [packaging and distribution](../project/packaging-and-distribution.md).

## Local Jupyter notebooks via Pixi

The notebooks page builds an environment entirely with Pixi:

```shell
pixi init notebooks \
    -c https://conda.modular.com/max-nightly/ \
    -c conda-forge
cd notebooks
pixi shell
pixi add max jupyterlab ipykernel
jupyter lab
```

Source: <https://mojolang.org/docs/tools/notebooks/>. See
[notebooks](notebooks.md).

## A reproducible project recipe

Everything below is a documented Pixi or Mojo command; the assembly is the
point.

```sh
# 1. Project with the right channels.
pixi init my-mojo-project \
  -c https://conda.modular.com/max/ -c conda-forge
cd my-mojo-project

# 2. Pin the toolchain (1.x line) and Python.
pixi add "mojo~=1.0.0" "python==3.11"

# 3. Verify.
pixi run mojo --version

# 4. Work in the environment.
pixi shell
mojo run app.mojo
mojo format app.mojo
exit

# 5. Commit pixi.toml and pixi.lock (never edit the lock by hand).
```

## Pitfalls

- **Editing `pixi.lock` by hand.** It is generated; let Pixi update it. Sources:
  <https://mojolang.org/docs/pixi/>,
  <https://mojolang.org/docs/manual/get-started/>.
- **Expecting `pixi clean` to be targeted.** It removes the whole environment and
  cached data. Source: <https://mojolang.org/docs/pixi/>.
- **Forgetting the channel.** A package cannot be found if the Modular channel is
  absent; either pass `-c` or set `default-channels` in
  `$HOME/.pixi/config.toml`. Source: <https://mojolang.org/docs/pixi/>.
- **Mixing stable and nightly channels.** The stable channel is
  `.../max/`; nightly is `.../max-nightly/`. Pick per project. Source:
  <https://mojolang.org/docs/pixi/>,
  <https://mojolang.org/install/>.
- **Updating a package-installed Pixi with `self-update`.** Use the package
  manager's updater instead (for example `brew upgrade pixi`). Source:
  <https://mojolang.org/docs/pixi/>.
- **Pinning Python outside 3.10–3.14 when using Python interop.** The
  requirements page states the supported range. Sources:
  <https://mojolang.org/docs/requirements/>,
  <https://mojolang.org/docs/pixi/>.
- **Assuming `max[all]` is a documented Pixi spec.** The official Mojo pages do
  not show it; install `max` plainly. See [install](../intro/install.md).
- **Assuming Magic still works.** It is deprecated in favour of Pixi. Source:
  <https://mojolang.org/docs/pixi/>.

## See also

- [Install](../intro/install.md) — `mojo` vs `mojo-compiler`, uv/pixi/conda.
- [Notebooks](notebooks.md) — a Pixi-built Jupyter environment.
- [Packaging and distribution](../project/packaging-and-distribution.md) —
  `rattler-build`, installed via Pixi.
- [CI](../project/ci.md) — pinning the environment in a pipeline.
- [Supported platforms](../intro/supported-platforms.md) — OS and Python
  requirements.

## Sources

- Pixi basics: <https://mojolang.org/docs/pixi/>
- Install Mojo: <https://mojolang.org/install/>
- System requirements (Python 3.10–3.14):
  <https://mojolang.org/docs/requirements/>
- Get started with Mojo (Pixi project):
  <https://mojolang.org/docs/manual/get-started/>
- Jupyter notebooks (Pixi environment):
  <https://mojolang.org/docs/tools/notebooks/>
- Packaging (`pixi global install rattler-build`):
  <https://mojolang.org/docs/tools/packaging/>
- Packages (modular-community channel): <https://mojolang.org/packages/>
- Mojo FAQ (SDK contents): <https://mojolang.org/docs/faq/>
