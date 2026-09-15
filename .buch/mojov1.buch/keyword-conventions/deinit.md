# deinit

`deinit` is an **argument convention**: a `deinit` argument is a *destructive
transfer*. The function takes ownership of the value and destroys it — the value
is initialized at entry and uninitialized when the function returns.

`deinit` is **not a reserved keyword**. It has fixed meaning only as an
argument convention (and as a closure capture convention). See
[the chapter index](index.md) for the official wording.

## What it means

The official reference defines it in one line:

> Destructive transfer; end of a value's lifecycle

Source: <https://mojolang.org/docs/reference/keywords/>.

The manual states the contract precisely:

> `deinit`: A special convention used in the destructor and consuming-move
> lifecycle methods. A `deinit` argument is initialized at the beginning of the
> function, and uninitialized when the function returns.

Source: <https://mojolang.org/docs/manual/values/ownership/>.

Where it is required:

> The function takes ownership and destroys the value. Required for `self` in
> `__deinit__` and the argument in move constructors:

```mojo
struct Resource:
    var handle: Int

    def __deinit__(deinit self):
        _release(self.handle)
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

## The destructor uses `deinit self`

The destructor's `self` is the canonical `deinit` argument:

```mojo
def __deinit__(deinit self):
    print("cleaning up")
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

The lifecycle page expands what `deinit self` means in a method:

> - The method takes ownership of `self`.
> - No automatic destructor is called after the method returns.
> - Fields may be transferred or explicitly destroyed inside the method.
> - Additional cleanup work may take place within the method.
> - The value is considered destroyed when the method completes.

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

## Move constructors use `deinit` on the source

A move constructor is an `__init__` with a single keyword-only `move` argument,
and that argument uses the `deinit` convention:

```mojo
def __init__(out self, *, deinit move: Self):
    self.x = move.x
    self.y = move.y
```

> The `move` argument must use the `deinit` convention. Move constructors can't
> raise.

Source: <https://mojolang.org/docs/reference/function-declarations/>.

Both the consuming move constructor and the destructor therefore take their
operand with `deinit`, which "grants exclusive ownership of the value and marks
it as destroyed at the end of the function". Source:
<https://mojolang.org/docs/manual/lifecycle/death/>.

## Chaining deinitialization

A `deinit self` method may transfer `self` to another `deinit` method, delegating
cleanup:

```mojo
def cleanup_method1(deinit self):
    self^.cleanup_method2()

def cleanup_method2(deinit self):
    # Actually perform the cleanup
    pass
```

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

## `deinit` on other methods

The 0.26.1 release extended the convention beyond the lifecycle methods:

> The `deinit` argument convention can now be applied to any argument of a
> struct method, but the argument type still must be of the enclosing struct
> type.

Source: <https://mojolang.org/releases/v0.26.1/>.

## Explicit destruction: named destructors take `deinit self`

For a type marked `@explicit_destroy`, cleanup is performed by named methods
that take `deinit self`:

```mojo
@explicit_destroy
struct FileBuffer:
    var path: String
    var data: String

    def __init__(out self, path: String):
        self.path = path
        self.data = ""

    def write(mut self, content: String):
        self.data += content

    def save_and_close(deinit self) raises:
        write_to_disk(self.path, self.data)
```

Source: <https://mojolang.org/docs/reference/decorators/explicit-destroy/>.

Unlike `__deinit__()`, these named destructors can raise errors, which is one
reason explicit destruction exists. Source:
<https://mojolang.org/docs/manual/lifecycle/death/>. See
[`@explicit_destroy`](../decorators/explicit-destroy.md).

## Relationship to `owned` and `__del__`

Two pre-1.0 spellings map onto today's `deinit`:

| Legacy (pre-1.0) | Replacement |
|------------------|-------------|
| `owned` (for `__moveinit__`/`__del__` arguments) | `deinit` |
| `__del__` | `__deinit__` |

Sources: <https://mojolang.org/releases/v1.0.0/>,
<https://mojolang.org/releases/v0.26.2/>. Never write `owned` or `__del__` in
1.x code; see [`versions/1.0.0`](../versions/1.0.0.md).

## Pitfalls

- **Calling a destructor explicitly.** Don't. Use the discard pattern (`_ = t`)
  for explicit lifetime extension instead. Source:
  <https://mojolang.org/docs/manual/lifecycle/death/>.
- **Writing `owned`.** It was removed in v0.26.2; use `var` for parameters or
  `deinit` for `__deinit__`/move-constructor arguments. Source:
  <https://mojolang.org/releases/v0.26.2/>.
- **Writing `__del__`.** The destructor is `__deinit__` in 1.x. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Expecting a second implicit destructor after a `deinit` method.** `deinit
  self` means no automatic destructor runs afterward. Verified above.
- **Using `deinit` on an argument whose type is not the enclosing struct.**
  The convention is limited to the enclosing type on a method. Source:
  <https://mojolang.org/releases/v0.26.1/>.
- **Making a destructor raise.** `__deinit__()` can't raise; use
  `@explicit_destroy` with a named destructor if cleanup may fail. Source:
  <https://mojolang.org/docs/reference/function-declarations/>.
- **Treating `deinit` as reserved.** It is not on the keyword list. Source:
  <https://mojolang.org/docs/reference/keywords/>.

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo function declarations reference:
  <https://mojolang.org/docs/reference/function-declarations/>
- Value destruction (manual): <https://mojolang.org/docs/manual/lifecycle/death/>
- Ownership (manual): <https://mojolang.org/docs/manual/values/ownership/>
- `@explicit_destroy` reference:
  <https://mojolang.org/docs/reference/decorators/explicit-destroy/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
- Mojo v0.26.2 release notes: <https://mojolang.org/releases/v0.26.2/>
- Mojo v0.26.1 release notes: <https://mojolang.org/releases/v0.26.1/>
