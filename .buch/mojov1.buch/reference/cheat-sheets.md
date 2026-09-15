# Cheat sheets

This page is the **offline quick-reference** for the `reference/` chapter. The
official cheat-sheets page publishes downloadable image cards (PNG/SVG/PDF) and
cannot be embedded in an offline book, so this page reconstructs the same
quick-reference material as dense tables drawn from the official language
reference. Every fact here also appears on one of the other reference pages,
linked from the right-hand column; this page is a scan sheet, not a substitute
for them.

## How to use this page

- Every table is a lookup, not a lesson. For prose and complete grammar, follow
  the link in the **Detail** column.
- The left column is the syntax you need at hand; the middle is the exact rule.
- The official cards are available at
  <https://mojolang.org/docs/reference/cheat-sheets/> for downloading.

## 1. Literals

| Literal | Forms | Default type |
|---------|-------|--------------|
| Decimal | `42`, `1_000_000`, `1__000_` | `Int` |
| Hex | `0xFF`, `0Xff` | `Int` |
| Octal | `0o52`, `0O52` | `Int` |
| Binary | `0b101010`, `0B1010` | `Int` |
| Float | `1.0`, `.5`, `2.`, `2.5e-3`, `1E10`, `1_000.000_5` | `Float64` |
| String | `"..."`, `'...'`, `"""..."""`, `'''...'''` | `String` (`StringSpan` in a view) |
| Raw string | `r"C:\path"`, `R"..."` | `String` |
| T-string | `t"Hello, {name}!"`, `rt"..."`, `t"""..."""` | `TString` (lazy) |
| Boolean | `True`, `False` | `Bool` |
| None | `None` | `NoneType` |
| Self | `Self` | the enclosing type |
| Discard | `_` | — (identifier) |
| Ellipsis | `...` | — (trait requirement marker) |

Rules: integer and float literals are always non-negative (`-1024` is unary
negation); no leading zeros in decimal; a base prefix needs a digit; an exponent
needs a digit; `{}` in a t-string interpolates (write `{{`/`}}` for literal
braces). Detail: [Literals](literals.md).

## 2. Escape sequences

| Sequence | Meaning | Sequence | Meaning |
|----------|---------|----------|---------|
| `\\` | Backslash | `\a` | Bell |
| `\"` | Double quote | `\b` | Backspace |
| `\'` | Single quote | `\f` | Form feed |
| `\n` | Newline | `\v` | Vertical tab |
| `\r` | Carriage return | `\xHH` | Hex (exactly 2 digits) |
| `\t` | Tab | `\0`–`\377` | Octal (1–3 digits) |
| `\uHHHH` | Unicode (4 hex digits) | `\UHHHHHHHH` | Unicode (8 hex digits) |

Surrogates U+D800–U+DFFF are rejected. Detail: [Literals](literals.md).

## 3. Numbers

| Name | Definition | Width |
|------|------------|-------|
| `Int` | `Scalar[DType.int]` | machine |
| `UInt` | `Scalar[DType.uint]` | machine |
| `Int8`/`UInt8` | `Scalar[DType.int8]` / `…uint8` | 8-bit |
| `Int16`/`UInt16` | `Scalar[DType.int16]` / `…uint16` | 16-bit |
| `Int32`/`UInt32` | `Scalar[DType.int32]` / `…uint32` | 32-bit |
| `Int64`/`UInt64` | `Scalar[DType.int64]` / `…uint64` | 64-bit |
| `Int128`/`UInt128` | `Scalar[DType.int128]` / `…uint128` | 128-bit |
| `Int256`/`UInt256` | `Scalar[DType.int256]` / `…uint256` | 256-bit |
| `Byte` | another name for `UInt8` | 8-bit |
| `Float16`, `Float32`, `Float64` | `Scalar[DType.float16/32/64]` | 16/32/64-bit |
| `BFloat16` | `Scalar[DType.bfloat16]` | 16-bit |
| `Float8_e4m3fn`, `…_e4m3fnuz`, `…_e5m2`, `…_e5m2fnuz`, `…_e8m0fnu` | `Scalar[DType.…]` | 8-bit |
| `Float4_e2m1fn` | `Scalar[DType.float4_e2m1fn]` | 4-bit |
| `SIMD[dtype, width]` | vector type | width = power of two ≤ 2**15 |

| Bounds | Access |
|--------|--------|
| Integer | `T.MIN`, `T.MAX` |
| Float | `T.MAX`, `T.MIN`, `T.MAX_FINITE`, `T.MIN_FINITE` |

