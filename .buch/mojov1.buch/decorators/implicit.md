# @implicit

`@implicit` marks a **single-argument constructor** as eligible for implicit
conversion. A value whose type can be converted by such a constructor may then
be passed or assigned without an explicit constructor call.

> You can add the `@implicit` decorator on any single-argument constructor to
> identify it as eligible for implicit conversion.

Source: <https://mojolang.org/docs/reference/decorators/implicit/>.

## Target

`@implicit` applies to methods — specifically constructors. Source:
<https://mojolang.org/docs/reference/decorators/>.

## Basic example

```mojo
struct MyInt:
    var value: Int

    @implicit
    def __init__(out self, value: Int):
        self.value = value

    def __init__(out self, value: Float64):
        self.value = Int(value)
```

> This implicit conversion constructor allows you to pass an `Int` to a function
> that takes a `MyInt` argument, or assign an `Int` to a variable of type
> `MyInt`. However, the constructor that takes a `Float64` value is **not** an
> implicit conversion constructor, so it must be invoked explicitly:

```mojo
def func(n: MyInt):
    print("MyInt value: ", n.value)

def main():
    func(Int(42))             # Implicit conversion from Int: OK
    func(MyInt(Float64(4.2))) # Explicit conversion from Float64: OK
    func(Float64(4.2))        # Error: can't convert Float64 to MyInt
```

Source: <https://mojolang.org/docs/reference/decorators/implicit/>.

## Exactly one argument

The decorator applies to a constructor with a single argument. For a
field-wise implicit constructor, `@fieldwise_init("implicit")` requires the type
to have exactly one instance field. See
[`@fieldwise_init`](fieldwise-init.md). Source:
<https://mojolang.org/docs/reference/decorators/fieldwise-init/>.

## Deprecating an implicit conversion

Over time an implicit conversion may become undesirable — it can hide
complexity or create ambiguous overloads. `@implicit` takes a `deprecated`
argument that warns on implicit use without breaking explicit calls:

```mojo
struct MyStruct:
    @implicit(deprecated=True)
    def __init__(out self, value: Int):
        # ...
```

```mojo
_: MyStruct = 1  # Warns on implicit conversion

_ = MyStruct(1)  # No warning. Conversion is explicit
```

Source: <https://mojolang.org/docs/reference/decorators/implicit/>.

This phasing-out tool was introduced in v0.25.7. Source:
<https://mojolang.org/releases/v0.25.7/>.

## Overload resolution

Implicit conversions are visible to overload resolution, which is why two
constructors that both accept the same source type make a call ambiguous:

- The compiler considers "whether a constructor is `@implicit`".
- Its final tiebreaker is "pick the candidate that is a non-`@implicit`
  constructor over an `@implicit` one".

Source: <https://mojolang.org/docs/reference/function-declarations/>.

The ambiguity example from the reference:

```mojo
def foo(name: MyString):
    print("MyString")

def foo(name: YourString):
    print("YourString")

def main():
    # Error because the call is ambiguous: both overloads need exactly
    # one implicit conversion from `String`
    foo("Hello")
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

Resolve it by casting at the call site: `foo(MyString("Hello"))`.

## Pitfalls

- **Marking a multi-argument constructor.** The decorator applies to a
  single-argument constructor. Verified above.
- **Creating two reachable implicit conversions.** Calls become ambiguous; the
  compiler rejects them. Verified above.
- **Forgetting `Int(42)` vs. `Float64(4.2)`.** Only the `@implicit` overload
  converts implicitly; others need an explicit call. Verified above.
- **Removing `@implicit` outright when phasing out.** That can expose another,
  unintended implicit path; use `@implicit(deprecated=True)` instead. Source:
  <https://mojolang.org/releases/v0.25.7/>.
- **Relying on implicit conversion of a container.** 1.0's default is explicit
  copy; only `ImplicitlyCopyable` types copy implicitly. Source:
  <https://mojolang.org/releases/v1.0.0/>.

## Sources

- `@implicit` reference:
  <https://mojolang.org/docs/reference/decorators/implicit/>
- Mojo decorators reference (target table):
  <https://mojolang.org/docs/reference/decorators/>
- Mojo function declarations reference (overload resolution):
  <https://mojolang.org/docs/reference/function-declarations/>
- `@fieldwise_init` reference (implicit variant):
  <https://mojolang.org/docs/reference/decorators/fieldwise-init/>
- Mojo v0.25.7 release notes (`deprecated=True` argument):
  <https://mojolang.org/releases/v0.25.7/>
- Mojo v1.0.0 release notes (copy semantics):
  <https://mojolang.org/releases/v1.0.0/>
