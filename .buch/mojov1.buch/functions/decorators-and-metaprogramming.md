# Decorators and metaprogramming

Mojo's compile-time metaprogramming system uses the same language as run-time
code — "you don't have to learn a new language — just a few new features":

- Compile-time statements and expressions (`comptime`).
- Parameters (covered in [parameters and generics](parameters-and-generics.md)).
- Traits.

Source: <https://mojolang.org/docs/manual/metaprogramming/>.

This page introduces the parts you need to *use* decorators and compile-time
evaluation: `comptime` values, `comptime if`/`comptime for`, `comptime assert`
and the constraint system, materialization, the built-in decorator set, and a
reflection primer. The full reference pages for individual decorators and for
reflection are [decorators index](../decorators/index.md) and
[reflection](../stdlib/reflection.md).

## What a decorator is

> A Mojo decorator modifies or extends the behavior of a struct, function, or
> other declaration at compile time. You place the decorator on the line above
> the declaration it applies to, prefixed with `@`.

```mojo
@fieldwise_init
struct Point:
    var x: Float64
    var y: Float64
```

> Decorators apply bottom-up: the one closest to the declaration is applied
> first. ... Mojo doesn't support custom decorators. The decorators in this
> section are built into the compiler.

Source: <https://mojolang.org/docs/reference/decorators/>.

### The built-in decorators

| Decorator | What it does |
|-----------|--------------|
| `@align` | Specifies a minimum alignment for a struct. |
| `@always_inline` | Copies the body of a function directly into the body of the calling function. |
| `@__copy_capture` | Captures register-passable typed values by copy (deprecated). |
| `@deprecated` | Marks outdated APIs and schedules them for removal; `use` supplies a migration hint. |
| `@doc_hidden` | Hides declarations from generated documentation. |
| `@explicit_destroy` | Prevents automatic destruction; requires named destructor methods. |
| `@export` | Marks a function for export. |
| `@fieldwise_init` | Generates the fieldwise constructor for a struct. |
| `@implicit` | Marks a constructor as eligible for implicit conversion. |
| `@no_inline` | Prevents a function from being inlined. |
| `@parameter` | Declares a legacy closure (deprecated). |
| `@staticmethod` | Declares a struct method as static. |

Source: <https://mojolang.org/docs/reference/decorators/>.

### Not every decorator works on every declaration

The official target matrix:

| Decorator | `struct` | `def` | method | `trait` | `comptime` | `var` | field |
|-----------|----------|-------|--------|---------|------------|-------|-------|
| `@align` | yes | | | | | | |
| `@always_inline` | | yes | yes | | | | |
| `@extensibility.register` | yes | | | | | | |
| `@__copy_capture` | | | yes | | | | |
| `@deprecated` | yes | yes | yes | yes | yes | | |
| `@doc_hidden` | yes | yes | yes | | yes | | yes |
| `@explicit_destroy` | yes | | | | | | |
| `@export` | | yes | | | | | |
| `@fieldwise_init` | yes | | | | | | |
| `@implicit` | | | yes | | | | |
| `@no_inline` | | yes | yes | | | | |
| `@nonmaterializable` | yes | | | | | | |
| `@parameter` | | | yes | | | | |
| `@staticmethod` | | | yes | | | | |

Source: <https://mojolang.org/docs/reference/decorators/>.

Note that the matrix includes `@extensibility.register` and
`@nonmaterializable`, which are not among the decorator pages listed in the
reference's own collection. Source:
<https://mojolang.org/docs/reference/decorators/>.

> **Open question:** the decorators reference lists `@extensibility.register`
> and `@nonmaterializable` in the target matrix but has no page for either.
> Their exact semantics are undocumented here; verify before use.

Two decorators carry the "legacy / internal" warning from the stability page:

> - `@parameter`, `@__copy_capture`: legacy closure support

Source: <https://mojolang.org/docs/api-docs/stability/>. Use capture lists
(see [closures and lambdas](closures-and-lambdas.md)) instead.

## `comptime` values

`comptime` names a compile-time value. Whereas `var` defines a run-time value,
`comptime` defines a named compile-time constant:

```mojo
comptime rows = 512
```

> A `comptime` value is always evaluated at compile time, so you can use
> `comptime` to force a function to run at compile time.

Source: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

