# Anti-patterns

This page is about code that **compiles** but is wrong, slow, or fragile. Each
entry gives the situation, the anti-pattern, why it is wrong, and the idiomatic
replacement. The bar for inclusion is that the problem is real under documented
Mojo 1.x semantics — not a matter of taste.

Two facts make this page necessary. First, Mojo's defaults are value semantics,
explicit mutability and explicit destruction, so Python-shaped code often
compiles and then does something different from what it looks like. Second, Mojo
1.0 ships a migration safety net: "nearly every breaking change ships with a
deprecated alias and a compiler fix-it, so migration is mechanical" — which means
a great deal of wrong code still compiles with a warning. Source:
<https://mojolang.org/releases/v1.0.0/>.

## Unnecessary copies under value semantics

### Situation

You pass a large value to a function, or bind it to a new name, and you want
read-only access.

### Anti-pattern

```mojo
# Slow: takes an owned copy of the whole list.
def report(var data: List[Record]):
    print(len(data))

# Slow: binds an owned copy rather than a reference.
def print_all(items: List[String]):
    var copy = items        # Error: List is not implicitly copyable — unless
                            # the author "fixes" it with .copy()
    for item in copy:
        print(item)
```

### Why it is wrong

The default argument convention is already an immutable reference; switching to
`var` asks for ownership and therefore a copy:

> In general, passing an immutable reference is much more efficient when handling
> large or expensive-to-copy values, because the copy constructor and destructor
> aren't invoked for a default (immutable reference) argument.

Source: <https://mojolang.org/docs/manual/values/ownership/>. The default
behavior "requires no copies unless we explicitly make the copies ourselves."
Source: <https://mojolang.org/docs/manual/values/value-semantics/>.

### Idiomatic

```mojo
# Fast: read-only reference, no copy.
def report(data: List[Record]):
    print(len(data))

# Fast: iterate the original by reference.
def print_all(items: List[String]):
    for item in items:
        print(item)
```

If you genuinely need a mutable local copy, say so with `.copy()` — but that is a
deliberate cost, not a default.

## Reaching for `ImplicitlyCopyable` on an expensive type

### Situation

You wrote a struct that owns heap memory and you want `var b = a` to work.

### Anti-pattern

```mojo
# Wrong: makes an expensive, resource-owning type implicitly copyable.
@fieldwise_init
struct Buffer(ImplicitlyCopyable):
    var data: List[UInt8]
```

### Why it is wrong

The official guidance is strict:

> A type should be implicitly copyable only if copying the type is inexpensive and
> has no side effects. ... In particular, any type that dynamically allocates
> memory or manages other resources probably shouldn't be implicitly copyable.

Source: <https://mojolang.org/docs/manual/lifecycle/life/>. And for collections:
`Array` "no longer conforms to `ImplicitlyCopyable`, since it is not inherently
cheap to copy. It continues to conform to `Copyable`." Source:
<https://mojolang.org/releases/v1.0.0/>. Marking such a type
`ImplicitlyCopyable` reintroduces exactly the accidental deep copies that 1.0
removed.

### Idiomatic

```mojo
@fieldwise_init
struct Buffer(Copyable):
    var data: List[UInt8]

# Explicit at the call site:
var b = a.copy()
```

## Fighting the borrow checker with unsafe origins

### Situation

The lifetime checker rejects your code because you hold a reference across a
mutation or an aliasing edge, and you want it to stop.

### Anti-pattern

```mojo
# Wrong: a wildcard origin silences the checker and disables its guarantees.
var p = Pointer[Int, MutUnsafeAnyOrigin](...)
```

### Why it is wrong

The docs give a three-part warning:

> Using a pointer with a wildcard origin into a scope effectively disables Mojo's
> ASAP destruction for any values in that scope, as long as the pointer is live.
> It also prevents Mojo from enforcing argument exclusivity and hides unused
> variable warnings. Accordingly, the use of wildcard origins is discouraged, and
> should be used as a last resort.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

### Idiomatic

Take the reference again after the mutation, or restructure so the borrow does
not overlap:

```mojo
# Wrong pattern the checker catches:
var list = [1, 2, 3]
ref elem = list[0]
list.append(4)      # error: use of invalidated interior reference
print(elem)

# Right: re-acquire the reference after the mutation.
list.append(4)
print(list[0])
```

The rejection is the feature:

> `List`, for example, now returns element references bound to an *interior
> origin* of the list instead of the whole-list origin, so mutating the list ...
> invalidates an element reference. The lifetime checker now correctly rejects
> code that holds an element reference across such a mutation, instead of letting
> it silently dangle after a reallocation.

Source: <https://mojolang.org/releases/v1.0.0/>.

## Using unstable APIs casually

### Situation

You found a feature that works and you want to build on it.

