# ffi

`ffi` is Mojo's foreign function interface for C code and dynamic libraries.

> Foreign function interface (FFI) for calling C code and loading libraries.

Source: <https://mojolang.org/docs/std/ffi/>.

The package page lists its parts precisely:

> - **C type aliases**: `c_int`, `c_char`, `c_long`, `c_size_t`, etc. for portable
>   type definitions that match C's type sizes on each platform.
> - **Dynamic library loading**: `OwnedDLHandle` for loading shared libraries at
>   runtime and calling their functions.
> - **External function calls**: `external_call()` for calling C functions by name
>   with compile-time resolution.
> - **String interop**: `CStringSlice` for working with null-terminated C strings.

Source: <https://mojolang.org/docs/std/ffi/>.

The book's interop chapter covers the whole calling-C story:
[calling C](../interop/calling-c.md).

## C type aliases

These are `comptime` values defined at the package root:

| Alias | Expands to | Note |
|-------|-----------|------|
| `c_char` | `Int8` | C `char`. |
| `c_short` | `Int16` | C `short`. |
| `c_int` | `Int32` | C `int` (signed 32-bit on common targets). |
| `c_long` | `Scalar[_c_long_dtype()]` | 64-bit on macOS/Linux, 32-bit on Windows. |
| `c_long_long` | `Scalar[_c_long_long_dtype()]` | C `long long`. |
| `c_uchar` | `UInt8` | C `unsigned char`. |
| `c_ushort` | `UInt16` | C `unsigned short`. |
| `c_uint` | `UInt32` | C `unsigned int`. |
| `c_ulong` | `Scalar[_c_long_dtype[True]()]` | C `unsigned long`. |
| `c_ulong_long` | `Scalar[_c_long_long_dtype[True]()]` | C `unsigned long long`. |
| `c_size_t` | `UInt` | C `size_t`. |
| `c_ssize_t` | `Int` | `ssize_t`. |
| `c_pid_t` | `Int` | C `pid_t`. |
| `c_float` | `Float32` | C `float`. |
| `c_double` | `Float64` | C `double`. |

Source: <https://mojolang.org/docs/std/ffi/>.

Two package-level constants also matter: `DEFAULT_RTLD`, "Default runtime linker
flags for dynamic library loading", and `MAX_PATH`, "Maximum path length for the
current platform". Source: <https://mojolang.org/docs/std/ffi/>.

## `external_call`

The simplest path to a C function already linked into the process:

```mojo
from std.ffi import c_int, external_call

def get_random() -> c_int:
    return external_call["rand", c_int]()
```

Source: <https://mojolang.org/docs/std/ffi/>.

`external_call` is declared as "Calls an external function". Source:
<https://mojolang.org/docs/std/ffi/external_call/>. The function name is a
**parameter** and the return type is the second element of the bracket list,
which is how the call is resolved at compile time. No headers and no manual
declaration are involved.

## `OwnedDLHandle` — runtime library loading

For a library that is not linked in at build time:

```mojo
from std.ffi import OwnedDLHandle

def main() raises:
    var lib = OwnedDLHandle("libm.so")
    var sqrt = lib.get_function[Float64]("sqrt")
    print(sqrt(4.0))  # 2.0
```

Source: <https://mojolang.org/docs/std/ffi/>.

`OwnedDLHandle` is documented as "Represents an owned handle to a dynamically
linked library with RAII semantics". Source:
<https://mojolang.org/docs/std/ffi/OwnedDLHandle/>. The RAII detail matters: the
handle closes the library when it is destroyed, and the operation is raising
(`main() raises`), so a missing library surfaces as an error rather than a crash.

`RTLD` is the companion enum: "Enumeration of the RTLD flags used during dynamic
library loading." Source: <https://mojolang.org/docs/std/ffi/RTLD/>.

## `CStringSlice` and `cstring`

`CStringSlice` is "A non-owning immutable view to a nul-terminated C string
(`const char*`)". The `cstring` module "Implements C string interoperability
utilities." Sources: <https://mojolang.org/docs/std/ffi/cstring/CStringSlice/>,
<https://mojolang.org/docs/std/ffi/cstring/>.

Use it when a C API returns `const char*` and you need to read it as Mojo text
without copying.

## `UnsafeUnion`

> An untagged union that can store any one of its element types.

Source: <https://mojolang.org/docs/std/ffi/unsafe_union/UnsafeUnion/>. It exists
for C unions, where the active member is not tracked. It is `Unsafe` by name and
it is the caller's job to know which member is live.

## Idioms

- **Use the `c_*` aliases, never raw sized integers**, when declaring a C
  function's signature. `c_long` genuinely differs between platforms.
- **Use `external_call` for a symbol known at compile time**, and
  `OwnedDLHandle` only when the library must be loaded at runtime.
- **Treat every FFI call as unsafe.** The compiler cannot check a C function's
  contract; get the types, ownership and null-termination right by hand.
- **Keep the C surface in one module.** Wrap each foreign function in a typed
  Mojo function so the rest of the program never touches `c_*` types.
- **Handle the raising case.** Dynamic loading is documented as raising; make the
  caller `raises` or handle it with `try`.

## Pitfalls

- **Assuming `c_long` is 64-bit.** The docs state it is typically 64-bit on
  macOS/Linux and 32-bit on Windows. Source:
  <https://mojolang.org/docs/std/ffi/>.
- **Passing a Mojo `String` to a C function expecting `char*`.** Use
  `CStringSlice` or `String.as_c_string_slice()`.
- **Ignoring the RAII lifetime of `OwnedDLHandle`.** A function pointer obtained
  from the handle is only valid while the handle lives.
- **Using `UnsafeUnion` without tracking the active member.** It is untagged by
  definition.
- **Forgetting `raises` on dynamic loading.** The documented example's `main()` is
  `raises`.
- **Bypassing the FFI layer for the language's own C-adjacent types.** `Pointer`
  and `Span` live in [`memory`](memory.md) and [`collections`](collections.md);
  `ffi` is specifically about C interop.

## Stability

The `ffi` package page shows **no `@stable(since=...)` marker**, and the
individual symbol pages (`OwnedDLHandle`, `RTLD`, `external_call`,
`CStringSlice`, `UnsafeUnion`) show no stability badges either. Under the
standard-library rule — "We consider standard library APIs unstable unless
specifically marked stable" — these APIs are **unstable by default**. Sources:
<https://mojolang.org/docs/std/ffi/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `ffi` package: <https://mojolang.org/docs/std/ffi/>
- Mojo `OwnedDLHandle`: <https://mojolang.org/docs/std/ffi/OwnedDLHandle/>
- Mojo `RTLD`: <https://mojolang.org/docs/std/ffi/RTLD/>
- Mojo `external_call`: <https://mojolang.org/docs/std/ffi/external_call/>
- Mojo `CStringSlice`: <https://mojolang.org/docs/std/ffi/cstring/CStringSlice/>
- Mojo `cstring` module: <https://mojolang.org/docs/std/ffi/cstring/>
- Mojo `UnsafeUnion`: <https://mojolang.org/docs/std/ffi/unsafe_union/UnsafeUnion/>
- Mojo `unsafe_union` module: <https://mojolang.org/docs/std/ffi/unsafe_union/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
