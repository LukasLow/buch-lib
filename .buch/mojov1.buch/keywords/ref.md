# ref

`ref` creates a reference binding to an existing value, and appears in signatures
as an argument convention with parametric mutability. It never copies.

## Purpose

The official keywords reference defines `ref` in one line:

> `ref` — Scoped reference binding

Source: <https://mojolang.org/docs/reference/keywords/>.

The same page lists `ref` under **Conventions** as "Argument or variable:
Reference that doesn't own the value", and explains that `var` and `ref` "also
appear in variable declarations, where `var` creates a scoped mutable variable
and `ref` creates a scoped reference binding". Source:
<https://mojolang.org/docs/reference/keywords/>.

## `ref` as a declaration

```mojo
ref y = my_list[3]  # `y` is a reference to the value at `my_list[3]`
```

> The `y` reference binding does not create a new value. It creates a reference
> to the existing value at `my_list[3]`. Modifying `y` modifies the value in
> `my_list[3]`; modifying `my_list[3]` modifies what `y` reads.

Source: <https://mojolang.org/docs/reference/simple-statements/>.

The variables manual contrasts the two bindings and shows the effect:

```mojo
var items: List[Int] = [99, 77, 33, 12]
var item = items[1]  # item is a copy of items[1]
item += 1  # increments item
print(items[1])  # prints 77
```

```mojo
ref item_ref = items[1]  # item_ref is a reference to item[1]
item_ref += 1  # increments items[1]
print(items[1])  # prints 78
```

Source: <https://mojolang.org/docs/manual/variables/>.

A reference binding cannot be re-assigned:

```mojo
ref item_ref = items[2]  # error: invalid redefinition of item_ref
```

Source: <https://mojolang.org/docs/manual/variables/>.

## `ref` in loop bindings

`for ref item in …` binds each element as a mutable reference, so mutation is
visible in the collection:

```mojo
var values = [1, 4, 7, 3, 6, 11]
for ref value in values:
    if value % 2 != 0:
        value -= 1
print(values)
```

```output
[0, 4, 6, 2, 6, 10]
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

The compound-statements reference contrasts it with `var`:

> By default, loop variables are immutable references to the iterated items
> (`imm`). To create a mutable copy, use `var`. To maintain value mutability, use
> `ref`.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## `ref` as an argument convention (signature use)

In a signature, `ref` declares an argument of **parametric mutability**: the
function does not need to know in advance whether the value will be mutable.

> The `ref` argument convention lets you specify an argument of parametric
> mutability: that is, you don't need to know in advance whether the passed
> argument will be mutable or immutable.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

Syntax:

```text
ref arg_name: arg_type
ref[origin_specifier(s)] arg_name: arg_type
```

> In the first form, the origin and mutability of the `ref` argument is inferred
> from the value passed in. The second form includes an origin clause, consisting
> of one or more origin specifiers inside square brackets.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

An origin specifier may be an origin value, an arbitrary expression (shorthand
for `origin_of(expression)`), an `AddressSpace` value, or `_` for unbound:

> - An arbitrary expression, which is treated as shorthand for
>   `origin_of(expression)`. In other words, the following declarations are
>   equivalent:
>
>   ```mojo
>   ref[origin_of(self)]
>   ref[self]
>   ```
>
> - ... An underscore character (`_`) to indicate that the origin is *unbound*.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

The function-declarations reference gives a complete example in which the
argument and the return value share an origin:

```mojo
def get_first[T: Copyable](ref data: List[T]) -> ref[data[0]] T:
    return data[0]
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

A larger example ties a returned `Span` to the argument's origin:

```mojo
from std.collections import List, Span

def to_byte_span[
    is_mutable: Bool,
    //,
    origin: Origin[mut=is_mutable],
](ref[origin] list: List[Byte]) -> Span[Byte, origin]:
    return Span(list)
```

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

## `ref` receivers on methods

A method can take `ref self` so that the returned reference inherits the
mutability of the receiver:

```mojo
struct NameList:
    var names: List[String]

    def __getitem__(ref self, index: Int) raises -> ref[self.names[0]] String:
        if (index >= 0 and index < len(self.names)):
            return self.names[index]
        else:
            raise Error("index out of bounds")
```

> Since the `origin` of the return value is tied to the origin of `self`, the
> returned reference will be mutable if the method was called using a mutable
> reference. The method still works if you have an immutable reference to the
> `NameList`, but it returns an immutable reference.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

Without parametric mutability, "you'd need to write two versions of
`__getitem__()`, one that accepts an immutable `self` and another that accepts a
mutable `self`." Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

## `ref` return values

A function may return a reference. The origin specifier is mandatory:

> Note that you **must** provide an origin specifier for a `ref` return value.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

At the call site, capturing the reference requires a `ref` binding; assigning to
a plain `var` copies:

```mojo
var name_copy = list[2]  # owned copy of list[2]
ref name_ref = list[2]   # reference to list[2]
```

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

Union origins handle branches that return one of several references:

```mojo
def pick_one(cond: Bool, ref a: String, ref b: String) -> ref[a, b] String:
    return a if cond else b
```

> Because the compiler can't statically determine which branch will be picked,
> this function must use the union origin `[a, b]`. ... The returned reference is
> mutable if **both** `a` and `b` are mutable.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

## Origins in one paragraph

An origin answers two questions: which variable owns the value, and whether it
can be mutated through this reference. Origins are mostly compiler-created, but
`ref` arguments and return values are where you interact with them directly.
`origin_of(value)` derives an origin, unions combine origins, and untracked or
wildcard origins (`MutUntrackedOrigin`, `ImmUntrackedOrigin`,
`MutUnsafeAnyOrigin`, `ImmUnsafeAnyOrigin`) represent memory outside the
ownership system. `UnsafeAnyOrigin` "should be used as a last resort", because
it "effectively disables Mojo's ASAP destruction for any values in that scope"
and "prevents Mojo from enforcing argument exclusivity". Sources:
<https://mojolang.org/docs/manual/values/lifetimes/>,
<https://mojolang.org/docs/manual/values/ownership/>.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `var` | The owning binding; `var` copies or transfers, `ref` never does. |
| `for` | `for ref x in …` binds a mutable reference per iteration. |
| `Struct` / `struct` | `ref self`, `ref` fields and `__getitem__` returning `ref` are struct-level patterns. |
| `return` | `-> ref[origin] T` is the reference return type. |
| `lambda` | `ref` is a valid lambda argument and capture convention. |
| `except`/`with` | Not related; `ref` is about value binding and mutability. |

## Signature vs. body

`ref` appears in **both**:

- In a **body** it is a reference binding (`ref x = …`) or a loop binding.
- In a **signature** it is an argument convention (`ref x: T`, optionally
  `ref[origin]`) and the receiver convention (`ref self`), and it appears in
  **return types** (`-> ref[origin] T`).

Like `var`, it is on both the keyword list and the conventions list. Source:
<https://mojolang.org/docs/reference/keywords/>.

## Pitfalls

- **Expecting `ref` to create a copy.** It always references the existing value;
  writes go through to the owner. Verified above.
- **Re-assigning a reference binding.** `ref item_ref = items[2]` after an
  earlier binding of the same name is an error. Source:
  <https://mojolang.org/docs/manual/variables/>.
- **`ref` return without an origin.** Rejected: an origin specifier is required.
  Source: <https://mojolang.org/docs/manual/values/lifetimes/>.
- **Dangling interior references.** Element references from containers such as
  `List` carry interior origins, so a later `append()`/`pop()` invalidates them:

  ```mojo
  var list = [1, 2, 3]
  ref elem = list[0]
  list.append(4)  # may reallocate, so `elem` is invalidated
  print(elem)     # error: use of invalidated interior reference
  ```

  Source: <https://mojolang.org/releases/v1.0.0/>.
- **Taking a mutable reference from an immutable one.** A `ref` argument follows
  the passed value's mutability; passing an immutable value yields an immutable
  reference, and `mut`-style mutation then fails. Source:
  <https://mojolang.org/docs/manual/values/lifetimes/>.
- **Exclusivity violations.** A mutable reference cannot alias another reference
  to the same value; `append_twice(my_string, my_string)` is an error. Source:
  <https://mojolang.org/docs/manual/values/ownership/>.
- **Reaching for wildcard origins too early.** They disable lifetime tracking and
  exclusivity checking; prefer a concrete origin. Source:
  <https://mojolang.org/docs/manual/values/lifetimes/>.
- **`ref` fields vs. `ref` locals.** A struct field is declared with `var` plus a
  type; the *origin* of a pointer-like field is expressed as a struct parameter,
  not by writing `ref` on the field.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`var`](var.md), [`for`](for.md), [`return`](return.md),
[`struct`](struct.md), [`variables-and-mutability`](../basics/variables-and-mutability.md),
[`origin-and-borrowing`](../memory/origin-and-borrowing.md),
[`pointers-and-references`](../types/pointers-and-references.md).
`keyword-conventions/ref.md` (planned) stays a plain code span.

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo simple statements reference:
  <https://mojolang.org/docs/reference/simple-statements/>
- Mojo compound statements reference:
  <https://mojolang.org/docs/reference/compound-statements/>
- Mojo function declarations reference:
  <https://mojolang.org/docs/reference/function-declarations/>
- Variables (manual): <https://mojolang.org/docs/manual/variables/>
- Lifetimes, origins, and references (manual):
  <https://mojolang.org/docs/manual/values/lifetimes/>
- Ownership (manual): <https://mojolang.org/docs/manual/values/ownership/>
- Control flow (manual): <https://mojolang.org/docs/manual/control-flow/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
