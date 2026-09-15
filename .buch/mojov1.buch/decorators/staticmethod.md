# @staticmethod

`@staticmethod` declares a struct method that belongs to the **type**, not to an
instance. A static method takes no `self` and therefore cannot touch instance
fields or instance methods.

```mojo
from std.pathlib import Path

struct MyStruct(Movable):
    var data: List[UInt8]

    def __init__(out self):
        self.data = List[UInt8]()

    @staticmethod
    def load_from_file(file_path: Path) raises -> Self:
        var new_struct = MyStruct()
        new_struct.data = file_path.read_bytes()
        return new_struct ^
```

Source: <https://mojolang.org/docs/reference/decorators/staticmethod/>.

## Target

`@staticmethod` applies to methods. Source:
<https://mojolang.org/docs/reference/decorators/>.

## What "static" means here

> Unlike an instance method, a static method doesn't take an implicit `self`
> argument. It's not attached to a specific instance of a struct, so it can't
> access instance data.

Source: <https://mojolang.org/docs/reference/decorators/staticmethod/>.

The struct-declarations reference adds what a static method *can* do:

> It can access type parameters and comptime members, can call other static
> methods, has no `self`, and has no access to instance fields and instance
> methods.

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

The same page notes the enforcement: a method without `self` is an error unless
it is marked `@staticmethod`.

```mojo
struct Unsound:
    def broken():
        pass
    # Error: self argument must be present in instance method

struct OK:
    @staticmethod
    def utility():  # No self required
        pass
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

## Calling a static method

Call it through the type name, not an instance:

```mojo
struct MathUtils:
    comptime pi: Float64 = 3.141592653589793

    @staticmethod
    def square(x: Int) -> Int:
        return x * x

def main():
    print(MathUtils.square(5))  # 25
    print(MathUtils.pi)         # 3.141592653589793
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

## Use cases

The struct-declarations reference recommends static methods for "utility
functions related to the struct's mission that don't need an instance", such as
factory methods and general-purpose helpers. The `load_from_file()` example
above is a factory: it constructs and returns a `Self` value without an
existing instance. Source:
<https://mojolang.org/docs/reference/struct-declarations/>.

## `@staticmethod` and overload resolution

Instance methods and static methods of the same name form one overload set. At
a method-call expression, the instance method wins:

```mojo
struct StaticOverload:
    def __init__(out self):
        pass

    def foo(mut self):
        print("instance method")

    @staticmethod
    def foo():
        print("static method")

def main():
    var a = StaticOverload()
    a.foo()  # instance method
```

To reach the static one explicitly, call it through the type:
`StaticOverload.foo()`. Source:
<https://mojolang.org/docs/reference/function-declarations/>.

## Pitfalls

- **Touching `self` in a static method.** There is no `self`; instance fields
  are inaccessible. Verified above.
- **Forgetting the decorator.** A method with no `self` that is not
  `@staticmethod` is a compile error. Verified above.
- **Assuming an instance call picks the static overload.** The instance method
  wins; use the type name to call the static one. Verified above.
- **Confusing a static method with an initializer.** `__init__()` is implicitly
  static, but factory methods often return `Self` rather than initializing in
  place. Verified above.

## Sources

- `@staticmethod` reference:
  <https://mojolang.org/docs/reference/decorators/staticmethod/>
- Mojo decorators reference (target table):
  <https://mojolang.org/docs/reference/decorators/>
- Mojo struct declarations reference (methods, static methods):
  <https://mojolang.org/docs/reference/struct-declarations/>
- Mojo function declarations reference (overload resolution):
  <https://mojolang.org/docs/reference/function-declarations/>
