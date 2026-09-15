# @__copy_capture (deprecated)

> **Deprecated.** The official page carries a caution block:
>
> > The `@__copy_capture` decorator is deprecated and will be removed in a future
> > release. Use the current `closure` syntax with capture lists.
>
> Source: <https://mojolang.org/docs/reference/decorators/copy-capture/>.
>
> This page exists only so a reader who meets the decorator in existing code
> knows what it is, what it replaced, and what to write instead. **Do not use it
> in new code.**

## What it did

> You can add the `@__copy_capture` decorator on a legacy closure to capture
> register-passable values by copy. This decorator causes a nested function to
> copy the value of the indicated variable into the closure object at the point
> of formation instead of capturing that variable by reference. This allows you
> to pass the closure as a parameter, but lifetimes aren't guaranteed to be
> respected.

Source: <https://mojolang.org/docs/reference/decorators/copy-capture/>.

The official example shows the decorator stacked with `@parameter` on a nested
function, capturing `z` by copy so that changing `z` afterwards does not affect
the closure:

```mojo
  def foo(x: Int):
      var z = x

      @__copy_capture(z)
      @parameter
      def formatter() -> Int:
          return z
      z = 2
      print(formatter())

  def main():
      foo(5)
```

Source: <https://mojolang.org/docs/reference/decorators/copy-capture/>.

## Target

`@__copy_capture` applied to methods (nested functions within a legacy closure
context). Source: <https://mojolang.org/docs/reference/decorators/>.

## Why it is deprecated

Two independent official statements point the same way:

1. Its own page says to use the current closure syntax with capture lists.
2. The stability page lists it under decorators that exist only for language
   migration and are not public API:

   > `@parameter`, `@__copy_capture`: legacy closure support

   Source: <https://mojolang.org/docs/api-docs/stability/>.

The 1.0.0 release notes tie it to the legacy closure model:

> Legacy closures, and the `@parameter` and `@__copy_constructor` decorators
> used to declare them, are deprecated and should not be used in new code. Use
> the newer closure syntax with capture lists, instead.

Source: <https://mojolang.org/releases/v1.0.0/>.

Note the release note's decorator name (`@__copy_constructor`) differs from the
reference page's (`@__copy_capture`). Both refer to the legacy copy-capture
mechanism; neither is current.

## What to write instead

Use a **capture list** with the `var` convention to capture by copy. This is the
modern, supported equivalent:

```mojo
def main():
    var snapshot_val = 42

    def frozen() {var snapshot_val} -> Int:
        return snapshot_val

    snapshot_val = 999
    print(frozen())  # 42  (copied at definition time)
```

Source: <https://mojolang.org/docs/manual/functions/closures/>.

`{var name}` copies at the point the closure is defined; later changes to the
outer variable do not affect it. For the full set of capture conventions
(`imm`, `mut`, `var`, `ref`, move), see the closures manual page.

## Pitfalls

- **Using it in new code.** It is deprecated and will be removed. Verified above.
- **Treating it as public API.** The stability page calls it internal legacy
  support. Verified above.
- **Assuming lifetimes are safe.** The reference explicitly warns that with this
  decorator "lifetimes aren't guaranteed to be respected". Verified above.
- **Mixing it with new closure syntax.** Legacy closures and capture-list
  closures are different models; migrate rather than combine.

## Sources

- `@__copy_capture` reference:
  <https://mojolang.org/docs/reference/decorators/copy-capture/>
- Mojo decorators reference (target table):
  <https://mojolang.org/docs/reference/decorators/>
- Mojo stability guarantees (internal legacy decorators):
  <https://mojolang.org/docs/api-docs/stability/>
- Closures (manual): <https://mojolang.org/docs/manual/functions/closures/>
- Mojo v1.0.0 release notes (legacy closures deprecated):
  <https://mojolang.org/releases/v1.0.0/>
