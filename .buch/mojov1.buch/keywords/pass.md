# pass

`pass` is a no-op placeholder statement. It satisfies the syntax where a
statement is required but no action is wanted.

## Purpose

The official keywords reference defines `pass` in one line:

> `pass` — No-op placeholder statement

Source: <https://mojolang.org/docs/reference/keywords/>.

> `pass` is a no-op. Use it as a placeholder where a statement is required but
> no action is needed.

Source: <https://mojolang.org/docs/reference/simple-statements/>.

```mojo
def not_ready():
    pass

struct Empty:
    pass
```

> `pass` is required in empty function and struct bodies to avoid syntax errors.

Source: <https://mojolang.org/docs/reference/simple-statements/>.

## Where `pass` appears

Because every `def`, `struct`, `trait`, and compound-statement body requires at
least one statement, `pass` is the way to say "nothing here":

- An empty function body. A body is always required:
  "Although you can't leave out the function body, you can use the `pass`
  statement to define a function that does nothing." Source:
  <https://mojolang.org/docs/manual/functions/>.
- An empty struct body. `struct ValidationError: pass` is the minimal struct.
  Source: <https://mojolang.org/docs/reference/struct-declarations/>.
- An empty branch of `if`/`elif`/`else`, or of a loop body, when the branch is
  intentionally not implemented yet.
- An empty `except` body.

```mojo
def main():
    var value = 3
    if value < 0:
        pass          # not handled yet
    elif value == 0:
        print("zero")
    else:
        print("positive")
```

## `pass` versus `...` — two different ideas

This is the single most important distinction on this page. The literals
reference states it directly:

> `...` and `pass` aren't interchangeable. `pass` is a no-op statement that
> provides an empty body. `...` is a requirement marker that means "you must
> implement this."

Source: <https://mojolang.org/docs/reference/literals/>.

In a **trait**, the difference is load-bearing: "An ellipsis (`...`) marks a
required method. Conforming types must provide an implementation", while a
method body of `pass` is a *provided* method — an inherited default that does
nothing. Source: <https://mojolang.org/docs/reference/trait-declarations/>.

The trait reference gives the compiler behaviour:

> `pass` and `...` mean distinct things in trait bodies:
>
> - `...` marks a required method stub.
> - `pass` is a no-op that counts as a provided implementation body. It's only
>   valid when the method returns `None`.

And the error case:

```mojo
trait Unsupported:
    def __compute__(self) -> Int:
        pass
    # Error because trait method with a return type must not use 'pass'.
    # Use '...' to declare the method as required.
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

So:

| Body | Meaning |
|------|---------|
| `pass` | A real (empty) implementation. Conforming types inherit it. |
| `...` | No implementation at all. Conforming types must supply one. |

Outside a trait, `...` is not valid: the literals reference notes that it "is
only valid inside trait definitions". Source:
<https://mojolang.org/docs/reference/literals/>.

## `pass` is not an expression

A conditional expression needs values, not statements, and `pass` is a
statement. The compound-statements reference names the failure directly:

```mojo
print("positive") if x > 0 else pass
    # Error because 'pass' isn't an expression
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

The same applies to the `and`/`or` shortcut:
`x > 0 and print("positive")` is an error "because `None` isn't truthy".
Source: <https://mojolang.org/docs/reference/compound-statements/>.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `def` | Empty function bodies need `pass`. |
| `struct` | Empty struct bodies need `pass`. |
| `trait` | `pass` is a provided implementation; `...` is a required stub. |
| `if`, `elif`, `else` | Empty branches may use `pass`. |
| `None` | A method whose body is `pass` must return `None` (or be unannotated). |

## Signature vs. body

`pass` never appears in a signature. It is a statement, used as the whole body
of a construct. It takes no arguments, produces no value, and has no effect at
runtime.

## Pitfalls

- **Using `pass` where `...` is required.** In a trait method that declares a
  return type, `pass` is a compile error; it "must not use `pass`". Use `...`
  to mark the method required. Source:
  <https://mojolang.org/docs/reference/trait-declarations/>.
- **Using `pass` in a trait as a silent default.** `pass` makes the method
  *provided*, so conforming types compile without implementing it. If the intent
  was "every type must implement this", write `...`.
- **Reaching for `pass` in an expression.** It is not a value; a ternary branch
  cannot be `pass`. Source:
  <https://mojolang.org/docs/reference/compound-statements/>.
- **Leaving `pass` in shipped code.** `pass` compiles, so an unfinished function
  silently returns `None` instead of failing loudly. Prefer raising or asserting
  for genuinely unimplemented paths.
- **`pass` versus an empty body.** A body may not be empty; removing `pass`
  without adding anything else is a syntax error.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`struct`](struct.md), [`trait`](trait.md), [`if`](if.md),
[`simple-statements`](../reference/simple-statements.md),
[`literals`](../reference/literals.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo simple statements reference:
  <https://mojolang.org/docs/reference/simple-statements/>
- Mojo literals reference: <https://mojolang.org/docs/reference/literals/>
- Mojo struct declarations reference:
  <https://mojolang.org/docs/reference/struct-declarations/>
- Mojo trait declarations reference:
  <https://mojolang.org/docs/reference/trait-declarations/>
- Mojo compound statements reference:
  <https://mojolang.org/docs/reference/compound-statements/>
- Functions (manual): <https://mojolang.org/docs/manual/functions/>
