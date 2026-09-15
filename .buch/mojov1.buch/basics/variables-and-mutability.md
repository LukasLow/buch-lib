# Variables and mutability

How Mojo binds names to values: `var` for a variable, `ref` for a reference
binding, how mutability works, how scope and shadowing work, and how types are
inferred or annotated.

## What a variable is

> A variable is a name that holds a value or object. All variables in Mojo are
> mutable by default. Their value can change.

Source: <https://mojolang.org/docs/manual/variables/>.

A `var` declaration does three things at once:

> - It declares a logical storage location, which is tied to a particular type.
> - It binds the name `greeting` to this logical storage location.
> - It *initializes* the storage space with a newly created `String` value...
>   The new value is *owned by* the variable.

Source: <https://mojolang.org/docs/manual/variables/>.

```mojo
def main():
    var greeting: String = "Hello World"
    print(greeting)
```

## Declaring with `var`

Use `var` with a name. You may give a value, a type annotation, or both:

> The more you annotate, the more explicit your code is, and the easier it is to
> read and maintain.

```mojo
var a = 5              # Mojo infers that a is type Int
var b: Float64 = 3.14  # Explicit declaration of Float64 type
var c: String          # The name is created but uninitialized
```

Source: <https://mojolang.org/docs/manual/variables/>.

A `var` with neither a type nor an initializer is an error, and a `var` with a
type but no initializer is created uninitialized (you must assign before use):

```mojo
# var x        # Error: declaration must have either a type or an initializer
var x: Int     # OK: type provided, value uninitialized
var y = 42     # OK: type inferred from initializer
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

Use an explicit annotation when the type is not obvious, or when you want the
compiler to catch a wrong value. The annotation is also how you write a
long-lived binding for a value produced elsewhere.

## Variables are mutable by default

> All variables in Mojo are mutable by default. Their value can change.

Source: <https://mojolang.org/docs/manual/variables/>.

```mojo
def main():
    var count = 0
    count += 1
    count += 1
    print(count)   # 2
```

Mutation means assigning a **new value of the same type**. It never changes the
variable's type, which is fixed at compile time:

> A variable's type never changes. Its storage is strongly typed upon creation
> and can only hold values of that type:

```mojo
var count = 8        # count is type Int
count = "Nine?"      # Error: can't implicitly convert 'StringLiteral' to 'Int'
```

Source: <https://mojolang.org/docs/manual/variables/>.

To define a value that cannot change at runtime, the manual points to the
`comptime` keyword (see [Compile-time constants](#compile-time-constants-comptime))
or a non-mutable function argument. Source:
<https://mojolang.org/docs/manual/variables/>.

## The static-typing rule

This is the core rule of the page, quoted officially:

> Mojo variables are statically typed: that is, Mojo sets a variable's type at
> compile time, and the type doesn't change at runtime. If you don't specify a
> type, Mojo uses the type of the first value assigned to the variable.

Source: <https://mojolang.org/docs/manual/basics/>.

And from the types reference:

> Mojo is statically typed. Every value has a type that is known at compile
> time.

Source: <https://mojolang.org/docs/reference/types/>.

The Python-to-Mojo guide frames why this matters:

> Mojo is statically typed. In Python, types are optional hints that the
> interpreter *mostly* ignores at runtime. In Mojo, types are first-class. The
> compiler uses them to generate fast, specialized machine code.

Source: <https://mojolang.org/docs/manual/python-to-mojo/>.

## Inference versus explicit annotation

If you omit the type, Mojo infers it from the initializer. Numeric literals
materialize to defaulting runtime types:

```mojo
var float1 = 3.3          # float1 is type Float64
var float2: Float32 = 7.5 # explicit narrower float
var int1 = 5              # int1 is type Int
var int2: Int8 = 4        # explicit narrower int
```

Source: <https://mojolang.org/docs/manual/types/>.

You can also infer a collection's element type from a literal initializer:

```mojo
var x: List[_] = [1, 2, 3]   # element type inferred
var y: List = [1.0, 2.0]     # element type inferred
```

Source: <https://mojolang.org/releases/v1.0.0/>.

The trade-off, from the manual: "The more you annotate, the more explicit your
code is, and the easier it is to read and maintain." Source:
<https://mojolang.org/docs/manual/variables/>. Annotate at API boundaries and
where inference would pick a type you do not intend; let inference handle the
obvious local cases.

## Scope

Mojo uses lexical scoping — a name's meaning is determined by where it appears
in the source, not when it runs:

> Variables in Mojo use *lexical scoping*. A variable's definition is determined
> by where it appears in the source code, not when it executes at runtime.

> Variables have **block-level** scope. Nested code can read and modify
> variables defined in an outer scope. An outer scope can't read variables
> defined in an inner scope.

Source: <https://mojolang.org/docs/manual/variables/>.

Every compound-statement body creates a new scope:

```mojo
def f():
    if True:
        var x = 10
    # print(x)   # Error: x is not in scope
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