### Anti-pattern

Depending on any of these without checking stability:

- `async`/`await` (explicitly unstable).
- Anything with a leading double underscore: `__mlir_type`, `__mlir_op`,
  `__mlir_attr`, `__generator_type`.
- Internal dunder power features: `__merge_with__()`, `__list_literal__()`,
  `__literal_size__()`.
- Decorators named `@__...`, and the legacy `@parameter` / `@__copy_capture`.
- **Any** standard-library API you have not checked for a stable marker,
  because standard-library APIs are unstable unless marked stable.

### Why it is wrong

> We consider standard library APIs **unstable** unless we explicitly identify
> them as stable. ... Stability guarantees apply to source code only; the Mojo
> ABI is currently not stable. Unstable features can change at any point.

Source: <https://mojolang.org/docs/api-docs/stability/>. On the double-underscore
features:

> Avoid using any language feature with a leading double underscore (`__`) unless
> the manual explicitly documents it as stable.

> Consider any decorators beginning with `@__` as internal and unstable, unless
> the manual explicitly documents them as public.

> Lastly, Mojo's async system isn't fully built out. So although the `async` and
> `await` keywords aren't prefixed, consider them unstable as well.

Source: <https://mojolang.org/docs/api-docs/stability/>.

### Idiomatic

Use the documented stable surface: `def`, `struct`, `trait`, `var`, the core
traits, and the documented standard-library APIs. When you must cross into an
unstable API, isolate it behind one small wrapper so a future release changes
one file. The compiler can remind you:

```sh
mojo run --warn-on-unstable-apis app.mojo
```

The official caveat is that this is noisy today: "We don't currently recommend
this because the stable API set is small." Source:
<https://mojolang.org/docs/api-docs/stability/>.

## Ignoring `raises`

### Situation

You call a function that can raise, and you want the code to stay simple.

### Anti-pattern

```mojo
# Wrong: bare `raises` on a typed-error API.
def process(value: Int) raises -> Int:
    return validate_typed(value)

# Wrong: treating assert like a catchable error.
def parse(text: String) -> Int:
    assert len(text) > 0, "empty"   # aborts; it is not a `raise`
    return Int(text)

# Wrong: mixing error types in one try block.
try:
    _ = error_func()    # raises Error
    _ = typed_func()    # raises ValidationError
except e:
    print(e)
```

### Why it is wrong

- Bare `raises` causes **type erasure**: "the compiler forgets the specific
  error type ... the caller ... receives an `Error`, not a `ValidationError`",
  and field access is lost. Source:
  <https://mojolang.org/docs/manual/errors/>.
- `assert` "aborts if a condition is false (gated by `-D ASSERT`)"; it is a
  program-invariant statement, not a recoverable error, and it is not caught by
  `try`/`except`. Source: <https://mojolang.org/docs/reference/keywords/>.
- A `try` block "handles one error type. The compiler raises an error if code in
  the `try` block can raise more than one error type." Source:
  <https://mojolang.org/docs/reference/compound-statements/>.

### Idiomatic

```mojo
# Name the error type so the caller keeps structure.
def process(value: Int) raises ValidationError -> Int:
    return validate_typed(value)

# Use separate try blocks for different error types.
try:
    _ = error_func()
except e:
    print(e)

try:
    _ = typed_func()
except e:
    print(e.field, e.reason)
```

## Python habits that mislead

### Situation

You are porting Python, or writing Mojo the way you would write Python.

### Anti-pattern and fix

| Python habit | Why it misleads in Mojo | Idiomatic Mojo |
|--------------|-------------------------|----------------|
| `b = a` shares a list | Assignment is value-semantic: it copies or transfers | `ref b = a` for sharing; `.copy()` for a deliberate copy |
| Implicit declaration `x = 0` | Deprecated in 1.0 with a fix-it | `var x = 0` |
| Mixing types in a list | Collections are statically typed, one element type | `List[Variant[Int, String]]` |
| `/` returns a float | `/` returns the operand type and truncates toward zero | `Float64(a) / Float64(b)` |
| `a[-1]` | Negative indexing removed in 1.0 | `a[len(a) - 1]`, guard the empty case |
| `try/except ValueError as e:` | `except` binds one inferred error type; `as` is removed | `except e:` with a typed `raises` |
| `class` + inheritance | Structs are static and have no inheritance | `struct` + traits |
| Mutating an argument | Arguments are immutable references by default | declare `mut` |
| `__del__` | Renamed | `__deinit__` |
| `fn` | An error in 1.x | `def` |

Sources: <https://mojolang.org/docs/manual/python-to-mojo/>,
<https://mojolang.org/releases/v1.0.0/>,
<https://mojolang.org/docs/manual/variables/> and
<https://mojolang.org/docs/reference/function-declarations/>.

