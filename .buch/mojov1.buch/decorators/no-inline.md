# @no_inline

`@no_inline` prevents the compiler from inlining a function. It is the opposite
of [`@always_inline`](always-inline.md).

> You can add the `@no_inline` decorator on any function to prevent it from
> being inlined by the compiler.

```mojo
@no_inline
def my_large_function():
    ...
```

Source: <https://mojolang.org/docs/reference/decorators/no-inline/>.

## Target

`@no_inline` applies to `def` declarations and methods. Source:
<https://mojolang.org/docs/reference/decorators/>.

## Why it exists

> Too many inlined functions can slow compilation and substantially increase the
> binary size of the compiled program. In particular, large or complex functions
> may not benefit as much from inlining.

Source: <https://mojolang.org/docs/reference/decorators/no-inline/>.

Inlining trades call overhead for code size. For a small hot function that
trade is usually good; for a large or complex one the compiler would normally
decline anyway. `@no_inline` makes the decision explicit and keeps a function
out of every call site.

The reference frames the two directions together: functions "can be explicitly
marked for inlining using `@always_inline`, or may be inlined automatically by
the compiler." Source:
<https://mojolang.org/docs/reference/decorators/no-inline/>.

## When to use it

- A large function whose body would bloat many call sites.
- Code-size-sensitive builds.
- Reducing compile time, where heavy inlining is a cost rather than a benefit.

## Pitfalls

- **Using it on a tiny hot helper.** Blocking inlining of a one-line function
  that runs in a tight loop gives up a real optimization. Verified above.
- **Expecting it to shrink runtime work.** `@no_inline` is about code size and
  compile time; it does not make a function faster. Verified above.
- **Using it as a substitute for a real optimization.** If a function is slow,
  profile it; blocking inlining is not a performance fix. Source:
  <https://mojolang.org/docs/reference/decorators/no-inline/>.

## Sources

- `@no_inline` reference:
  <https://mojolang.org/docs/reference/decorators/no-inline/>
- Mojo decorators reference (target table):
  <https://mojolang.org/docs/reference/decorators/>
