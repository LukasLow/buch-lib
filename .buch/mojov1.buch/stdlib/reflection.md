# reflection

`reflection` is the standard library package for **compile-time introspection**:
inspect a type's fields, a function's name and symbol, and a source location —
all at compile time, with no runtime cost.

> Compile-time reflection utilities for introspecting Mojo types and functions.

> This module provides compile-time reflection capabilities including:
>
> - Unified type and struct reflection via `reflect[T]`, a `comptime` alias for
>   the `Reflected[T]` handle type. Use `reflect[T].name()`,
>   `reflect[T].base_name()`, `reflect[T].field_count()`, etc.
> - Function name and linkage introspection (`get_function_name`,
>   `get_linkage_name`).
> - Source location introspection (`source_location`, `call_location`).
>
> `reflect` is auto-imported via the prelude. The other names listed above must
> be imported explicitly from `std.reflection`.

Source: <https://mojolang.org/docs/std/reflection/>.

## Cross-references

The concept chapters live elsewhere in the book:

- [Traits](../types/traits.md) — what traits are, conformance, and the type
  system this package introspects.
- [Decorators and metaprogramming](../functions/decorators-and-metaprogramming.md)
  — `comptime`, constraints, materialization, and a reflection primer.
- The official manual's reflection chapter:
  <https://mojolang.org/docs/manual/metaprogramming/reflection/>.
- The language reference: [`reference/`](../reference/index.md), whose
  [function declarations](../reference/function-declarations.md) and
  [trait declarations](../reference/trait-declarations.md) pages define the
  syntax reflection exposes.

## The big caveat

The manual is explicit that this is immature:

> Mojo reflection is newly introduced and currently incomplete. Some reflection
> capabilities are limited, unstable, or not yet fully exposed through the
> language interface. This page describes the direction of the feature as well
> as the parts that are available today.

Source: <https://mojolang.org/docs/manual/metaprogramming/reflection/>.

Treat every handle on this page as moving.

## Modules

| Module | Contents |
|--------|----------|
| `reflect` | `reflect[T]` (`comptime` alias) and `Reflected[T]`. |
| `function` | `reflect_fn[func]` (`comptime` alias) and `ReflectedFn[func]`. |
| `type_info` | `get_function_name`, `get_linkage_name`. |
| `location` | `SourceLocation`, `source_location`, `call_location`. |

Source: <https://mojolang.org/docs/std/reflection/>.

## `reflect[T]` — type introspection

`reflect[T]` is a `comptime` alias for the `Reflected[T]` handle type. The handle
has **no runtime state** — `T` lives entirely in the compile-time parameter — so
queries are spelled `reflect[T].method()` (no parentheses after `[T]`). Source:
<https://mojolang.org/docs/std/reflection/reflect/>.

The spelling rule from the `Reflected` page:

- A member that returns a **type** is a `comptime` member alias, spelled
  **without** `()`: `field[name]`, `field_at[idx]`.
- A member that returns a **value** is an `@staticmethod`, spelled **with** `()`:
  `field_count()`, `field_names()`, `field_types()`, `field_index["x"]()`.

Source: <https://mojolang.org/docs/std/reflection/reflect/Reflected/>.

| Member | Returns | Purpose |
|--------|---------|---------|
| `is_struct()` | `Bool` | "Returns `True` if `T` is a Mojo struct type, `False` otherwise." |
| `name[*, qualified_builtins: Bool = False]()` | `StaticString` | The fully qualified struct name. |
| `base_name()` | `StaticString` | The unqualified base name (`List` for `List[Int]`). |
| `field_count()` | `Int` | Number of fields. |
| `field_names()` | `Array[StringSpan, N]` | Field names. |
| `field_types()` | `TypeList` | Field types (nested struct kept whole). |
| `field_index[name]()` | `Int` | Index of a named field; needs a concrete `T`. |
| `field[name]` | `Reflected[FieldT]` | Handle to a named field's type. |
| `field_at[idx]` | `Reflected[FieldT]` | Handle by index; works with a generic `T`. |
| `field_ref[idx](s)` | `ref` to the field | Reference to a field; supports mutation. |
| `field_offset[name=…]()` / `field_offset[index=…]()` | `Int` | Byte offset including alignment padding. |

Sources: <https://mojolang.org/docs/std/reflection/reflect/Reflected/>,
<https://mojolang.org/docs/std/reflection/reflect/>.

The wrapped type is exposed as `.T`, so a handle composes in type position:
`reflect[Point].field["y"].T` is `Float64`. Source:
<https://mojolang.org/docs/std/reflection/reflect/Reflected/>.

### A runnable example