A worked example of the first row, because it is the most disruptive:

```mojo
# Python-shaped and wrong:
var a: List[Int] = [1, 2, 3]
var b = a             # Error: List is not implicitly copyable
b.append(4)

# Idiomatic: pick the semantics you meant.
var c = a.copy()      # independent copy
ref d = a             # shared reference
```

The Python-to-Mojo guide states the rule the table encodes: "Mojo prefers *value
semantics* and explicit mutability. In Python, most objects are mutable
references, so assigning a list doesn't copy it. In Mojo, assigning or passing a
value typically creates an independent copy." Source:
<https://mojolang.org/docs/manual/python-to-mojo/>.

## Over-parameterizing

### Situation

You want a function or type to be maximally reusable, so you parameterize
everything and constrain it heavily.

### Anti-pattern

```mojo
# Wrong: value parameter for something only known at runtime.
def fixed[size: Int]():
    var buf = List[Int](capacity=size)

# Wrong: type parameters where the type is fixed.
def add_int[T: Intable, U: Intable](a: T, b: U) -> Int:
    return Int(a) + Int(b)

# Wrong: constraints the body never uses.
def count[T: Writable & Deinitable](items: List[T]) -> Int:
    return len(items)
```

### Why it is wrong

Three documented reasons:

1. **A value parameter is for what the caller knows at compile time.** The
   decision rule is explicit: "Ask yourself: does the caller know this value when
   writing the code? If yes, use a parameter. If it depends on input, files, or
   runtime state, use an argument." Source:
   <https://mojolang.org/docs/manual/generics/>.
2. **Each parameter creates a specialized copy.** "The compiler resolves the
   parameter values during compilation, and creates a concrete version of the
   `repeat[]()` function for each unique parameter value." Source:
   <https://mojolang.org/docs/manual/parameters/>. Parameterizing on runtime
   inputs multiplies code for no benefit.
3. **Unused constraints shrink the acceptable type set.** "Adding constraints
   restricts which types you accept, but expands what your code can do." An
   unused constraint only restricts. Source:
   <https://mojolang.org/docs/manual/generics/>.

### Idiomatic

```mojo
# Runtime-determined size: an argument.
def dynamic(size: Int):
    var buf = List[Int](capacity=size)

# A fixed shape: parameters, used in the type.
def fixed[size: Int]():
    var buf = Array[Int, size](fill=0)

# Only the constraints the body uses.
def count[T: Copyable](items: List[T]) -> Int:
    return len(items)
```

Keep the parameter set minimal and meaningful: "Use the fewest constraints your
code needs. This keeps your function usable with more types." Source:
<https://mojolang.org/docs/manual/generics/>.

## Misusing lifecycle machinery

### Situation

You are writing a struct that owns a resource, and you reach for lifecycle hooks.

### Anti-patterns

```mojo
# Wrong: a shallow copy constructor on a heap-owning type.
def __init__(out self, *, copy: Self):
    self.data = copy.data          # copies the pointer, not the contents

# Wrong: calling the destructor explicitly.
resource.__deinit__()

# Wrong: assuming dealloc() destroys the pointees.
dealloc(allocation^)               # pointees leak their own resources

# Wrong: relying on end-of-scope destruction.
var handle = open(path, "r")       # destroyed at last use, not at scope end
```

### Why they are wrong

- The compiler does not enforce deep copies: "the Mojo compiler doesn't enforce
  this, so it's the type author's responsibility to implement copy constructor
  with value semantics." Source:
  <https://mojolang.org/docs/manual/lifecycle/life/>.
- "If you need to ensure that a destructor is called at a specific point, use
  the discard pattern" — do not call the destructor yourself. Source:
  <https://mojolang.org/docs/manual/lifecycle/death/>.
- "Note that a pointer doesn't *own* any values in the memory it points to, so
  when a pointer is destroyed, Mojo doesn't call the destructors on those
  values." Source: <https://mojolang.org/docs/manual/lifecycle/death/>.
- "Mojo does *not* wait until the end of a code block — or even until the end of
  an expression — to destroy an unused value." Source:
  <https://mojolang.org/docs/manual/lifecycle/death/>.

### Idiomatic

```mojo
@fieldwise_init
struct HeapArray(Deinitable):
    var data: ThinAllocation[Int]
    var size: Int

    def __deinit__(deinit self):
        var ptr = self.data.unsafe_ptr()
        for i in range(self.size):
            ptr.unsafe_offset(i).unsafe_deinit_pointee()
        dealloc(self.data^.unsafe_with_layout({count = self.size}))
```

Use `_ = x` as the documented explicit last-use marker when you need to control
destruction timing:

```mojo
var t = "xyz"
print(t)
_ = t        # t is destroyed after this line
```

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

