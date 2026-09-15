# Collections

Mojo has a small set of container types, each with a clear job. The important
1.x fact is that a list expression now builds an `Array`, not a `List` — so
knowing which container you actually have is part of reading the language. This
page covers `Array`, `List`, `Dict`, `Set`, `Tuple` and the non-owning `Span`,
how to choose between them, the literal and display syntax, iteration, and the
interior-origin rule that governs references into a container.

`Optional` is the sixth collection and has its own page:
[Optionals and nullability](optionals-and-nullability.md).

## The container families

The types reference lists the collection types in two groups — those in the
prelude and those requiring an import:

| Type | What it is | Import? |
|------|------------|---------|
| `List` | Dynamically sized, growable sequence. | prelude |
| `Dict` | Key-value mapping. | prelude |
| `Set` | Unordered collection of unique values. | `std.collections` |
| `Optional` | A value that may or may not be present. | prelude |
| `Tuple` | Fixed-size, heterogeneous group of values. | prelude |
| `Array` | Fixed-size array stored inline, with no heap allocation. | prelude |
| `Variant` | Holds one value from a fixed set of types. | `std.utils` |

Source: <https://mojolang.org/docs/reference/types/>.

Two facts to notice from the same page:

> `List`, `Dict`, `Set`, and `Tuple` support display syntax, as described in
> Expressions.
>
> `Set` and `Variant` aren't in the prelude. Import `Set` from
> `std.collections` and `Variant` from `std.utils`.

Source: <https://mojolang.org/docs/reference/types/>.

A display is not a literal — displays can contain expressions, literals cannot —
but the syntax looks the same. Source:
<https://mojolang.org/docs/reference/expressions/>.

## `Array` — fixed size, inline storage

`Array` is the fixed-size container, and the default result of a list
expression. Its signature is `struct Array[T: AnyType, length: Int]`, and the
length must be a positive integer constant. Source:
<https://mojolang.org/docs/std/collections/array/Array/>.

```mojo
def main():
    var arr: Array[Int, 3] = [1, 2, 3]
    print(arr[0])            # 1
    print(len(arr))          # 3

    var filled = Array[Int, 5](fill=42)   # [42, 42, 42, 42, 42]
    print(filled[4])         # 42
```

Source: <https://mojolang.org/docs/std/collections/array/Array/>.

The 1.0 default changed, and this is the single most important collection fact
of the release:

> Mojo now picks `Array` (instead of `List`) as the default type to construct
> from a list expression, eliminating implicit heap allocations.

```mojo
var x = [1, 2, 3]
# type_of(x) = Array[Int, 3]
```

Source: <https://mojolang.org/releases/v1.0.0/>.

`Array` provides `__getitem__` with runtime bounds checking, compile-time
bounds checking through `__getitem_param__`, `__contains__`, `__len__`,
`__eq__`, by-reference and owned iteration, and `unsafe_ptr()`.
Source: <https://mojolang.org/docs/std/collections/array/Array/>.

### The old name

`InlineArray` was renamed to `Array`, its first parameter from `ElementType` to
`T`, and its second from `size` to `length`. Source:
<https://mojolang.org/releases/v1.0.0/>. The stdlib page still shows the
compatibility alias:

```text
comptime InlineArray = Array[_, _]
```

> A comptime alias to `std.collections.Array` to enable migration.

Source: <https://mojolang.org/docs/std/collections/array/>. Write `Array` in new
code; `InlineArray` is shown in this book only in migration snippets like the
alias above and in [the change record](../versions/1.0.0.md).

### Copyability

`Array` "no longer conforms to `ImplicitlyCopyable`, since it is not inherently
cheap to copy. It continues to conform to `Copyable`." Source:
<https://mojolang.org/releases/v1.0.0/>. Copy explicitly:

```mojo
var a: Array[Int, 3] = [1, 2, 3]
var b = a.copy()   # explicit: Array is not implicitly copyable
```

Source: <https://mojolang.org/docs/std/collections/array/Array/>. The
`Movable` conformance is conditional on the element type, and the element bound
loosened from `Movable` to `AnyType` in 1.0:

> `Array`'s element type bound loosened from `Movable` to `AnyType`, so an
> `Array` can now hold a non-`Movable` element type. The `Movable` conformance
> is now conditional on the element: move construction (including list-literal
> construction such as `[a, b, c]`) requires a `Movable` element, while
> indexing, by-reference iteration, and destruction do not.

Source: <https://mojolang.org/releases/v1.0.0/>.

## `List` — dynamically sized

`List` is the growable, heap-allocated container. Its signature is
`struct List[T: Movable, /]`: "a dynamically-allocated and resizable list" whose
"list can grow and shrink in size at runtime", with all elements of the same
compile-time type. Source: <https://mojolang.org/docs/std/collections/list/List/>.

```mojo
def main():
    var names = List[String]()
    names.append("Mojo")
    names.append("rocks")
    print(len(names))        # 2
    print(names.pop())       # rocks
    print(names[0])          # Mojo

    var preallocated = List[String](capacity=100)
    var filled = List[Float64](length=10, fill=0.0)
```

Source: <https://mojolang.org/docs/std/collections/list/List/>.

Key characteristics from the same page:

- **Type safety**: all elements share one compile-time type; a mixed list is an
  error. Use `Variant` for a heterogeneous collection:
  "`var mixed = [1, "hello"]      # Error! All elements must be same type`".
- **Value semantics**: "A `List` is value semantic by default, so assignment
  creates a deep copy of all elements" — write `.copy()` explicitly because
  `List` is not `ImplicitlyCopyable`.
- **Reference iteration is immutable** unless you write `ref`:
  "When iterating a list by reference, you get immutable references to the
  actual elements, unless you specify `ref`".
- **Out-of-bounds access aborts**: `my_list[5]` aborts with
  "index 5 is out of bounds".

Source: <https://mojolang.org/docs/std/collections/list/List/>.

```mojo
var numbers = [10, 20, 30]   # a List here, because of the annotation below
for ref num in numbers:
    num += 1                 # mutates the list elements
print(numbers)               # [11, 21, 31]
```

Source: <https://mojolang.org/docs/std/collections/list/List/>.

### Methods worth knowing

`append`, `insert(i, value)`, `extend`, `pop()` / `pop(i)`, `reserve`,
`resize(length, fill)`, `shrink(new_length)`, `reverse`, `count`, `index`,
`try_index`, `clear`, `capacity()` and `swap_elements`. Source:
<https://mojolang.org/docs/std/collections/list/List/>.

```mojo
def main():
    var list = [1, 2, 3]
    list.append(4)                 # [1, 2, 3, 4]
    list.insert(1, 15)             # [1, 15, 2, 3, 4]
    print(list.pop())              # 4
    print(list.pop(1))             # 15
    print(list.capacity())         # current allocated capacity
    list.resize(4, 0)              # [1, 2, 3, 0]
    _ = list.pop(0)
    list.reverse()
```

Sources: <https://mojolang.org/docs/std/collections/list/List/> and
<https://mojolang.org/docs/manual/types/>.

### 1.0 renames to carry

- `List.capacity` is now a **method** `capacity()`, not a field. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- `resize(new_size=, value=)` → `resize(new_length=, fill=)`, and
  `shrink(new_size=)` → `shrink(new_length=)`. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- `insert()` no longer normalizes negative indices: the valid range is
  `[0, len(self)]`. Source: <https://mojolang.org/releases/v1.0.0/>.
- `steal_data()` is deprecated in favour of `unsafe_take_allocation()`. Source:
  <https://mojolang.org/docs/std/collections/list/List/>.

## `Dict` — key-value mapping

`Dict` stores key-value pairs with amortized O(1) insertion, lookup and
removal:

> It uses a Swiss Table implementation with SIMD group probing for fast
> lookups... Insertion order is implicitly preserved. Iteration over keys,
> values, and items have a deterministic order based on insertion.

Source: <https://mojolang.org/docs/std/collections/dict/>.

Its bounds are the important part:

> Key elements only need to be `Movable & Hashable & Equatable`. Methods that
> fundamentally need to copy keys (`copy`, `update`, `__or__`, `fromkeys`,
> iteration, ...) are conditionally available via
> `where conforms_to(K, Copyable)` clauses.
>
> Value elements only need to be `Movable & Deinitable`. Methods that
> fundamentally need to copy values (`copy`, `find`, `get`, `update`, `__or__`,
> `fromkeys`, iteration, ...) are conditionally available via
> `where conforms_to(V, Copyable)` clauses.

