# assert

`assert` checks a condition at run time (or, with `comptime`, at compile time)
and aborts if it is false. It is a debugging and invariant-checking tool, not an
error-handling mechanism: a failing `assert` is not catchable by `try`/`except`.

## Purpose

The official keywords reference defines `assert` in one line:

> `assert` — Aborts if a condition is false (gated by `-D ASSERT`)

Source: <https://mojolang.org/docs/reference/keywords/>.

The simple-statements reference lists `assert` among the statements its parser
handles (`parseAssertStmt()`), so `assert` is a **simple statement**: one logical
line, optionally with a message. Source:
<https://mojolang.org/docs/reference/simple-statements/>.

```mojo
assert x > 0, "x must be positive"
assert len(items) != 0
```

## The two forms: compile time and run time

Mojo spells assertions in two places, and they behave differently:

| Form | When it runs | Effect on failure |
|------|--------------|-------------------|
| `assert cond, "msg"` | At run time (gated by `-D ASSERT`) | Aborts the program. |
| `comptime assert cond, "msg"` | During compilation | Compilation fails with the message. |

The compile-time form is documented in the constraints manual:

> Mojo also supports *compile-time assertions*, which test a proposition at
> compile time—if the assertion evaluates to false, compilation fails:
>
> ```mojo
> comptime assert x >= 0, "x must be greater than or equal to 0."
> ```

Source: <https://mojolang.org/docs/manual/metaprogramming/constraints/>.

A `comptime assert` also *teaches the constraint system*: after it, the asserted
condition is known to be true for the rest of the scope. Source:
<https://mojolang.org/docs/manual/metaprogramming/constraints/>.

The run-time `assert` statement is gated by the `-D ASSERT` flag; the
compile-time form is not gated by it.

## The message is optional

Both forms accept an optional message:

> The message is optional. If the condition evaluates to false at compile time,
> compilation fails and the compiler shows the message (or a default message if
> none is specified).

Source: <https://mojolang.org/docs/manual/metaprogramming/constraints/>.

The tools page shows the compile-time failure output:

```output
note: constraint failed: this function requires a GPU target
    comptime assert is_gpu(), "this function requires a GPU target"
    ^
```

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

## The `ASSERT` levels

Run-time assertions are controlled by the `ASSERT` compile-time flag. The tools
page gives the levels in full:

| Value | Meaning |
|-------|---------|
| `none` | Disable all assertions |
| `safe` | Run only assertions tagged `assert_mode="safe"` (default in non-debug builds) |
| `all` | Run every assertion |
| `warn` | Run every assertion, but emit warnings instead of aborting |

```sh
mojo run -D ASSERT=all hello.mojo
```

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

The `debug_assert()` library reference repeats the same four values and adds
that `-D ASSERT=none` exists "for performance at the cost of safety". Source:
<https://mojolang.org/docs/std/builtin/debug_assert/debug_assert/>.

A build with `-D ASSERT=all` is also what enables bounds checking on GPU:
"Use `mojo build -D ASSERT=all` to enable bounds checking on GPU; use
`-D ASSERT=none` to disable all asserts including CPU bounds checking." Source:
<https://mojolang.org/releases/v1.0.0b1/>.

