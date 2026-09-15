# Mojo built-in decorators

A Mojo *decorator* modifies or extends the behavior of a struct, function, or
other declaration at compile time. You place it on the line above the
declaration it applies to, prefixed with `@`:

```mojo
@fieldwise_init
struct Point:
    var x: Float64
    var y: Float64
```

> A Mojo decorator modifies or extends the behavior of a struct, function, or
> other declaration at compile time. You place the decorator on the line above
> the declaration it applies to, prefixed with `@`.

Source: <https://mojolang.org/docs/reference/decorators/>.

Each decorator goes on its own line, may take arguments in parentheses, and
decorators stack. A stack is applied bottom-up — the decorator closest to the
declaration runs first:

```mojo
@fieldwise_init
@align(64)
struct CacheLine:
    var data: SIMD[DType.float32, 16]
```

Source: <https://mojolang.org/docs/reference/decorators/>.

## No custom decorators

Decorators are a compiler feature, not a library feature:

> Mojo doesn't support custom decorators. The decorators in this section are
> built into the compiler.

Source: <https://mojolang.org/docs/reference/decorators/>.

So the set of decorators is fixed by the compiler. Metaprogramming in Mojo is
done with `comptime`, parameters, traits and reflection rather than with
user-defined decorators.

## `@__`-prefixed decorators are internal and unstable

The stability page gives the rule that governs every decorator beginning with
`@__`:

> Consider any decorators beginning with `@__` as internal and unstable, unless
> the manual explicitly documents them as public.

Source: <https://mojolang.org/docs/api-docs/stability/>.

This matters because the decorators reference page lists some `@__`-prefixed
entries in its target table. `@__copy_capture` is documented — but only as a
**deprecated** legacy-closure decorator, not as public API. The stability page
explicitly names the legacy closure decorators as internal:

> Some decorators exist only to support language migration, compiler
> implementation, or standard library development. Avoid decorators named
> like:
>
> - `@parameter`, `@__copy_capture`: legacy closure support
> - `@__allow_legacy_custom_self_types`
> - `@__name`
> - `@__llvm_arg_metadata`
> - `@__unsafe_nested_origins_read_only`

Source: <https://mojolang.org/docs/api-docs/stability/>.

So an agent should treat any `@__...` decorator it encounters in real code as
an implementation detail and not build on it, unless a specific page in the
official manual documents it as public.

## Deprecated decorators

Two of the reference decorators are marked deprecated by their own page and are
scheduled for removal:

| Decorator | Status | Official guidance |
|-----------|--------|-------------------|
| `@parameter` | Deprecated | "The `@parameter` decorator is deprecated and will be removed in a future release. Use the current closure syntax instead." |
| `@__copy_capture` | Deprecated | "The `@__copy_capture` decorator is deprecated and will be removed in a future release. Use the current closure syntax with capture lists." |

Sources: <https://mojolang.org/docs/reference/decorators/parameter/>,
<https://mojolang.org/docs/reference/decorators/copy-capture/>.

Both are legacy-closure decorators. The 1.0.0 release notes confirm the
direction:

> Legacy closures, and the `@parameter` and `@__copy_constructor` decorators
> used to declare them, are deprecated and should not be used in new code. Use
> the newer closure syntax with capture lists, instead.

Source: <https://mojolang.org/releases/v1.0.0/>.

Their pages exist here for one reason: so a reader who meets them in existing
code knows what they are and what replaces them.

## Decorator targets

Not every decorator works on every declaration. The official table:

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

The table includes `@extensibility.register` and `@nonmaterializable`, which
have no dedicated page in this chapter. They are documented only as rows in this
table; see the open question below.

> **Open question:** the decorators reference's target table lists
> `@extensibility.register` and `@nonmaterializable`, but the reference provides
> no section or page describing either. They are not covered by a page in this
> chapter because there is no official documentation to base one on. Verify
> against the next upstream release before using them.

## The pages in this chapter

| Decorator | What it does | Page |
|-----------|--------------|------|
| `@align` | Specifies a minimum memory alignment for a struct type | [`align`](align.md) |
| `@always_inline` | Copies the function body into every caller | [`always-inline`](always-inline.md) |
| `@deprecated` | Marks an API obsolete and schedules removal; `use=` points to the replacement | [`deprecated`](deprecated.md) |
| `@doc_hidden` | Hides a declaration from generated documentation | [`doc-hidden`](doc-hidden.md) |
| `@explicit_destroy` | Prevents automatic destruction; requires named destructor calls | [`explicit-destroy`](explicit-destroy.md) |
| `@export` | Exports a function as a symbol in the compiled artifact | [`export`](export.md) |
| `@fieldwise_init` | Synthesizes the field-wise `__init__()` constructor | [`fieldwise-init`](fieldwise-init.md) |
| `@implicit` | Marks a single-argument constructor eligible for implicit conversion | [`implicit`](implicit.md) |
| `@no_inline` | Prevents a function from being inlined | [`no-inline`](no-inline.md) |
| `@staticmethod` | Declares a struct method as static (no `self`) | [`staticmethod`](staticmethod.md) |
| `@__copy_capture` (deprecated) | Captures register-passable values by copy in a legacy closure | [`copy-capture`](copy-capture.md) |
| `@parameter` (deprecated) | Creates a legacy capturing closure | [`parameter`](parameter.md) |

## Related pages

- [`keywords/index`](../keywords/index.md) — reserved words, including the
  `@`-free language vocabulary.
- [`keyword-conventions/index`](../keyword-conventions/index.md) — words with
  fixed meaning in declarations that are *not* reserved.
- [`decorators-and-metaprogramming`](../functions/decorators-and-metaprogramming.md)
  — how decorators fit into compile-time metaprogramming.
- [`versions/1.0.0`](../versions/1.0.0.md) — the removal of `@value`,
  `@register_passable` and `@doc_private`, and the deprecation of the legacy
  closure decorators.

## Sources

- Mojo decorators reference: <https://mojolang.org/docs/reference/decorators/>
- Mojo stability guarantees (internal decorators, `@__` rule):
  <https://mojolang.org/docs/api-docs/stability/>
- Mojo v1.0.0 release notes (legacy closure decorators deprecated):
  <https://mojolang.org/releases/v1.0.0/>
