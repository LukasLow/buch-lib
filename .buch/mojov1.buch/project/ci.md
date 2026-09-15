# CI

A practical continuous-integration outline for a Mojo project, built only from
documented facts. The pieces come from the
[install page](https://mojolang.org/install/), the
[Pixi page](https://mojolang.org/docs/pixi/), the
[requirements page](https://mojolang.org/docs/requirements/), the
[testing page](https://mojolang.org/docs/tools/testing/), the
[CLI reference](https://mojolang.org/docs/cli/), and the
[packaging guide](https://mojolang.org/docs/tools/packaging/).

> **Read this first — no vendor-specific CI configuration is invented here.**
> The official Mojo docs do not publish a GitHub Actions workflow, a GitLab CI
> file, or any other CI-provider configuration. This page describes the *steps*
> a Mojo CI job must take, with the documented commands for each. Wiring those
> commands into a specific provider's YAML is left to you. Where the docs are
> silent, an open question is marked.

## The four steps

Every Mojo CI job reduces to the same four documented actions:

1. **Pin the toolchain version.**
2. **Install Mojo** (`pixi`, `uv`, conda, or pip).
3. **Run the test suite** (`mojo run` on each test file).
4. **Build** (`mojo build`) to prove the program links.

Each is documented; the sections below give the exact commands.

## 1. Pin the toolchain version

Mojo versions must be explicit in CI, for two documented reasons:

- **Standard library APIs are mostly unstable.** "We consider standard library
  APIs unstable unless specifically marked stable" and the stable set "is small"
  at the current release (`%%mojo.version%%`)
  (<https://mojolang.org/docs/api-docs/stability/>). A CI job that floats on
  nightly will break without warning.
- **Precompiled `.mojoc` files are compiler-version-locked.** A package built by
  one compiler version errors when loaded by another
  (<https://mojolang.org/docs/cli/precompile/>). If CI consumes or produces
  `.mojoc` files, the version must be pinned on both sides.

### With Pixi

```sh
pixi add "mojo~=1.0.0"
```

Version specifiers are documented on the Pixi page: "You can optionally specify
the version with a version specifier", e.g. `pixi add "mojo~=1.0.0" "numpy<2.0"`.
Use `"mojo=*"` only if you deliberately want the latest.

The resolved versions are recorded in `pixi.lock`, which "is crucial to ensure
that you can reliably reproduce your environment across different machines" and
"should not edit … by hand". Commit both `pixi.toml` and `pixi.lock`. Sources:
<https://mojolang.org/docs/pixi/>,
<https://mojolang.org/docs/manual/get-started/>.

### With uv

```sh
uv add mojo
# or, in a project:
uv pip install mojo
```

For the nightly index (not recommended for CI unless you are testing nightly):

```sh
uv pip install mojo \
  --index https://whl.modular.com/nightly/simple/ \
  --prerelease allow
```

Source: <https://mojolang.org/install/>.

### Which channel

| Channel | Use in CI for… |
|---------|-----------------|
| `https://conda.modular.com/max/` (stable) | Release-gating jobs. |
| `https://conda.modular.com/max-nightly/` (nightly) | A separate, non-blocking nightly job. |
| `https://repo.prefix.dev/modular-community` | Jobs consuming community Mojo packages. |
| `conda-forge` | General tooling alongside Modular packages. |

Sources: <https://mojolang.org/install/>,
<https://mojolang.org/docs/pixi/>,
<https://mojolang.org/packages/>.

### Verify the pin

```sh
pixi run mojo --version
```

`mojo --version` prints a semantic Mojo version since v1.0.0b1
(<https://mojolang.org/docs/cli/>,
<https://mojolang.org/releases/v1.0.0b1/>). Record it in the job log so a red
build can be diagnosed as "toolchain changed" versus "code broke".

## 2. Install Mojo in the runner

The requirements page constrains the runner itself:

| Requirement | Value |
|-------------|-------|
| Linux | glibc 2.34+ (Ubuntu 22.04 LTS or later is "officially supported"). |
| macOS | macOS Sequoia (15)+ on Apple silicon. |
| CPU | x86-64-v3 (Haswell-class, ~2013+) or ARM64 Neoverse N1+. |
| RAM | 8 GiB minimum for Mojo development. |
| Software | A C compiler on Linux (used as a linker); Xcode/Xcode CLT 16+ on macOS. |
| Windows | Only via WSL. |

Sources: <https://mojolang.org/docs/requirements/>,
<https://mojolang.org/docs/faq/>.

The two documented install paths for a runner:

```sh
# Pixi (recommended)
curl -fsSL https://pixi.sh/install.sh | sh
pixi install          # materialises the pinned environment from pixi.toml/lock
pixi run mojo --version
```

```sh
# uv
curl -LsSf https://astral.sh/uv/install.sh | sh
uv pip install mojo
```

Sources: <https://mojolang.org/docs/pixi/>,
<https://mojolang.org/install/>.

> **Open question — `pixi install` in CI.** The Pixi page documents `pixi init`,
> `pixi add`, `pixi run`, `pixi shell`, `pixi update`, `pixi remove`, `pixi
> clean` and the lock file. It does **not** show an explicit "install from the
> lock file" CI command. `pixi install` is the conventional command, but it is
> not on the official Mojo docs pages; verify against the Pixi documentation
> (<https://pixi.sh/latest/>) before relying on it. Source:
> <https://mojolang.org/docs/pixi/>.

### Which package to install

| Package | CI use |
|---------|--------|
| `mojo` | Full SDK: compiler, stdlib, LSP, debugger, formatter, REPL. Needed if CI runs `mojo format` or any debugging tooling. |
| `mojo-compiler` | Smaller: CLI + stdlib + Python package. Enough to compile, run and precompile; not for formatting/debugging. |
| `max` | GPU/MAX work; includes Mojo. |

Source: <https://mojolang.org/docs/faq/>.

For a CI job that only compiles and runs tests, `mojo-compiler` is the smaller
choice; a job that also enforces formatting needs `mojo`.

## 3. Run the test suite

Tests are run file by file with `mojo run`. The official testing page's commands
always pass `-I src` because test files import the target module:

```bash
mojo run -I src test/my_math/test_inc.mojo
```

**A failing test suite exits non-zero**, so a CI step can rely on the exit code:

```output
Summary [ 0.009 ] 2 tests run: 1 passed , 1 failed , 0 skipped
Test suite 'ROOT_DIR/test_quickstart.mojo' failed!

mojo: error: execution exited with a non-zero result: 1
```

Source: <https://mojolang.org/docs/tools/testing/>.

### Running all test files

There is no documented `mojo test` command or recursive test runner; each test
file has its own `main()`. A CI loop over the test files is the composition of
two documented facts (each test file is a program; a failed suite exits
non-zero):

```sh
status=0
for f in test/**/test_*.mojo; do
  pixi run mojo run -I src "$f" || status=1
done
exit "$status"
```

> **Open question — a recursive test runner.** The official 1.x docs publish no
> `mojo test` command and no recursive runner; the loop above is not itself an
> official recipe. It composes documented behaviour only. Sources:
> <https://mojolang.org/docs/tools/testing/>,
> <https://mojolang.org/docs/cli/>.

### Useful test flags in CI

| Flag | Why CI cares |
|------|--------------|
| `--skip-all` | Collect and list the tests without running them (a discovery smoke test). |
| `--only <name>` / `--skip <name>` | Focus a failing job; names must match exactly, one flag per command. |
| `suite^.run(quiet=True)` | In the test file: silent when the suite passes, prints only on failure. |

Sources: <https://mojolang.org/docs/tools/testing/>,
<https://mojolang.org/docs/std/testing/suite/TestSuite/>.

See [testing](../tooling/testing.md) for the full framework.

## 4. Build

```sh
mojo build src/my_package/../main.mojo -o build/app
```

or, for a library:

```sh
mojo build mylib.mojo --emit shared-lib -o libmylib.so
```

`mojo build` "compiles the Mojo file at the given path into an executable" and
fails non-zero on compile/link errors; `--Werror` promotes warnings to failures.
Source: <https://mojolang.org/docs/cli/build/>.

If the project distributes a precompiled package, also verify precompilation:

```sh
mojo precompile src/my_package -o my_package.mojoc
```

Source: <https://mojolang.org/docs/cli/precompile/>.

### A stricter build gate

```sh
mojo build --Werror --diagnose-missing-doc-strings app.mojo -o build/app
```

Both flags are documented on the build page. Be careful, though, with
`--warn-on-unstable-apis`: the stability page "doesn't currently recommend this
because the stable API set is small", so combining it with `--Werror` would fail
almost everything. Sources:
<https://mojolang.org/docs/cli/build/>,
<https://mojolang.org/docs/api-docs/stability/>,
<https://mojolang.org/docs/tools/feature-toggles/>.

## Optional: formatting and docstring gates

### Formatting

`mojo format` rewrites files in place and documents no `--check` mode, so a CI
"is the tree formatted?" gate must format and then inspect the diff:

```sh
pixi run mojo format src/ test/
git diff --exit-code    # fails if formatting changed anything
```

Source: <https://mojolang.org/docs/cli/format/>.

> **Open question — a formatter check mode.** No `mojo format --check` or
> `--dry-run` is documented on the 1.x page; the `git diff --exit-code` pattern
> above is the workable substitute. Verify whether an undocumented check mode
> exists before depending on it. Source:
> <https://mojolang.org/docs/cli/format/>.

### Docstrings

```sh
mojo doc src/my_package --diagnose-missing-doc-strings --Werror -o docs.json
```

Both validation flags are documented on the `mojo doc` page. Source:
<https://mojolang.org/docs/cli/doc/>.

## A provider-neutral CI job

The steps below are commands, not YAML. Drop them into any runner.

```sh
set -euo pipefail

# --- Install ---
curl -fsSL https://pixi.sh/install.sh | sh
pixi install                       # pinned by pixi.toml + pixi.lock
pixi run mojo --version            # log the toolchain version

# --- Static gates ---
pixi run mojo format src/ test/
git diff --exit-code               # formatting unchanged

# --- Test ---
for f in test/**/test_*.mojo; do
  pixi run mojo run -I src "$f"
done

# --- Build ---
pixi run mojo build --Werror src/main.mojo -o build/app

# --- Optional: packaging artifact ---
pixi run mojo precompile src/my_package -o my_package.mojoc
```

Every command is documented; see the sources at the end. What is *not*
documented is any specific provider's job syntax — supply that yourself.

## Cross-platform notes

- **Linux and macOS only.** Mojo "supports Mac and Linux natively and supports
  Windows via WSL" (<https://mojolang.org/docs/faq/>). A Windows CI job must use
  WSL or a Linux container.
- **macOS needs Apple silicon** and macOS Sequoia (15)+
  (<https://mojolang.org/docs/requirements/>).
- **Linux needs a C compiler** available as a linker, and glibc 2.34+
  (<https://mojolang.org/docs/requirements/>). On a minimal container image,
  install `cc`/`gcc`/`clang` before building.
- **CPU baseline.** x86 runners must be x86-64-v3 (Haswell-class). Older cloud
  runners may fail; check the microarchitecture level
  (<https://mojolang.org/docs/requirements/>).
- **GPU jobs are optional and NVIDIA-only for debugging.** GPU CI needs drivers
  (NVIDIA driver 580+, or AMD 6.3.3+) and the requirements page's compatibility
  tiers (<https://mojolang.org/docs/requirements/>,
  <https://mojolang.org/docs/tools/debugging/>).

## Release automation

Once the test and build gates pass, the documented path to a release is the
packaging flow, not a bespoke script:

- `modular-community` hosts packages whose recipes are merged into
  `modular/modular-community`; "The repo automatically builds and hosts all the
  packages based on the recipes in the repo"
  (<https://mojolang.org/docs/tools/packaging/>).
- `rattler-build-action` is the GitHub Action named by the guide as the expected
  CI integration: the recipe location `conda.recipe/recipe.yaml` is "the location
  expected by the GitHub Action
  ([rattler-build-action](https://github.com/prefix-dev/rattler-build-action))"
  (<https://mojolang.org/docs/tools/packaging/>).

So release automation reduces to: keep `conda.recipe/recipe.yaml` current, bump
`context.version`, reset `build.number` to `0`, and let the channel's automation
build it. See [packaging and distribution](packaging-and-distribution.md).

> **Open question — a Mojo-specific release workflow.** The packaging guide names
> `rattler-build-action` and the modular-community automation, but the Mojo 1.x
> docs publish no complete release workflow (tagging, changelogs, artifacts).
> Treat the recipe + channel as the documented automation and fill in the rest.

## Pitfalls

- **Floating on `mojo=*`.** The stdlib is mostly unstable and `.mojoc` is
  compiler-locked; pin `"mojo~=1.0.0"`-style versions. Sources:
  <https://mojolang.org/docs/pixi/>,
  <https://mojolang.org/docs/api-docs/stability/>,
  <https://mojolang.org/docs/cli/precompile/>.
- **Editing `pixi.lock`.** It is generated; commit it and let Pixi update it.
  Sources: <https://mojolang.org/docs/pixi/>,
  <https://mojolang.org/docs/manual/get-started/>.
- **Running on a non-conforming runner.** glibc, CPU baseline, RAM and a linker C
  compiler are hard requirements. Source:
  <https://mojolang.org/docs/requirements/>.
- **Forgetting `-I src` on test runs.** Test files import the target module and
  fail to compile without it. Source:
  <https://mojolang.org/docs/tools/testing/>.
- **Combining `--warn-on-unstable-apis` with `--Werror` as a blanket gate.** The
  docs do not recommend the flag yet, and the stable set is small. Source:
  <https://mojolang.org/docs/api-docs/stability/>.
- **Expecting `mojo format --check`.** It is not documented; use
  `git diff --exit-code` after formatting. Source:
  <https://mojolang.org/docs/cli/format/>.
- **Expecting `mojo test`.** There is no such documented command; run each test
  file with `mojo run`. Source: <https://mojolang.org/docs/cli/>.
- **Building with `--experimental-fixit` in CI.** It "may result in irreversible
  data loss"; use `--experimental-export-fixit` for reviewable output. Source:
  <https://mojolang.org/docs/cli/build/>.
- **Assuming a Windows-native runner.** Windows is WSL-only. Source:
  <https://mojolang.org/docs/faq/>.
- **Installing `mojo-compiler` and running `mojo format`.** The smaller package
  has no formatter, LSP or debugger. Source:
  <https://mojolang.org/docs/faq/>.

## See also

- [Testing](../tooling/testing.md) — the suite commands in full.
- [`mojo build`](../cli/build.md), [`mojo run`](../cli/run.md) — the CLI flags.
- [Formatter and linter](../tooling/formatter-and-linter.md) — the static gates.
- [Pixi](../tooling/pixi.md) — pinning the environment.
- [Structure](structure.md) — the layout CI operates on.
- [Packaging and distribution](packaging-and-distribution.md) — release
  automation via modular-community.
- [Compiler and flags](../tooling/compiler-and-flags.md) — `-D ASSERT`, debug
  profiles, sanitizers in CI.

## Sources

- Install Mojo: <https://mojolang.org/install/>
- System requirements: <https://mojolang.org/docs/requirements/>
- Pixi basics: <https://mojolang.org/docs/pixi/>
- Testing: <https://mojolang.org/docs/tools/testing/>
- `TestSuite` reference: <https://mojolang.org/docs/std/testing/suite/TestSuite/>
- `mojo build`: <https://mojolang.org/docs/cli/build/>
- `mojo run`: <https://mojolang.org/docs/cli/run/>
- `mojo format`: <https://mojolang.org/docs/cli/format/>
- `mojo doc`: <https://mojolang.org/docs/cli/doc/>
- `mojo precompile`: <https://mojolang.org/docs/cli/precompile/>
- Mojo CLI reference: <https://mojolang.org/docs/cli/>
- Packaging (rattler-build, modular-community automation):
  <https://mojolang.org/docs/tools/packaging/>
- Packages (modular-community channel): <https://mojolang.org/packages/>
- Mojo FAQ (OS support, SDK contents): <https://mojolang.org/docs/faq/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
- Compilation feature toggles: <https://mojolang.org/docs/tools/feature-toggles/>
- Mojo v1.0.0b1 release notes (`mojo --version`):
  <https://mojolang.org/releases/v1.0.0b1/>
- Official docs map: <https://mojolang.org/llms.txt>