A variable's value is destroyed at its last use, and the variable itself is
destroyed when its scope ends:

> Its value is destroyed at last use. You may transfer a value from a variable
> so it no longer lives in that variable or that scope. The name, that is, the
> variable itself, is destroyed when the scope ends.

Source: <https://mojolang.org/docs/manual/variables/>.

## Shadowing

Declaring a `var` with a name already bound in an outer scope creates a **new**
variable that hides the outer one. The manual's example, with its output:

```mojo
def lexical_scopes():
    var num = 1
    var dig = 1
    if num == 1:
        print("num:", num)  # Reads the outer-scope "num"
        var num = 2         # Creates new inner-scope "num"
        print("num:", num)  # Reads the inner-scope "num"
        dig = 2             # Updates the outer-scope "dig"
    print("num:", num)      # Reads the outer-scope "num"
    print("dig:", dig)      # Reads the outer-scope "dig"
```

```output
num: 1
num: 2
num: 1
dig: 2
```

> Note that the `var` statement inside the `if` creates a **new** variable with
> the same name as the outer variable... This is called "variable shadowing,"
> where the inner scope variable hides or "shadows" a variable from an outer
> scope. The lifetime of the inner `num` ends exactly where the `if` code block
> ends.

Source: <https://mojolang.org/docs/manual/variables/>.

Note the contrast in the same block: `dig = 2` (no `var`) assigns the outer
variable, while `var num = 2` shadows it. That distinction is exactly why 1.x
requires `var`.

## Reference bindings with `ref`

Some APIs return references to values owned elsewhere. Assigning such a result
to a `var` **copies** it (or errors if the type is not copyable); to keep the
reference, bind it with `ref`:

```mojo
def main():
    var items: List[Int] = [99, 77, 33, 12]

    var item = items[1]   # item is a copy of items[1]
    item += 1
    print(items[1])       # 77  (unchanged)

    ref item_ref = items[1]  # item_ref is a reference to items[1]
    item_ref += 1
    print(items[1])          # 78  (changed through the reference)
```

Source: <https://mojolang.org/docs/manual/variables/>.

Reference bindings cannot be re-assigned: they bind to one location for their
lifetime.

```mojo
ref item_ref = items[2]  # error: invalid redefinition of item_ref
```

Source: <https://mojolang.org/docs/manual/variables/>.

For Python developers, the mental shift is explicit:

> To use Python-like reference behavior, declare `b` with `ref` instead of
> `var`.

```mojo
var a: List[Int] = [1, 2, 3]
ref b = a     # b is a reference to the same value
b.append(4)   # The list updates. a still owns the list.
print(a)      # [1, 2, 3, 4]
```

Source: <https://mojolang.org/docs/manual/python-to-mojo/>.

`ref` is also a **keyword** in declarations (see
[`keywords/index`](../keywords/index.md)); it is separately documented as a
convention in `keyword-conventions/ref.md` (planned, not written yet).

## Copying versus transferring on assignment

Assignment of an existing value copies it or transfers ownership, depending on
the type and on the transfer sigil `^`:

```mojo
var source = String("Hello")
var copied = source   # A copy
var moved = source^   # A transfer
```

> A transfer leaves `source` uninitialized, and you can't use it again until you
> assign it a new value.

Source: <https://mojolang.org/docs/manual/variables/>.

Not every type may be copied implicitly. In 1.0 the default is *explicit* copy:

```mojo
var first: List[Int] = [1, 2, 3]
var second = first  # error: 'List[Int]' is not implicitly copyable because
                    # it doesn't conform to 'ImplicitlyCopyable'

var second = first.copy()   # explicit copy
var second = first^         # or transfer ownership
```

Source: <https://mojolang.org/docs/manual/variables/>. The split between
`Copyable` and `ImplicitlyCopyable` was overhauled in 0.25.6 and became
fundamental in 1.0; `Array` in particular no longer conforms to
`ImplicitlyCopyable`. Source: <https://mojolang.org/releases/v1.0.0/>.

Implicitly copyable types are the simple value types:

> Implicitly copyable types are generally simple value types like `Int`,
> `Float64`, and `Bool`, which can be copied trivially.

Source: <https://mojolang.org/docs/manual/variables/>.

## Compile-time constants: `comptime`

To name a value that cannot change at runtime, Mojo provides the `comptime`
keyword. The manual's variables page points here for constants, and the
`comptime` evaluation page defines it:

```mojo
comptime rows = 512
comptime SIZE = 1024 // 32
```

> A `comptime` value is always evaluated at compile time, so you can use
> `comptime` to force a function to run at compile time.

Source: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

Compile-time aliases are a common use — naming a type for reuse:

```mojo
comptime Vec3 = List[Float64]
var position: Vec3 = [0.0, 0.0, 0.0]
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

> **Open question:** older Mojo code spells compile-time constants `alias`, and
> the `comptime` keyword was introduced as "a synonym for `alias`" in v0.25.7
> (<https://mojolang.org/releases/v0.25.7/>). In 1.x the documented spelling is
> `comptime` — the official keywords reference does **not** list `alias` as a
> keyword at all. This book therefore teaches `comptime` and files `alias` under
> [`keyword-conventions/alias.md`](../keyword-conventions/alias.md) rather than
> presenting it as a current reserved word. Verify against the next upstream
> release.

## Pitfalls

- **Leaving out `var`.** Declaring without `var` is deprecated and warns with a
  fix-it that inserts it. Always write `var` (see the next section). Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Changing a variable's type.** Assignment can change the *value*, never the
  *type*: `var count = 8` then `count = "Nine?"` is a compile error. Verified
  above.
- **Assuming assignment shares.** In Python, `b = a` makes `b` another name for
  the same list. In Mojo, assignment copies or transfers; it does not alias. Use
  `ref` when you want a shared reference. Verified above.
- **Relying on implicit copies of collections.** `List`, `Dict`, `Array` and
  friends are not `ImplicitlyCopyable` in 1.0. Write an explicit `.copy()` or
  transfer with `^`. Verified above.
- **Re-assigning a `ref` binding.** A reference binding is fixed to its target:
  `ref x = ...` twice is an error. Use a new name. Verified above.
- **Expecting inner-scope names to leak.** Block-level scoping means a `var`
  declared inside an `if`/`for` body is gone when the body ends. Verified above.
- **`var` at module scope.** Put `var` declarations inside a function; module
  scope holds declarations, imports and `comptime` values. Verified above
  (<https://mojolang.org/docs/reference/simple-statements/>).
- **Assuming a variable is immutable after `var`.** `var` bindings are mutable
  by default. Use `comptime` or a non-mutable argument for a constant. Verified
  above.

## The deprecated implicit declaration form

The one pre-1.0 spelling that survives here is the **implicit declaration**: a
first assignment to a bare name without `var`. It is **deprecated**.

> All variable declarations should use `var`. Implicit variable declarations are
> deprecated, and now warn with a fix-it that inserts `var`:

```mojo
x = 0        # implicit declaration of 'x' is deprecated; add 'var' before the name
var x = 0    # Fixed; no warning
```

> Every first assignment to a name warns, `:=` walrus targets and a bare
> `x: T` annotation included. Binding forms that already spell out how they bind
> are unaffected: `for` targets, `with ... as`, `except ... as`, comprehension
> targets, and the `_` discard.

Source: <https://mojolang.org/releases/v1.0.0/>.

This book never teaches the implicit form. It is listed here only as a migration
step: if you see a bare `x = 0` that is meant to *declare* `x`, add `var`. The
full migration record lives in [`versions/1.0.0`](../versions/1.0.0.md).

## Sources

- Variables (manual): <https://mojolang.org/docs/manual/variables/>
- Mojo language basics (manual): <https://mojolang.org/docs/manual/basics/>
- Mojo tips for Python devs (manual): <https://mojolang.org/docs/manual/python-to-mojo/>
- Get started with Mojo (manual): <https://mojolang.org/docs/manual/get-started/>
- Compile-time evaluation (manual): <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>
- Mojo types reference: <https://mojolang.org/docs/reference/types/>
- Mojo simple statements reference: <https://mojolang.org/docs/reference/simple-statements/>
- Mojo compound statements reference: <https://mojolang.org/docs/reference/compound-statements/>
- Mojo identifiers, keywords, and conventions reference: <https://mojolang.org/docs/reference/keywords/>
- Mojo v0.25.7 release notes: <https://mojolang.org/releases/v0.25.7/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
