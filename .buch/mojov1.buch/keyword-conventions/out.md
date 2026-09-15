# out

`out` is an **argument convention**: an `out` argument is the function's
*return slot*. It is an uninitialized variable at entry that the function must
initialize before it returns; to the caller, it *is* the return value.

`out` is **not a reserved keyword**. It has fixed meaning only as an argument
convention (and, in ordinary positions, it is just an identifier). See
[the chapter index](index.md) for the official wording.

## What it means

The official reference defines it in one line:

> Returns a value without a return arrow

Source: <https://mojolang.org/docs/reference/keywords/>.

The manual gives the fuller contract:

> `out`: A special convention used for the `self` argument in constructors and
> for named results. An `out` argument is uninitialized at the beginning of the
> function, and must be initialized before the function returns. Although `out`
> arguments show up in the argument list, they're never passed in by the caller.

Source: <https://mojolang.org/docs/manual/values/ownership/>.

Two properties follow from that sentence and matter in practice:

1. The caller does not supply the `out` argument. The call site passes the
   other arguments only, and the `out` value comes back as the result.
2. The function must assign the `out` variable on every path.

## A named result

An `out` argument declares the return value by name:

```mojo
def make_int(out result: Int):
    result = 42

def main():
    var x = make_int()
    print(x)   # 42
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

No `return` statement is required:

> A function with a named result argument doesn't need to include an explicit
> `return` statement... If the function terminates without a `return`, or at a
> `return` statement with no value, the value of the `out` argument is returned
> to the caller.

Source: <https://mojolang.org/docs/manual/functions/>.

The manual stresses that the form is transparent to the caller — these two
signatures are interchangeable to anyone calling them:

```mojo
def get_name_tag(var name: String) -> NameTag:
    ...

def get_name_tag(var name: String, out name_tag: NameTag):
    ...

# Both are called the same way:
var tag = get_name_tag("Judith")
```

Source: <https://mojolang.org/docs/manual/functions/>.

## Why named results exist

They let a function return a value that cannot be moved or copied. Building the
value directly in the caller's storage skips the move:

```mojo
struct ImmovableObject:
    var name: String

    def __init__(out self, var name: String):
        self.name = name^

def create_immovable_object(var name: String, out obj: ImmovableObject):
    obj = ImmovableObject(name^)
    obj.name += "!"
    # obj is implicitly returned

def main():
    var my_obj = create_immovable_object("Blob")
```

By contrast, the same function written with `-> ImmovableObject` and a local
variable fails, because the final `return obj^` would need a move or copy:

```mojo
def create_immovable_object2(var name: String) -> ImmovableObject:
    var obj = ImmovableObject(name^)
    obj.name += "!"
    return obj^ # Error: ImmovableObject is not copyable or movable
```

Source: <https://mojolang.org/docs/manual/functions/>.

## `out` replaces `->`; they cannot be combined

A function can declare only one return value. Using both an `out` argument and
an explicit `->` type is an error, and the official reference gives the
diagnostic:

> `out` declares the return value by name. It can't be combined with `->`:

```mojo
def make_point(out result: Point):        # OK
    result = Point(0, 0)

def make_point(out result: Point) -> Point:  # Error: function cannot have
    result = Point(0, 0)                     # both an 'out' argument and
                                             # an explicit result type
```

Source: <https://mojolang.org/docs/reference/keywords/>.

The function-declarations reference repeats it:

```mojo
# Error because function cannot have both an 'out' argument
#        and an explicit result type
def wrong(out result: Int) -> Int:
    result = 0
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

There is exactly **one** `out` argument allowed per function.

## `out self` in constructors

The most common `out` in ordinary Mojo code is on `self` in an initializer.
The reference requires it:

```mojo
struct Point:
    var x: Int
    var y: Int

    def __init__(out self, x: Int, y: Int):
        self.x = x
        self.y = y
```

Omitting `out self` is an error:

```mojo
# Error because __init__ method must return Self type
#        with 'out' argument
def __init__(self):
    pass
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

Every field must be assigned before `__init__()` returns. Source:
<https://mojolang.org/docs/reference/struct-declarations/>.

## Placement in the argument list

The manual gives the convention:

> The `out` argument for a named result can appear anywhere in the argument
> list, but by convention, it should be the last argument in the list.

Source: <https://mojolang.org/docs/manual/functions/>.

## `out` is not `var`

`out` gives the callee an *uninitialized* slot that the callee must fill.
`var` gives it an *owned copy* of an existing value. They are different
conventions with different call-site behaviour: an `out` argument is not
passed by the caller at all, while a `var` argument is.

## Pitfalls

- **Combining `out` with `->`.** It is the same return slot declared twice; the
  compiler rejects it. Pick one. Verified above.
- **Forgetting to initialize an `out` argument on every path.** The variable is
  uninitialized at entry, so a path that leaves it unset is a compile error.
  Source: <https://mojolang.org/docs/manual/values/ownership/>.
- **Passing an `out` argument at the call site.** The caller never supplies it;
  the argument shows up only in the declaration and comes back as the result.
  Source: <https://mojolang.org/docs/manual/values/ownership/>.
- **Declaring more than one `out` argument.** Only one return value is allowed.
  Source: <https://mojolang.org/docs/reference/function-declarations/>.
- **Omitting `out self` in `__init__`.** The initializer must take `out self`.
  Verified above.
- **Treating `out` as reserved.** It is not on the keyword list; it is an
  ordinary identifier outside an argument declaration. Source:
  <https://mojolang.org/docs/reference/keywords/>.

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo function declarations reference:
  <https://mojolang.org/docs/reference/function-declarations/>
- Functions (manual): <https://mojolang.org/docs/manual/functions/>
- Ownership (manual): <https://mojolang.org/docs/manual/values/ownership/>
- Mojo struct declarations reference:
  <https://mojolang.org/docs/reference/struct-declarations/>