Conversions: `Float32(i)` (constructor), `a.cast[DType.int32]()` (SIMD),
`Int(s)`, `Int(mlir_value=…)`. Integer overflow wraps; float→int truncates toward
zero; `nan == nan` is `False`. Detail: [Numeric types](numeric-types.md).

## 4. Operators

| Precedence (tightest → loosest) | Operators | Notes |
|---------------------------------|-----------|-------|
| 1 | `()` `[]` `.` | call, subscript, attribute |
| 2 | `**` | right-associative |
| 3 | `+x` `-x` `~x` | unary prefix |
| 4 | `*` `@` `/` `//` `%` | multiplicative |
| 5 | `+` `-` | additive |
| 6 | `<<` `>>` | shift |
| 7 | `&` | bitwise AND |
| 8 | `^` | bitwise XOR |
| 9 | `\|` | bitwise OR |
| 10 | `==` `!=` `<` `<=` `>` `>=`, `in`, `not in`, `is`, `is not` | chainable |
| 11 | `not` | prefix |
| 12 | `and` | short-circuits |
| 13 | `or` | short-circuits |
| 14 | `a if c else b` | ternary, right-associative |
| 15 | `:=` | walrus; loosest |

| Operator | Meaning |
|----------|---------|
| `a / b` | `/` truncates toward zero (integers) |
| `a // b` | floors toward negative infinity |
| `a % b` | `a == b * (a // b) + (a % b)` |
| `a ^ b` | XOR; `a^` (after a name) transfers |
| `a @ b` | matrix multiply via `__matmul__` |
| `x in c` | `c.__contains__(x)` |
| `x is y` | identity (`ArcPointer`, `PythonObject`, `Optional is None`) |
| `a and b` / `a or b` | short-circuit boolean |
| `not a` | boolean negation |

Assignment operators: `=`, `+=`, `-=`, `*=`, `/=`, `//=`, `%=`, `**=`, `@=`,
`&=`, `|=`, `^=`, `<<=`, `>>=` — statements, not expressions. Detail:
[Operators](../basics/operators.md).

## 5. Declarations

| Declaration | Signature skeleton |
|-------------|--------------------|
| Function | `def name[params](args) effects -> Return where c:` |
| Struct | `struct Name[params](Traits):` |
| Trait | `trait Name(Parents):` |
| Closure | `def name[params](args) effects {captures} -> Return:` |
| Lambda | `lambda [params](args) [effects] [{captures}] [-> R]: expr` |
| `comptime` | `comptime NAME = value` / `comptime NAME: T` |
| Variable | `var name: T = value` |
| Reference | `ref name = lvalue` |

Detail: [Function declarations](function-declarations.md),
[Struct declarations](struct-declarations.md),
[Trait declarations](trait-declarations.md),
[Closure declarations](closure-declarations.md).

## 6. Function markers and conventions

| Marker | Arguments | Parameters |
|--------|-----------|------------|
| `//` | — | infer-only |
| `/` | positional-only | positional-only |
| `*` | keyword-only | keyword-only |

Order is `//`, then `/`, then `*`; each once; `/` not first, `*` not last.

| Convention | Meaning | Default allowed? |
|------------|---------|------------------|
| (none) / `imm` | immutable reference | yes |
| `mut` | mutable reference | no |
| `var` | owned copy | yes |
| `out` | return slot (alone; not with `->`) | — |
| `deinit` | destructive transfer | — |
| `ref` | reference with explicit origin | — |

Variadics: `*values: Int` (homogeneous), `*args: *Ts` (pack). At most one
`*args`; no defaults; `out` can't be variadic.

Effects: `raises [ErrorType]`, `thin` (types only), `abi("C")` (types only, with
`thin`). Detail: [Function declarations](function-declarations.md).

## 7. Special method signatures

| Method | Signature |
|--------|-----------|
| Initializer | `def __init__(out self, ...)` |
| Copy constructor | `def __init__(out self, *, copy: Self)` |
| Move constructor | `def __init__(out self, *, deinit move: Self)` |
| Destructor | `def __deinit__(deinit self)` |
| Callable | `def __call__(self, ...) -> R` |
| Context manager | `def __enter__(self) -> Self` / `def __exit__(self)` |
| Operator dunders | `__add__`, `__eq__`, `__getitem__`, `__contains__`, … |

Detail: [Function declarations](function-declarations.md),
[Struct declarations](struct-declarations.md),
[Operator support](../types/operator-support.md).

## 8. Struct body elements

