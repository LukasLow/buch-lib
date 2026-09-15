# @deprecated

`@deprecated` marks a declaration as **obsolete and scheduled for removal**. It
does not stop the declaration from working; it makes the compiler warn at every
call site, giving users time to migrate before the API disappears.

> The `@deprecated` decorator marks a declaration as obsolete and scheduled for
> removal. It actively signals to callers that an API still works today but
> won't stick around forever.

Source: <https://mojolang.org/docs/reference/decorators/deprecated/>.

> Deprecation doesn't prevent using symbols. Instead, it surfaces guidance in
> the form of compiler warnings.

Source: <https://mojolang.org/docs/reference/decorators/deprecated/>.

## Target

`@deprecated` is the most widely applicable built-in decorator: it works on
`struct`, `def`, methods, `trait` and `comptime` declarations. Source:
<https://mojolang.org/docs/reference/decorators/>.

## Two styles

### `@deprecated(use=symbol)`

Use this when there is a clear successor. The compiler warns and points callers
at the named symbol:

> - The argument for `use` is the actual symbol. Don't quote it.
> - The symbol must be valid or the compiler will error.

Source: <https://mojolang.org/docs/reference/decorators/deprecated/>.

### `@deprecated("message")`

Use this when there is no single replacement. The compiler prints the string in
the warning:

> If there's no direct replacement in play, the message style lets you explain
> the impact of your deprecation.

Source: <https://mojolang.org/docs/reference/decorators/deprecated/>.

## A complete example

```mojo
# Mark function `a` as deprecated with a custom message
@deprecated("Sunsetting a")
def a():
    pass

# Mark function `b` as deprecated with alternative
@deprecated(use=c)
def b():
    pass

# `c` is `b`'s recommended replacement after deprecation
def c():
    pass

def main():
    a() # custom warning
    b() # warning with recommended replacement
    c() # no warning

    # Demonstrate that only warnings are issued
    print("This is a functioning app")
```

Source: <https://mojolang.org/docs/reference/decorators/deprecated/>.

The official output shows that both calls still run — only warnings are
emitted, and the program prints its final line:

```text
deprecation.mojo:16:6: warning: Sunsetting a
    a() # custom warning
    ~^~
deprecation.mojo:3:4: note: 'a' declared here
def a():
   ^
deprecation.mojo:17:6: warning: 'b' is deprecated, use 'c' instead
    b() # warning with recommended replacement
    ~^~
deprecation.mojo:8:4: note: 'b' declared here
def b():
   ^
This is a functioning app
```

Source: <https://mojolang.org/docs/reference/decorators/deprecated/>.

## What you can deprecate

- **Structs** — `@deprecated(use=PerformantStruct) struct LegacyStruct:`
- **Functions** — `@deprecated("This function is being phased out") def legacy_function(self):`
- **Traits** — `@deprecated(use=Honkable) trait Quackable:`
- **`comptime` values** — `@deprecated("Use tau instead") comptime pi = 3.141592`

Source: <https://mojolang.org/docs/reference/decorators/deprecated/>.

## Official deprecation practices

The reference recommends four qualities:

- **Clarity** — explain the reason when it gives actionable context.
- **Actionability** — point to a concrete replacement (`use`) or next step.
- **Consistency** — use the same phrasing across related APIs.
- **Precision** — deprecate individual functions or methods rather than whole
  types where possible.

Source: <https://mojolang.org/docs/reference/decorators/deprecated/>.

## Pitfalls

- **Quoting the `use` argument.** `@deprecated(use="c")` is wrong; the argument
  is a symbol reference, not a string. Source:
  <https://mojolang.org/docs/reference/decorators/deprecated/>.
- **Pointing `use` at an invalid symbol.** The compiler errors. Source:
  <https://mojolang.org/docs/reference/decorators/deprecated/>.
- **Mixing the two styles.** `use=` and a positional message are alternatives,
  not a pair. The reference presents them as two styles. Source:
  <https://mojolang.org/docs/reference/decorators/deprecated/>.
- **Expecting deprecation to disable the API.** It only warns; the call still
  works. Verified above.
- **Deprecating a whole type when one method suffices.** The official practice is
  to be precise. Source: <https://mojolang.org/docs/reference/decorators/deprecated/>.

## Sources

- `@deprecated` reference:
  <https://mojolang.org/docs/reference/decorators/deprecated/>
- Mojo decorators reference (target table):
  <https://mojolang.org/docs/reference/decorators/>
- Mojo v0.25.7 release notes (`use=` argument introduced):
  <https://mojolang.org/releases/v0.25.7/>