Source: <https://mojolang.org/docs/std/collections/dict/>.

The shorthand for that key bound is exported as `KeyElement`:

> `comptime KeyElement = Equatable & Hashable & Movable`

Source: <https://mojolang.org/docs/std/collections/dict/>.

```mojo
def main():
    var empty_dict: Dict[String, Float64] = {}
    var values: Dict[String, Float64] = {"pi": 3.14159, "e": 2.71828}

    values["tau"] = 6.28318                    # insert or update
    print(values.get("pi", default=-1.0))      # 3.14159
    print("pi" in values)                      # True
    print(values.pop("e"))                     # 2.71828
    print(len(values))                         # 2
```

Sources: <https://mojolang.org/docs/manual/types/> and
<https://mojolang.org/docs/std/collections/dict/>.

### Iteration

Three ways: iterate keys, iterate `items()`, or iterate `values()`. Each
iterator yields references by default:

```mojo
var capitals: Dict[String, String] = {
    "California": "Sacramento",
    "Hawaii": "Honolulu",
    "Oregon": "Salem"
}

for var state in capitals:
    print(t"{capitals[state]}, {state}")

for item in capitals.items():
    print(t"{item.value}, {item.key}")
```

Source: <https://mojolang.org/docs/manual/control-flow/>. The manual types page
notes that `Dict` iterators "all yield references, which are copied into the
declared name by default, but you can use the `ref` marker to avoid the copy."
Source: <https://mojolang.org/docs/manual/types/>. Iteration order is insertion
order, per the package page above.

By-reference iteration no longer requires `Deinitable` key or value types:
"These iterators only borrow references and never destroy an entry". Consuming
iteration (`for entry in dict^`) still requires `Deinitable`. Source:
<https://mojolang.org/releases/v1.0.0/>.

## `Set` — unique values

> The `Set` type represents a set of unique values. You can add and remove
> elements from the set, test whether a value exists in the set, and perform set
> algebra operations, like unions and intersections between two sets.

Source: <https://mojolang.org/docs/manual/types/>. Its element type must conform
to `KeyElement`, and its signature carries a hasher parameter with a default.
Source: <https://mojolang.org/docs/std/collections/set/Set/>.

```mojo
from std.collections import Set

def main():
    var i_like = {"sushi", "ice cream", "tacos", "pho"}
    var you_like = {"burgers", "tacos", "salad", "ice cream"}
    var we_like = i_like.intersection(you_like)

    print("We both like:")
    for item in we_like:
        print("-", item)
```

Source: <https://mojolang.org/docs/manual/types/>.

Set algebra is available through both named methods and operators. `Set`
implements `==`, `<`, `<=`, `>`, `>=` as subset/superset comparisons and
`|`, `&`, `-`, `^` as union, intersection, difference and symmetric difference,
with the matching in-place forms `|=`, `&=`, `-=`, `^=`. Source:
<https://mojolang.org/docs/std/collections/set/Set/>.

```mojo
from std.collections import Set

def main():
    var a = Set[Int](1, 2, 3)
    a.add(4)
    print(4 in a)                                  # True
    print(a | Set[Int](0, 1) == Set[Int](0, 1, 2, 3, 4))   # True
    print(a.issubset(Set[Int](1, 2, 3, 4, 5)))     # True
    print(a.isdisjoint(Set[Int](7, 8)))            # True
```

Source: <https://mojolang.org/docs/std/collections/set/Set/>.

### The import sharp edge

Set *displays* are core syntax; the `Set` *type* is not in the prelude. The
expressions reference calls this out directly:

> **Sharp edge: set displays are core Mojo syntax but the `Set` type is not**.
> You must import `Set` from the standard library to use it as a type:

```mojo
from std.collections import Set
from std.testing import assert_equal

def main() raises:
    var display_set = {1, 2, 3}        # a set with elements 1, 2, and 3
    assert_equal(len(display_set), 3)

    var empty_set = Set[Int]()         # an empty set
    empty_set.add(4)
    empty_set.add(4)
    assert_equal(len(empty_set), 1)    # sets do not allow duplicate elements
```

