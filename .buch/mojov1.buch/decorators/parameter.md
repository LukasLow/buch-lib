# @parameter (deprecated)

> **Deprecated.** The official page carries a caution block:
>
> > The `@parameter` decorator is deprecated and will be removed in a future
> > release. Use the current `closure` syntax instead.
>
> Source: <https://mojolang.org/docs/reference/decorators/parameter/>.
>
> This page exists only so a reader who meets the decorator in existing code
> knows what it is and what to write instead. **Do not use it in new code.**

## What it did

> You can add `@parameter` on a nested function to create a legacy capturing
> closure. This means you can create a closure function that captures values
> from the outer scope (regardless of whether they are variables or parameters),
> and then use that closure as a parameter.

Source: <https://mojolang.org/docs/reference/decorators/parameter/>.

The official example shows the `[_]` origin specifier in the function type,
which represented the set of origins of the captured values:

> **Open question:** the official page's example spells the function type with
> the legacy `fn(...)` keyword, which 1.0 removed in favour of `def(...)`. The
> quotation is kept verbatim as pre-1.0 migration material; read `fn(Int)` as
> today's `def(Int)` function type. Source:
> <https://mojolang.org/releases/v1.0.0/>. See
> [`versions/1.0.0`](../versions/1.0.0.md).

```mojo
def use_closure[func: fn(Int) capturing [_] -> Int](num: Int) -> Int:
    return func(num)

def create_closure():
    var x = 1

    @parameter
    def add(i: Int) -> Int:
        return x + i

    var y = use_closure[add](num=5)
    print(y)

create_closure()
```

```output
3
```

Source: <https://mojolang.org/docs/reference/decorators/parameter/>.

```mojo
def use_closure[func: fn(Int) capturing [_] -> Int](num: Int) -> Int:
```

> This origin specifier represents the set of origins for the values that the
> legacy closure captures. This allows the compiler to correctly extend the
> lifetimes of those values.

Source: <https://mojolang.org/docs/reference/decorators/parameter/>.

## Target

`@parameter` applied to methods (nested functions). Source:
<https://mojolang.org/docs/reference/decorators/>.

## Why it is deprecated

The stability page lists it among the decorators that exist only for language
migration and are not public API:

> - `@parameter`, `@__copy_capture`: legacy closure support

Source: <https://mojolang.org/docs/api-docs/stability/>.

The 1.0.0 release notes confirm:

> Legacy closures, and the `@parameter` and `@__copy_constructor` decorators
> used to declare them, are deprecated and should not be used in new code. Use
> the newer closure syntax with capture lists, instead.

Source: <https://mojolang.org/releases/v1.0.0/>.

The same release notes note that using these decorators "doesn't currently
generate a warning, because there are still a few APIs using these legacy
closures" — so silence from the compiler is not a sign the decorator is fine.

Source: <https://mojolang.org/releases/v1.0.0/>.

## What to write instead

Use a nested `def` with an explicit **capture list**. The current closures
syntax makes each capture convention visible:

```mojo
def main():
    var multiplier = 3

    def scale(x: Int) {imm multiplier} -> Int:
        return x * multiplier

    print(scale(5))  # 15
```

Source: <https://mojolang.org/docs/manual/functions/closures/>.

Instead of passing a legacy closure as a compile-time parameter with
`capturing [_]`, define a closure whose capture list states how it relates to
the enclosing scope. For the full grammar and all conventions (`imm`, `mut`,
`var`, `ref`, move), see the closures manual page and the closure-declarations
reference.

## Pitfalls

- **Using it in new code.** It is deprecated and will be removed. Verified above.
- **Relying on the compiler to warn.** It does not currently warn on `@parameter`
  use. Source: <https://mojolang.org/releases/v1.0.0/>.
- **Treating it as public API.** The stability page calls it internal legacy
  support. Verified above.
- **Reading `capturing [_]` as current syntax.** That origin specifier belongs to
  the legacy closure model; migrate to a capture list. Verified above.
- **Assuming no warning means supported.** The absence of a warning is a
  compatibility concession, not an endorsement. Verified above.

## Sources

- `@parameter` reference:
  <https://mojolang.org/docs/reference/decorators/parameter/>
- Mojo decorators reference (target table):
  <https://mojolang.org/docs/reference/decorators/>
- Mojo stability guarantees (internal legacy decorators):
  <https://mojolang.org/docs/api-docs/stability/>
- Closures (manual): <https://mojolang.org/docs/manual/functions/closures/>
- Mojo v1.0.0 release notes (legacy closures deprecated):
  <https://mojolang.org/releases/v1.0.0/>