Types are compile-time expressions, so a `comptime` value is how you write a
type alias:

```mojo
comptime Float16 = SIMD[DType.float16, 1]
comptime UInt8 = SIMD[DType.uint8, 1]

var x: Float16 = 0
```

Source: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

`comptime` obeys scope. Functions create a new compile-time scope, as do each
branch of a compile-time conditional and the body of a `comptime for` loop. You
can assign a `comptime` value to a given identifier **once** per scope:

```mojo
comptime VALUE = 10

def scope_me():
    print(VALUE)          # prints 10
    comptime VALUE = 20
    # comptime VALUE = 30   # error: invalid redeclaration of VALUE
    comptime if True:
        comptime VALUE = 40
        print(VALUE)      # prints 40
    print(VALUE)          # prints 20
```

Source: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

A parameterized `comptime` value takes parameters and returns a compile-time
constant; unlike a function it can return a type. See
[parameters and generics](parameters-and-generics.md).

## What triggers compile-time execution

Several things trigger compile-time execution:

- Assigning an expression to a `comptime` value.
- Evaluating a `comptime` conditional or loop.
- Assigning an expression to a compile-time parameter.

Source: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

```mojo
comptime SIZE = 1024 // 32
comptime for i in range(4):
    print(i)
var array = Array[Int, get_array_size()]()
```

In the last line, `get_array_size()` must run at compile time because its result
forms part of the type. Source:
<https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

Some code the compiler **will not** run at compile time:

> - File I/O.
> - Foreign function calls (for example, to external libraries).
> - Functions that can raise errors.

> In addition, the compiler can't run functions on the GPU. Compile-time
> functions in GPU code are actually run on the CPU.

Source: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

### How the compiler runs code

The evaluation process has three components:

- **Parser** — parses code into IR and type-checks; also performs *constant
  folding* of very simple `comptime` expressions (functions marked
  `@always_inline("builtin")` are constant foldable).
- **Interpreter** — runs code at compile time.
- **Elaborator** — substitutes concrete values for compile-time parameters and
  produces concrete versions of parameterized functions and structs.

> When reading code, it's important to remember that when a function is being
> interpreted at compile time, the function has been concretized: compile-time
> conditionals have been processed, and compile-time constraints and assertions
> have been tested.

So a failing compile-time assertion stops compilation before any of the function
body runs — "even code that occurs *before* the assertion." Source:
<https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

## `comptime if` and `comptime for`

### `comptime if`

Use it for platform-specific code, to prune branches, or to handle different
types in parameterized code. Only the live branch is compiled:

```mojo
from std.sys import has_accelerator

def main():
    comptime if has_accelerator():
        run_on_gpu()
    else:
        run_on_cpu()
```

> In this example, if no accelerator is available, the `run_on_gpu()` function is
> never called, or even compiled.

The construct supports `elif` and `else`. Source:
<https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

The condition must be a compile-time expression:

```mojo
comptime if runtime_value > 0:   # Error: 'comptime if' requires
    pass                         # compile-time evaluation
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

### `comptime for`

`comptime for` unrolls a loop at compile time. The loop sequence must be a
valid compile-time expression, and the compiler replaces the loop with *N*
copies of its body:

```mojo
comptime for i in range(1, 5):
    b[i-1] = a[i] + a[i-1]
```

This is unrolled to `b[0] = a[1] + a[0]` and so on. Source:
<https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

> This unrolled loop compiles to branchless machine code, unlike a normal `for`
> loop, which includes a bounds test at every iteration.

> The `comptime for` construct unrolls at the beginning of compilation, which can
> greatly expand both the code size and the compilation time.

Source: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

Because the induction variable becomes a compile-time constant, a dynamic value
cannot drive the loop:

> `len(args)` doesn't work because `args` is a dynamic value, so `len(args)` is a
> dynamic expression. You can't use a dynamic value to drive a `comptime for`.

For a `VariadicPack`, use `args.__len__()` instead. Source:
<https://mojolang.org/docs/reference/function-declarations/>.

## Constraints: `where` and `comptime assert`

A *constraint* is a precondition for calling a function or instantiating a
struct, written with `where` at the end of the declaration:

```mojo
def pow2[n: Int]() -> Int where n >= 0:
    ...