Source: <https://mojolang.org/docs/reference/expressions/>.

## `Tuple` — fixed size, heterogeneous

> Mojo's `Tuple` is a lightweight, fixed-size, heterogeneous collection with
> value semantics. A tuple contains zero or more comma-separated values,
> which may have different types. Although a tuple's structure (its size and
> element types) is fixed, individual elements can be mutated.

```mojo
var example_tuple = Tuple[Int, String](1, "Example")
var x, y = example_tuple       # destructuring
print(x, y)                    # 1 Example
print(example_tuple[1])        # Example
```

Source: <https://mojolang.org/docs/manual/types/>. The expression reference adds
the comma rule:

> A *tuple* is a fixed-size, ordered group of values. Commas create tuples,
> not parentheses.

```mojo
var a = 2, 3       # tuple without parentheses
var b = (2, 3)     # same tuple with parentheses
()                 # empty tuple
(1,)               # one-element tuple — the trailing comma matters
```

Source: <https://mojolang.org/docs/reference/expressions/>.

Tuple element types are the only place multiple concrete types coexist in one
value without `Variant`. When you need a *runtime-varying* one-of-many type,
use `Variant`:

> the [`Variant`] type can hold different types of values. For example, a
> `Variant[Int32, Float64]` can hold either an `Int32` *or* a `Float64` value at
> any given time.

Source: <https://mojolang.org/docs/manual/types/>. `Variant` requires an import
from `std.utils` and is covered by the [`utils` stdlib page](../stdlib/utils.md).

## `Span` — non-owning view

A `Span` is a view over contiguous data owned by someone else:

> `Span` is a non-owning view of contiguous data.

Source: <https://mojolang.org/docs/reference/types/>. Its module page states:

> A non-owning view of contiguous data.

Source: <https://mojolang.org/docs/std/collections/span/>.

A span is parameterized on the origin of its data, which is how the compiler
ties its lifetime to the owner. Slicing a `List` with a contiguous slice yields
a span:

```mojo
var items = [0, 1, 2, 3, 4, 5]
var middle = items[1:4]      # Span view, [1, 2, 3]
var strided = items[::2]     # new List, [0, 2, 4]
```

Source: <https://mojolang.org/docs/reference/types/>. The distinction is
explicit: "A contiguous `List` slice yields a `Span` view; a strided slice yields
a new `List`."

### 1.0 changes to `Span`

- `Span` moved from `std.memory.span` to `std.collections.span`. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- The `ptr=` constructor argument was renamed to `unsafe_ptr=`, "to flag that
  this construction path is memory-unsafe". Source:
  <https://mojolang.org/releases/v1.0.0/>.
- `MutSpan` and `ImmSpan` are exported from the prelude. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- `Span` gained a keyword-only `address_space` parameter (default
  `AddressSpace.GENERIC`). Source: <https://mojolang.org/releases/v1.0.0/>.

```mojo
var numbers = [1, 2, 3]
var more = [4, 5, 6]
numbers.extend(Span(more))    # copy from a Span
print(numbers)                # [1, 2, 3, 4, 5, 6]
```

Source: <https://mojolang.org/docs/std/collections/list/List/>.

### `StringSpan`

The text equivalent is `StringSpan`, covered in
[Bool and strings](bool-and-strings.md). The 1.0 rename is
`StringSlice` → `StringSpan` with the old name kept as a `comptime` alias.
Source: <https://mojolang.org/releases/v1.0.0/>.

## Choosing a container

| Need | Use | Why |
|------|-----|-----|
| Fixed count known at compile time | `Array[T, N]` | Inline storage, no heap allocation, compile-time size. |
| Growth and shrinking at runtime | `List[T]` | Heap-backed dynamic sequence. |
| Lookup by key | `Dict[K, V]` | Amortized O(1), insertion-ordered. |
| Membership / uniqueness | `Set[T]` | Amortized O(1); import required. |
| Fixed, heterogeneous fields | `Tuple` | One value with per-element types. |
| A value that may be absent | `Optional[T]` | See [Optionals and nullability](optionals-and-nullability.md). |
| Borrow a slice of someone else's data | `Span[T]` / `StringSpan` | Non-owning view, no copy. |
| One of several runtime types | `Variant[T, U, ...]` | Runtime type tag; import from `std.utils`. |

