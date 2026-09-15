# Your first program

This page is the practical bridge between [installing Mojo](install.md) and
writing real code: the smallest complete program, the commands that run and
build it, the REPL and formatter, the edit → run loop an agent should follow,
how to read the installed version, and the first-run failures worth knowing
before they cost you an hour.

It is sourced from the official
[get-started tutorial](https://mojolang.org/docs/manual/get-started/), the
[quickstart](https://mojolang.org/docs/manual/quickstart/) and the CLI command
pages [`run`](https://mojolang.org/docs/cli/run/),
[`build`](https://mojolang.org/docs/cli/build/),
[`repl`](https://mojolang.org/docs/cli/repl/) and
[`format`](https://mojolang.org/docs/cli/format/).

## The smallest complete program

Every executable Mojo program needs a no-argument `main()` entry point. The
official wording:

> An executable Mojo program *requires* you to define a no-argument `main()`
> function as its entry point. Running the program automatically invokes the
> `main()` function, and your program exits when the `main()` function returns.
> — <https://mojolang.org/docs/manual/get-started/>

The tutorial's first file is exactly this:

```mojo title="life.mojo"
# My first Mojo program!
def main():
    print("Hello, World!")
```

Three documented facts about that snippet:

- `def` defines the function.
- `print()` "is a Mojo built-in, so it doesn't require an import."
- Indentation is like Python's: "You can use any number of spaces or tabs for
  indentation as long as you use the same indentation for the entire code
  block." The official examples use 4 spaces.

The quickstart's equivalent is `analyzer.mojo`:

```mojo title="analyzer.mojo"
def main():
    print("Temperature Analyzer")
```

Source: <https://mojolang.org/docs/manual/quickstart/>.

A `main()` that can raise declares `raises`. The tutorial shows the transition:
`input()` can raise, so the version of `main()` that calls it reads
`def main() raises:`. "Mojo functions are non-raising by default—you only need
`raises` when a function can propagate an error to its caller." Source:
<https://mojolang.org/docs/manual/get-started/>.

## Create a project and install Mojo

The get-started tutorial recommends `pixi` (for the alternatives, see
[install](install.md)). The sequence it documents:

```sh
# 1. Install pixi if you do not have it.
curl -fsSL https://pixi.sh/install.sh | sh

# 2. Create a project, add the Modular conda channel, and enter it.
pixi init life \
  -c https://conda.modular.com/max/ -c conda-forge
cd life

# 3. Install the mojo package.
pixi add mojo
```

After `pixi add mojo`, `ls -A` shows the project files the tutorial lists:

```output
.gitattributes
.gitignore
.pixi
pixi.lock
pixi.toml
```

`pixi.toml` is the manifest ("defines the project dependencies"), `pixi.lock`
"specifies the transitive dependencies and actual package versions installed in
the project's virtual environment", and `.pixi` is the conda virtual
environment. The tutorial adds: "Never edit the lock file directly. The `pixi`
command automatically updates the lock file if you edit the manifest file."
Sources: <https://mojolang.org/docs/manual/get-started/>,
<https://mojolang.org/docs/pixi/>.

The `uv` path (from the install guide) is:

```sh
uv pip install mojo
```

Source: <https://mojolang.org/install/>. Full options and the nightly channel
are on [install](install.md) and
[packages and environments](packages-and-environments.md).

## How to know which version is installed

`mojo --version` (or `-v`) "Prints the Mojo version and exits"; it belongs to the
`mojo` command itself, not to a subcommand
(<https://mojolang.org/docs/cli/>). Since v1.0.0b1 it prints a semantic version:

> `mojo --version` now prints a semantic Mojo version (for example,
> `1.0.0...`) instead of an internal build identifier.

Source: <https://mojolang.org/releases/v1.0.0b1/>.

Inside a Pixi project, run it through the project environment so you are reading
the project's version, not another one on your machine:

```sh
pixi run mojo --version
```

The tutorial says this "executes a command in the project's virtual
environment" and that "You should see a version string indicating the version of
Mojo installed, which by default should be the latest version. You can view and
edit the version for your project in the dependencies list in the `pixi.toml`
file." Source: <https://mojolang.org/docs/manual/get-started/>.

Once you are inside the environment (`pixi shell`), bare `mojo --version` works
too (<https://mojolang.org/docs/pixi/>).

## Run the program

The tutorial first enters the project environment, then runs the file:

```sh
pixi shell          # start a shell session in the project's virtual environment
mojo life.mojo
```

```output
Hello, World!
```

"When you want to exit the virtual environment, just type `exit`." Source:
<https://mojolang.org/docs/manual/get-started/>.

The quickstart skips the explicit `pixi shell` and shows the command directly:

```sh
mojo analyzer.mojo
```

```output
Temperature Analyzer
```

Source: <https://mojolang.org/docs/manual/quickstart/>.

`mojo life.mojo` and `mojo run life.mojo` are the same command. The CLI
reference documents `mojo <path>` as identical to `mojo run <path>`
(<https://mojolang.org/docs/cli/>). Two facts that matter for an agent:

- **Options go before the filename.** "Options for this command itself … must
  appear before the input file `path` argument. Any command line arguments that
  appear after the Mojo source file `path` are interpreted as arguments for that
  Mojo program." So `mojo run app.mojo -O0` passes `-O0` to *your program*.
  Source: <https://mojolang.org/docs/cli/run/>.
- **It compiles, it does not interpret.** The FAQ is explicit: "Mojo is a
  compiled language. `mojo build` and `mojo run` both perform ahead-of-time
  (AOT) compilation." (<https://mojolang.org/docs/faq/>). The get-started page
  describes the user-visible step as JIT compilation before running the result;
  the authoritative statement about the compilation model is the FAQ. This is
  the same nuance recorded on [`mojo run`](../cli/run.md).

## Build an executable

The tutorial's second step is `mojo build`:

```sh
mojo build life.mojo   # saves an executable file named `life` in the current directory
./life
```

```output
Hello, World!
```

Source: <https://mojolang.org/docs/manual/get-started/>.

The `build` page states the default naming rule: "By default, the executable is
saved to the current directory and named the same as the input file, but without
a file extension." Use `-o` to be explicit, and remember the single most
important limitation:

> Beware that any Python libraries used in your Mojo project are not included in
> the executable binary, so they must be provided by the environment where you
> run the executable.

Source: <https://mojolang.org/docs/cli/build/>. For the full option set
(`--emit`, targets, `-O`/`-g`, sanitizers), see [`mojo build`](../cli/build.md).

When to use which, in one line each:

| Command | When |
|---------|------|
| `mojo run file.mojo` (or `mojo file.mojo`) | The edit → run loop; nothing persisted. |
| `mojo build file.mojo -o prog` | You want an artifact to run repeatedly or ship. |

## The REPL

Bare `mojo` and `mojo repl` are the same command: "Launches a Mojo
read-evaluate-print loop (REPL) environment, which provides interactive
development in the terminal. You can also start the REPL by simply running
`mojo`." Source: <https://mojolang.org/docs/cli/repl/>.

```sh
mojo repl
```

The REPL's arguments are forwarded to the underlying LLDB tool, **not** to the
Mojo compiler: "Any number of options and arguments may be specified on the
command line. These are then forwarded to the underlying lldb tool, which runs
the REPL." So do not expect `-O`, `-g` or `-D` to apply in the REPL; use
`mojo run` or `mojo build` for those. The REPL ships with the full `mojo`
package, not with `mojo-compiler`. Source: <https://mojolang.org/docs/cli/repl/>,
<https://mojolang.org/docs/faq/>. Full details: [`mojo repl`](../cli/repl.md).

Use the REPL to check an expression or a language construct; use a file with
`main()` for anything that has to run through `mojo run` or `mojo build`.

## Format the source

`mojo format` "Formats the given set of Mojo sources using a Mojo-specific lint
tool." It takes a **list** of sources and rewrites them in place.

```sh
mojo format app.mojo
mojo format app.mojo lib/util.mojo tests/test_app.mojo
mojo format --line-length 100 mypackage
```

The synopsis is `mojo format [options] <sources...>`, and the only documented
format option is `--line-length <INTEGER>` / `-l <INTEGER>` (default 80).
`--quiet` / `-q` "[d]isables non-error messages". Source:
<https://mojolang.org/docs/cli/format/>. Full command page:
[`mojo format`](../cli/format.md); formatter-versus-linter context:
[formatter and linter](../tooling/formatter-and-linter.md).

**Pitfall:** there is no documented dry-run/`--check` flag — it edits files in
place. Run it on a clean working tree so the diff is reviewable
(<https://mojolang.org/docs/cli/format/>).

## The edit → run loop an agent should follow

The commands below are each documented; the ordering is the practical loop.

```sh
# 1. Enter the project environment once per shell.
pixi shell

# 2. Edit a source file.

# 3. Format the file you touched (in place).
mojo format app.mojo

# 4. Compile and run. A clean compile is the first correctness gate.
mojo run app.mojo

# 5. When it must ship, build the artifact.
mojo build app.mojo -o bin/app
```

Rules that make this loop reliable:

- **Treat a clean compile as the first gate, not the last.** Mojo is
  statically typed and ownership-checked; type errors, a missing `mut`, a
  use-after-transfer and an uninitialized field are compile-time failures.
- **Put compiler options before the filename.** Anything after the file becomes
  a program argument (<https://mojolang.org/docs/cli/run/>).
- **Add `--Werror` when you want warnings to fail the command**; on `run`,
  `build` and `precompile` this "[t]reat[s] warnings as errors"
  (<https://mojolang.org/docs/cli/build/>).
- **Do not lean on `--experimental-fixit`.** It "is highly experimental and may
  result in irreversible data loss"; to review fixes first, use
  `--experimental-export-fixit` (<https://mojolang.org/docs/cli/build/>).
- **Re-format after upgrading the toolchain.** The formatter tracks new syntax
  and lagged it at least once: `mojo format` only learned the bare move-capture
  form `{name^}` in v1.0.0b2 (<https://mojolang.org/releases/v1.0.0b2/>).

If you work in an editor instead of a terminal, the same commands are what the
extension runs underneath; the extension itself does not accept compilation
flags. See [editor and LSP](../tooling/editor-and-lsp.md).

## Common first-run failures

These are the failures the official pages actually document. Each one names the
documented cause and the documented fix.

### 1. Toolchain and PATH: `mojo` not found until you enter the environment

The tutorial's own sequence is to enter the project environment *before* the
first `mojo` invocation:

```sh
pixi shell      # then: mojo life.mojo
```

The quickstart's project-setup section says the same thing: "You can install
Mojo using any Python or Conda package manager, but we recommend either `pixi`
or `uv`." Sources: <https://mojolang.org/docs/manual/get-started/>,
<https://mojolang.org/docs/manual/quickstart/>.

**Practical reading:** `mojo` is provided by the project environment; a shell
that has not entered that environment (or run `pixi run`) is not guaranteed to
find it on `PATH`. Use `pixi run mojo …` or `pixi shell`, or install Mojo in the
environment you are actually in. The editor-side version of this failure is
documented on the debugging page: if the extension "cannot find your SDK
installation", run the **Python: Set Project Environment** command and select
your virtual environment (<https://mojolang.org/docs/tools/debugging/>).

### 2. Missing package manager

Mojo is installed *through* a package manager; both official paths install their
manager first:

```sh
# pixi (conda path)
curl -fsSL https://pixi.sh/install.sh | sh

# uv (Python path)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Sources: <https://mojolang.org/docs/manual/get-started/>,
<https://mojolang.org/install/>. If neither `pixi` nor `uv` is present, there is
no install command to run yet — install the manager first. (On a Pixi project,
`pixi self-update` updates Pixi; if Pixi came from a package manager such as
brew, "you must use the built-in update mechanism" —
<https://mojolang.org/docs/pixi/>.)

### 3. Windows: there is no native support

If the failure is on Windows, the documented answer is not a flag:

> Mojo doesn't natively support Windows. You can use Mojo on [Windows with
> WSL](https://learn.microsoft.com/en-us/windows/wsl/install) using a compatible
> version of Ubuntu (see the Linux requirements).

Source: <https://mojolang.org/docs/requirements/>. So on Windows: install WSL
with a compatible Ubuntu, then follow the Linux instructions inside WSL. The
get-started page repeats the platform line: "You can use Mac, Linux, or Windows
with WSL." Full platform matrix: [supported platforms](supported-platforms.md).

### 4. Linux and macOS prerequisites: the native toolchain

- **Linux:** "A C compiler (such as `cc`, `gcc`, or `clang`) on Linux—used as a
  linker." Without it, linking a build fails.
- **Linux glibc:** 2.34 or later (Ubuntu 22.04 LTS+). Older glibc means "run
  Mojo inside a container with a compatible base image such as Ubuntu 22.04."
- **macOS:** "Xcode or Xcode Command Line Tools 16 or later."
- **macOS for GPU work:** you may need the Metal toolchain:
  `xcodebuild -downloadComponent MetalToolchain`.

Source: <https://mojolang.org/docs/requirements/>. The full list of hardware and
GPU prerequisites is on [supported platforms](supported-platforms.md).

### 5. Python interop fails without a supported interpreter

Mojo itself does not require Python. If your program imports Python, the
supported window is Python 3.10–3.14: "Mojo itself doesn't require Python. To
use the Mojo ↔ Python interoperability features described in this section, you
need Python 3.10–3.14." Source: <https://mojolang.org/docs/manual/python/>. So
an `import_module()` failure can be an environment problem, not a code problem —
the `mojo build` binary does not embed Python, and the interpreter must exist
where the program runs (<https://mojolang.org/docs/cli/build/>). See
[packages and environments](packages-and-environments.md) for pinning the
interpreter and [calling Python from Mojo](../interop/calling-python.md) for the
interop itself.

## Where to go next

- [Packages and modules](packages-and-modules.md) — how to organise code beyond
  a single file, and where to put each file in a real project.
- [Packages and environments](packages-and-environments.md) — dependencies,
  channels and version pinning.
- [`mojo run`](../cli/run.md), [`mojo build`](../cli/build.md),
  [`mojo repl`](../cli/repl.md), [`mojo format`](../cli/format.md) — the full
  command reference.
- [Editor and LSP](../tooling/editor-and-lsp.md) — the editor-side workflow.
- [Testing](../tooling/testing.md) — the correctness loop beyond a manual run.

## Sources

- https://mojolang.org/docs/manual/get-started/
- https://mojolang.org/docs/manual/quickstart/
- https://mojolang.org/docs/cli/run/
- https://mojolang.org/docs/cli/build/
- https://mojolang.org/docs/cli/repl/
- https://mojolang.org/docs/cli/format/
- https://mojolang.org/docs/cli/
- https://mojolang.org/install/
- https://mojolang.org/docs/requirements/
- https://mojolang.org/docs/faq/
- https://mojolang.org/docs/pixi/
- https://mojolang.org/docs/manual/python/
- https://mojolang.org/docs/tools/debugging/
- https://mojolang.org/releases/v1.0.0b1/
- https://mojolang.org/releases/v1.0.0b2/
