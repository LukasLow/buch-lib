# Inline MLIR

This page is the **complete formal reference** for Mojo's inline MLIR built-ins,
mirroring `/docs/reference/inline-mlir/`. It is the book's one **escape hatch**
page: inline MLIR is not ordinary Mojo, it is direct access to the compiler's
intermediate representation. Use it when Mojo does not expose an operation you
need, and only then. Nothing else in this buch uses it; the tour pages never
require it.

> **Stability warning:** the `pop`, `kgen`, `co` and `lit` dialects are *internal
> implementation details of the compiler and may change without notice*. Inline
> MLIR is an unstable, low-level surface, not a stable API. Built-in dialects such
> as `index` are also available. Source:
> <https://mojolang.org/docs/reference/inline-mlir/>.

## What inline MLIR is for

> Mojo is built on [MLIR](https://mlir.llvm.org/) and exposes it directly to
> developers. When you need an operation that Mojo doesn't surface, such as
> hardware intrinsics, atomic memory orderings, or custom dialect operations, you
> can write the MLIR operation yourself instead of waiting for a language feature.
>
> MLIR (Multi-Level Intermediate Representation) is a compiler framework in the
> LLVM project. It models programs with custom, layered dialects that represent
> data flow, loops, and hardware-specific operations. These dialects are
> translated step by step into LLVM IR and then into machine code.

Source: <https://mojolang.org/docs/reference/inline-mlir/>.

> **Honest framing:** the reference page itself demonstrates inline MLIR with
> `42 + 8`, which you could write in plain Mojo. The point is not that the
> arithmetic is useful; it is that inline MLIR is the documented route to
> operations the language does not expose yet, such as NVVM barriers, AMD matrix
> multiplies, and target-specific address spaces. Treat it as a last resort: it
> locks your code to specific compiler internals. Source:
> <https://mojolang.org/docs/reference/inline-mlir/>.

## Hello MLIR

> This example shows a minimal Mojo-MLIR program at the level of a "Hello World"
> implementation. It creates two MLIR index constants, adds them, and converts
> the result back to Mojo's `Int`:

```mojo
def main():
    var a: __mlir_type.index = __mlir_attr.`42 : index`
    var b: __mlir_type.index = __mlir_attr.`8 : index`
    var c = __mlir_op.`index.add`(a, b)
    print(Int(mlir_value=c))  # 50
```

> These built-ins work together:
>
> - `__mlir_type` sets the variable's MLIR type.
> - `__mlir_attr` provides a compile-time constant.
> - `__mlir_op` runs an MLIR operation.
>
> `Int(mlir_value=...)` converts the raw MLIR value back into Mojo.

Source: <https://mojolang.org/docs/reference/inline-mlir/>.

## The four built-in identifiers

| Built-in | Purpose | Produces |
|----------|---------|----------|
| `__mlir_type` | Reference an MLIR type | A type |
| `__mlir_attr` | Reference an MLIR attribute | Compile-time value |
| `__mlir_op` | Invoke an MLIR operation | Runtime value or `None` |
| `__mlir_region` | Define a single-block region | Statement (no value) |

> Types and attributes support two forms: dot/backtick syntax for simple names
> and bracket syntax for parameterized construction.

Source: <https://mojolang.org/docs/reference/inline-mlir/>.

## `__mlir_type`

> The `__mlir_type` built-in lets you define MLIR types directly in Mojo. You can
> use these types in variable declarations, parameter lists, and `comptime`
> aliases, just as you'd use built-in types like `Float64` or
> `UnsafePointer[Int]`.

> **Open question:** the official inline-MLIR page still writes
> `UnsafePointer[Int]` in this sentence, but 1.0.0 unified `UnsafePointer` into
> the single `Pointer` type (with unsafety marked per operation via `unsafe_*`
> names). The quotation above is kept verbatim; read `UnsafePointer[Int]` as
> today's `Pointer[Int]`. Source:
> <https://mojolang.org/releases/v1.0.0/>. See
> [`versions/1.0.0`](../versions/1.0.0.md).

### Dot and backtick syntax

> For simple type names that are valid identifiers, use dot syntax. Use backticks
> when the name includes special characters like `!`, `<`, or `>`:

```mojo
var x: __mlir_type.i1                  # 1-bit integer
var y: __mlir_type.index               # Machine-width index
var z: __mlir_type.f64                 # 64-bit float
var a: __mlir_type.`!kgen.none`        # Dialect type with ! prefix
var b: __mlir_type.`!kgen.scalar<f64>`  # Pop dialect scalar
var c: __mlir_type.`!kgen.pointer<!kgen.pointer<f32>>`
    # Nested pointer
```

| MLIR name | Meaning |
|-----------|---------|
| `i1` | 1-bit integer (boolean) |
| `i8` | 8-bit signless integer |
| `i32` | 32-bit signless integer |
| `i64` | 64-bit signless integer |
| `si32` | 32-bit signed integer |
| `si64` | 64-bit signed integer |
| `ui32` | 32-bit unsigned integer |
| `f16` | 16-bit float (IEEE half) |
| `bf16` | 16-bit bfloat |
| `f32` | 32-bit float |
| `f64` | 64-bit float |
| `index` | Machine-width integer for sizes and offsets |

> "Signless" means the type itself doesn't specify signed or unsigned. The
> operation using the value decides how to interpret it. The `s` and `u` prefixed
> variants (`si32`, `ui64`) carry signedness in the type.
>
> Dialect-defined MLIR types use the `!` prefix. Without it, the compiler rejects
> the type with an error like:

```text
invalid MLIR type: kgen.dtype
```

> Use ``__mlir_type.`!kgen.dtype` `` instead.

```mojo
def mlir_types_in_action():
    var flag: __mlir_type.i1 = __mlir_attr.true
    var count: __mlir_type.index = __mlir_attr.`0 : index`

    # Convert back to Mojo types to print
    print(Bool(flag))              # True
    print(Int(mlir_value=count))   # 0
```

### Bracket syntax

> Use bracket syntax when you need to build a type from values known at compile
> time. The compiler splices Mojo expressions into an MLIR type string.
>
> The following list builds a single MLIR type string. It alternates between
> backtick literals (copied as-is) and Mojo expressions (inserted as MLIR text):

```mojo
# From SIMD: build storage type from dtype and size parameters.
# For SIMD[DType.float32, 4], produces: !kgen.simd<4, f32>
comptime _mlir_type = __mlir_type[
    `!kgen.simd<`, Self.size._mlir_value, `, `,
    Self.dtype._mlir_value, `>`
]

# From Pointer: produces, for example, !kgen.pointer<MyStruct>
comptime _mlir_type = __mlir_type[`!kgen.pointer<`, Self.T, `>`]

# From Optional: produces, for example, !kgen.variant<MyStruct, i1>
comptime _mlir_type = __mlir_type[
    `!kgen.variant<`, Self.T, `, i1>`
]

# Nested substitution: produces complex<i32>
var complexInt: __mlir_type[
    `complex<`, __mlir_type.i32, `>`
]
```

> Bracket lists only accept positional operands. Using keyword operands produces a
> compile-time error.

### MLIR types in parameter lists

> You can use MLIR types as compile-time parameters for structs and functions.
> Dialect types like `!kgen.string` and `!kgen.dtype` appear here alongside
> builtin types.

```mojo
# Parameter is a compile-time MLIR string (for example, "hello")
struct StringLiteral[value: __mlir_type.`!kgen.string`]:
    # ...

# Parameter is a compile-time dtype (for example, f32 or si64)
def example[dtype: __mlir_type.`!kgen.dtype`]():
    # For dtype=f32, produces: !kgen.scalar<f32>
    var a: __mlir_type[`!kgen.scalar<`, dtype, `>`]
    # ...
```

### Properties of raw MLIR types

> Raw MLIR types (not wrapped in a struct) are register-passable, trivially
> copyable, and trivially movable. They don't have methods or attributes and
> accessing `.field` on the type produces an error.

Source: <https://mojolang.org/docs/reference/inline-mlir/>.

## `__mlir_attr`

> Use `__mlir_attr` to define MLIR attributes in Mojo. An MLIR attribute is a
> compile-time constant embedded in the IR.

### Dot and backtick syntax

```mojo
# Boolean attributes
__mlir_attr.true
__mlir_attr.false

# Built-in type shorthands used in return positions
__mlir_attr.i1
__mlir_attr.index
__mlir_attr.f16
__mlir_attr.f32
__mlir_attr.si32

# Typed constants (with backtick syntax)
__mlir_attr.`0 : index`
__mlir_attr.`42 : i17`
__mlir_attr.`1 : si32`
```

> MLIR attribute constants use MLIR literal syntax, not Mojo's. Binary (`0b1010`),
> octal (`0o17`), and hex (`0xFF`) prefixes aren't supported. Use decimal values
> instead.

```mojo
# Dialect-specific attributes
__mlir_attr.`#kgen.dtype.constant<f32> : !kgen.dtype`
    # DType constant for float32
__mlir_attr.`#index<cmp_predicate slt>`
    # Signed less-than predicate
__mlir_attr.`#pop<atomic_ordering seq_cst>`
    # Sequential consistency ordering
__mlir_attr.`#kgen.simd<"nan"> : !kgen.scalar<f32>`
    # Float32 NaN constant
```

```mojo
def circle_area_approx(radius: Int) -> Int:
    """Approximate area using integer math: pi ≈ 3."""
    var r = radius.__mlir_index__()
    var r_squared = __mlir_op.`index.mul`(r, r)
    var pi: __mlir_type.index = __mlir_attr.`3 : index`
    var area = __mlir_op.`index.mul`(pi, r_squared)
    return Int(mlir_value=area)

def main():
    print(circle_area_approx(5))   # 75
    print(circle_area_approx(10))  # 300
```

### Bracket syntax

> Use bracket syntax when you need to build an attribute from compile-time values.
> This follows the same rules as `__mlir_type`.

```mojo
# String concatenation at compile time.
# For "Hello" + "World", produces:
#   #pop.string_concat<"Hello","World"> : !kgen.string
__mlir_attr[
    `#pop.string_concat<`, self.value, `,`, rhs.value,
    `> : !kgen.string`,
]

# Null pointer constant for a parameterized type.
# For Pointer[Int], produces:
#   #interp.pointer<0> : !kgen.pointer<Int>
__mlir_attr[`#interp.pointer<0> : `, Self._mlir_type]

# Compile-time parameter expression.
# For a=5, produces: #kgen.param.expr<max, 5, 42> : index
comptime new_lower = __mlir_attr[
    `#kgen.param.expr<max, `, a, `, `,
    Int(42)._mlir_value, `> : index`
]
```

Source: <https://mojolang.org/docs/reference/inline-mlir/>.

## `__mlir_op`

> Use `__mlir_op` to call MLIR operations directly from Mojo. This lets you use
> operations that Mojo doesn't expose yet, like hardware intrinsics and
> dialect-specific operations.

### Syntax

> Place compile-time parameters (attributes) in square brackets and runtime values
> (operands) in parentheses. Put the operation name in backticks:

```mojo
__mlir_op.`dialect.operation`(operands)
__mlir_op.`dialect.operation`[attributes](operands)
```

### Operations with no attributes

```mojo
# Boolean XOR
__mlir_op.`pop.xor`(self._mlir_value, rhs._mlir_value)

# Index addition
__mlir_op.`index.add`(self._mlir_value, rhs._mlir_value)

# Trap (no operands, no result)
__mlir_op.`llvm.intr.trap`()
```

### Operations with attributes

> An operation may need to pass attributes, the key-value pairs in square brackets
> before the operands (that is, the runtime values):

```mojo
# Cast a pop scalar to a builtin i1
#   (for example, !kgen.scalar<bool> → i1)
__mlir_op.`pop.cast_to_builtin`[
    _type=__mlir_type.i1
](mlir_value)

# Signed less-than comparison on two index values. Returns i1.
__mlir_op.`index.cmp`[
    pred=__mlir_attr.`#index<cmp_predicate slt>`
](self._mlir_value, rhs._mlir_value)

# Load a value from a pointer with atomic ordering.
# Returns a value of the pointer's element type.
__mlir_op.`pop.load`[
    ordering=ordering.__mlir_attr(),
    _type=Self._mlir_type,
](ptr.address)
```

```mojo
def clamp(val: Int, low: Int, high: Int) -> Int:
    """Clamp val to [low, high] using MLIR comparisons and select."""
    var v = val.__mlir_index__()
    var lo = low.__mlir_index__()
    var hi = high.__mlir_index__()

    # If val < low, use low.
    # index.cmp returns i1, but pop.select needs a !kgen.scalar<bool>.
    var too_low = __mlir_op.`pop.cast_from_builtin`[
        _type=__mlir_type.`!kgen.scalar<bool>`
    ](__mlir_op.`index.cmp`[pred=__mlir_attr.`#index<cmp_predicate slt>`](
            v, lo)
    )
    var result = __mlir_op.`pop.select`(too_low, lo, v)

    # If result > high, use high
    var too_high = __mlir_op.`pop.cast_from_builtin`[
        _type=__mlir_type.`!kgen.scalar<bool>`
    ](__mlir_op.`index.cmp`[pred=__mlir_attr.`#index<cmp_predicate sgt>`](
            result, hi)
    )
    result = __mlir_op.`pop.select`(too_high, hi, result)

    return Int(mlir_value=result)

def main():
    print(clamp(15, 0, 10))  # 10
    print(clamp(-5, 0, 10))  # 0
    print(clamp(7, 0, 10))   # 7
```

### Special attributes

| Attribute | Purpose |
|-----------|---------|
| `_type` | Sets the result type; pass `None` for an operation with no result |
| `_properties` | Passes MLIR operation properties as a `DictionaryAttr` |
| `_region` | References a named `__mlir_region` as a region argument |

### `_type`

> Most operations require an explicit result type:

```mojo
# Single result type
var i1Cast = __mlir_op.`index.castu`[
    _type=__mlir_type.i1
](idxConstant)
```

> When an operation returns multiple values, assign them to a typed tuple:

```mojo
# Returns the current source location as (line, column, filename).
# _properties passes inline depth to the code generator.
_ = __mlir_op.`kgen.source_loc`[
    _type = (
        __mlir_type.index,
        __mlir_type.index,
        __mlir_type.`!kgen.string`
    ),
]()
```

> Operations that produce no result take `_type=None`:

```mojo
__mlir_op.`nvvm.fence.mbarrier.init`[_type=None]()
```

> If the compiler can't infer the result type and you don't provide `_type`,
> you'll receive an error:
> `unable to infer result type from MLIR operation 'name'`.

### `_properties`

> Some MLIR operations store configuration in properties instead of attributes.
> Attributes are compile-time constants in Mojo. Properties store compile-time
> metadata on the operation. Pass them as a `DictionaryAttr`:

```mojo
_ = __mlir_op.`kgen.source_loc`[
    _type = (
        __mlir_type.index,
        __mlir_type.index,
        __mlir_type.`!kgen.string`
    ),
    _properties = __mlir_attr.`{inlineCount = 1 : i64}`,
]()
```

> Operations can mix attributes and properties in the same bracket list:

```mojo
__mlir_op.`llvm.add`[
    _type=__mlir_type.i64,
    _properties=__mlir_attr.`{
        overflowFlags = #llvm.overflow<nsw>
    }`,
](arg0, arg1)
```

> As an example, NVVM operations often use the `operandSegmentSizes` property to
> describe which optional operands are present:

```mojo
__mlir_op.`nvvm.cp.async.bulk.shared.cluster.global`[
    _properties=__mlir_attr.`{
        operandSegmentSizes = array<i32: 1,1,1,1,0,1>
    }`,
    _type=None,
](dst, src, size, mbar, predicate)
```

> In Mojo, you can only call registered MLIR operations. If you try to call one
> that isn't registered, the compiler will error with:
> `use of unregistered MLIR operation 'name'`.

Source: <https://mojolang.org/docs/reference/inline-mlir/>.

## `__mlir_region`

> Use `__mlir_region` to define a block of MLIR code for an operation to run. A
> region is a block of code that an MLIR operation runs, similar to a loop body or
> callback. Unlike a closure, it doesn't implicitly capture variables.
>
> Some MLIR operations take a region as input. You define the block with
> `__mlir_region` and pass it to the operation using the `_region` attribute.
>
> A region is written as a named block with arguments and an indented body:

```mojo
__mlir_region name(arg: type, ...):
    body
```

### Basic usage

> The following example uses `hlcf.loop`, an MLIR loop operation. It repeatedly
> runs the region body, passing the current iteration value as an argument. The
> region calls `hlcf.continue` with the next value:

```mojo
comptime one = __mlir_attr.`1 : index`

def structured_for_loop() -> __mlir_type.index:
    # Define the loop body as a region. The operation passes
    # the current iteration value as `i`.
    __mlir_region loop_body(i: __mlir_type.index):
        # Yield the next iteration value: i + 1
        __mlir_op.`hlcf.continue`(
            __mlir_op.`index.add`(i, one)
        )

    # Start at 0, run loop_body repeatedly,
    # return the final value.
    return __mlir_op.`hlcf.loop`[
        _type=__mlir_type.index,
        _region=__mlir_attr.`"loop_body"`,
    ](__mlir_attr.`0 : index`)
```

> The region arguments (`i` in this example) come from the operation that uses the
> region. Here, `hlcf.loop` passes the current loop value as `i`. The `_region`
> attribute takes the region name as a string.
>
> This loop runs indefinitely. To exit conditionally, wrap `hlcf.break` in
> `hlcf.if`. In practice, it's simpler to use Mojo's `for` and `while` loops for
> control flow.

```mojo
def sum_to(end: Int) -> Int:
    """Mojo while loop with MLIR arithmetic and comparison."""
    var acc: __mlir_type.index = __mlir_attr.`0 : index`
    var i: __mlir_type.index = __mlir_attr.`0 : index`
    var one: __mlir_type.index = __mlir_attr.`1 : index`

    # end.__mlir_index__() unwraps Mojo Int to raw __mlir_type.index
    while Bool(__mlir_op.`index.cmp`[
        pred=__mlir_attr.`#index<cmp_predicate slt>`
    ](i, end.__mlir_index__())):
        acc = __mlir_op.`index.add`(acc, i)
        i = __mlir_op.`index.add`(i, one)

    return Int(mlir_value=acc)

def main():
    print(sum_to(10))  # 45
    print(sum_to(0))   # 0
    print(sum_to(1))   # 0
    print(sum_to(5))   # 10
```

### Multiple regions in one scope

> A function can define multiple regions, each with its own name. This example
> defines a region and passes it to `co.suspend`, an MLIR coroutine operation that
> suspends execution and later resumes by running the provided region:

```mojo
@always_inline
def _suspend_async[
    body: def(AnyCoroutine) capturing -> None
]():
    # Runs when the coroutine resumes.
    # The operation passes the coroutine handle as `hdl`.
    __mlir_region await_body(
        hdl: __mlir_type.`!co.routine`
    ):
        body(hdl)
        # Signal that the await body is done
        __mlir_op.`co.suspend.end`()

    # Suspend the current coroutine, registering await_body
    # as the code to run when it resumes.
    __mlir_op.`co.suspend`[_region="await_body".value]()
```

> Operations that accept multiple regions reference them by name. Each
> `__mlir_region` defines a single block.

### Region arguments

> Region arguments look like function arguments, but they don't support Mojo
> argument conventions like `ref`, `var`, or `mut`. The operation provides the
> argument values directly as raw MLIR values:

```mojo
# Region arguments receive raw MLIR values from the enclosing
# operation. Mojo conventions don't apply.
__mlir_region my_region(
    x: __mlir_type.index,              # Raw index from the operation
    y: __mlir_type.`!kgen.scalar<f32>`, # Raw f32 scalar
):
    # x and y are raw MLIR values, not Mojo types.
    # Wrap them (for example, Int(mlir_value=x)) to use
    # Mojo operations on them.
    # ...
```

Source: <https://mojolang.org/docs/reference/inline-mlir/>.

## Common dialects

| Prefix | Covers |
|--------|--------|
| `pop.*` | Mojo portable ops: arithmetic, casts, SIMD, pointers |
| `index.*` | Index-typed arithmetic and comparisons |
| `kgen.*` | Codegen primitives: structs, variants, parameters |
| `lit.*` | Language-level ops: ownership, references, closures |
| `llvm.*` | LLVM dialect: traps, inline assembly, pointer ops |
| `nvvm.*` | NVIDIA GPU intrinsics: barriers, async copies, tensor ops |
| `co.*` | Coroutine ops: suspend, resume, destroy, await |

> The `pop`, `kgen`, `co` and `lit` dialects are internal implementation details
> of the compiler and may change without notice.
>
> Built-in dialects, like `index`, are also available.

Source: <https://mojolang.org/docs/reference/inline-mlir/>.

> **Stability:** the `pop`, `kgen`, `co` and `lit` dialects are explicitly
> unstable. `index` is a built-in MLIR dialect. Even for those, the Mojo surface
> (`__mlir_op`, `__mlir_type`, `__mlir_attr`, `__mlir_region`) is an escape hatch
> the reference describes as a way to reach operations "that Mojo doesn't
> surface", not as supported API. Verify against your compiler version before
> relying on any of it.

## Stdlib patterns

> The standard library uses inline MLIR in consistent patterns that show up across
> the codebase. These patterns will help you understand how to use the built-ins
> in your own code.

### Wrapper structs

> The most common pattern: a Mojo struct wraps a raw MLIR type in a field called
> `_mlir_value`. The struct provides a Mojo-friendly interface; the field holds
> the actual MLIR representation.

```mojo
# Bool wraps a single MLIR bit. The struct provides Mojo-level
# operators; the i1 field holds the actual hardware value.
struct Bool:
    var _mlir_value: __mlir_type.`!kgen.scalar<bool>`
                     # 1-bit integer: true or false

    def __init__(out self, value: __mlir_type.`!kgen.scalar<bool>`):
        self._mlir_value = value     # Store the raw bit directly
```

> When the storage type depends on struct parameters, define it as a `comptime`
> alias. For example, `SIMD` builds its type from `dtype` and `size`:

```mojo
struct SIMD[dtype: DType, size: Int]:
    comptime _mlir_type = __mlir_type[
        `!kgen.simd<`, Self.size._mlir_value, `, `,
        Self.dtype._mlir_value, `>`
    ]
    var _mlir_value: Self._mlir_type  # Parameterized SIMD vector
```

> This pattern appears in `SIMD`, `Pointer`, `Tuple`, `Variant`, and
> `Optional`'s internal storage.

```mojo
struct Counter:
    """A simple counter backed by a raw MLIR index."""
    var _mlir_value: __mlir_type.index

    def __init__(out self):
        self._mlir_value = __mlir_attr.`0 : index`

    def increment(mut self):
        var one: __mlir_type.index = __mlir_attr.`1 : index`
        self._mlir_value = __mlir_op.`index.add`(
            self._mlir_value, one
        )

    def value(self) -> Int:
        return Int(mlir_value=self._mlir_value)

def main():
    var c = Counter()
    c.increment()
    c.increment()
    c.increment()
    print(c.value())  # 3
```

### Operations as methods

> Once a struct wraps an MLIR type, its methods delegate to MLIR operations. The
> `_mlir_value` field goes in, the result comes back, and the struct re-wraps it:

```mojo
def __invert__(self) -> Bool:
    return __mlir_op.`pop.xor`(
        self._mlir_value, __mlir_attr.true
    )

def __and__(self, rhs: Bool) -> Bool:
    return __mlir_op.`pop.and`(
        self._mlir_value, rhs._mlir_value
    )
```

```mojo
def __add__(self, rhs: Int) -> Int:
    return Int(
        mlir_value=__mlir_op.`index.add`(
            self._mlir_value, rhs._mlir_value
        )
    )

def __lt__(self, rhs: Int) -> Bool:
    return __mlir_op.`index.cmp`[
        pred=__mlir_attr.`#index<cmp_predicate slt>`
    ](self._mlir_value, rhs._mlir_value)
```

Source: <https://mojolang.org/docs/reference/inline-mlir/>.

## Inline MLIR syntax (consolidated)

```text
mlir_type       → "__mlir_type" "." NAME
                | "__mlir_type" "." "`" mlir_type_string "`"
                | "__mlir_type" "[" splice_list "]"
mlir_attr       → "__mlir_attr" "." NAME
                | "__mlir_attr" "." "`" mlir_attr_string "`"
                | "__mlir_attr" "[" splice_list "]"
mlir_op         → "__mlir_op" "." "`" op_name "`" "(" operand_list ")"
                | "__mlir_op" "." "`" op_name "`"
                  "[" attribute_list "]" "(" operand_list ")"
mlir_region     → "__mlir_region" NAME "(" region_arg_list ")" ":" suite

splice_list     → splice ("," splice)* [","]
splice          → "`" mlir_text "`"      # copied verbatim
                | expression              # spliced as MLIR text
attribute_list  → attribute ("," attribute)* [","]
attribute       → "_type" "=" type
                | "_type" "=" "(" type ("," type)* ")"
                | "_type" "=" "None"
                | "_properties" "=" __mlir_attr
                | "_region" "=" __mlir_attr
                | NAME "=" expression
region_arg_list → NAME ":" mlir_type ("," NAME ":" mlir_type)* [","]
```

Sources: <https://mojolang.org/docs/reference/inline-mlir/> and
<https://mojolang.org/docs/reference/expressions/>.

## Pitfalls

- **Reaching for inline MLIR by default.** It is a documented escape hatch for
  operations Mojo does not surface, and its dialects may change without notice.
  Prefer normal Mojo; use inline MLIR only when there is no alternative. Verified
  above.
- **Omitting the `!` on a dialect type.** `kgen.dtype` is rejected; write
  `` __mlir_type.`!kgen.dtype` ``. Verified above.
- **Using Mojo literal syntax inside an MLIR attribute.** MLIR attribute
  constants use MLIR literal syntax; `0b1010`, `0o17` and `0xFF` prefixes are not
  supported, so use decimal values. Verified above.
- **Passing keyword operands to bracket syntax.** `__mlir_type[...]` and
  `__mlir_attr[...]` accept positional operands only. Verified above.
- **Accessing `.field` on a raw MLIR type.** Raw MLIR types have no methods or
  attributes. Verified above.
- **Forgetting `_type`.** An operation whose result type can't be inferred errors
  with "unable to infer result type from MLIR operation". Verified above.
- **Passing a result type for a no-result operation.** Use `_type=None`. Verified
  above.
- **Calling an unregistered MLIR operation.** Only registered operations can be
  called; the compiler errors with "use of unregistered MLIR operation". Verified
  above.
- **Using Mojo argument conventions on a region argument.** Region arguments are
  raw MLIR values; `ref`, `var` and `mut` do not apply. Verified above.
- **Referencing a region by the wrong name.** `_region` takes the region's name
  as a string; operations with multiple regions reference them by name. Verified
  above.
- **Expecting a region to capture variables.** Unlike a closure, a region does
  not implicitly capture. Verified above.
- **Building control flow in MLIR by hand.** The reference explicitly says it is
  simpler to use Mojo's `for` and `while`. Verified above.
- **Treating `pop`, `kgen`, `co`, `lit` as stable.** They are internal
  implementation details that may change without notice. Verified above.

## Sources

- Mojo inline MLIR reference: <https://mojolang.org/docs/reference/inline-mlir/>
- MLIR built-in types: <https://mlir.llvm.org/docs/Dialects/Builtin/#types>
- MLIR project: <https://mlir.llvm.org/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