The official guidance on the `Array`/`List` split is the 1.0 note quoted above:
prefer `Array` for fixed-size values and let list expressions build one; reach
for `List` when you need to grow. Source:
<https://mojolang.org/releases/v1.0.0/>. The numeric-types guidance on scalar
versus vector is separate and covered in
[Integers and floats](integers-and-floats.md).

## Interior origins: references into a container

This is the 1.0 safety feature that changes how you write code holding
references to elements. A new experimental feature called *interior origins*
binds an element reference to the container's interior, so a mutation that
could reallocate invalidates the reference *at compile time* instead of leaving
it dangling:

> `List`, for example, now returns element references bound to an *interior
> origin* of the list instead of the whole-list origin, so mutating the list
> (with `append()` or `pop()`, for example) invalidates an element reference.
> The lifetime checker now correctly rejects code that holds an element
> reference across such a mutation, instead of letting it silently dangle after
> a reallocation:

```mojo
var list = [1, 2, 3]
ref elem = list[0]
list.append(4)  # may reallocate, so `elem` in invalidated
print(elem)     # error: use of invalidated interior reference
```

Source: <https://mojolang.org/releases/v1.0.0/>.

The types that adopted it: "`List`, `Deque`, `Variant`, `String`, `Dict`,
`LinkedList`, `OwnedPointer`, and `HostBuffer`". Source:
<https://mojolang.org/releases/v1.0.0/>.

A practical consequence is in the `List` slice API: a contiguous slice returns
a `Span` that "carries an interior origin derived from `self`, so any subsequent
mutation of the list (`append`, `pop`, and similar) invalidates it at compile
time." Source: <https://mojolang.org/docs/std/collections/list/List/>.

```mojo
def main():
    var list = [1, 2, 3]
    var view = list[0:2]     # Span with an interior origin
    print(len(view))         # 2
    # list.append(4)         # would invalidate `view`; the checker rejects use
```

## Literal and display syntax

The expression reference defines displays and gives the forms:

```mojo
var empty: List[Float32] = []
var numbers = [1, 2, 3]
var strings = ["one", "two", "three",]   # trailing comma allowed

var empty_dict: Dict[String, Int] = {}
var ages = {"Alice": 30, "Bob": 25}

var primes = {2, 3, 5, 7}                # set display
```

> Mojo allows trailing commas after all collection elements, including the
> final one.

Source: <https://mojolang.org/docs/reference/expressions/>.

Do not mix set and dictionary syntax:

```mojo
{"a": 1, 2}   # Error: expected 'key: value' in dictionary expression
{1, "b": 2}   # Error: cannot have a 'key: value' pair in set initializer
```

Source: <https://mojolang.org/docs/reference/expressions/>.

Brace syntax is also an **initializer list** that constructs an instance of an
inferred type, and the compiler resolves which of the three meanings applies
from the expected type:

```mojo
{x, y}           # set or initializer list, without context
{z=4, "foo"}     # initializer list with keyword argument

process({1, "hello"})   # type inferred from the signature
var x: T = {}           # type inferred from the declaration, calls T()
```

Source: <https://mojolang.org/docs/reference/expressions/>.

Comprehensions build collections too:

```mojo
var squares = [x * x for x in [0, 1, 2, 3, 4] if x % 2 == 0]   # [0, 4, 16]
var fibs = {fib(x) for x in range(6)}                            # a set
var dict_squares = {x: x * x for x in range(3)}                  # {0: 0, 1: 1, 2: 4}
```

Source: <https://mojolang.org/docs/reference/expressions/>.

Type inference from a literal initializer works with an explicit wildcard:

```mojo
var x: List[_] = [1, 2, 3]   # element type inferred
var y: List = [1.0, 2.0]     # element type inferred
```

Source: <https://mojolang.org/releases/v1.0.0/>.

> **Open question:** list expressions now construct `Array` by default, but the
> collection types can also be inferred from display context. The rules that
> pick `Array` versus `List` for a plain `var x = [...]` are stated as a default
> change in the release notes, while
> [expressions](../reference/expressions.md) describes displays without naming
> the constructed type. When the element type or the container type matters,
> annotate it. Sources:
> <https://mojolang.org/releases/v1.0.0/> and
> <https://mojolang.org/docs/reference/expressions/>.