> **Open question:** the keywords reference says only that `assert` is "gated by
> `-D ASSERT`", and the tools page describes the *levels* (`none`, `safe`,
> `all`, `warn`) for assertions in general. The official 1.x pages do not state
> whether a bare run-time `assert` statement is treated as a `"safe"` assertion
> (active by default) or as an untagged one (active only under `-D ASSERT=all`).
> The pre-1.0 release note that introduced the statement said it is active
> "when compiled with `-D ASSERT=all` and are no-ops otherwise"
> (<https://mojolang.org/releases/v0.26.2/>), but that is a pre-1.0 statement
> about the 0.x release and is not restated on the 1.x keywords or tools pages.
> Verify against the next upstream release before relying on the default
> activation of a bare `assert`. Sources:
> <https://mojolang.org/docs/reference/keywords/>,
> <https://mojolang.org/docs/tools/feature-toggles/>.

## Assertions are not errors

An `assert` failure aborts; it does not raise a catchable error. This is why
`assert` and `raise` occupy different roles:

- Use `raise` when the condition is a caller-visible error that a caller can
  recover from; the function declares `raises` and `try`/`except` can handle it.
- Use `assert` (or `comptime assert`) for internal invariants and for
  "this must never happen" states.

The constraints manual states the decision rule directly:

> If the constraint is *not* understandable or *not* provable by the user, use
> `assert` or `abort`.

and in its summary:

> - Use a dedicated type when the condition is a common refinement that should
>   be proven once and reused everywhere.
> - Use `where` when the condition is a user-understandable precondition.
> - Use `comptime assert` or `abort` for internal inconsistencies in your
>   library where a user can't do anything with the failure.

Source: <https://mojolang.org/docs/manual/metaprogramming/constraints/>.

## The testing module's assertions are different

Do not confuse the statement with the standard-library test helpers. The
`testing` module provides `assert_true()`, `assert_false()`, `assert_equal()`,
`assert_not_equal()`, `assert_almost_equal()` and the `assert_raises()` context
manager. These are ordinary raising functions used in unit tests:

> Each assertion returns `None` if its condition is met or raises an error if it
> isn't.

Source: <https://mojolang.org/docs/tools/testing/>.

They are `Writable`-using library functions in `std.testing`, not the `assert`
keyword.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `comptime` | `comptime assert` moves the check to compile time and feeds the constraint system. |
| `raise` | The recoverable counterpart; `assert` aborts instead of raising. |
| `try`, `except` | Cannot catch an `assert` failure; it is an abort, not an error. |
| `where` | Declares a precondition for the *caller* to prove; `comptime assert` proves one locally. |
| `True`, `False` | The condition must evaluate to a boolean value. |

## Signature vs. body

`assert` is a statement and never appears in a signature. Its compile-time form
(`comptime assert`) may appear in bodies and in compile-time contexts. The
nearest signature construct is `where`, which expresses a precondition rather
than testing one.

## Pitfalls

- **Expecting `try`/`except` to catch an assertion.** It aborts; it does not
  raise. Source: <https://mojolang.org/docs/manual/metaprogramming/constraints/>.
- **Side effects in the condition or message.** The tools page warns that asserts
  can be compiled out: "To ensure that you have no run-time penalty from your
  assertions even when they're disabled, make sure there are no side effects in
  your message and condition expressions." Source:
  <https://mojolang.org/docs/std/builtin/debug_assert/debug_assert/>.
- **Condition not a `Bool`.** The condition must evaluate to a boolean; a
  `Boolable` value used directly works in conditions, but an arbitrary value does
  not.
- **Confusing `assert` with `comptime assert`.** Only the latter affects
  compilation and the constraint system; only the former can be disabled with
  `-D ASSERT=none`.
- **Using `assert` where `raise` is intended.** A caller cannot recover from an
  abort, cannot test for it with `assert_raises()`-style handling, and does not
  see a typed error.
- **Relying on assertion defaults.** The exact default activation of a bare
  `assert` under the `safe` level is not stated on the 1.x pages — see the open
  question above.
- **Aborts on GPU.** Assertion behaviour differs by target: `debug_assert()` "is
  silently disabled on Apple GPU targets", and GPU bounds checking is off unless
  `-D ASSERT=all` is used. Sources:
  <https://mojolang.org/docs/tools/feature-toggles/>,
  <https://mojolang.org/releases/v1.0.0b1/>.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`comptime`](comptime.md), [`raise`](raise.md), [`try`](try.md),
[`True`](true.md), [`where`](../keyword-conventions/where.md),
[`safety-and-undefined-behaviour`](../errors/safety-and-undefined-behaviour.md),
[`compiler-and-flags`](../tooling/compiler-and-flags.md),
[`testing`](../tooling/testing.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo simple statements reference:
  <https://mojolang.org/docs/reference/simple-statements/>
- Comptime constraints and assertions (manual):
  <https://mojolang.org/docs/manual/metaprogramming/constraints/>
- Compilation feature toggles (tools):
  <https://mojolang.org/docs/tools/feature-toggles/>
- `debug_assert()` standard library reference:
  <https://mojolang.org/docs/std/builtin/debug_assert/debug_assert/>
- Testing (tools): <https://mojolang.org/docs/tools/testing/>
- Mojo v0.26.2 release notes (version history only):
  <https://mojolang.org/releases/v0.26.2/>