```mojo
struct Point:
    var x: Int
    var y: Float64

def print_fields[T: AnyType]():
    comptime names = reflect[T].field_names()
    comptime for i in range(reflect[T].field_count()):
        print(names[i])

def main():
    print_fields[Point]()          # x, y
    print(reflect[Point].field_count())                  # 2
    print(reflect[Point].base_name())                    # Point
    comptime y_type = reflect[Point].field["y"]
    var v: y_type.T = 3.14                               # Float64
    print(v)
```

Source: <https://mojolang.org/docs/std/reflection/reflect/>.

### Iterating fields with a guard

`is_struct()` exists because the other methods produce a compile error on
non-struct (MLIR primitive) types:

```mojo
def process_type[T: AnyType]():
    comptime if reflect[T].is_struct():
        print("struct with", reflect[T].field_count(), "fields")
    else:
        print("non-struct:", reflect[T].name())
```

Source: <https://mojolang.org/docs/std/reflection/reflect/Reflected/>.

### Field offsets and layout

```mojo
struct Packet:
    var flags: UInt8
    var id: UInt32
    var payload: UInt64

def main():
    comptime flags_off = reflect[Packet].field_offset[name="flags"]()   # 0
    comptime id_off = reflect[Packet].field_offset[name="id"]()         # 4
    comptime payload_off = reflect[Packet].field_offset[name="payload"]() # 8
    print(flags_off, id_off, payload_off)
```

Source: <https://mojolang.org/docs/manual/metaprogramming/reflection/>.
`field_offset` "accounts for alignment padding. Computed using the target's data
layout." Source:
<https://mojolang.org/docs/std/reflection/reflect/Reflected/>.

### Mutating through `field_ref`

```mojo
@fieldwise_init
struct Container:
    var id: Int
    var name: String

def main():
    var c = Container(id=1, name="test")
    reflect[Container].field_ref[0](c) = 42   # mutates c.id
    print(c.id)                               # 42
```

Source: <https://mojolang.org/docs/std/reflection/reflect/Reflected/>.
`field_ref` "returns a reference rather than a copy, so this works with
non-copyable field types and supports mutation through the result."

## `reflect_fn[func]` — function introspection

`reflect_fn[func]` is the function-side counterpart, a `comptime` alias for
`ReflectedFn[func]`:

| Method | Returns | Purpose |
|--------|---------|---------|
| `display_name()` | `StaticString` | "Returns the function's name as declared in source." |
| `linkage_name[*, target=…]()` | `StaticString` | "Returns the function's mangled linkage / symbol name." |

Source: <https://mojolang.org/docs/std/reflection/function/ReflectedFn/>.

```mojo
from std.reflection import reflect_fn

def my_func(x: Int) -> Int:
    return x + 1

def main():
    print(reflect_fn[my_func].display_name())   # "my_func"
    print(reflect_fn[my_func].linkage_name())   # mangled symbol
```

Source: <https://mojolang.org/docs/std/reflection/function/>.

The older free functions `get_function_name[func]()` and
`get_linkage_name[func]()` live in `type_info` and do the same job:

> This module exposes the function-side counterparts:
>
> - `get_function_name[func]()` - returns the source name of a function.
> - `get_linkage_name[func]()` - returns the symbol/linkage name of a function.

Source: <https://mojolang.org/docs/std/reflection/type_info/>.

```mojo
from std.reflection import get_function_name, get_linkage_name

def process_data():
    pass

def main():
    print(get_function_name[process_data]())   # process_data
    print(get_linkage_name[process_data]())    # mangled symbol
```

Source: <https://mojolang.org/docs/std/reflection/type_info/>.

## `location` — source locations

`SourceLocation` "stores source location data and provides utilities for
formatting location-prefixed messages." Its accessors: `line()`, `column()`,
`file_name()` (returns `StaticString`) and `prefix(msg)`, which formats
`"At file:line:col: msg"`. It is `Writable`, so it prints directly. Source:
<https://mojolang.org/docs/std/reflection/location/SourceLocation/>.

The two capture functions differ in *whose* location they report:

- `source_location()` — "Returns the location for where this function is
  called," i.e. inside the function that calls it.
- `call_location[*, inline_count: Int = 1]()` — "Returns the location for where
  the caller of this function is called." Requires the enclosing function to be
  `@always_inline` (or `@always_inline("nodebug")`); `inline_count` skips extra
  inlined levels.

Sources: <https://mojolang.org/docs/std/reflection/location/source_location/>,
<https://mojolang.org/docs/std/reflection/location/call_location/>.

`call_location()` is what makes a custom assertion point at the call site:

```mojo
from std.reflection import call_location

@always_inline  # Required for call_location() to work
def assert_positive(value: Int) raises:
    if value <= 0:
        raise Error(call_location().prefix("value must be positive"))

def main() raises:
    var x = 5
    assert_positive(x)   # fine
    # assert_positive(-1)  # Error: At file:line:col: value must be positive
```

Source: <https://mojolang.org/docs/std/reflection/location/call_location/>.
Without `@always_inline`, the location would point inside `assert_positive()`
instead of the caller.

