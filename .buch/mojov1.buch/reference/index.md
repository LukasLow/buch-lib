# Language reference

This chapter mirrors the **official Mojo language reference** page for page. Its
job is the one the tour chapters cannot do: give the *complete formal form* of
every construct — the grammar, the exhaustive tables, every alternative — so a
reader or an agent can look up the exact rule instead of a teaching example.

Unlike the tour pages elsewhere in this buch, these pages do not teach from
scratch. Where a topic is already introduced in `basics/`, `types/` or
`functions/`, the reference page gives the complete grammar and table view and
links to the tour for the guided explanation. The tour teaches; the reference
enumerates. Read a reference page when you need the exact rule; read the tour
page when you are learning the concept.

## Pages

| Page | Covers | Official counterpart |
|------|--------|----------------------|
| [Expressions](expressions.md) | Identifier, parenthesized, tuple, display, member, call, subscript, slice, ternary, walrus, comprehension and function-type expressions | `/docs/reference/expressions/` |
| [Simple statements](simple-statements.md) | Imports, expression statements, assignments, `var`/`ref`, `pass`, `return`, `raise`, `break`/`continue`, `comptime` | `/docs/reference/simple-statements/` |
| [Compound statements](compound-statements.md) | `if`, `while`, `for`, loop `else`, `try`/`except`/`else`/`finally`, `with`, `comptime if`/`comptime for`, scopes | `/docs/reference/compound-statements/` |
| [Literals](literals.md) | Integer, float, string, t-string, boolean, `None`, `Self`, discard, ellipsis, with the lexical grammar | `/docs/reference/literals/` |
| [Numeric types](numeric-types.md) | `SIMD`, `DType`, `Scalar`, `Int`, `UInt`, sized integers, floats, `Byte`, the literal rules | `/docs/reference/numeric-types/` |
| [Function declarations](function-declarations.md) | Signatures, markers, argument conventions, variadics, effects, return types, special methods, overloads | `/docs/reference/function-declarations/` |
| [Struct declarations](struct-declarations.md) | Fields, methods, parameters, trait conformance, initializers, lifecycle methods | `/docs/reference/struct-declarations/` |
| [Trait declarations](trait-declarations.md) | Required/provided methods, associated types, refinement, composition, conformance | `/docs/reference/trait-declarations/` |
| [Closure declarations](closure-declarations.md) | Capture lists, capture conventions, the move operator, parametric closures | `/docs/reference/closure-declarations/` |
| [Docstrings](docstrings.md) | Placement, first-sentence rules, structured sections, compiler checks | `/docs/reference/docstrings/` |
| [Inline MLIR](inline-mlir.md) | The `__mlir_*` built-ins: hardware intrinsics, atomics, GPU dialect operations | `/docs/reference/inline-mlir/` |
| [Cheat sheets](cheat-sheets.md) | Dense, offline quick-reference tables for the most-used syntax | `/docs/reference/cheat-sheets/` |

The official reference also has pages that this chapter does **not** duplicate,
because an existing page already carries the complete form:

| Official reference page | Complete form lives in |
|-------------------------|------------------------|
| `/docs/reference/operators/` | [Operators](../basics/operators.md) — full precedence, associativity and symbol reference |
| `/docs/reference/types/` | [Types overview](../types/overview.md) plus the `types/` pages (`integers-and-floats.md`, `bool-and-strings.md`, `collections.md`, `pointers-and-references.md`, `optionals-and-nullability.md`) |
| `/docs/reference/keywords/` | [Keywords](../keywords/index.md) plus [keyword conventions](../keyword-conventions/index.md) |
| `/docs/reference/decorators/` | [Decorators](../decorators/index.md) and one page per built-in decorator |
| `/docs/reference/lambda-expressions/` | [Closures and lambdas](../functions/closures-and-lambdas.md) — signature grammar, captures, thin vs. closure lambdas |

## How to read a signature

Every reference page uses the same notation. In Mojo, angle-bracket groups in
these pages are metasyntax, while square brackets in real code hold **compile-time
parameters** and parentheses hold **run-time arguments**:

| Notation | Meaning |
|----------|---------|
| `name` (italic or plain) | A placeholder you replace |
| `[ ... ]` | Optional element in the grammar; in real Mojo, compile-time parameters |
| `( ... )` | Run-time arguments in real Mojo |
| `<conv>` | One of the argument/capture conventions |
| `→` | A lexical production |
| `...` | Repetition, unless it is a literal trait-requirement marker |
| `*` before a name | Variadic argument |

The convention names `imm`, `mut`, `out`, `deinit`, `raises`, `where` are **not
reserved keywords**; they have fixed meaning only in a declaration.
[`keyword-conventions/`](../keyword-conventions/index.md) owns that distinction.
The 34 true reserved words are in [`keywords/`](../keywords/index.md).

## Sources

- Mojo language reference: <https://mojolang.org/docs/reference/>
- Mojo identifiers, keywords, and conventions reference: <https://mojolang.org/docs/reference/keywords/>
- Mojo operator reference: <https://mojolang.org/docs/reference/operators/>
- Mojo types reference: <https://mojolang.org/docs/reference/types/>
