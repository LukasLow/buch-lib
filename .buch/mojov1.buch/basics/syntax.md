# Syntax: the shape of a Mojo source file

This page describes how a Mojo source file is structured: comments, whitespace
and indentation, statements versus expressions, the discard `_`, docstrings,
where executable code lives, and how a file is run or built. The sources are the
official manual basics page and the language reference.

## Mojo is statically typed

Before the mechanics, the model. The official types reference states:

> Mojo is statically typed. Every value has a type that is known at compile
> time.

Source: <https://mojolang.org/docs/reference/types/>.

The manual basics page states the same rule for variables:

> Mojo variables are statically typed: that is, Mojo sets a variable's type at
> compile time, and the type doesn't change at runtime. If you don't specify a
> type, Mojo uses the type of the first value assigned to the variable.

Source: <https://mojolang.org/docs/manual/basics/>.

So the following is a compile-time error, not a runtime one:

```mojo
def main():
    var x = 10
    x = "Foo"  # Error: cannot implicitly convert
               # 'StringLiteral["Foo"]' value to 'Int'
```

See [`basics/variables-and-mutability`](variables-and-mutability.md) for `var`,
mutability and `ref`.

## Comments

Mojo has one comment form: the line comment introduced by `#`.

> You can create a one-line comment using the hash `#` symbol:

```mojo
# This is a comment. The Mojo compiler ignores this line.
```

Comments may also follow code on the same line:

```mojo
var message = "Hello, World!"  # This is also a valid comment
```

Source: <https://mojolang.org/docs/manual/basics/>.

There is **no block-comment syntax documented** in the official Mojo 1.x
manual or language reference. The manual documents `#` line comments and
triple-quoted docstrings, and nothing else; the language reference has no
comments page in its table of contents. When you need to disable several lines,
comment each line with `#`.

> **Open question:** Mojo is commonly assumed to be Python-like, and Python has
> no block comments either — but this book found **no official 1.x statement**
> that block comments are absent, and no `/* ... */` form anywhere in the
> official manual or reference. The documented comment form is `#` only. Verify
> with the compiler before asserting that a block-comment syntax exists or that
> it is impossible.

## Whitespace and indentation define blocks

Mojo uses indentation for blocks. A colon marks the start of a block, and the
following lines are indented:

> Define code blocks such as functions, conditions, and loops with a colon
> followed by indented lines. For example:

```mojo
def loop():
    for x in range(5):
        if x % 2 == 0:
            print(x)
```

> You can use any number of spaces or tabs for your indentation (we prefer 4
> spaces).

Source: <https://mojolang.org/docs/manual/basics/>.

The reference adds the exact rule and the error you get when you violate it:

> The body must be indented more than the header. The first body statement sets
> the indentation for the rest of the body:

```mojo
if condition:
    do_something()
      do_more()    # Error because statement has excess indentation
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

Every compound statement has a header ending in `:` and an indented body. The
body creates a new scope; variables declared inside are not visible outside:

```mojo
def f():
    if True:
        var x = 10
    # print(x)   # Error: x is not in scope
```

### Line breaks

Statements end at a newline, but you can break them inside brackets:

> All code statements in Mojo end with a newline. The Mojo compiler is fairly
> lenient in allowing extra line breaks. As a rule of thumb, you can always
> break statements between a pair of parentheses (`()`), square brackets (`[]`),
> or curly braces (`{}`):

```mojo
var long_text = (
    "This is a long line of text that is a lot easier to read if"
    " it is broken up across two lines instead of one long line."
)
```

Source: <https://mojolang.org/docs/manual/basics/>.

Adjacent string literals are combined, so `long_text` ends up as one string.

In 1.0 the compiler additionally rejects newlines in the middle of certain
statements — between `def`/`struct`/`trait`/`comptime` and the identifier,
between `async` and `def`, and anywhere inside an `import` statement (except
inside a parenthesized import list). Source:
<https://mojolang.org/releases/v1.0.0/>.

## Statements versus expressions

The reference defines the two precisely:

> An *expression* is any piece of code that produces a value.

Source: <https://mojolang.org/docs/reference/expressions/>.

> A *simple statement* performs a single action on one logical line. Multiple
> simple statements can share a line when separated by semicolons.

Source: <https://mojolang.org/docs/reference/simple-statements/>.

So `a + b` is an expression; `var x = a + b` is a statement. Statements use
expressions inside them. Assignment (`=`) is a **statement**, not an
expression:

```mojo
def main():
    var x = 1 + 2     # statement containing the expression `1 + 2`
    print(x)          # statement: an expression statement with a side effect
```

An expression statement that produces a non-`None` unused value draws a
warning:

```mojo
x + y              # Warning: result is unused
print("hello")     # no warning: the result is None
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

The one expression form of assignment is the walrus operator, `:=`, which binds
a name and evaluates to the bound value:

```mojo
def main():
    var items = [1, 2, 3, 4]
    var n: Int
    if (n := len(items)) > 3:
        print(n)   # 4
```

Source: <https://mojolang.org/docs/reference/expressions/>.

## The discard `_`

The underscore `_` discards a value. It is an identifier, **not a keyword** —
the keyword reference explicitly warns not to document it as one:

> The underscore `_` discards a value in an assignment:

```mojo
_, var y = get_pair()  # Ignore the first element
```

Source: <https://mojolang.org/docs/reference/literals/>.