## Idioms

- **Assign a value-returning query to a `comptime` variable.** The `Reflected`
  page recommends it explicitly: "assign the result of static methods that return
  type-level values (such as `field_names`, `field_types`, `field_count`) to
  `comptime` variables so the work happens at compile time."
- **Guard with `comptime if reflect[T].is_struct()`** before field queries on a
  type that may be an MLIR primitive.
- **Use `field_at[idx]` in a `comptime for` loop**, not `field[name]`, because
  the name is not a literal there and `field[name]` requires a concrete `T`.
- **Use `field_ref` to avoid copying** and to mutate in place.
- **Use `@always_inline` on any helper that calls `call_location()`.**
- **Use `get_function_name[func]()` for logging and tracing** — it is free at
  runtime because the name is resolved at compile time.
- **Prefer `reflect_fn[func].display_name()`** over the older free function for
  new code; both are documented.

## Pitfalls

- **Forgetting the parentheses.** `field_count()` is a static method;
  `field["x"]` is a `comptime` alias. Mixing them up is a compile error.
- **Using `field[name]` when `T` is a generic parameter.** The reference says it
  "requires a concrete type, not a generic type parameter"; use `field_at[idx]`.
- **Calling `call_location()` from a non-inlined function.** It will point at the
  wrong place; the docs require `@always_inline`.
- **Expecting `field_types()` to flatten nested structs.** "For nested structs
  this returns the struct type itself, not its flattened fields."
- **Relying on layout through `field_offset` across targets.** The value is
  computed from a target's data layout and can differ per target; re-verify.
- **Assuming reflection is complete.** The manual calls it "newly introduced and
  currently incomplete" with capabilities that are "limited, unstable, or not yet
  fully exposed."
- **Depending on `associatedtype`/reflection spelling stability.** See the open
  question on [Traits](../types/traits.md).
- **Forgetting that only `reflect` is in the prelude.** `Reflected[T]`,
  `reflect_fn`, `SourceLocation`, `get_function_name` and friends need an import
  from `std.reflection`.

> **Open question:** the manual's reflection page lists `reflect[T].field["x"]`
> returning a handle whose type is read with `.T`, while the API page documents
> `field[name]` as a `comptime` member that already resolves to `Reflected[FieldT]`.
> The two agree in substance, but the manual's "read `.T`" phrasing and the API's
> "use `field[name].T` in type position" phrasing are easy to misread. Verify
> against the compiler which spelling a given release accepts. Sources:
> <https://mojolang.org/docs/manual/metaprogramming/reflection/>,
> <https://mojolang.org/docs/std/reflection/reflect/Reflected/>.

> **Open question:** the reflection page says reflection is "newly introduced and
> currently incomplete" and that its examples "may change as reflection support
> matures", yet the stability page gives the language a broad stable default and
> the `Reflected`/`ReflectedFn` pages show no `@stable` marker. Treat every
> reflection handle as moving and re-check it against the current release.
> Sources: <https://mojolang.org/docs/manual/metaprogramming/reflection/>,
> <https://mojolang.org/docs/api-docs/stability/>.

## Stability

The `reflection` package page, its module pages and the `Reflected`,
`ReflectedFn` and `SourceLocation` pages show **no `@stable(since=...)` marker**
and no stability badges. Under the standard-library rule — "We consider standard
library APIs unstable unless specifically marked stable" — these APIs are
**unstable by default**. The manual's own "newly introduced and currently
incomplete" warning reinforces this. Sources:
<https://mojolang.org/docs/std/reflection/>,
<https://mojolang.org/docs/manual/metaprogramming/reflection/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `reflection` package: <https://mojolang.org/docs/std/reflection/>
- Mojo `reflect` module: <https://mojolang.org/docs/std/reflection/reflect/>
- Mojo `Reflected` struct: <https://mojolang.org/docs/std/reflection/reflect/Reflected/>
- Mojo `function` module: <https://mojolang.org/docs/std/reflection/function/>
- Mojo `ReflectedFn` struct: <https://mojolang.org/docs/std/reflection/function/ReflectedFn/>
- Mojo `type_info` module: <https://mojolang.org/docs/std/reflection/type_info/>
- Mojo `get_function_name`: <https://mojolang.org/docs/std/reflection/type_info/get_function_name/>
- Mojo `location` module: <https://mojolang.org/docs/std/reflection/location/>
- Mojo `SourceLocation` struct: <https://mojolang.org/docs/std/reflection/location/SourceLocation/>
- Mojo `source_location`: <https://mojolang.org/docs/std/reflection/location/source_location/>
- Mojo `call_location`: <https://mojolang.org/docs/std/reflection/location/call_location/>
- Mojo manual — Reflection: <https://mojolang.org/docs/manual/metaprogramming/reflection/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
