# Calling C from Mojo

Mojo can call C directly, with no translation layer and no runtime overhead. The
official page opens with the use case and the performance claim:

> "When you need functionality that's already available in a C library, you can
> call it directly from your Mojo code. Many libraries for graphics, databases,
> hardware control, signal processing, and scientific computing expose C APIs.
>
> Mojo emits a direct native call, with no translation layer or extra runtime
> overhead. A C call from Mojo runs as fast as handwritten C."
>
> — <https://mojolang.org/docs/manual/c-ffi/>

Everything on this page is grounded in that manual page; the API-level details
are cross-checked against `std.ffi`
(<https://mojolang.org/docs/std/ffi/>). The companion reference for exporting in
the other direction is [calling Mojo from Python](mojo-from-python.md), and the
C-ABI export path is in
[compiler and flags](../tooling/compiler-and-flags.md).

## The mental model: you are the type checker

The most important paragraph in the whole C-FFI documentation is the safety
model. Mojo's compiler guarantees end at the boundary:

> "Inside Mojo, the compiler checks types, tracks lifetimes through origins, and
> refuses code that would use a value after it dies. None of that reaches across
> the C boundary. C has no origins, no ownership, and no type information Mojo
> can read, so the compiler emits exactly the call you described and trusts you
> to have described it correctly.
>
> That makes you the type checker. The C header is the contract, and matching it
> is your job:
>
> - **Declare what C declares.** Use the `std.ffi` aliases so your types track
>   the target's C ABI. A mismatch isn't a compile error, it's a wrong answer.
> - **Free memory on the side that allocated it.** C memory needs C's `free()`.
>   Mojo memory has to outlive every C use, including uses that continue after
>   the call returns.
> - **Assume undefined behavior, not exceptions.** A mismatched declaration
>   usually produces a plausible result rather than a crash, so a passing test is
>   weak evidence that a declaration is right."
>
> — <https://mojolang.org/docs/manual/c-ffi/>

Read that again before writing any FFI code: **a wrong FFI declaration is not a
compile error — it is a wrong answer, often a plausible-looking one.**

## C number types do not have fixed sizes

> "C integer types don't have fixed sizes. Their sizes depend on the target
> platform and its C *ABI*. For example, `int` is commonly 32 bits, while `long`
> is 64 bits on Linux and macOS but 32 bits on Windows.
>
> An ABI (application binary interface) defines how machine code passes
> arguments, returns values, and lays out data in memory.
>
> Use the `std.ffi` module's type aliases when working with C APIs. They match
> the target platform's C ABI, so you don't need to worry about platform-specific
> size differences."
>
> — <https://mojolang.org/docs/manual/c-ffi/>

The full table from the manual:

| C type | `std.ffi` alias | Equivalent Mojo type | Notes |
|--------|-----------------|----------------------|-------|
| `int` | `c_int` | `Int32` | the most common type by far |
| `short` | `c_short` | `Int16` | |
| `long` | `c_long` | depends on target | 64-bit on Linux and macOS |
| `long long` | `c_long_long` | `Int64` | Always 64 bits |
| `unsigned char` | `c_uchar` | `UInt8` | |
| `char` | `c_char` | `Int8` | signed; you'll mostly see it as `char*` |
| `unsigned short` | `c_ushort` | `UInt16` | |
| `unsigned int` | `c_uint` | `UInt32` | |
| `unsigned long` | `c_ulong` | depends on target | matches `c_long` |
| `float` | `c_float` | `Float32` | |
| `double` | `c_double` | `Float64` | |
| `size_t` | `c_size_t` | `UInt` | for sizes and counts |
| `ssize_t` | `c_ssize_t` | `Int` | for sizes that can be negative |
| `void*` | `OpaquePointer` | `Pointer[NoneType]` | uses origins |

Source: <https://mojolang.org/docs/manual/c-ffi/#c-type-reference>.

The reference confirms the alias definitions, including that `c_long` and
`c_ulong` are target-dependent while `c_int` is `Int32` and `c_size_t` is `UInt`
(<https://mojolang.org/docs/std/ffi/>). Additional `std.ffi` aliases documented
there: `c_pid_t` (`Int`), `c_long_long`/`c_ulong_long` (`Int64`/`UInt64`).

**Pitfall:** writing `Int64` for a C `long` "happens to work" on every platform
Mojo currently supports (LP64), but the alias "says what you mean and keeps
saying it if the supported targets change."
(<https://mojolang.org/docs/manual/c-ffi/>)

## Calling libc functions: `external_call()`

> "`libc` is the C standard library. It provides functions for memory
> allocation, string manipulation, file I/O, and other common tasks. Mojo calls
> libc functions with `external_call()`. Mojo resolves the symbol for you, so you
> don't need to add anything to your build.
>
> Import `external_call` from `std.ffi`. Parameterize it with the function name
> and return type. Then pass the function arguments in parentheses. Mojo infers
> the argument types from the values you pass, so there's nothing else to
> declare."

The signature:

```mojo
def external_call[
    callee: StaticString,
    return_type: RegisterPassable,
    *types: AnyType,
    num_fixed_args: OptionalReg[Int] = None,
](*args: *types) -> return_type
```

Source: <https://mojolang.org/docs/manual/c-ffi/>.

The simplest complete example:

```mojo
from std.ffi import external_call, c_int

def main():
    # int abs(int n);
    var n = external_call["abs", c_int](c_int(-42))
    print(t"Absolute value is 42: {n == 42}")  # True
```

`c_int` is 32 bits on every platform Mojo targets.

### Why the return type is mandatory

`external_call()` takes the return type as a parameter, and nothing validates
the argument types against the C declaration. The manual's safety list spells
out the failure modes:

> - "**Type matching** (both): Nothing validates your arguments or return type
>   against the C declaration of the function you're calling."
> - "**Return type width** (both): Declaring a narrower return than C returns
>   keeps only the low bits. Declare `strchr`'s `char*` return as `c_int` and a
>   pointer whose real value is 6199428535 comes back as 1904461239. That's
>   truncation rather than noise, so a wrong value can still look plausible."
> - "**Argument type width and signedness** (both): Whatever you write becomes
>   the declaration verbatim. Passing a `c_char` where C declares `int` has the
>   callee reading a register the caller never fully set."
>
> — <https://mojolang.org/docs/manual/c-ffi/>

### Variadic C functions

> "A *variadic* C function takes a variable number of arguments, like `printf()`
> and `snprintf()`. Pass `num_fixed_args` with the number of arguments declared
> before the `...`."

```mojo
from std.ffi import external_call, c_char, c_int, c_size_t

def main():
    # int snprintf(char *buf, size_t size, const char *fmt, ...);
    # Three fixed arguments, so num_fixed_args=3.
    var buf = Array[c_char, 64](uninitialized=True)
    var written = external_call["snprintf", c_int, num_fixed_args=3](
        buf.unsafe_ptr(),
        c_size_t(64),
        "score: %d/%d".as_c_string_slice().unsafe_ptr(),
        c_int(7),
        c_int(10),
    )
    print(t"wrote {written}: {String(unsafe_from_utf8_ptr=buf.unsafe_ptr())}")
```

> "Without `num_fixed_args`, Mojo treats every argument as fixed. Some ABIs pass
> variadic arguments differently from fixed ones, so the call can work on one
> target and break on another."
> — <https://mojolang.org/docs/manual/c-ffi/>

**Pitfall:** omitting `num_fixed_args` is the classic "works on x86-64 Linux,
breaks on Apple silicon" bug. "AAPCS on ARM64 macOS passes variadic arguments
differently from fixed ones, so the mistake can work on x86-64 Linux and break
on Apple silicon." (<https://mojolang.org/docs/manual/c-ffi/>)

The 1.0.0 notes give the exact semantics for the default:

> "Left at its `None` default, the callee is declared non-variadic, which
> miscompiles variadic calls on targets whose ABI passes variadic arguments
> differently from fixed ones. A count of `0` is distinct from `None`: it
> declares a callee whose every argument is variadic."
> — <https://mojolang.org/releases/v1.0.0/>

## Loading shared libraries: `OwnedDLHandle`

> "An `OwnedDLHandle` owns a handle to a dynamically linked library with RAII
> semantics. Use it to load shared libraries and retrieve functions as Mojo
> callables, so you can work with libraries such as SQLite, libcurl, camera SDKs,
> GPU vendor libraries, and other native libraries."

```mojo
from std.ffi import OwnedDLHandle, c_double
from std.sys.info import platform_map

comptime LIBM = platform_map["libm", linux="libm.so.6", macos="libm.dylib"]()

def main() raises:
    var lib = OwnedDLHandle(LIBM)
    var sqrt = lib.get_function[c_double]("sqrt")
    print(sqrt(c_double(4.0)))  # Prints: 2.0
    # Library automatically closed when lib goes out of scope
```

Source: <https://mojolang.org/docs/manual/c-ffi/>.

`platform_map()` selects the right library name per platform at compile time:

> "If `platform_map()` has no value for the target, it raises a compilation
> error. It won't fall through to a library name for another platform."
> — <https://mojolang.org/docs/manual/c-ffi/>

### Library names

> "Pass the library as any `os.PathLike`, such as a `String` or a `Path`. Mojo
> resolves the name at runtime. Use the bare name (`libm.dylib`) when the library
> is on the system search path, or a full path (`path/to/libm.dylib`) when it
> isn't.
>
> On Linux, use the ABI-versioned runtime name, such as `libm.so.6`, instead of
> the unversioned `libm.so`. An ABI version doesn't necessarily match the
> library's release version. For example, libcurl 8.21 still uses
> `libcurl.so.4`.
>
> The unversioned name belongs to the development package, where the static
> linker consumes it for options such as `-lm`. It's often a linker script rather
> than a library, so passing it to `dlopen` can fail with an `invalid ELF header`
> error."
>
> — <https://mojolang.org/docs/manual/c-ffi/>

The page gives the diagnostic command:

```bash
ldconfig -p | grep libcurl
```

> "macOS uses one name for both purposes. `libcurl.dylib` is both what you link
> against and what you load.
>
> If you omit the library name, `OwnedDLHandle()` opens the current process. This
> is another way to call libc functions and other symbols already linked into
> your program."
> — <https://mojolang.org/docs/manual/c-ffi/>

**Pitfall:** `libm.so` is often a GNU linker script, not an ELF object. Passing
it to `dlopen` fails with `invalid ELF header`. Use `libm.so.6`.

### Availability checks

> "`OwnedDLHandle` loads libraries at runtime, so the library must be available
> when your program runs. If it can't be found, loading fails:"

```mojo
comptime LIBCURL = platform_map[
    "libcurl", linux="libcurl.so.4", macos="libcurl.dylib"
]()

try:
    var lib = OwnedDLHandle(LIBCURL)
    # use the optional feature
except:
    # fall back
```

> "You can guard against missing functions with `check_symbol()`. Use it to test
> for optional, versioned, or platform-specific features. The check works for
> both functions and exported globals:"

```mojo
comptime LIBM = platform_map[
    "libm", linux="libm.so.6", macos="libm.dylib"
]()

var lib = OwnedDLHandle(LIBM)
if lib.check_symbol("exp10"):
    var exp10 = lib.get_function[c_double]("exp10")
    print(exp10(c_double(2.0)))  # 100.0
else:
    print("exp10 not found in libm")
```

Source: <https://mojolang.org/docs/manual/c-ffi/>.

### Retrieving functions by name

> "`get_function()` looks up a library function by name and returns a callable.
> Parameterize it with the C function's return type. …
>
> You don't declare the argument types. Mojo infers them from the values you pass
> at each call, and forwards them using the C calling convention.
>
> Missing symbols raise errors."

```mojo
# WinPtr is a pointer to a curses window struct
var wgetch = lib.get_function[c_int]("wgetch")

# ... later

_ = wgetch(win)  # blocks until a key is pressed.
```

Source: <https://mojolang.org/docs/manual/c-ffi/>.

**Pitfall:** the undeclared argument types are a feature and a hazard. The
manual lists it under silently-wrong behavior:

> "**Undeclared argument types** (`OwnedDLHandle`): `get_function()` takes the
> return type only, so nothing connects the arguments to the C function's real
> signature. Calling `get_function[c_double]("sqrt")` with a `c_int` returns
> `0.0` instead of failing."

Use `external_call()` when you want the compiler to at least *see* the argument
types you pass, and `get_function()` only when you must resolve a symbol at
runtime.

## Pointers

> "Many C APIs work with pointers. Mojo represents raw pointers with `Pointer[T]`,
> where `T` is the pointed-to type. When a C API expects a `void*`, use
> `.unsafe_bitcast[NoneType]()` to produce an `OpaquePointer`.
>
> - Use `Pointer(to=value)` to get a pointer to a Mojo value.
> - Use `.unsafe_bitcast[U]()` to reinterpret a pointer as another pointer type."

```mojo
var value: c_int = 42
var p = Pointer(to=value)  # Pointer to a C int
var opaque: OpaquePointer[origin_of(value)] = p.unsafe_bitcast[NoneType]()
```

Source: <https://mojolang.org/docs/manual/c-ffi/>.

### Typed pointers and the `imm` trap

> "C functions often write results through a pointer you provide, rather than
> returning them. Pass `Pointer(to=value)` and C fills in the value. An `imm`
> function argument won't work, and, worse, it fails quietly, leaving the value
> unchanged. Use the `mut` convention or copy the value into a local `var` before
> your call."

```mojo
from std.ffi import external_call, c_double, c_int

def main():
    # double frexp(double x, int *exp);
    # Returns the mantissa and writes the exponent through the pointer.
    var exponent: c_int = 0
    var mantissa = external_call["frexp", c_double](
        c_double(12.0), Pointer(to=exponent)
    )
    print(t"12.0 = {mantissa} * 2^{exponent}")  # 0.75 * 2^4
```

Source: <https://mojolang.org/docs/manual/c-ffi/>.

**Pitfall:** declaring the out-parameter's binding as a function argument without
`mut` compiles and then does nothing. The C function writes through the pointer,
but the pointer addresses a temporary. Copy into a local `var` (as above) or use
`mut`.

### Opaque pointers, callbacks and `qsort`

> "The C standard library provides `qsort`, a general-purpose sorting function.
>
> `qsort` sorts its array in place. You provide a pointer to that array, its
> number of elements, the element size, and a comparison function. Whenever
> `qsort` compares two elements, it calls your Mojo-native comparison function.
>
> The comparison function must be *thin*. That is, it can't capture any Mojo state
> as a closure. You must mark it with `abi("C")`, allowing `qsort` to call it
> across the FFI boundary."

```mojo
from std.ffi import external_call, c_int, c_size_t
from std.sys import size_of

def compare(
    a: OpaquePointer[mut=False, _],
    b: OpaquePointer[mut=False, _],
) abi("C") -> c_int:
    var a_value = a.unsafe_bitcast[c_int]()[]
    var b_value = b.unsafe_bitcast[c_int]()[]
    # `qsort` only needs to know which value is larger. Compare the values
    # instead of subtracting them. Large differences can overflow, producing the
    # wrong comparison result and sorting the values incorrectly.
    if a_value < b_value:
        return c_int(-1)
    return c_int(a_value > b_value)

def main() raises:
    var numbers: List[c_int] = [5, 2, 9, 1, 5, 6]
    var count = c_size_t(len(numbers))
    var size = c_size_t(size_of[c_int]())
    external_call["qsort", NoneType](
        numbers.unsafe_ptr(),
        count,
        size,
        compare,
    )
    print("Sorted numbers:", numbers)  # [1, 2, 5, 5, 6, 9]
```

Source: <https://mojolang.org/docs/manual/c-ffi/>.

The reference explains why `thin` is required: "Used only in function types,
`thin` indicates a function pointer type (not a closure) and ensures the function
value doesn't capture values from its defining scope." And why `abi("C")` comes
with it: "Because C has no closure mechanism, `abi("C")` always appears together
with `thin` in function types."
(<https://mojolang.org/docs/reference/function-declarations/#thin>)

**Pitfall:** subtracting two `c_int` values in a comparator overflows for large
differences and produces the wrong order (or, for signed types, the wrong sign).
The manual's example compares instead, deliberately. Also note that a Mojo
function passed to C as a callback must be thin and `abi("C")`; a capturing
closure cannot cross the boundary.

## Passing structs

### Reading a struct written by C

```mojo
from std.ffi import external_call, c_int, c_long
from std.sys.info import platform_map

@fieldwise_init
struct CTimeSpec(RegisterPassable):  # Matches C's struct timespec.
    # CLOCK_MONOTONIC differs by platform
    comptime monotonic = c_int(
        platform_map["CLOCK_MONOTONIC", linux=1, macos=6]()
    )

    var tv_sec: c_long
    var tv_nsec: c_long

    @staticmethod
    def monotonic_nanos() raises -> c_long:
        var time_spec = Self(0, 0)
        if (
            external_call["clock_gettime", c_int](
                Self.monotonic,
                Pointer(to=time_spec),
            )
            != 0
        ):
            raise Error("clock_gettime failed")
        return time_spec.tv_sec * 1_000_000_000 + time_spec.tv_nsec

def main() raises:
    print(t"Monotonic time: {CTimeSpec.monotonic_nanos()} ns")
```

### C-compatible structs

> "C-compatible types are ordinary structs with two requirements:
>
> - They conform to `RegisterPassable`.
> - They contain only C-compatible fields.
>
> Field order matters. Declare your fields in the same order as the C struct
> you're mirroring. Mojo uses the corresponding C layout, including padding
> required for field alignment:"

```mojo
# Mirrors C `div_t`: two ints, 8 bytes total.
@fieldwise_init
struct DivT(RegisterPassable):
    var quot: c_int
    var rem: c_int

def main() raises:
    var proc = OwnedDLHandle()  # No path: opens the current process

    var div = proc.get_function[DivT]("div")
    var d = div(c_int(7), c_int(3))
    print(t"div(7, 3): quot {d.quot} rem {d.rem}")  # 2 1
```

Source: <https://mojolang.org/docs/manual/c-ffi/>.

**Pitfall:** field order and padding are your responsibility. Reordering fields
changes the memory layout; a wrong layout yields silently wrong data, not an
error.

**Pitfall:** return types must be `RegisterPassable`. The manual says:

> "**Return types must be `RegisterPassable`** (both): `return_type` is bound to
> `RegisterPassable`, so the compiler rejects anything larger. A C function that
> returns a big struct by value isn't callable directly. C ABIs return those
> through a hidden pointer argument, so allocate the struct in Mojo, pass a
> pointer to it, and declare the return type as `NoneType`."

## Passing lists, arrays and spans

> "A Mojo `List[T]` stores its elements contiguously in memory, just like C
> arrays. You pass a list to C as a pointer plus a length …
>
> Mojo list pointers are fragile. Operations that grow the list, such as
> `append()`, may move its storage and leave an earlier pointer stale. So get the
> pointer fresh, right before you use it, after any change to the list.
>
> `Span[T]` is Mojo's built-in pointer-plus-length pair. It wraps a pointer to
> contiguous memory and stores a length. This gives you built-in bounds checking
> and safe iteration.
>
> `Array[T, length]` is Mojo's fixed-size array. It owns its elements inline, so
> Mojo cleans it up and C can fill it through a pointer plus a length.
>
> Both `Span` and `Array` are safe to pass to and from C by pointer. Add a length
> to calls where C needs one."

The full example, which also shows `getcwd()`, `strlen()`, `Span` construction
and `String(from_utf8=...)`:

```mojo
from std.ffi import external_call, c_char, c_size_t

def main() raises:
    # char *getcwd(char *buf, size_t size); C fills a buffer that Mojo owns.
    comptime CAPACITY = 256
    var buf = Array[c_char, CAPACITY](uninitialized=True)

    var filled = external_call[
        "getcwd", Optional[Pointer[c_char, origin_of(buf)]]
    ](buf.unsafe_ptr(), c_size_t(CAPACITY))
    if not filled:
        raise Error("getcwd failed")

    # C reports no length, so ask for it, then wrap the bytes in a `Span`.
    var length = external_call["strlen", c_size_t](buf.unsafe_ptr())
    var span = Span(
        unsafe_ptr=buf.unsafe_ptr().unsafe_bitcast[Byte](), length=Int(length)
    )
    print(t"{len(span)} bytes: {String(from_utf8=span)}")
```

Source: <https://mojolang.org/docs/manual/c-ffi/>.

> "`Span`s work with both Mojo and C memory:
>
> - If you wrap a Mojo-owned buffer, the `Span` keeps it alive.
> - If you wrap a C-owned buffer, such as memory from `malloc()`, the `Span`
>   doesn't free it. You must free C-owned memory with C."

1.0.0 changed `Span`'s constructor to flag its unsafety: the pointer-and-length
argument was renamed from `ptr` to `unsafe_ptr`, "to flag that this construction
path is memory-unsafe: the caller must ensure the pointer addresses at least
`length` valid elements."
(<https://mojolang.org/releases/v1.0.0/>)

**Pitfall:** a `List` pointer obtained before an `append()` can dangle. Re-fetch
`unsafe_ptr()` immediately before each C call that consumes it.

## Strings

> "C strings are null-terminated byte arrays (`char*`). Mojo strings are
> length-prefixed UTF-8."

### Mojo string → C string

> "Call `as_c_string_slice()` on a `String` to ensure null termination, then
> `unsafe_ptr()` to access the raw pointer:
>
> ```mojo
> name.as_c_string_slice().unsafe_ptr()
> ```
>
> The source string must be mutable because `as_c_string_slice()` may append a
> terminating zero byte. It may also move the string's buffer, so call it once
> and reuse the result."

### C string → Mojo string

> "Use `String(unsafe_from_utf8_ptr=...)` to copy a null-terminated C string into
> a Mojo string:
>
> ```mojo
> # Copies the bytes; uses `strlen()`.
> String(unsafe_from_utf8_ptr=c_string_ptr)
> ```
>
> When you already know the length, you can wrap the C bytes in a non-copying,
> non-owning `Span[Byte]` and covert that to a Mojo `String`."

The `strdup()` example, which also shows freeing C memory:

```mojo
var name: String = "Echo"
var cptr = external_call[
    "strdup", Optional[Pointer[c_char, MutUntrackedOrigin]]
](name.as_c_string_slice().unsafe_ptr())
if cptr:
    var ptr = cptr.value()
    # Ask C for the length. A Mojo string's `byte_length()` measures the
    # Mojo side, which says nothing about the buffer C returned.
    var length = external_call["strlen", c_size_t](ptr)
    var span = Span(unsafe_ptr=ptr.unsafe_bitcast[Byte](), length=Int(length))
    print(String(from_utf8=span))  # or from_utf8_lossy or unsafe_from_utf8
    external_call["free", NoneType](ptr.unsafe_bitcast[NoneType]())  # free it
```

Source: <https://mojolang.org/docs/manual/c-ffi/>.

### Mojo string literals → C strings

> "String literals can be passed to C APIs that expect a null-terminated `char*`.
> Call `as_c_string_slice()` to access the C string:
>
> ```mojo
> "libm.so.6".as_c_string_slice()
> ```
>
> Mojo performs the conversion at compile time and embeds the null-terminated
> string in the compiled program."

**Pitfall:** `external_call()` rejects a bare `String` at compile time, but a
callable from `get_function()` does not:

> "**Raw `String` arguments** (`OwnedDLHandle`): `external_call()` rejects a
> `String` at compile time, but a callable from `get_function()` accepts one and
> reads whatever the struct's bytes happen to be. Passing a 53-byte `String` to
> `strlen` returns 5. Always pass `as_c_string_slice().unsafe_ptr()`."

**Pitfall:** a bare `Pointer[c_char]` with no terminator "sends a C string
function reading off the end." `CStringSlice` "is the guardrail for this,
ensuring a null terminator is present."
(<https://mojolang.org/docs/manual/c-ffi/>)

## Memory management

> "Mojo tracks the lifetime of its own memory. C memory has no Mojo value behind
> it, so there's nothing for Mojo to track. Every allocation that crosses the
> boundary still belongs to one side, and that side remains responsible for
> freeing it:
>
> - Free C memory with C's `free()`.
> - Let Mojo handle its own memory, except for unsafe allocations."

### Allocating C memory

```mojo
from std.ffi import external_call, c_size_t

def create_buffer(
    n: c_size_t,
) -> Optional[Pointer[UInt8, MutUntrackedOrigin]]:
    return external_call[
        "malloc", Optional[Pointer[UInt8, MutUntrackedOrigin]]
    ](n)

def main() raises:
    var buf = create_buffer(c_size_t(16))
    if not buf:
        raise Error("malloc failed")
    var ptr = buf.value()
    ptr[unsafe_offset=0] = 42
    print(ptr[unsafe_offset=0])  # 42
    external_call["free", NoneType](ptr.unsafe_bitcast[NoneType]())
```

> "`MutUntrackedOrigin` tells Mojo not to reason about this pointer's lifetime.
> It's the opposite of every other origin on this page. Instead of tying the
> pointer to an owner, it says that no Mojo value owns *this* memory. You're
> responsible for keeping it valid and freeing it."
> — <https://mojolang.org/docs/manual/c-ffi/>

### Freeing C memory automatically

```mojo
from std.ffi import external_call, c_size_t

struct CBuffer:
    var ptr: Pointer[UInt8, MutUntrackedOrigin]
    var size: c_size_t

    def __init__(out self, n: c_size_t) raises:
        self.size = n
        var allocated = external_call[
            "malloc", Optional[Pointer[UInt8, MutUntrackedOrigin]]
        ](n)
        if not allocated:
            raise Error("malloc failed")
        self.ptr = allocated.value()

    def __enter__(self) -> Pointer[UInt8, MutUntrackedOrigin]:
        return self.ptr

    def __exit__(self):
        external_call["free", NoneType](self.ptr.unsafe_bitcast[NoneType]())

def main() raises:
    with CBuffer(c_size_t(1024)) as buf:
        buf[unsafe_offset=0] = 42
        print(buf[unsafe_offset=0])  # 42
    # The buffer is freed here.
```

> "Pairing every `malloc()` with a matching `free()` by hand is easy to get
> wrong. A context manager can manage the allocation and release it for you.
> When the following block exits, `__exit__()` calls `free()`, even after a
> raised error."
> — <https://mojolang.org/docs/manual/c-ffi/>

**Pitfall:** `free()` is called on the `NoneType` bitcast of the pointer. Keep
the `MutUntrackedOrigin` on the field so Mojo does not try to track C-owned
memory as if it belonged to a value.

### Null returns

> "C uses null pointers to mean "nothing" or "failed." A Mojo `Pointer` can't be
> null, so wrap any "maybe null" return in `Optional`. …
>
> `Optional`'s empty case adds nothing to the call and costs nothing to pass:"

```mojo
from std.ffi import external_call, c_char

def main() raises:
    var name: String = "PATH"
    var found = external_call[
        "getenv", Optional[Pointer[c_char, MutUntrackedOrigin]]
    ](name.as_c_string_slice().unsafe_ptr())
    if found:
        print(String(unsafe_from_utf8_ptr=found.value()))
    else:
        print(t"{name} is not set")
```

> "Declaring an unwrapped, non-optional `Pointer` would compile. It would also
> treat C's null as a valid pointer. Dereferencing results in undefined behavior
> and will typically crash your program."
> — <https://mojolang.org/docs/manual/c-ffi/>

**Pitfall:** any C function that can return `NULL` must have its Mojo return type
wrapped in `Optional`. This is not enforced.

### Keeping Mojo values alive

> "Pointers into Mojo memory carry an origin that tracks the value's lifetime.
> When you derive a pointer from a variable, Mojo keeps the variable alive while
> the pointer is live. It rejects code that would let the variable die first:"

```mojo
from std.ffi import OwnedDLHandle, c_size_t

def main() raises:
    var proc = OwnedDLHandle()  # No path: opens the current process.
    var c_strlen = proc.get_function[c_size_t]("strlen")

    # The pointer carries `line`'s origin, so `line` outlives the call.
    var line = String("Hello")
    var n = c_strlen(line.as_c_string_slice().unsafe_ptr())
    print(t"length of '{line}': {n}")  # 5

    # Refill the same variable and call again. The origin still holds.
    line = "Hello, Mojo!"
    n = c_strlen(line.as_c_string_slice().unsafe_ptr())
    print(t"length of '{line}': {n}")  # 12
```

> "The pointer's origin ties its lifetime to `line`. Mojo keeps `line` alive
> while C uses the pointer. As a result, you don't need workarounds to extend its
> lifetime."
> — <https://mojolang.org/docs/manual/c-ffi/>

**Pitfall:** the origin only protects a pointer while Mojo can see it:

> "**Pointers C keeps after the call** (both): An origin protects a pointer for
> as long as Mojo can see it. Mojo can't see C storing your pointer for later, so
> a call returning doesn't mean C is finished with what you passed. Check the C
> documentation for whether a function retains the pointer."

## Unsafe operations used with C

> "Mojo marks operations it can't check for you with an `unsafe_` prefix, the same
> convention used throughout the standard library. This page uses four:
> `unsafe_ptr()` to hand C a raw pointer, `unsafe_bitcast()` to reinterpret one,
> `unsafe_offset=` to index past the first element, and
> `String(unsafe_from_utf8_ptr=)` to trust bytes C gave you.
>
> Each `unsafe_` operation marks a guarantee and responsibility you've taken over
> from the compiler.
>
> Origins still help wherever a pointer stays inside Mojo's view. Deriving a
> pointer from a variable, as in `line.as_c_string_slice().unsafe_ptr()`, keeps
> that variable alive for as long as the pointer lives. That protection ends when
> C stores the pointer somewhere Mojo can't see.
>
> `external_call()` and `OwnedDLHandle` are intentionally low level. Neither
> validates C signatures or protects you from ABI mismatches. Small declaration
> mistakes can produce plausible but incorrect results, while others fail only at
> build time or when you move to a different platform."
> — <https://mojolang.org/docs/manual/c-ffi/>

## The complete list of traps

Mojo's manual groups the failure modes by when they appear. This is the checklist
to run against any FFI code.

### Silently wrong at runtime

| Trap | What goes wrong |
|---|---|
| Type matching (both APIs) | "Nothing validates your arguments or return type against the C declaration" |
| Return type width | Narrower return type truncates; the value can still look plausible |
| Argument type width and signedness | The callee reads a register the caller never fully set |
| Undeclared argument types (`OwnedDLHandle`) | `get_function()` connects no argument types; a `c_int` to `sqrt` returns `0.0` |
| Raw `String` arguments (`OwnedDLHandle`) | The callable reads the `String` struct's bytes; `strlen` returns 5 for a 53-byte string |
| Pointers returned into a library | Return type must borrow from the handle; declaring `ImmStaticOrigin` reads freed memory |
| Variadic callees without `num_fixed_args` | Wrong ABI on ARM64 macOS; can work on x86-64 Linux |
| Platform-varying C types | `c_long`/`c_ulong` resolve per target; `Int64` happens to work today but is not the contract |
| Pointers C keeps after the call | An origin protects only while Mojo can see the pointer |
| Non-nul-terminated buffers | A bare `Pointer[c_char]` lets a C string function read off the end |

### Caught at build time

| Trap | What goes wrong |
|---|---|
| Two signatures for one symbol in a module (`external_call()`) | Build fails, and "the diagnostic points into `std.ffi` rather than at either of your call sites" |
| String arguments (`external_call()`) | Rejected at compile time; "the error names `as_c_string_slice()` as the fix" |
| Return types must be `RegisterPassable` | Anything larger is rejected; use a hidden pointer + `NoneType` return |

### Limitations

| Limitation | Consequence |
|---|---|
| `external_call()` cannot load dynamic libraries | Use `OwnedDLHandle` for a runtime-loaded library |
| Function resolution is by C symbol name | C++ functions need `extern "C"` |
| `OwnedDLHandle` resolves everything at runtime | Wrong library or symbol fails at run time; `check_symbol()` validates existence, not signature |
| `mojo run` and `mojo build` resolve symbols differently | A symbol can resolve under `mojo run` and fail under `mojo build` with `DSO missing from command line`; name the library in `MODULAR_MOJO_MAX_SYSTEM_LIBS` |

The 1.0.0 notes also warn that the "unsafe operations prefixed with `unsafe_`"
unification changed many spellings: `load()` → `unsafe_load()`, `store()` →
`unsafe_store()`, `[i]` → `[unsafe_offset=i]`, and so on.
(<https://mojolang.org/releases/v1.0.0/>) Old spellings still compile with a
deprecation warning in 1.0.0; write the `unsafe_` spelling in new code.

## What the APIs do check

> "Two guarantees `OwnedDLHandle` provides that `external_call()` doesn't:
>
> - A missing symbol raises an error rather than aborting the process, so you can
>   probe for optional symbols.
> - The callable from `get_function()` borrows the handle, so the library can't be
>   closed between the lookup and the call."
> — <https://mojolang.org/docs/manual/c-ffi/>

The one signature mistake `external_call()` catches is a raw `String` argument;
everything else is unchecked.

## A safe workflow

1. **Read the C header.** Copy the exact declaration.
2. **Translate every type through `std.ffi` aliases.** Never guess a width.
3. **Decide the direction of each pointer.** In-parameter → `Pointer` with the
   caller's origin; out-parameter → a local `var` plus `Pointer(to=...)`, or
   `mut`; C-owned → `MutUntrackedOrigin`.
4. **Wrap every nullable return in `Optional`.**
5. **Pass `num_fixed_args` for variadics.**
6. **For strings, always go through `as_c_string_slice()`/`unsafe_from_utf8_ptr=`.**
7. **Free on the allocating side**, preferably with a context manager.
8. **Do not cache a `List` pointer across a mutation.**
9. **Test on more than one platform** if the code will ship on more than one;
   ABI bugs are target-specific by nature.

## Open questions

> **Open question:** `std.ffi`'s index lists only `c_char`, `c_double`, `c_float`,
> `c_int`, `c_long`, `c_long_long`, `c_pid_t`, `c_short`, `c_size_t`,
> `c_ssize_t`, `c_uchar`, `c_uint`, `c_ulong`, `c_ulong_long`, `c_ushort`.
> There is no documented `c_bool` or `c_wchar_t`. For a C `_Bool`, pass `Bool`
> explicitly and verify the ABI by hand.

> **Open question:** the manual's C-FFI page documents `MODULAR_MOJO_MAX_SYSTEM_LIBS`
> for `mojo build` link failures, but the variable is not listed on an environment
> variable reference page. Search the installed toolchain if the symbol resolves
> under `mojo run` but not under `mojo build`.

> **Open question:** the manual says the `qsort` comparison "must be *thin*" and
> marked `abi("C")`, but does not state what happens if a *capturing* closure is
> passed. Treat it as a hard requirement: the compiler will not generate a C
> entry point for a closure with captures.

## Sources

- <https://mojolang.org/docs/manual/c-ffi/>
- <https://mojolang.org/docs/manual/c-ffi/#c-type-reference>
- <https://mojolang.org/docs/manual/c-ffi/#pointers>
- <https://mojolang.org/docs/std/ffi/>
- <https://mojolang.org/docs/reference/function-declarations/#thin>
- <https://mojolang.org/docs/reference/function-declarations/#abi-c>
- <https://mojolang.org/docs/reference/decorators/export/>
- <https://mojolang.org/docs/faq/>
- <https://mojolang.org/releases/v1.0.0/>
