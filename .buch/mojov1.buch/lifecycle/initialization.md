# Initialization: logical versus field-wise

Mojo tracks **two** kinds of initialization for structs, and conflating them is
the source of a whole class of compile errors:

> - Fieldwise initialization means each field contains valid data and the
>   instance's storage has been populated.
> - Logical initialization means the instance as a whole is valid and its
>   `__init__()` method has run.

> Fieldwise initialization alone isn't enough. The compiler requires logical
> initialization before an instance can be used.

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

This page is the deep dive: the difference between the two states, what happens
inside `__init__()`, moving values out of fields, the destructor, the `deinit`
convention, and the rules that tie it all together.

## The basics: construction is a call

You create struct instances by calling the `__init__()` constructor:

```mojo
struct Person:
    var name: String
    var age: Int

    def __init__(out self, name: String, age: Int):
        self.name = name
        self.age = age

def main():
    var me = Person("Alice", 30)
```

Calling `Person("Alice", 30)` is syntactic sugar for calling the constructor
directly:

```mojo
var me: Person
me = Person.__init__("Alice", 30)   # Identical
```

> When constructing a Person, the compiler first allocates stack space for the
> instance `me`, then `__init__()` initializes that space.

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

## Field-wise initialization is not enough

Assigning directly to every field populates the storage but does **not** make the
instance usable:

```mojo
def main():
    var me: Person
    me.age = 25
    me.height = 6
    print(me)   # Error
    # error: 'me' used with all fields manually initialized
    #        but without calling an '__init__' method
```

> In this example, all fields contain valid values, but the instance is still not
> considered initialized.

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

The fix is to route construction through the initializer:

```mojo
var me = Person(25, 6)   # Now OK: __init__() ran
```

> Calling `__init__()` makes an instance *logically* initialized. This process
> isn't just about assigning data. It ensures that any required initialization
> logic ran and that the instance is safe to use.

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

## Inside `__init__()`: logically initialized, field-wise empty

This is the asymmetry that makes the model work. On entry to `__init__()`, `self`
is already logically initialized, but its fields are not:

```mojo
def __init__(out self, name: String, age: Int):
    # At this point:
    # - Logically initialized (self is valid as an instance)
    # - Fieldwise uninitialized (fields have no values yet)

    self.name = name
    self.age = age

    # Now both logically and fieldwise initialized
```

> This distinction is intentional. Entering `__init__()` establishes the instance
> itself, but it's your responsibility to populate its fields.

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

You must initialize **every** field:

```mojo
def __init__(out self, name: String, age: Int):
    self.name = name
    # Error: field 'age' not initialized in __init__
```

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

### The signature does not have to mirror the fields

A constructor can compute fields from anything available at run time or compile
time:

```mojo
# Parameters can be used to initialize fields
self._store = List[T](capacity=Count)

# Constants can be used to initialize fields
self.string = ""

# External values can be used to initialize fields
from std.math import pi
self.default_angle = pi / 2.0
self.uuid = MyUUIDImplementation.uuid()
```

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

### No method calls before all fields are initialized

```mojo
def __init__(out self, name: String):
    self.greet()      # Error: self not fully initialized
    self.name = name
    self.greet()      # OK: all fields initialized
```

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

And a rule that is easy to get wrong when writing helper code:

> Field initialization is restricted to `__init__()` methods. Regular functions
> can't *initialize* individual fields of an `out` argument, but `__init__()`
> methods can.

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

## Moving from fields

Moving a value out of a field **deinitializes that field**:

```mojo
struct Person2:
    var name: String
    var age: Int

    def __init__(out self, name: String, age: Int):
        self.name = name
        self.age = age

def main():
    var me = Person2("Connor", 25)
    var name_owner = me.name^   # Move the value out of me.name
    print(me)                   # Error: use of uninitialized value 'me'
```

> After the move, the instance is still *logically initialized*, but it's only
> partially *fieldwise initialized*. Mojo doesn't allow using instances with
> uninitialized fields.

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

To make the instance usable again, reinitialize the moved-from field:

```mojo
var me = Person2("Connor", 25)
var name_owner = me.name^
me.name = "John"        # Reinitialize the field
print(me)               # OK
use_value(name_owner)   # Now use name_owner
```

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

> Any moved field requires a new value before you can use the instance again. Even
> if *all* fields are moved, the instance itself remains logically initialized.

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

### Normal methods: reinitialize before returning

In an ordinary method you cannot leave a field moved-out at the implicit return:

```mojo
@fieldwise_init
struct MyStruct:
    var name: String

    def move_field(mut self, var new_name: String):
        var name = self.name^   # Error:
        # error: 'self.name' is uninitialized at the implicit return
        #        from this function
        print("Name:", name)
```

The fix is to reinitialize the field before the end of scope:

```mojo
def move_field(mut self, var new_name: String):
    var name = self.name^
    print("Name:", name)
    self.name = new_name^   # reinitialize the name field
```

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

## The destructor: `__deinit__()`

> `__deinit__()` is Mojo's default *destructor* (or *deinitializer*). While it
> runs, the instance remains logically initialized, and it becomes logically
> deinitialized when the method completes.

```mojo
@fieldwise_init
struct Contact:
    var name: String
    var email: String

    def __deinit__(deinit self):
        # `self` is initialized
        print("destroying contact")
        # `self` is deinitialized
```

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

Full destruction semantics — ASAP destruction, `Deinitable`, `@explicit_destroy`
— are on [death](death.md).

### Destructors may move fields without reinitializing

Destructors are the **only** place where you can move values out of fields
without reinitializing them before the next use. It is not about where the code
lives, "it's about guarantees":

```mojo
def __deinit__(deinit self):
    var name = self.name^   # OK: can take ownership of fields
```

> The compiler knows that destructors like `__deinit__()` are the final use of an
> instance. Because of this, it allows you to move values out of fields without
> reinitializing them.

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

Fields use ASAP destruction inside deinit methods too:

```mojo
struct S:
   var a: String
   var b: String

   def __deinit__(deinit self):
       # Mojo calls a.__deinit__() here.
       use(b)
       # Mojo calls b.__deinit__() here.
```

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

## The `deinit` convention

`deinit self` is what makes a method a destructor. It works in named destructors
as well as in `__deinit__()`:

```mojo
struct Parent:
    def consume(deinit self):
        # `consume` is a named destructor
        # Can move values out of fields here too
        var name = self.name^
        print("Name:", name)
```

> Any struct method that uses `deinit self` as its first argument is a destructor.
> As a destructor, you can use this `consume` method for explicitly destroyed
> types.

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

### `deinit` on other arguments

The convention is not limited to `self` — you can write methods that destruct
other instances:

```mojo
struct Pair:
    def destroy_other(self, deinit other: Self):
        # Can take from fields of `other` here
```

> Using `deinit` means `other` is logically deinitialized at the end of the
> method. Because of this, it's safe to move values out of `other`, since the
> instance's lifetime is guaranteed to complete.

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

## Explicit and implicit destructors

- **Implicit destruction** uses `__deinit__()`, which is "the core of implicit
  destruction types. It's Mojo's default destructor and works hand in hand with
  `Deinitable`, a trait that all structs conform to by default. The compiler calls
  `__deinit__()` automatically when it detects the final use of a `Deinitable`
  struct value."
- **Explicit destruction** requires you to call a destructor. "An explicitly
  destroyed type must define at least one custom destructor ... The compiler makes
  sure that the final use of an explicitly destroyed value will be a call to one
  of its custom destructors."

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

The differences for explicit destruction:

> - Destruction doesn't automatically happen at the point of last use.
> - The explicit destructor isn't named `__deinit__()`.

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

## Destruction is ASAP

> Unless you opt into explicit destructors, Mojo uses implicit destruction. Both
> explicit and implicit destructors use ASAP ("As Soon As Possible") destruction:

```mojo
def example():
    var x = SomeType()
    use(x)        # last use in scope
    # x destroyed here, immediately after last use
    more_code()   # x is already gone
```

> With ASAP, Mojo destroys instances immediately after their last use, not at the
> end of scope. This can happen even in the middle of an expression.