Assigning an otherwise-unused expression statement to `_` silences the unused
result warning:

```mojo
_ = update()       # Explicitly discard the result
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

A loop whose induction variable is unused is a common case:

```mojo
for _ in range(3):
    print("tick")
```

The literal reference notes `...` and `pass` are not interchangeable: `pass` is
a no-op statement that provides an empty body, while `...` marks a trait method
as required. Source: <https://mojolang.org/docs/reference/literals/>.

## Docstrings

A docstring documents a declaration. It is a string literal placed immediately
after the declaration:

> Enclose API documentation comments in triple quotes.

```mojo
def print(x: String):
    """Prints a string.

    Args:
        x: The string to print.
    """
    ...
```

Source: <https://mojolang.org/docs/manual/basics/>.

The manual notes the precise nature of the construct:

> Technically, docstrings aren't _comments_, they're a special use of Mojo's
> syntax for multi-line string literals.

Source: <https://mojolang.org/docs/manual/basics/>.

The docstring reference gives placements. Type, trait and function docstrings
sit after the declaration line and before the body/members; field and `comptime`
docstrings follow the field or `comptime`:

```mojo
struct Color:
    """Represents an RGB color."""  # Struct docstring

    var r: UInt8
    """The red channel, in [0, 255]."""  # Field docstring

    comptime MAX: UInt8 = 255
    """The maximum value for any channel."""  # `comptime` docstring

    def to_hex(self) -> String:
        """Converts the color to a hex string."""  # Method docstring
        ...
```

> Place module docstrings as the first string in the file.

Source: <https://mojolang.org/docs/reference/docstrings/>.

The first sentence of a docstring is its summary and appears in index views. You
can generate an API reference from docstrings with the `mojo doc` command.
Source: <https://mojolang.org/docs/manual/basics/>.

## Top-level code execution and `main()`

Executable Mojo programs have an entry point named `main`:

> Every Mojo program must include a function named `main()` as the entry point.

Source: <https://mojolang.org/docs/manual/basics/>.

> An executable Mojo program *requires* you to define a no-argument `main()`
> function as its entry point. Running the program automatically invokes the
> `main()` function, and your program exits when the `main()` function returns.

Source: <https://mojolang.org/docs/manual/get-started/>.

```mojo
def main():
    print("Hello, world!")
```

Module scope (the top level of a file) is for **declarations**, imports and
`comptime` values — not for `var` and not for expressions:

> Expressions are not valid at module scope or in struct bodies outside of
> methods.

Source: <https://mojolang.org/docs/reference/simple-statements/>.

> Unlike `var` variables, `comptime` values can be defined at the module level,
> outside of any function.

Source: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

That official contrast means module scope may hold `comptime` constants, but a
`var` belongs inside a function. In short: put executable code in `main()`.

```mojo
comptime SIZE = 256          # OK at module scope: a comptime constant

def helper(x: Int) -> Int:   # OK at module scope: a declaration
    return x * x

def main():
    var total = 0            # `var` lives inside a function
    for i in range(SIZE):
        total += helper(i)
    print(total)
```

Many short snippets in the official reference omit `def main():` for brevity;
the manual says to add them to a `main()` function to test them. Source:
<https://mojolang.org/docs/manual/basics/>.

## Running versus building a file

Two documented ways to turn a file into a running program. The `mojo run`
command compiles and executes:

> Compiles the Mojo file at the given path and immediately executes it. Another
> way to execute this command is to simply pass a file to `mojo`. For example:
> `mojo hello.mojo`

Source: <https://mojolang.org/docs/cli/run/>.

`mojo build` produces a standalone executable instead:

> Compiles the Mojo file at the given path into an executable. By default, the
> executable is saved to the current directory and named the same as the input
> file, but without a file extension.

Source: <https://mojolang.org/docs/cli/build/>.

```sh
# Run directly (compile + execute):
mojo life.mojo

# Or spell it out:
mojo run life.mojo

# Build a standalone executable, then run it:
mojo build life.mojo
./life
```

Two practical details from the CLI reference:

- For `mojo run`, options for the command itself "must appear before the input
  file `path` argument"; anything after the file is passed to your program as an
  argument. Source: <https://mojolang.org/docs/cli/run/>.
- A built executable does **not** bundle Python libraries used by the project;
  they must be provided by the environment where the executable runs. Source:
  <https://mojolang.org/docs/cli/build/>.

Both commands perform ahead-of-time compilation of the Mojo source. Source:
<https://mojolang.org/docs/faq/>.

## Sources

- Mojo language basics (manual): <https://mojolang.org/docs/manual/basics/>
- Get started with Mojo (manual): <https://mojolang.org/docs/manual/get-started/>
- Compile-time evaluation (manual): <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>
- Mojo types reference: <https://mojolang.org/docs/reference/types/>
- Mojo expression reference: <https://mojolang.org/docs/reference/expressions/>
- Mojo simple statements reference: <https://mojolang.org/docs/reference/simple-statements/>
- Mojo compound statements reference: <https://mojolang.org/docs/reference/compound-statements/>
- Mojo literals reference: <https://mojolang.org/docs/reference/literals/>
- Mojo docstring reference: <https://mojolang.org/docs/reference/docstrings/>
- mojo run: <https://mojolang.org/docs/cli/run/>
- mojo build: <https://mojolang.org/docs/cli/build/>
- Mojo FAQ: <https://mojolang.org/docs/faq/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
