# @always_inline

`@always_inline` makes the compiler **inline** a function: the function's body
is copied directly into the body of every caller. It removes the cost of a call
and return, at the price of a larger binary.

```mojo
@always_inline
def add(a: Int, b: Int) -> Int:
    return a + b

print(add(1, 2))
```

Source: <https://mojolang.org/docs/reference/decorators/always-inline/>.

> Normally, the compiler will do this automatically where it can improve
> performance, but this decorator forces it to do so. The downside is that it can
> increase the binary size by duplicating the function at every call site.

Source: <https://mojolang.org/docs/reference/decorators/always-inline/>.

The page's own illustration: because `add()` is decorated, the program behaves
as if the call site read `print(1 + 2)`.

## Target

`@always_inline` applies to `def` declarations and methods. Source:
<https://mojolang.org/docs/reference/decorators/>.

## `@always_inline("nodebug")`

The `"nodebug"` argument inlines the function as usual but omits debug
information for it, so a debugger cannot step into it:

> This decorator is intended to be used on the low-level functions in a library,
> which may wrap primitive functions, MLIR operations, or inline assembly.
> Marking these functions as "nodebug" prevents users from accidentally stepping
> into low-level non-Mojo code when debugging.

Source: <https://mojolang.org/docs/reference/decorators/always-inline/>.

## `@always_inline("builtin")`

The `"builtin"` argument is stricter than `"nodebug"` and is intended for the
standard library, not user code:

> The `"builtin"` version of the decorator should only be used on functions that
> wrap a single MLIR operation that the compiler has special compile-time
> handling for. It allows the compiler to inline the function when it's used in a
> parameter context.

Source: <https://mojolang.org/docs/reference/decorators/always-inline/>.

`"builtin"` does everything `"nodebug"` does, plus two things:

- It validates the body: no control flow, no calls to functions that are not
  themselves `@always_inline("builtin")`, no unsupported MLIR operations.
- When used in a parameter context, the function is unconditionally inlined.

The official caution is explicit:

> Using this version of the decorator requires some knowledge of the Mojo
> compiler's internals. Using it outside of the standard library is not
> recommended. Use the standard `@always_inline` decorator or the `"nodebug"`
> version, instead.

Source: <https://mojolang.org/docs/reference/decorators/always-inline/>.

## When to use it

- **Tiny hot functions.** A one-line accessor or arithmetic helper benefits from
  removing the call overhead.
- **Thin wrappers over intrinsics or inline assembly** in library code — the
  `"nodebug"` form.
- **Standard-library primitives wrapping a single MLIR operation** — the
  `"builtin"` form only.

Do not reach for it by default: the compiler already inlines where it helps, and
forced inlining duplicates code at every call site.

## Pitfalls

- **Applying it everywhere.** Each call site receives a copy of the body, so
  binary size grows; that is the documented trade-off. Source:
  <https://mojolang.org/docs/reference/decorators/always-inline/>.
- **Using `"builtin"` outside the standard library.** The official guidance says
  not to. Source: <https://mojolang.org/docs/reference/decorators/always-inline/>.
- **Expecting a `"nodebug"` function to be step-debuggable.** It deliberately
  carries no debug information. Source:
  <https://mojolang.org/docs/reference/decorators/always-inline/>.
- **Using `@always_inline("builtin")` on a body with control flow or non-builtin
  calls.** The body check rejects it. Source:
  <https://mojolang.org/docs/reference/decorators/always-inline/>.

## Sources

- `@always_inline` reference:
  <https://mojolang.org/docs/reference/decorators/always-inline/>
- Mojo decorators reference (target table):
  <https://mojolang.org/docs/reference/decorators/>
