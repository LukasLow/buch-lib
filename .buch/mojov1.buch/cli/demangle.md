# `mojo demangle`

Demangles the given name.

## Synopsis

```
mojo demangle [options] <name>
```

## Purpose

> If the given name is a mangled Mojo symbol name, prints the demangled name. If
> no name is provided, one is read from standard input.

Source: <https://mojolang.org/docs/cli/demangle/>.

*Name mangling* is the compiler's encoding of a declaration's full identity into
a single symbol string — the types, parameters and origin of a function become
part of the linker-visible name so that overloads and generic instances get
distinct symbols. `mojo demangle` reverses that encoding for readability.

This is a small utility command. It has no compilation, target, diagnostic or
output options; its only options are the shared common options.

## Options

| Option | Meaning |
|--------|---------|
| `--help`, `-h` | Displays help information. |
| `--help-hidden` | Displays help for hidden options. |

Those are the only options on the 1.x page. Source:
<https://mojolang.org/docs/cli/demangle/>.

## Two input paths: argument or stdin

The command accepts the name either way:

| Input | Form |
|-------|------|
| Argument | `mojo demangle <name>` |
| Standard input | run `mojo demangle` with no name and pipe/type a name |

The stdin path makes the command pipeable, which is its main practical use: feed
it the mangled symbols a linker, profiler or debugger produced.

## Realistic invocations

**Demangle one symbol given as an argument.**

```bash
mojo demangle "_ZN5mypkg3fooEi"
```

**Read names from standard input (one per invocation).**

```bash
nm ./app | mojo demangle
```

```bash
echo "_ZN5mypkg3fooEi" | mojo demangle
```

The pipe shape follows from the documented stdin behaviour ("If no name is
provided, one is read from standard input"), combined with an external symbol
source such as `nm`. The 1.x page documents no `nm` integration itself. Source:
<https://mojolang.org/docs/cli/demangle/>.

**Demangle a symbol found in a crash or profile report.**

```bash
mojo demangle "<symbol-copied-from-report>"
```

> **Open question:** the page does not say whether a single invocation can
> demangle several names (for example a whole stream). "one is read from
> standard input" is singular. If you pipe many symbols, verify whether each line
> is processed or only the first; on the documented reading, invoke the command
> per name. Source: <https://mojolang.org/docs/cli/demangle/>.

## Where mangled names appear

- **In built artifacts.** The compiler and linker expose mangled symbols in
  binaries; `mojo demangle` makes them readable.
- **In reflection.** Function reflection exposes the mangled form:
  `reflect_fn[my_func].linkage_name()` returns the "mangled symbol name", while
  `display_name()` returns the readable name. The v1.0.0b2 release notes show:

  ```mojo
  from std.reflection import reflect_fn

  def my_func(x: Int) -> Int:
      return x + 1

  def main():
      print(reflect_fn[my_func].display_name())  # "my_func"
      print(reflect_fn[my_func].linkage_name())  # mangled symbol name
  ```

  Source: <https://mojolang.org/releases/v1.0.0b2/>.

  `mojo demangle` is the CLI counterpart to that `linkage_name()` value: it
  turns a linkage name back into something a human can read.

- **In debugger output.** LLDB-based sessions (`mojo debug`, `mojo repl`)
  surface native symbol names; `mojo demangle` is the offline tool to interpret
  a name you copied out.

## Exit behaviour

- Success: the demangled name is printed and the command exits 0.
- If the input is not a recognised mangled name, the tool prints it back (it has
  nothing to decode) rather than failing.

> **Open question:** the page says only "If the given name is a mangled Mojo
> symbol name, prints the demangled name." It does not state what happens for a
> non-mangled or non-Mojo name, nor the exit codes. The behaviour above is the
> natural reading ("prints the demangled name" only when mangled), not a
> documented guarantee. Verify before scripting against the failure case.
> Source: <https://mojolang.org/docs/cli/demangle/>.

## Pitfalls

- **It demangles; it does not look symbols up.** There is no binary argument —
  `mojo demangle ./app` is not a documented form. Feed it a *name* (argument or
  stdin), not a file. Source: <https://mojolang.org/docs/cli/demangle/>.
- **Expecting compiler options.** The page documents none; `-O`, `-g`, `-D` are
  meaningless here. Source: <https://mojolang.org/docs/cli/demangle/>.
- **Quoting.** Mangled names can contain characters your shell treats specially;
  quote the argument. (General shell practice, not a Mojo rule.)
- **A name that is not Mojo-mangled.** The tool is for Mojo symbol names; the
  page makes no claim about C++ or Rust mangling. Source:
  <https://mojolang.org/docs/cli/demangle/>.

## See also

- [`index`](index.md) — the full command surface.
- [`debug`](debug.md) — where mangled names show up during a debug session.
- [Debugging and profiling](../tooling/debugging-and-profiling.md) — symbol
  names in debugger and profiler output.

## Sources

- `mojo demangle`: <https://mojolang.org/docs/cli/demangle/>
- Mojo CLI reference: <https://mojolang.org/docs/cli/>
- Mojo CLI reference (single document): <https://mojolang.org/llms-cli.txt>
- Mojo v1.0.0b2 release notes (`reflect_fn[...].linkage_name()`):
  <https://mojolang.org/releases/v1.0.0b2/>