```

> The expression `n >= 0` is called a *proposition*. With the exception of very
> simple expressions, Mojo doesn't evaluate these propositions literally.
> Instead, it analyzes them symbolically, tracking a list of propositions that are
> known to be true in the current scope.

Source: <https://mojolang.org/docs/manual/metaprogramming/constraints/>.

The key consequence: **the compiler does not derive evidence for callers.** A
caller must introduce "knowledge" explicitly. There are four ways:

- Inside a struct declaration, all constraints on the struct are known.
- Inside a function, all constraints on the function are known.
- Inside a `comptime if`, the `if` condition is known.
- After a `comptime assert`, the asserted condition is known.

Source: <https://mojolang.org/docs/manual/metaprogramming/constraints/>.

```mojo
def print_first[size: Int](l: Array[Int, size]) where size >= 1:
    ...

def print_first_two[size: Int](l: Array[Int, size]) where size >= 2:
     # Error: invalid call to 'print_first': lacking evidence to prove correctness
    print_first[size](l)
```

The system compares the known propositions at the call site against the required
set: "the known set of propositions is a superset of the required set". Source:
<https://mojolang.org/docs/manual/metaprogramming/constraints/>.

> **Open question:** the constraints page uses `Array[_, size]` and
> `Array[Int, size]` in its own examples. The `_` form is an unbound parameter and
> is covered in [parameters and generics](parameters-and-generics.md); the exact
> spelling that a `where` clause accepts is not enumerated, so prefer the fully
> written form when in doubt.

The system is deliberately conservative. It applies only a *very limited* amount
of "smartness":

- **Simple implication.** A known `A and B` satisfies a requirement of `A` (or
  `B`); `A` implies `A or B`.
- **Canonicalization.** `x > 0` equals `x >= 1`, `x >= 2` equals
  `not (x < 2)`, `x + x` equals `2 * x`. Function calls are **opaque**: only two
  identical calls are treated as the same.
- **Context-free folding.** `1 + 1` becomes `2`, `4 % 2` becomes `0`,
  `1 + x + 1` becomes `2 + x`.

Source: <https://mojolang.org/docs/manual/metaprogramming/constraints/>.

```mojo
def is_even(x: Int) -> Bool:
    return x % 2 == 0

def needs_even[x: Int]() where is_even(x):
    pass

def forward_even_bad[x: Int]() where x % 2 == 0:
    needs_even[x]()   # Error: needs evidence for `is_even(x)`

def forward_even_good[x: Int]() where is_even(x):
    needs_even[x]()   # OK
```

Source: <https://mojolang.org/docs/manual/metaprogramming/constraints/>.

Some stdlib functions can be evaluated in `where` clauses because the compiler
knows them, but "there's no way to identify these builtin functions without
looking at the source code, and whether a given function is builtin may change
without notice." The documented workaround is a parameterized `comptime` value,
"which is always inlined":

```mojo
comptime is_even[x: Int]: Bool = x % 2 == 0
```

Source: <https://mojolang.org/docs/manual/metaprogramming/constraints/>.

### Compile-time assertions

`comptime assert` tests a proposition at compile time; if it is false,
compilation fails:

```mojo
comptime assert x > 0, "x must be greater than 0."
```

The message is optional. After the assertion, the condition is added to the
known-true set. Source:
<https://mojolang.org/docs/manual/metaprogramming/constraints/>.

> **Pitfall:** `comptime assert` is *not* the run-time `assert`. They are
> different constructs with different gating. See the run-time
> `assert`/`debug_assert` discussion in
> [safety and undefined behaviour](../errors/safety-and-undefined-behaviour.md).

### How to choose

The official decision guidance:

- **Writing a function:** if it can handle the entire domain of its input types
  (returning a value or raising), no constraint is needed. Use a dedicated type
  when the condition is a common refinement proven once and reused; use `where`
  when the condition is a user-understandable precondition; use `comptime
  assert` or `abort` for internal inconsistencies a user cannot act on.
- **Calling a function:** if a constrained parameter comes from a parent
  parameter list, propagate the same requirement onto your own function, or
  branch with `comptime if`. If it was computed in the body, either prove it
  with `comptime assert` (when it holds by construction) or handle both cases
  with `comptime if`.

Source: <https://mojolang.org/docs/manual/metaprogramming/constraints/>.

## Materialization

*Materialization* is making a compile-time value available at run time. For
trivially copyable values the compiler just inserts the value. For complex types
that allocate, Mojo forces you to materialize explicitly:

```mojo
def lookup_fn(count: Int):
    comptime list_of_values = [1, 3, 5, 7]

    for i in range(count):
        var idx = dynamic_function(i)
        var tmp: List[Int] = materialize[list_of_values]()   # explicit
        var lookup = tmp[idx]
        process(lookup)