### Wrong: `@explicit_destroy` without a message

In 1.0, the current opt-out is `Deinitable where False`, and using
`@explicit_destroy` without an error-string argument is an error. Source:
<https://mojolang.org/releases/v1.0.0/>.

```mojo
# 1.x
@explicit_destroy("Must call save_and_close() or discard()")
struct FileBuffer(Deinitable where False):
    ...
```

## Micro-optimizing before measuring

### Situation

You want the code to be fast, so you sprinkle performance decorators and
compile-time unrolling everywhere.

### Anti-pattern

```mojo
# Wrong: unrolling a large body at compile time.
comptime for i in range(1000):
    process(i)

# Wrong: forcing inlining of a large function at every call site.
@always_inline
def big_pipeline(data: List[Float64]) -> Float64:
    ...
```

### Why it is wrong

- `comptime for` "unrolls at the beginning of compilation, which can greatly
  expand both the code size and the compilation time"; the docs say to "generally
  use this only for loops with small loop bodies and low iteration counts."
  Source: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.
- `@always_inline` "can increase the binary size by duplicating the function at
  every call site", and `@no_inline` exists precisely because "too many inlined
  functions can slow compilation and substantially increase the binary size".
  Sources: <https://mojolang.org/docs/reference/decorators/always-inline/> and
  <https://mojolang.org/docs/reference/decorators/no-inline/>.

### Idiomatic

Write the straightforward version first, measure, and only then make a targeted
change. The performance-idioms page covers when the compiler already does the
work for you: see [performance idioms](performance-idioms.md).

## Pitfalls

- **Taking `var` for a read-only argument.** It copies a large value when the
  default would not. Verified above.
- **Marking a heap-owning type `ImplicitlyCopyable`.** It reintroduces accidental
  deep copies. Verified above.
- **Silencing the lifetime checker with wildcard origins.** It disables ASAP
  destruction, exclusivity checking and unused-variable warnings. Verified above.
- **Depending on `async`/`await` or `__`-prefixed features.** Explicitly
  unstable, with no stability guarantee. Verified above.
- **Assuming an unmarked stdlib API is stable.** Standard-library APIs are
  unstable unless marked stable. Verified above.
- **Bare `raises` on a typed-error API.** It erases the error type at compile
  time. Verified above.
- **Using `assert` for a recoverable failure.** It aborts; it does not raise.
  Verified above.
- **Mixing error types in one `try`.** The compiler rejects it. Verified above.
- **Assuming assignment aliases.** Value semantics means copy or transfer;
  containers are explicitly copyable only. Verified above.
- **Writing `x[-1]`.** Negative indexing is a compile-time error in 1.x. Verified
  above.
- **Over-constraining a generic.** Every unused trait narrows the type set for no
  benefit. Verified above.
- **Parameterizing on a runtime value.** It specializes code per value for no
  compile-time benefit. Verified above.
- **Writing a shallow copy constructor for an owning type.** The compiler will
  not catch it. Verified above.
- **Calling `__deinit__()` by hand.** Use the discard pattern instead. Verified
  above.
- **Assuming `dealloc()` destroys pointees.** It does not; call
  `unsafe_deinit_pointee()` per element. Verified above.
- **Unrolling a large `comptime for`.** It expands code size and compile time.
  Verified above.
- **Putting `@always_inline` on everything.** It bloats the binary. Verified
  above.

## Sources

- Mojo manual — Python-to-Mojo: <https://mojolang.org/docs/manual/python-to-mojo/>
- Mojo manual — Value semantics: <https://mojolang.org/docs/manual/values/value-semantics/>
- Mojo manual — Ownership: <https://mojolang.org/docs/manual/values/ownership/>
- Mojo manual — Lifetimes, origins and references: <https://mojolang.org/docs/manual/values/lifetimes/>
- Mojo manual — Value creation and destruction: <https://mojolang.org/docs/manual/lifecycle/life/> ; <https://mojolang.org/docs/manual/lifecycle/death/>
- Mojo manual — Errors: <https://mojolang.org/docs/manual/errors/>
- Mojo manual — Parameters and generics: <https://mojolang.org/docs/manual/generics/>
- Mojo manual — Parameterization: <https://mojolang.org/docs/manual/parameters/>
- Mojo manual — Compile-time evaluation: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>
- Mojo manual — Variables: <https://mojolang.org/docs/manual/variables/>
- Mojo reference — Compound statements: <https://mojolang.org/docs/reference/compound-statements/>
- Mojo reference — Keywords and conventions: <https://mojolang.org/docs/reference/keywords/>
- Mojo reference — `@always_inline`: <https://mojolang.org/docs/reference/decorators/always-inline/>
- Mojo reference — `@no_inline`: <https://mojolang.org/docs/reference/decorators/no-inline/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