## Iteration and mutation

The control-flow manual gives the conventions for loop variables, which is how
you choose copy, read-only reference or mutable reference:

> Use `var` and `ref` conventions to control ownership, copying, and
> mutability behavior in loop variables. By default, loop variables are
> immutable references to the iterated items (`imm`). To create a mutable
> copy, use `var`. To maintain value mutability, use `ref`:

```mojo
var list: List[String] = ["a", "b", "c", "d"]

for var item in list:
    item = item + "x"   # item is a mutable copy; the list is unchanged
print(list)             # ["a", "b", "c", "d"]

for ref item in list:
    item = item + "x"   # mutability picked up in a reference to the element
print(list)             # ["ax", "bx", "cx", "dx"]
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

Owned iteration consumes the container:

```mojo
var names = ["alice", "bob"]
for x in names^:       # moves the list into the loop
    print(x^)
# `names` is consumed and can no longer be used here
```

Source: <https://mojolang.org/docs/std/collections/list/List/>. Consuming
iteration always requires a `Deinitable` element, since the loop drops the
elements it does not yield. Source:
<https://mojolang.org/releases/v1.0.0/>. Loops and their `else`/`break`
interaction are covered on [Control flow](../basics/control-flow.md).

## Pitfalls

- **Assuming `[1, 2, 3]` is a `List`.** Since 1.0 a list expression constructs
  an `Array` by default. Annotate when you need a `List`. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Assuming a container copies implicitly.** `Array`, `List`, `Dict` and `Set`
  are not `ImplicitlyCopyable`; assignment without `.copy()` does not compile.
  Verified above.
- **Using negative indices.** Negative indexing was removed in 1.0 and is a
  compile-time error for a literal; write `x[len(x) - 1]` and guard the empty
  case. Source: <https://mojolang.org/releases/v1.0.0/>.
- **Slicing with an invalid range.** A contiguous slice with out-of-range or
  reversed start/end now aborts instead of clamping. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Holding a reference across a mutation.** The interior-origin checker rejects
  it, by design. Take the reference again after the mutation. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Reading `list.capacity` as a field.** It is `capacity()` now. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Calling `insert` with a negative index.** The valid range is
  `[0, len(self)]`; a negative index is out of bounds. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **`print(list)` on a `List`.** "You can't `print()` a list, or convert it
  directly into a string." Print the elements, or use a type that is
  `Writable`. Source: <https://mojolang.org/docs/manual/types/>.
- **Mixing element types in a `List`.** Every element must share one type; use
  `Variant` for a heterogeneous collection. Source:
  <https://mojolang.org/docs/std/collections/list/List/>.
- **Iterating a list and mutating through a copy.** A default loop variable is
  an immutable reference; `for var item in list` gives you a mutable *copy* and
  `for ref item in list` gives you the element. Verified above.
- **Forgetting to import `Set`.** The display `{1, 2}` needs no import; the type
  `Set[Int]` does. Verified above.
- **Writing `InlineArray` or `StringSlice` in new code.** Both are
  compatibility aliases; the 1.x names are `Array` and `StringSpan`. Verified
  above.

## Sources

- Mojo types reference: <https://mojolang.org/docs/reference/types/>
- Types (manual): <https://mojolang.org/docs/manual/types/>
- Mojo expressions reference: <https://mojolang.org/docs/reference/expressions/>
- Mojo compound statements reference: <https://mojolang.org/docs/reference/compound-statements/>
- Control flow (manual): <https://mojolang.org/docs/manual/control-flow/>
- Mojo `Array` API: <https://mojolang.org/docs/std/collections/array/Array/>
- Mojo `array` module: <https://mojolang.org/docs/std/collections/array/>
- Mojo `List` API: <https://mojolang.org/docs/std/collections/list/List/>
- Mojo `Dict` module: <https://mojolang.org/docs/std/collections/dict/>
- Mojo `Set` API: <https://mojolang.org/docs/std/collections/set/Set/>
- Mojo `span` module: <https://mojolang.org/docs/std/collections/span/>
- Mojo `collections` package: <https://mojolang.org/docs/std/collections/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