```

Without `materialize[...]()`, the compiler reports:

```output
cannot materialize comptime value of type 'List[Int]' to runtime
because it is not 'ImplicitlyCopyable'
```

> This is why Mojo requires you to explicitly materialize non-trivial values; it
> puts you in control of when your program allocates resources.

Source: <https://mojolang.org/docs/manual/metaprogramming/materialization/>.

A `comptime` sub-expression can force a single expression to be evaluated at
compile time without naming a temporary:

```mojo
comptime layout = Layout.row_major(16, 8)
var x = comptime (layout.size()) // WARP_SIZE
```

Source: <https://mojolang.org/docs/manual/metaprogramming/materialization/>.

### Global lookup tables

Mojo has no general-purpose global static data mechanism, but `global_constant()`
copies a compile-time value into static constant storage. It works only for
self-contained values without pointers to other memory, which rules out `List`
and `Dict`. `Array` is the easy case:

```mojo
from std.builtin.globals import global_constant

def use_lookup(idx: Int) -> Int64:
    comptime numbers: Array[Int64, 10] = [
        1, 3, 14, 34, 63, 101, 148, 204, 269, 343
    ]
    ref lookup_table = global_constant[numbers]()
    if idx >= len(lookup_table):
        return 0
    return lookup_table[idx]
```

The result must bind to a `ref`; `var` would trigger a copy, and `Array` doesn't
support implicit copying. Source:
<https://mojolang.org/docs/manual/metaprogramming/materialization/>.

### Literals

```mojo
comptime str_literal = "Hello"              # at compile time, a StringLiteral
var str = str_literal                        # at run time, a String
var static_str: StaticString = str_literal   # or a StaticString
```

Both `String` and `StaticString` can be created implicitly from a
`StringLiteral`; without a type annotation, Mojo defaults to `String`. Source:
<https://mojolang.org/docs/manual/metaprogramming/materialization/>.

## Reflection primer

Reflection lets code inspect its own structure at compile time, with no run-time
cost. `reflect[T]` resolves to a `Reflected[T]` handle with static query methods:

```mojo
def show_type[T: AnyType]():
    comptime type_name = reflect[T].name()
    comptime field_count = reflect[T].field_count()
    comptime field_names = reflect[T].field_names()
    comptime field_types = reflect[T].field_types()

    print("struct", type_name)
    comptime for idx in range(field_count):
        comptime field_name = field_names[idx]
        comptime field_type = reflect[field_types[idx]].name()
        print("  var ", field_name, ": ", field_type, sep="")
```

Source: <https://mojolang.org/docs/manual/metaprogramming/reflection/>.

The most visible use is automatic derived behavior: conform a struct to
`Equatable` (and `Hashable`, `Writable`) and Mojo inspects the fields at compile
time and generates the code. Source:
<https://mojolang.org/docs/manual/metaprogramming/reflection/>.

Useful handles:

| Handle | Purpose |
|--------|---------|
| `reflect[T].name()` | Fully qualified type name with parameters applied. |
| `reflect[T].base_name()` | Base type name only (`List`, `Dict`). |
| `reflect[T].field_count()` | Number of fields. |
| `reflect[T].field_names()`, `field_types()` | Field names and types. |
| `reflect[T].field["host"]` | One field by name; requires a concrete type; read `.T`. |
| `reflect[T].field_ref[idx](value)` | A reference to a field. |
| `reflect[T].field_offset[index=i]()` | Byte offset including alignment padding. |
| `materialize[reflect[T].field_names()]()` | Materialize a compile-time value. |

Source: <https://mojolang.org/docs/manual/metaprogramming/reflection/>.

Reflection is explicitly incomplete and unstable in this release:

> Mojo reflection is newly introduced and currently incomplete. Some reflection
> capabilities are limited, unstable, or not yet fully exposed through the
> language interface.

Source: <https://mojolang.org/docs/manual/metaprogramming/reflection/>. The full
package is documented with the standard library; see
[reflection](../stdlib/reflection.md).

### Source locations and function names

`call_location()` returns the caller's source location, which is what makes
assertion messages point at the call site — but the enclosing function must be
`@always_inline`:

```mojo
from std.reflection import call_location