> Mojo's ASAP destruction enables better tail call optimization, but it also means
> destructors can run earlier than you might expect.

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

The compiler's side of the contract:

> Mojo tracks the lifetimes of values in your code. It knows when you move out of
> a value using the transfer operator (`^`), or when you call a `deinit` method
> that explicitly destroys it. If the compiler finds a live value that hasn't
> otherwise been cleaned up, it uses the implicit destructor
> (`__deinit__(deinit self...)`) to destroy it.

> If a type doesn't have an implicit destructor because it requires explicit
> destruction, the compiler emits an error, as indicated by the
> `@explicit_destroy` decorator.

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

## The summary, as the docs state it

> Create instances by calling `__init__()`. You must initialize every field in the
> initializer, especially if you plan to use the instance within the method scope.
> You can't call methods on a struct unless all its fields are initialized.

> You must *logically* initialize an instance before using it, which means calling
> the initializer. You must also initialize fields before accessing them. Partially
> initialized instances can't be used in many contexts, including method calls and
> return values.

> For implicitly destroyed structs, the compiler inserts a destructor call after
> the instance's last use. For explicitly destroyed values, you must call a
> destructor before the instance goes out of scope. Destruction is
> compiler-checked, but you choose when it happens. The value's final use in scope
> must be that explicit destructor call.

> Field operations are also constrained. Fieldwise initialization must happen
> inside the `__init__()` constructor. You can move values out of a field only when
> the compiler can prove that the instance won't be used again, or that the field
> will be reinitialized before the end of a normal method.

Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.

## Pitfalls

- **Assigning to all fields and calling it initialized.** Only `__init__()` makes
  an instance logically initialized. Source:
  <https://mojolang.org/docs/manual/lifecycle/initialization/>.
- **Leaving one field uninitialized in `__init__()`.** "field 'age' not
  initialized in `__init__`". Source:
  <https://mojolang.org/docs/manual/lifecycle/initialization/>.
- **Calling a method before all fields are set.** `self not fully
  initialized`. Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.
- **Moving a field out and then using the instance.** The instance is only
  partially field-wise initialized; reinitialize the field first. Source:
  <https://mojolang.org/docs/manual/lifecycle/initialization/>.
- **Leaving a field moved-out at a normal method's implicit return.** Use it in
  `__deinit__()`/a `deinit self` method, or reinitialize before returning.
  Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.
- **Initializing a field from a regular function.** Fieldwise initialization is
  restricted to `__init__()`. Source:
  <https://mojolang.org/docs/manual/lifecycle/initialization/>.
- **Assuming end-of-scope destruction.** It is ASAP — after last use, possibly
  mid-expression. Source: <https://mojolang.org/docs/manual/lifecycle/initialization/>.
- **Writing `__del__`.** The current destructor name is `__deinit__`; `__del__` is
  the pre-1.0 spelling. See [`versions/1.0.0`](../versions/1.0.0.md).

## Open questions

> **Open question:** the initialization page itself uses both `__del__()` and
> `__deinit__()`, and its "default destructor" section is headed with `__del__()`
> while later sections and the `death` page use `__deinit__()`. This book uses
> `__deinit__` throughout and records the rename in
> [`versions/1.0.0`](../versions/1.0.0.md); re-verify on the next release.

> **Open question:** the page mentions `@explicit_destroy` in prose but does not
> restate the current 1.0 form (`@explicit_destroy("message")` together with
> `Deinitable where False`). See [death](death.md) for the current construction
> and [`versions/1.0.0`](../versions/1.0.0.md) for the change.

## Sources

- Mojo manual — Deep dive — Instance initialization: <https://mojolang.org/docs/manual/lifecycle/initialization/>
- Mojo manual — Value creation: <https://mojolang.org/docs/manual/lifecycle/life/>
- Mojo manual — Value destruction: <https://mojolang.org/docs/manual/lifecycle/death/>
- Mojo reference — Function declarations (special methods): <https://mojolang.org/docs/reference/function-declarations/>
- Mojo reference — Decorators (`@explicit_destroy`): <https://mojolang.org/docs/reference/decorators/>
