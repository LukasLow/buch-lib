# @fieldwise_init

`@fieldwise_init` generates a struct's **field-wise `__init__()` constructor**,
with one argument per field, so you do not have to write the assignment
boilerplate by hand.

```mojo
@fieldwise_init
struct MyPet:
    var name: String
    var age: Int
```

> Mojo sees the `@fieldwise_init` decorator and synthesizes a field-wise
> constructor, the result being as if you had actually written this:

```mojo
struct MyPet:
    var name: String
    var age: Int

    def __init__(out self, var name: String, age: Int):
        self.name = name^
        self.age = age
```

Source: <https://mojolang.org/docs/reference/decorators/fieldwise-init/>.

Two details are visible in the synthesized signature: the first argument is
taken by `var` and transferred with `^`, and later arguments use the default
convention. The synthesized constructor is a starting point you can always
replace with a hand-written `__init__()`.

## Target

`@fieldwise_init` applies to `struct` declarations only. Source:
<https://mojolang.org/docs/reference/decorators/>.

## Copy and move constructors

The decorator handles the field-wise constructor. To also get the copy and move
constructors, add the `Copyable` trait (or the ones you need):

> You can synthesize the copy constructor and move constructor by adding the
> `Copyable` trait to your struct.

Source: <https://mojolang.org/docs/reference/decorators/fieldwise-init/>.

The reference points to the lifecycle documentation for those methods.
Source: <https://mojolang.org/docs/reference/decorators/fieldwise-init/>.

## Implicit conversion variant

`@fieldwise_init("implicit")` also makes the synthesized constructor an implicit
conversion. It works only when the type has **exactly one instance field** —
the limit applies to the type, not merely to the constructor's arguments.

> - Use `@fieldwise_init("implicit")` to auto-create one, as long as your type
>   has exactly _one_ instance field. This limit applies to the type itself, not
>   just to initializer arguments.

Source: <https://mojolang.org/docs/reference/decorators/fieldwise-init/>.

With an `@implicit` initializer, all three call forms build a value:

```mojo
some_function(an_instance)      # pass an instance
some_function(MyStruct(42))     # build one directly
some_function(42)               # implicit conversion
```

Source: <https://mojolang.org/docs/reference/decorators/fieldwise-init/>.

## Example: fieldwise plus implicit

```mojo
from std.math import Floorable, floor

# Creates an implicit initializer and limits the type to one instance field.
@fieldwise_init("implicit")
struct FlooringInt:
    var floored: Int

    # Allows implicit conversion from types that can be floored and made into an Int.
    @implicit
    def __init__[T: Floorable & Intable](out self, value: T):
        self.floored = Int(floor(value))

def floored(value: FlooringInt) -> Int:
    return value.floored

def main():
    print(floored(FlooringInt(42)))  # pass an instance, output: 42
    print(floored(2))                # pass Int, output: 2
    print(floored(52.6))             # pass Float64, output: 52
```

Source: <https://mojolang.org/docs/reference/decorators/fieldwise-init/>.

`@fieldwise_init("implicit")` supplies the `Int` conversion; the explicitly
written `@implicit` constructor handles other floorable types.

## When synthesis fails

The struct-declarations reference records the failure case: synthesis fails if a
field is non-copyable and non-movable.

```mojo
@fieldwise_init
struct Color:
    var r: UInt8
    var g: UInt8
    var b: UInt8
    var alpha: Alpha
    # Error: cannot synthesize fieldwise init because field
    # 'alpha' has non-copyable and non-movable type 'Alpha'
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

## Pitfalls

- **Assuming `("implicit")` works for a multi-field type.** It requires exactly
  one instance field. Verified above.
- **Expecting the copy/move constructors from the decorator alone.** Add
  `Copyable` (and the traits you need) for those. Verified above.
- **Using it on a struct with a non-copyable, non-movable field.** Synthesis
  fails; write the constructor yourself. Verified above.
- **Treating the generated signature as the whole story.** You can still write
  your own `__init__()` overloads alongside it. Verified above.
- **Replacing the removed `@value`.** In older code `@value` did this job; it was
  removed in favour of `@fieldwise_init` plus explicit traits. Source:
  <https://mojolang.org/releases/v0.25.6/>.

## Sources

- `@fieldwise_init` reference:
  <https://mojolang.org/docs/reference/decorators/fieldwise-init/>
- Mojo decorators reference (target table):
  <https://mojolang.org/docs/reference/decorators/>
- Mojo struct declarations reference (synthesis rules):
  <https://mojolang.org/docs/reference/struct-declarations/>
- Mojo lifecycle — Life of a value (manual):
  <https://mojolang.org/docs/manual/lifecycle/life/>
- Mojo v0.25.6 release notes (`@value` removed):
  <https://mojolang.org/releases/v0.25.6/>
