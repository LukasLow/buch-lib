# Cheat sheet

A dense, offline quick reference for Mojo 1.x syntax. Scan the tables; follow a
link only when you need the detail. Everything here is the current 1.x spelling —
the pre-1.0 spellings (`fn`, `read`, `owned`, `InlineArray`, `__del__`, …) live
only in [`versions/1.0.0`](../versions/1.0.0.md) and are not shown here.

**Sources for the whole page:** the official language reference
(<https://mojolang.org/docs/reference/>), the keywords reference
(<https://mojolang.org/docs/reference/keywords/>), the function-declarations
reference (<https://mojolang.org/docs/reference/function-declarations/>), the
compound-statements reference
(<https://mojolang.org/docs/reference/compound-statements/>), the
manual basics (<https://mojolang.org/docs/manual/basics/>) and the CLI reference
(<https://mojolang.org/docs/cli/>). Individual rows cite a narrower source where
useful.

## 1. Program shape

| Thing | Form |
|-------|------|
| Entry point | `def main():` — one required |
| Run | `mojo hello.mojo` or `mojo run hello.mojo` |
| Build | `mojo build hello.mojo` → `./hello` |
| REPL | `mojo repl` |
| Format | `mojo format file.mojo` (`-l` sets max line length, default 80) |
| Doc | `mojo doc file.mojo` |
| Package a `.mojoc` | `mojo precompile mypackage -o mypack.mojoc` |
| Module = | one `.mojo` file |
| Package = | a directory with `__init__.mojo` |

Sources: <https://mojolang.org/docs/manual/basics/>,
<https://mojolang.org/docs/cli/run/>, <https://mojolang.org/docs/cli/build/>,
<https://mojolang.org/docs/cli/format/>,
<https://mojolang.org/docs/manual/packages/>.

**Module scope** holds declarations, imports and `comptime` values — not `var`
and not expressions. Executable code goes in `main()`.

## 2. Declarations and bindings

| Purpose | Syntax | Example |
|---------|--------|---------|
| Mutable variable | `var name = value` | `var count = 0` |
| Typed variable | `var name: Type = value` | `var ratio: Float64 = 0.5` |
| Uninitialized variable | `var name: Type` | `var sum: Int` |
| Reference binding | `ref name = existing` | `ref view = items[0]` |
| Compile-time constant | `comptime NAME = value` | `comptime SIZE = 256` |
| Typed compile-time constant | `comptime NAME: Type = value` | `comptime MAX: UInt8 = 255` |
| Type alias | `comptime Alias = TypeExpr` | `comptime Key = String` |
| Parameterized alias | `comptime Alias[X] = TypeExpr` | `comptime Dict2[V] = Dict[String, V]` |

Sources: <https://mojolang.org/docs/manual/variables/>,
<https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>,
<https://mojolang.org/docs/manual/parameters/>.

**Implicit declaration is deprecated.** Write `var` always. Source:
<https://mojolang.org/releases/v1.0.0/>.

## 3. Functions

| Purpose | Syntax |
|---------|--------|
| Free function | `def name(a: T) -> R:` |
| No return value | `def name(a: T):` (or `-> None`) |
| Parameterized | `def name[P: Trait](a: T) -> R:` |
| Raising | `def name(a: T) raises -> R:` |
| Typed raising | `def name(a: T) raises MyErr -> R:` |
| Where clause | `def name[P: AnyType](a: T) -> R where cond:` |
| Named result | `def name(a: T, out r: R):` |
| Static method | `@staticmethod` + `def name(a: T):` (no `self`) |
| Lambda | `lambda` (see [closures](../functions/closures-and-lambdas.md)) |

Sources: <https://mojolang.org/docs/reference/function-declarations/>,
<https://mojolang.org/docs/manual/functions/>.

### Argument conventions

| Convention | Meaning |
|-----------|---------|
| (none) / `imm` | Immutable reference (default; no copy) |
| `mut` | Mutable reference |
| `var` | Owned copy (or move if the caller uses `^`) |
| `out` | Return slot; may not combine with `->` |
| `deinit` | Destructive transfer (destructor, move ctor) |
| `ref` | Reference with parametric mutability and an origin |

Source: <https://mojolang.org/docs/reference/keywords/>.

### Signature markers

| Marker | Effect |
|--------|--------|
| `//` | Parameters before it are infer-only (parameters only) |
| `/` | Arguments/parameters before it are positional-only |
| `*` | Arguments/parameters after it are keyword-only |
| `*args: T` | Variadic argument (homogeneous) |
| `*args: *Ts` | Variadic pack (heterogeneous) |
| `var **kwargs: T` | Variadic keyword arguments; `var` required |

Sources: <https://mojolang.org/docs/reference/function-declarations/>,
<https://mojolang.org/docs/manual/functions/>.

### Effects

| Effect | Meaning |
|--------|---------|
| none | Non-raising (default) |
| `raises` | Can raise; optionally `raises MyType` |
| `thin` | Function *type* only: non-capturing function value |
| `abi("C")` | C calling convention; pairs with `thin` |

Source: <https://mojolang.org/docs/reference/function-declarations/>.

## 4. Structs, traits, lifecycle

| Purpose | Syntax |
|---------|--------|
| Struct | `struct Name:` |
| Parameterized struct | `struct Name[T: Trait]:` |
| Conformance | `struct Name(TraitA, TraitB):` |
| Conditional conformance | `struct Name(Trait where conforms_to(T, X)):` |
| Field | `var name: Type` (must have `var` and a type) |
| Constructor (generated) | `@fieldwise_init` |
| Constructor (manual) | `def __init__(out self, x: Int):` |
| Destructor | `def __deinit__(deinit self):` |
| Trait | `trait Name:` |
| Required method | `def m(self) -> R: ...` |
| Provided method | `def m(self): pass` (or a body) |
| Marker trait | `trait Name: pass` |
| Trait refinement | `trait Child(Parent):` |
| Trait composition | `T: A & B` |
| Associated type | `comptime Name: Writable` (in a trait) |

Sources: <https://mojolang.org/docs/manual/structs/>,
<https://mojolang.org/docs/manual/traits/>,
<https://mojolang.org/docs/reference/trait-declarations/>.

**Structs are `Movable` by default but not copyable.** Add `Copyable` for
explicit copies, `ImplicitlyCopyable` for implicit ones. Sources:
<https://mojolang.org/releases/v1.0.0/>,
<https://mojolang.org/docs/manual/structs/>.

## 5. Types at a glance

| Type | What it is |
|------|-----------|
| `Int`, `UInt` | Machine-width integers (`Scalar[DType.int]` / `.uint`) |
| `Int8`–`Int256`, `UInt8`–`UInt256` | Fixed-width integers |
| `Float16`, `Float32`, `Float64`, `BFloat16` | IEEE floats (no default `Float`) |
| `SIMD[dtype, length]` | Vector; width-1 is `Scalar[dtype]` |
| `Bool` | Boolean |
| `String`, `StringSpan`, `StringLiteral` | Text, text view, literal |
| `List[T]`, `Array[T, length]` | Growable heap list; fixed inline array |
| `Dict[K, V]`, `Set[T]` | Mapping; unique set (import `Set`) |
| `Tuple`, `Optional[T]`, `Variant[...]` | Fixed heterogeneous tuple; nullable; closed union |
| `Pointer[T, origin]`, `Span[T, origin]` | Pointer; non-owning view |
| `Error`, `Never`, `NoneType` | Error; no-constructor type; `None` |
| `Some[Trait]` | Argument-position trait constraint |

Sources: <https://mojolang.org/docs/reference/types/>,
<https://mojolang.org/docs/reference/numeric-types/>. A list expression builds an
`Array`, not a `List`. Source: <https://mojolang.org/releases/v1.0.0/>.

Related pages: [types overview](../types/overview.md),
[integers and floats](../types/integers-and-floats.md),
[bool and strings](../types/bool-and-strings.md),
[collections](../types/collections.md),
[optionals](../types/optionals-and-nullability.md),
[pointers](../types/pointers-and-references.md).

## 6. Operators

| Group | Operators |
|-------|-----------|
| Arithmetic | `+ - * / // % **` |
| Comparison | `== != < <= > >=` |
| Bitwise | `& \| ^ ~ << >>` |
| Boolean (words) | `and or not` |
| Membership / identity | `in`, `is` / `is not` |
| Assignment | `= += -= *= /= //= %= **= &= \|= ^= <<= >>=` |
| Transfer | `^` (postfix, moves a value) |
| Walrus | `:=` (binds and evaluates) |
| Ternary | `a if cond else b` |
| Attribute / call / index / slice | `.` `()` `[]` `[a:b:c]` |

Source: <https://mojolang.org/docs/manual/operators/>. Full precedence is on
[operators](../basics/operators.md).

**`/` returns the operand type** (integer division truncates toward zero);
`//` floors toward negative infinity. Source:
<https://mojolang.org/docs/manual/python-to-mojo/>.

## 7. Control flow

| Purpose | Syntax |
|---------|--------|
| Conditional | `if c:` / `elif c:` / `else:` |
| Conditional expression | `x if c else y` |
| While | `while c:` |
| For over a sequence | `for item in items:` |
| Read-only element (default) | `for item in items:` |
| Mutable element | `for ref item in items:` |
| Mutable copy | `for var item in items:` |
| Consume the container | `for item in items^:` |
| Range | `for i in range(stop)` / `range(start, stop)` / `range(start, stop, step)` |
| Reverse | `for i in reversed(range(n)):` |
| Loop `else` (no `break`) | `for …: … else: …` |
| Early exit / skip | `break` / `continue` |
| Destructure in target | `for k, v in pairs:` |
| Compile-time branch | `comptime if cond:` |
| Compile-time unroll | `comptime for i in range(n):` |
| Context manager | `with manager as name:` |
| Multiple managers | `with a as x, b as y:` |

Sources: <https://mojolang.org/docs/manual/control-flow/>,
<https://mojolang.org/docs/reference/compound-statements/>.

There is **no `match`/`switch`** in the current release. Source:
<https://mojolang.org/docs/manual/control-flow/>.

## 8. Error handling

```text
try:
    risky()
except e:          # error bound to `e`; type inferred from the call
    print(e)
else:              # runs only if no error
    on_success()
finally:           # always runs
    cleanup()
```

| Need | Form |
|------|------|
| Declare that a function can raise | `def f() raises:` |
| Declare a typed error | `def f() raises MyError:` |
| Raise the built-in error | `raise Error("msg")` or `raise "msg"` |
| Re-raise, copy | `raise e` |
| Re-raise, transfer | `raise e^` |
| Catch without binding | `except:` |
| Assert an invariant (aborts) | `assert cond, "msg"` / `debug_assert(...)` |
| Gate assertions | `-D ASSERT=none\|safe\|all\|warn` |

Sources: <https://mojolang.org/docs/manual/errors/>,
<https://mojolang.org/docs/reference/keywords/>,
<https://mojolang.org/docs/tools/feature-toggles/>.

**Rules:** a `try` block handles one error type; a function may declare at most
one error type after `raises`; a bare `raises` erases the type at compile time.
Source: <https://mojolang.org/docs/manual/errors/>.

## 9. Common standard-library calls

| Call | Does |
|------|------|
| `print(x)` | Write to stdout |
| `len(x)` | Length |
| `range(...)` | Integer sequence generator |
| `String(x)` | Convert to text (requires `Writable`) |
| `repr(x)` | Text representation |
| `Int(x)`, `Float64(x)` | Numeric conversion |
| `min(a, b)`, `max(a, b)` | Minimum / maximum |
| `abs(x)` | Absolute value |
| `round(x, n)` | Round to `n` places |
| `hash(x)` | Hash value |
| `enumerate(seq)`, `zip(a, b)` | Indexed iteration; parallel iteration |
| `reversed(seq)` | Reverse iteration |
| `x.append(v)` | Add to a `List` |
| `x.pop()`, `x.pop(i)` | Remove from a `List` |
| `x.items()`, `x.values()` | `Dict` iteration views |
| `x.get(k, default=...)` | `Dict` lookup with default |
| `x.copy()` | Explicit copy |
| `open(path, mode)` | Open a file (context manager) |
| `alloc(...)`, `dealloc(x^)` | Raw allocation and free |
| `assert_equal(a, b)` | Testing assertion |
| `simd_width_of[DType.x]()` | Hardware vector width |

Sources: <https://mojolang.org/docs/std/>,
<https://mojolang.org/docs/std/collections/list/List/>,
<https://mojolang.org/docs/std/collections/dict/>,
<https://mojolang.org/docs/std/testing/testing/>,
<https://mojolang.org/docs/manual/errors/>. Import paths vary — a name may be in
the prelude or need an import; check the package page on
<https://mojolang.org/docs/std/>.

## 10. CLI commands

| Command | Does |
|---------|------|
| `mojo file.mojo` | Compile and run (`mojo run file.mojo`) |
| `mojo build file.mojo` | Build an executable |
| `mojo build --emit object\|asm\|llvm -o out file.mojo` | Emit a specific output |
| `mojo run -O0 file.mojo` | Set optimization level 0–3 (default 3) |
| `mojo run -g file.mojo` | Include debug info (`none`/`line-tables`/`full`) |
| `mojo build -D KEY=VALUE` | Define a compile-time value |
| `mojo run -I path file.mojo` | Add an import search directory |
| `mojo run -D ASSERT=all file.mojo` | Enable assertions |
| `mojo run --warn-on-unstable-apis file.mojo` | Warn on unstable APIs |
| `mojo format -l 100 file.mojo` | Format with a custom line length |
| `mojo repl` | Start the REPL |
| `mojo doc file.mojo` | Compile docstrings |
| `mojo precompile pkg -o pkg.mojoc` | Precompile a package |
| `mojo debug file.mojo` | Launch the debugger |
| `mojo demangle name` | Demangle a symbol |

Sources: <https://mojolang.org/docs/cli/>,
<https://mojolang.org/docs/cli/run/>, <https://mojolang.org/docs/cli/build/>.

## 11. Docstring skeleton

```text
"""Summary sentence with a capital and a period.

Body paragraphs.

Parameters:
    P: The compile-time parameter.

Args:
    a: The runtime argument.

Returns:
    What is returned.

Raises:
    When it raises.
"""
```

Recommended order: `Parameters:` → `Args:` → `Returns:` → `Raises:` →
`Preconditions:` → `Constraints:` → `Safety:` → `Performance:` → `See:` →
`Examples:`. Source: <https://mojolang.org/docs/reference/docstrings/>.

## 12. Import forms

| Form | Meaning |
|------|---------|
| `import mymodule` | Import a module; use `mymodule.name` |
| `from mymodule import Name` | Import one name |
| `from mypackage.mymodule import Name` | Import through a package |
| `from mypackage import Name` | Re-exported via `__init__.mojo` |
| `import mymodule as my` | Alias a module |
| `from pkg import name as other` | Alias a name |
| `from . import sibling` | Relative import (no `import .sibling`) |

Sources: <https://mojolang.org/docs/manual/packages/>,
<https://mojolang.org/docs/reference/simple-statements/>.

## 13. Spelling quick map: write the right name

| Decision | Write |
|----------|-------|
| Function | `def` |
| Variable | `var` |
| Read-only arg | `imm` |
| Destructor | `__deinit__` |
| Destructible | `Deinitable` |
| Fixed array | `Array[T, length]` |
| String view | `StringSpan` |
| Length | `length` / `len(x)` |
| Pointer | `Pointer`, operations `unsafe_*` |
| Compile-time value | `comptime` |
| Closure captures | `{imm x}` / `{mut x}` |
| Package command | `mojo precompile` |

Source: <https://mojolang.org/releases/v1.0.0/>.

## Pitfalls

- **Assuming `[1, 2, 3]` is a `List`.** It builds an `Array`. Verified above.
- **Using `.size`.** Use `len(x)` or `length`. Verified above.
- **Writing `fn`, `read`, `owned`, `__del__`.** All pre-1.0. Verified above.
- **Expecting `/` to return a float.** It returns the operand type. Verified
  above.
- **Using `x[-1]`.** Negative indexing is a compile-time error in 1.x. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Combining `out` with `->`.** Not allowed. Verified above.
- **Giving a `mut` argument a default.** Not allowed. Verified above.
- **Bare `**kwargs`.** Write `var **kwargs`. Verified above.
- **Putting `where` inside `[]` or `()`.** It goes at the end of the
  declaration. Verified above.
- **Expecting `match`.** Not in the current release. Verified above.
- **Writing a block comment.** Only `#` is documented. See
  [comments and docstrings](../basics/comments-and-docstrings.md).

## Sources

- Mojo language reference: <https://mojolang.org/docs/reference/>
- Mojo identifiers, keywords, and conventions reference: <https://mojolang.org/docs/reference/keywords/>
- Mojo function declarations reference: <https://mojolang.org/docs/reference/function-declarations/>
- Mojo compound statements reference: <https://mojolang.org/docs/reference/compound-statements/>
- Mojo docstring reference: <https://mojolang.org/docs/reference/docstrings/>
- Mojo types reference: <https://mojolang.org/docs/reference/types/>
- Mojo numeric types reference: <https://mojolang.org/docs/reference/numeric-types/>
- Mojo language basics (manual): <https://mojolang.org/docs/manual/basics/>
- Mojo variables (manual): <https://mojolang.org/docs/manual/variables/>
- Mojo control flow (manual): <https://mojolang.org/docs/manual/control-flow/>
- Mojo operators (manual): <https://mojolang.org/docs/manual/operators/>
- Mojo structs (manual): <https://mojolang.org/docs/manual/structs/>
- Mojo traits (manual): <https://mojolang.org/docs/manual/traits/>
- Mojo errors (manual): <https://mojolang.org/docs/manual/errors/>
- Mojo modules and packages (manual): <https://mojolang.org/docs/manual/packages/>
- Mojo parameterization (manual): <https://mojolang.org/docs/manual/parameters/>
- Mojo standard library: <https://mojolang.org/docs/std/>
- Mojo CLI reference: <https://mojolang.org/docs/cli/>
- Mojo tools — feature toggles: <https://mojolang.org/docs/tools/feature-toggles/>
- Mojo testing: <https://mojolang.org/docs/tools/testing/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