| Element | Syntax |
|---------|--------|
| Field | `var name: Type` (no default) |
| Method | `def name(self, ...)` |
| Static method | `@staticmethod def name(...)` |
| `comptime` constant | `comptime name = value` |
| Initializer | `def __init__(out self, ...)` |
| Destructor | `def __deinit__(deinit self)` |
| Conformance | `struct Name(TraitA, TraitB):` |
| Conditional conformance | `struct Name(Trait where conforms_to(T, Trait)):` |
| Parameter | `struct Name[T: Copyable]:` with `var x: Self.T` |

Detail: [Struct declarations](struct-declarations.md).

## 9. Trait body elements

| Element | Syntax | Meaning |
|---------|--------|---------|
| Required method | `def m(self): ...` | must implement |
| Provided method | `def m(self): <body>` | default; may override |
| `pass` body | `def m(self): pass` | provided no-op; `None` return only |
| Associated type | `comptime Name: Trait` | conforming type supplies a type |
| Required value | `comptime name: Type` | conforming type supplies a value |
| Constant | `comptime name = value` | shared |

Traits: no parameter lists, no fields, no `where` on methods. Detail:
[Trait declarations](trait-declarations.md).

## 10. Capture conventions

| Capture | Form | Semantics |
|---------|------|-----------|
| Immutable reference | `{imm x}` / `{imm}` | sees current outer value |
| Mutable reference | `{mut x}` / `{mut}` | writes outer binding |
| Reference | `{ref x}` / `{ref}` | mutability from origin |
| Owned copy | `{var x}` / `{var}` | independent copy at declaration |
| Move | `{var x^}` / `{x^}` | consumes outer binding |
| Copyable default | `{var^}` | move-capture all; `Copyable` if captures are |

Bare `{x}` = `{imm x}`. One default entry max. `^` requires `var` (or bare).
Detail: [Closure declarations](closure-declarations.md).

## 11. Statements

| Statement | Form |
|-----------|------|
| Import | `import mod`, `import mod as m`, `from mod import a, b`, `from mod import *` |
| Expression | `expr` (warn if non-`None` result unused) |
| Discard | `_ = expr` |
| Variable | `var x = v`, `var x: T`, `var x: T = v` |
| Reference | `ref x = lvalue` |
| Multiple assign | `var a = var b = v` (right-associative) |
| Destructure | `var a, b = pair`, `var (a, b) = pair` |
| Swap | `a, b = b, a` |
| Augmented | `x += y` and the rest |
| `pass` / `return` / `raise` / `break` / `continue` | as named |
| `comptime` | `comptime NAME = value` |

Detail: [Simple statements](simple-statements.md).

## 12. Compound statements

| Statement | Form |
|-----------|------|
| `if` | `if c:` … `elif c:` … `else:` |
| `while` | `while c:` … `else:` |
| `for` | `for t in it:` … `else:` |
| Loop bindings | `for x in c:` (imm), `for ref x in c:` (ref), `for var x in c:` (copy) |
| `try` | `try:` `except e:` `except:` `else:` `finally:` |
| `with` | `with mgr as name, mgr2 as name2:` |
| `comptime if` | `comptime if c:` … `else:` |
| `comptime for` | `comptime for i in range(n):` |

Loop `else` runs only on normal completion (not after `break`). A `try` needs at
least one `except` or `finally` and handles one error type. Detail:
[Compound statements](compound-statements.md).

## 13. Expressions

| Form | Syntax |
|------|--------|
| Parenthesized | `(expr)` |
| Tuple | `a, b`, `(a, b)`, `(1,)`, `()` |
| List display | `[a, b, c]` (trailing comma allowed) |
| Dict display | `{k: v, …}` |
| Set display | `{a, b, c}` (needs `from std.collections import Set` to use the type) |
| Initializer list | `{k=v, …}` → `T(k=v, …)` when `T` is known |
| Member | `a.b`, `a.b.c` |
| Call | `f(a, k=v)` (positional before keyword) |
| Subscript | `a[i]`, `a[i, j]`, `m["k"]` |
| Slice | `a[start:stop:stride]`, `a[::2]`, `a[::-1]` |
| Ternary | `x if c else y` |
| Walrus | `n := expr` |
| `comptime` | `comptime(expr)` (parentheses required) |
| Reflection | `type_of(x)`, `conforms_to(T, Trait)`, `origin_of(x)` |
| Function type | `def(T) thin -> U`, `def() raises -> R` |
| Comprehension | `[e for p in it if c]`, `{e …}`, `{k: v …}` |

Detail: [Expressions](expressions.md).

## 14. Comprehension syntax

