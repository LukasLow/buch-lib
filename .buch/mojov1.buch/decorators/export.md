# @export

`@export` makes a function **publicly available as an exported symbol** in the
compiled artifact, so code outside Mojo — C, C++, or Python — can call it. An
`@export` function must declare its calling convention with an explicit `abi`
effect.

> You can add the `@export` decorator on any function to make it publicly
> available as an exported symbol in the compiled artifact, allowing it to be
> called from external code. An `@export` function must declare its calling
> convention with an explicit `abi` effect.

Source: <https://mojolang.org/docs/reference/decorators/export/>.

## Target

`@export` applies to `def` declarations only. Source:
<https://mojolang.org/docs/reference/decorators/>.

## Basic usage

By default the function is exported under its own name; an optional argument
exports it under a different name:

```mojo
# This function is internal - not an exported symbol
def internal_helper():
    print("Internal")

# This function is exported under its own name, "my_exported_function"
@export
def my_exported_function() abi("Mojo"):
    print("Exported!")
    internal_helper()

# This function is exported under the name "my_renamed_function"
@export("my_renamed_function")
def my_other_function() abi("Mojo"):
    print("Another function.")
```

Source: <https://mojolang.org/docs/reference/decorators/export/>.

## Exporting with the C calling convention

Use a name argument plus `abi("C")` to produce a C-compatible symbol. The
exported name must be a valid C identifier:

```mojo
@export("my_func")
def my_function(
    name: StaticString,
    ptr: OpaquePointer[MutUntrackedOrigin],
) abi("C") -> None:
    pass
```

Source: <https://mojolang.org/docs/reference/decorators/export/>.

`abi("C")` also pairs with `thin` in function *types*; see the
function-declarations reference. Source:
<https://mojolang.org/docs/reference/function-declarations/>.

## Shared libraries need manual runtime initialization

The reference carries a note that matters for real C/C++ integration:

> If you compile an exported function into a shared library
> (`mojo build --emit shared-lib`) and call it from a non-Mojo host program such
> as C or C++, no Mojo `main()` function runs, so the Mojo runtime is never
> initialized. Call `initialize_runtime()` before calling any other standard
> library functions.

Source: <https://mojolang.org/docs/reference/decorators/export/>.

## Exporting to Python

For Python, the reference points to the module-builder path rather than `@export`:

> To call Mojo from Python, register functions with a module builder. See
> "Calling Mojo from Python" for details.

Source: <https://mojolang.org/docs/reference/decorators/export/>.

## The explicit `abi` requirement

In 1.0 an `@export` function without an `abi` effect is deprecated, and the old
`ABI="C"` spelling is deprecated as well:

> `@export` with no explicit `abi` effect, or `ABI="C"` ... explicit `abi("C")`
> effect ... v1.0.0b2: `ABI="C"` deprecated; missing `abi` on `@export` warns.

Source: <https://mojolang.org/releases/v1.0.0/>.

Always write `abi("Mojo")` for a Mojo-native export or `abi("C")` for a C
export.

## Pitfalls

- **Omitting the `abi` effect.** It warns (and is deprecated); write
  `abi("Mojo")` or `abi("C")`. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Using `ABI="C"`.** That older parameter is deprecated; use the `abi("C")`
  effect. Source: <https://mojolang.org/releases/v1.0.0/>.
- **Exporting a C symbol under an invalid C identifier.** The optional name must
  be a valid C identifier when combined with `abi("C")`. Verified above.
- **Forgetting `initialize_runtime()` in a shared library.** No `main()` runs in
  a non-Mojo host, so the runtime is uninitialized. Verified above.
- **Combining `abi("C")` with `raises`.** The compiler rejects it. Source:
  <https://mojolang.org/docs/reference/function-declarations/>.
- **Expecting `@export` to help Python calls directly.** Python integration uses
  the module builder. Verified above.

## Sources

- `@export` reference: <https://mojolang.org/docs/reference/decorators/export/>
- Mojo decorators reference (target table):
  <https://mojolang.org/docs/reference/decorators/>
- Mojo function declarations reference (`abi` effects):
  <https://mojolang.org/docs/reference/function-declarations/>
- Mojo v1.0.0 release notes (`abi` requirement):
  <https://mojolang.org/releases/v1.0.0/>