@always_inline
def require(cond: Bool, msg: String = "requirement failed") raises:
    if not cond:
        raise Error(call_location().prefix(msg))
```

`source_location()` reports the location of its own call. `get_function_name[func]()`
returns the source name and `get_linkage_name[func]()` the mangled symbol; both
take the function as a parameter value. Source:
<https://mojolang.org/docs/manual/metaprogramming/reflection/>.

This is exactly why `@always_inline` appears on the helper rather than on the
call site: without it, the location would point inside `require()`.

## Pitfalls

- **Assuming `comptime` runs anything.** File I/O, FFI calls, and raising
  functions are not run at compile time; GPU-targeted compile-time functions run
  on the CPU. Source:
  <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.
- **Expecting the constraint checker to do your math.** It treats propositions
  symbolically and does not derive evidence; callers must introduce knowledge
  with `where`, `comptime if`, or `comptime assert`. Source:
  <https://mojolang.org/docs/manual/metaprogramming/constraints/>.
- **Relying on a function call being evaluated in a `where` clause.** Function
  calls in propositions are opaque unless the compiler treats them as builtin.
  Prefer a parameterized `comptime` value for a predicate that must always
  inline. Source: <https://mojolang.org/docs/manual/metaprogramming/constraints/>.
- **Declaring the same `comptime` identifier twice in one scope.** Re-declaration
  in the same scope is an error; nested scopes may shadow. Source:
  <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.
- **Forgetting `materialize[]()` for a non-`ImplicitlyCopyable` value.** The
  compiler rejects the implicit use; do it yourself so you control when memory is
  allocated. Source:
  <https://mojolang.org/docs/manual/metaprogramming/materialization/>.
- **Binding `global_constant()` to `var`.** Use `ref`; `var` copies, and `Array`
  isn't implicitly copyable. Source:
  <https://mojolang.org/docs/manual/metaprogramming/materialization/>.
- **Using a custom decorator.** Mojo does not support them; all decorators are
  compiler built-ins. Source: <https://mojolang.org/docs/reference/decorators/>.
- **Using `@__`-prefixed decorators or keywords.** They are internal and
  unstable; `--warn-on-unstable-apis` will not warn about them. Source:
  <https://mojolang.org/docs/api-docs/stability/>.
- **Forgetting `@always_inline` when capturing a caller location.** Without it,
  `call_location()` points inside the helper. Source:
  <https://mojolang.org/docs/manual/metaprogramming/reflection/>.

## Open questions

> **Open question:** the reflection page says reflection is "newly introduced
> and currently incomplete" and that its examples "may change as reflection
> support matures", yet the stability page gives the language a broad stable
> default. Treat every reflection handle as moving; re-check it against the
> current release before relying on it in a library.

> **Open question:** the decorators reference's target matrix includes
> `@extensibility.register` and `@nonmaterializable`, which have no page in the
> decorator collection. Their semantics are undocumented here.

## Sources

- Mojo manual — Intro to metaprogramming: <https://mojolang.org/docs/manual/metaprogramming/>
- Mojo manual — Compile-time evaluation: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>
- Mojo manual — Comptime constraints and assertions: <https://mojolang.org/docs/manual/metaprogramming/constraints/>
- Mojo manual — Materializing compile-time values at run time: <https://mojolang.org/docs/manual/metaprogramming/materialization/>
- Mojo manual — Reflection: <https://mojolang.org/docs/manual/metaprogramming/reflection/>
- Mojo reference — Decorators: <https://mojolang.org/docs/reference/decorators/>
- Mojo reference — Compound statements (`comptime if`/`comptime for`): <https://mojolang.org/docs/reference/compound-statements/>
- Mojo reference — Function declarations (`VariadicPack.__len__`): <https://mojolang.org/docs/reference/function-declarations/>
- Mojo stability guarantees (internal decorators): <https://mojolang.org/docs/api-docs/stability/>
- Mojo tools — Feature toggles: <https://mojolang.org/docs/tools/feature-toggles/>