| Kind | Syntax |
|------|--------|
| List | `[expr for pattern in iterable if condition]` |
| Set | `{expr for pattern in iterable if condition}` |
| Dict | `{key_expr: value_expr for pattern in iterable if condition}` |
| Multiple clauses | add more `for`/`if` clauses; evaluated left to right |

Detail: [Expressions](expressions.md).

## 15. Docstring sections

| Section | Documents | Checked? |
|---------|-----------|----------|
| `Parameters:` | compile-time parameters | yes |
| `Args:` | runtime arguments | yes |
| `Returns:` | return value | yes |
| `Raises:` | error conditions | yes |
| `Constraints:` | compile-time requirements | no |
| `Preconditions:` | runtime caller conditions that abort | no |
| `Performance:` | performance characteristics | no |
| `Safety:` | unsafe states | no |
| `See:` | related references | no |
| `Examples:` | usage examples (last) | no |

Summary rule: first sentence, capital start, ends with `.` `!` `?` or a backtick.
Placement: functions after the signature; structs/traits after the opening line;
fields and `comptime` *after* the declaration; modules first string in the file;
packages in `__init__.mojo`. `@doc_hidden` hides; `%#` hides example lines.
Detail: [Docstrings](docstrings.md).

## 16. Inline MLIR

| Built-in | Produces |
|----------|----------|
| `__mlir_type.name` / `` __mlir_type.`!dialect.type` `` / `__mlir_type[...]` | a type |
| `__mlir_attr.name` / `` __mlir_attr.`…` `` / `__mlir_attr[...]` | a compile-time value |
| `` __mlir_op.`dialect.op`[attrs](operands) `` | a runtime value or `None` |
| `__mlir_region name(args): body` | a single-block region |

Special attributes: `_type` (result type; `None` for no result), `_properties`
(`DictionaryAttr`), `_region` (region name). Common dialects: `pop.*` (portable),
`index.*` (built-in), `kgen.*`, `lit.*`, `llvm.*`, `nvvm.*`, `co.*`. **Unstable:**
`pop`, `kgen`, `co`, `lit` may change without notice. Detail:
[Inline MLIR](inline-mlir.md).

## 17. Common pitfalls at a glance

| Wrong | Right |
|-------|-------|
| `fn f():` | `def f():` |
| `0123` | `0o123` |
| `x = 0` (declaration) | `var x = 0` |
| `2 ** 3 == 8` as a chain | `(2 ** 3) == 8` |
| `a && b` / `a \|\| b` | `a and b` / `a or b` |
| `^` for power | `**` for power; `^` is XOR/transfer |
| `out result: T` with `-> T` | pick one |
| `def __init__(self)` | `def __init__(out self)` |
| bare `self` then mutate | `mut self` |
| `**kwargs` | `var **kwargs` |
| `def wrong(mut x: Int = 0)` | `mut` takes no default |
| `for x in c:` then mutate | `for ref x in c:` |
| `x > 0 and print(...)` | `if x > 0: print(...)` |
| `arguments:` in a docstring | `Args:` |
| `len(args)` in a `comptime for` | `args.__len__()` |
| `Set` display without import | `from std.collections import Set` |
| `SIMD[dtype, size=4]` | `SIMD[dtype, length=4]` |
| positional-index a `StringLiteral` | `s[byte=]`, `s[codepoint=]`, `s[grapheme=]` |

Detail: the `Pitfalls` section of each reference page.

## Sources

- Mojo cheat sheets: <https://mojolang.org/docs/reference/cheat-sheets/>
- Mojo language reference: <https://mojolang.org/docs/reference/>
- Mojo expression reference: <https://mojolang.org/docs/reference/expressions/>
- Mojo literals reference: <https://mojolang.org/docs/reference/literals/>
- Mojo numeric types reference: <https://mojolang.org/docs/reference/numeric-types/>
- Mojo simple statements reference: <https://mojolang.org/docs/reference/simple-statements/>
- Mojo compound statements reference: <https://mojolang.org/docs/reference/compound-statements/>
- Mojo function declarations reference: <https://mojolang.org/docs/reference/function-declarations/>
- Mojo struct declarations reference: <https://mojolang.org/docs/reference/struct-declarations/>
- Mojo trait declarations reference: <https://mojolang.org/docs/reference/trait-declarations/>
- Mojo closure declarations reference: <https://mojolang.org/docs/reference/closure-declarations/>
- Mojo docstring reference: <https://mojolang.org/docs/reference/docstrings/>
- Mojo inline MLIR reference: <https://mojolang.org/docs/reference/inline-mlir/>
- Mojo operator reference: <https://mojolang.org/docs/reference/operators/>
