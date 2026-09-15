# Official docs map — fetched from https://mojolang.org/llms.txt on 2026-09-15 (reports Version: 1.0.0). Content below is verbatim, unedited.

# Mojo programming language documentation

> Official documentation for the Mojo programming language, including the manual, language reference, standard library API docs, and more.

Version: 1.0.0

For section-specific indexes, see:
- [Mojo standard library (index only)](/llms-stdlib.txt)
- [Mojo manual (full content)](/llms-manual.txt)
- [Mojo language reference (full content)](/llms-reference.txt)
- [Mojo CLI reference (full content)](/llms-cli.txt)


## Table of Contents

- [Install Mojo](https://mojolang.org/install/): You can install Mojo using pixi, uv, conda, pip, or other Python/Conda package managers.
- [Mojo FAQ](https://mojolang.org/docs/faq/): Answers to questions we expect about Mojo.
- [Documentation](https://mojolang.org/docs/): All the documentation for the Mojo programming language.
- [Pixi basics](https://mojolang.org/docs/pixi/): Pixi is a CLI tool [from Prefix.dev](https://prefix.dev/blog/launching_pixi)
- [System requirements](https://mojolang.org/docs/requirements/): Operating system, hardware, software, and GPU compatibility requirements for Mojo.
- [Mojo roadmap](https://mojolang.org/docs/roadmap/): A summary of our plans and priorities to improve the Mojo language.
- [Mojo vision](https://mojolang.org/docs/vision/): Our motivations and the design decisions that define the Mojo programming language
- [Mojo language basics](https://mojolang.org/docs/manual/basics/): An overview of the Mojo language.
- [Using Mojo's C foreign function interface to call C libraries](https://mojolang.org/docs/manual/c-ffi/): Call C libraries from Mojo. Pass values, pointers, strings, and structs safely across the FFI boundary.
- [Control flow](https://mojolang.org/docs/manual/control-flow/): Mojo control flow statements.
- [Errors, error handling, and context managers](https://mojolang.org/docs/manual/errors/): Mojo represents errors as values—specifically, as alternate return values from
- [Closures](https://mojolang.org/docs/manual/functions/closures/): Functions that capture values from their surrounding scope
- [Lambda expressions](https://mojolang.org/docs/manual/functions/lambda/): Lambda expressions are small anonymous functions that let you write immediate custom behavior for use in other statements and functions.
- [Functions](https://mojolang.org/docs/manual/functions/): Introduction to Mojo functions.
- [Parameterized declarations](https://mojolang.org/docs/manual/generics/): Write code that builds and runs across many types using parameterized declarations.
- [Get started with Mojo](https://mojolang.org/docs/manual/get-started/): Install Mojo and learn the language basics by building a complete Mojo program
- [Mojo Manual](https://mojolang.org/docs/manual/): A comprehensive guide to the Mojo programming language.
- [Value destruction](https://mojolang.org/docs/manual/lifecycle/death/): An explanation of when and how Mojo destroys values.
- [Intro to value lifecycle](https://mojolang.org/docs/manual/lifecycle/): An introduction to the value lifecycle.
- [Deep dive - Instance initialization](https://mojolang.org/docs/manual/lifecycle/initialization/): Understanding logical and fieldwise initialization is fundamental to working with structs.
- [Value creation](https://mojolang.org/docs/manual/lifecycle/life/): An explanation of when and how Mojo creates values.
- [Compile-time evaluation](https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/): When and how code is executed at compile time.
- [Comptime constraints and assertions](https://mojolang.org/docs/manual/metaprogramming/constraints/): How to use Mojo's constraint system to express program guarantees.
- [Intro to metaprogramming](https://mojolang.org/docs/manual/metaprogramming/): An overview of Mojo's metaprogramming features.
- [Materializing compile-time values at run time](https://mojolang.org/docs/manual/metaprogramming/materialization/): How to use compile-time values at run time.
- [Reflection](https://mojolang.org/docs/manual/metaprogramming/reflection/): Compile-time reflection utilities for introspecting Mojo types and functions
- [Operators](https://mojolang.org/docs/manual/operators/): Arithmetic, comparison, bitwise, boolean, and assignment operators in Mojo, with precedence and examples.
- [Modules and packages](https://mojolang.org/docs/manual/packages/): Learn how to organize Mojo code into modules and packages.
- [Parameterization](https://mojolang.org/docs/manual/parameters/): Creating and using parameterized structs and functions.
- [Intro to pointers](https://mojolang.org/docs/manual/pointers/): An overview of accessing memory using Mojo's pointer types.
- [Using pointers](https://mojolang.org/docs/manual/pointers/using-pointers/): Using pointers and dynamically-allocated memory.
- [Python interoperability](https://mojolang.org/docs/manual/python/): Using Python and Mojo together.
- [Calling Mojo from Python](https://mojolang.org/docs/manual/python/mojo-from-python/): How to import and use Mojo modules in Python code.
- [Calling Python from Mojo](https://mojolang.org/docs/manual/python/python-from-mojo/): How to import and use Python modules in Mojo code.
- [Python types](https://mojolang.org/docs/manual/python/types/): Using Mojo types in Python, and Python types in Mojo.
- [Mojo tips for Python devs](https://mojolang.org/docs/manual/python-to-mojo/): Explore ways Mojo differs from Python as you prepare to migrate
- [Mojo quickstart](https://mojolang.org/docs/manual/quickstart/): Get up and running fast with the Mojo programming language
- [Mojo structs](https://mojolang.org/docs/manual/structs/): Introduction to Mojo structures (structs).
- [Add operator support to custom types](https://mojolang.org/docs/manual/structs/operator-support/): Implement operators for your custom types by creating dunder methods in your struct.
- [Self-referential structs](https://mojolang.org/docs/manual/structs/reference/): Mojo structs can't directly contain themselves. Learn how to use pointers to build linked lists, trees, and other self-referential data structures.
- [Traits](https://mojolang.org/docs/manual/traits/): What a trait is, why Mojo needs them, and how to use one.
- [Types](https://mojolang.org/docs/manual/types/): Standard Mojo data types.
- [Intro to value ownership](https://mojolang.org/docs/manual/values/): Introduction to Mojo value ownership.
- [Lifetimes, origins, and references](https://mojolang.org/docs/manual/values/lifetimes/): Working with origins and references.
- [Ownership](https://mojolang.org/docs/manual/values/ownership/): How Mojo shares references through function arguments.
- [Value semantics](https://mojolang.org/docs/manual/values/value-semantics/): An explanation of Mojo's value-semantic defaults.
- [Variables](https://mojolang.org/docs/manual/variables/): Introduction to Mojo variables.
- [How to read the standard library API documentation](https://mojolang.org/docs/api-docs/): Read Mojo API and function signatures, including declaration syntax, parameters, brackets, parentheses, and slashes.
- [Mojo stability guarantees](https://mojolang.org/docs/api-docs/stability/): Learn which Mojo language features and APIs are considered stable and which are subject to change or removal.
- [Mojo cheat sheets](https://mojolang.org/docs/reference/cheat-sheets/): Quick reference cards for Mojo essentials.
- [Mojo closure declarations reference](https://mojolang.org/docs/reference/closure-declarations/): Reference for Mojo closure declaration syntax. Covers capture lists, capture conventions, the move operator, parametric closures, declaration-level...
- [Mojo compound statements reference](https://mojolang.org/docs/reference/compound-statements/): Complete reference for Mojo compound statements. Covers if statements, loops, error handling with try/except, context managers with with, and compi...
- [@align](https://mojolang.org/docs/reference/decorators/align/): Specifies a minimum alignment for a struct.
- [@always_inline](https://mojolang.org/docs/reference/decorators/always-inline/): Copies the body of a function directly into the body of the calling function.
- [@__copy_capture](https://mojolang.org/docs/reference/decorators/copy-capture/): Captures register-passable typed values by copy (deprecated).
- [@deprecated](https://mojolang.org/docs/reference/decorators/deprecated/): Mojo's `@deprecated` decorator marks outdated APIs and schedules them for removal. When used with the `use` parameter, it also provides migration s...
- [@doc_hidden](https://mojolang.org/docs/reference/decorators/doc-hidden/): Hides declarations from generated documentation.
- [@explicit_destroy](https://mojolang.org/docs/reference/decorators/explicit-destroy/): Prevents automatic destruction by a `__del__()` method and requires explicit cleanup through named destructor methods.
- [@export](https://mojolang.org/docs/reference/decorators/export/): Marks a function for export.
- [@fieldwise_init](https://mojolang.org/docs/reference/decorators/fieldwise-init/): Generates fieldwise constructor for a struct.
- [@implicit](https://mojolang.org/docs/reference/decorators/implicit/): Marks a constructor as eligible for implicit conversion.
- [Mojo decorators](https://mojolang.org/docs/reference/decorators/): A reference of Mojo's built-in decorators
- [@no_inline](https://mojolang.org/docs/reference/decorators/no-inline/): Prevents a function from being inlined.
- [@parameter](https://mojolang.org/docs/reference/decorators/parameter/): Declares a legacy closure (deprecated).
- [@staticmethod](https://mojolang.org/docs/reference/decorators/staticmethod/): Declares a struct method as static.
- [Mojo docstring reference](https://mojolang.org/docs/reference/docstrings/): Complete reference for Mojo docstrings. Covers placement, first-sentence rules, structured sections (Parameters, Args, Returns, Raises, Constraints...
- [Mojo expression reference](https://mojolang.org/docs/reference/expressions/): Complete reference for Mojo expressions. Covers parenthesized expressions, tuples, collection displays, member access, calls, subscripts, slices, t...
- [Mojo function declarations reference](https://mojolang.org/docs/reference/function-declarations/): Reference for Mojo function declaration syntax. Covers signatures, argument conventions, markers, variadic arguments, effects, return types, and sp...
- [Mojo language reference](https://mojolang.org/docs/reference/): Reference for the syntax, keywords, decorators, and more
- [Mojo inline MLIR reference](https://mojolang.org/docs/reference/inline-mlir/): Use Mojo's inline MLIR built-ins to call hardware intrinsics, atomic operations, and GPU dialect operations that the language doesn't yet expose na...
- [Mojo identifiers, keywords, and conventions reference](https://mojolang.org/docs/reference/keywords/): Complete reference for Mojo identifiers, keywords, and conventions. Covers naming rules, reserved words, escaped identifiers, argument and variable...
- [Mojo lambda expressions reference](https://mojolang.org/docs/reference/lambda-expressions/): Reference for Mojo lambda expressions. Covers lambda signature grammar, capture lists and return types, thin lambdas versus lambda closures.
- [Mojo literals reference](https://mojolang.org/docs/reference/literals/): Complete reference for Mojo literal syntax. Covers integer, floating-point, string, t-string, boolean, None, Self, discard, and ellipsis literals w...
- [Mojo numeric types reference](https://mojolang.org/docs/reference/numeric-types/): Complete reference for Mojo numeric types. Covers SIMD, DType, Scalar, Int, UInt, sized integers, floating-point types, Byte, numeric literals, and...
- [Mojo operator reference](https://mojolang.org/docs/reference/operators/): Operator precedence, associativity, and symbols for Mojo.
- [Mojo simple statements reference](https://mojolang.org/docs/reference/simple-statements/): Complete reference for Mojo simple statements. Covers import statements, expression statements, assignment statements, and other simple statements.
- [Mojo struct declarations reference](https://mojolang.org/docs/reference/struct-declarations/): Reference for Mojo struct declarations, fields, methods, parameters, trait conformance, initializers, and lifecycle methods.
- [Mojo trait declarations](https://mojolang.org/docs/reference/trait-declarations/): Reference for Mojo trait declarations, required and provided methods, associated types, trait refinement, trait composition, and conformance rules.
- [Mojo types reference](https://mojolang.org/docs/reference/types/): Reference for Mojo's built-in types: the numeric, string, collection, memory, and other types every program can use without an import.
- [Compilation targets](https://mojolang.org/docs/tools/compilation/): Build Mojo code for a different architecture, CPU, or GPU than your development machine.
- [Debugging](https://mojolang.org/docs/tools/debugging/): Debugging Mojo programs.
- [Mojo compilation feature toggles](https://mojolang.org/docs/tools/feature-toggles/): How to conditionally enable or disable behavior in Mojo code at compile time.
- [Jupyter notebooks](https://mojolang.org/docs/tools/notebooks/): Using Mojo in local and Colab Jupyter Notebooks
- [Packaging](https://mojolang.org/docs/tools/packaging/): How to package your Mojo project for distribution
- [Mojo AI skills](https://mojolang.org/docs/tools/skills/): Official AI agent skills for developing projects with Mojo and MAX. Follows the Agent Skills Standard and encodes best practices for AI coding agents.
- [Testing](https://mojolang.org/docs/tools/testing/): Testing Mojo programs.
- [mojo build](https://mojolang.org/docs/cli/build/): Builds an executable from a Mojo file.
- [mojo debug](https://mojolang.org/docs/cli/debug/): Launches the Mojo debugger using the command-line interface or an external editor.
- [mojo demangle](https://mojolang.org/docs/cli/demangle/): Demangles the given name.
- [mojo doc](https://mojolang.org/docs/cli/doc/): Compiles docstrings from a Mojo file.
- [mojo format](https://mojolang.org/docs/cli/format/): Formats Mojo source files.
- [mojo](https://mojolang.org/docs/cli/): The Mojo🔥 command line interface.
- [mojo precompile](https://mojolang.org/docs/cli/precompile/): Precompiles a Mojo package.
- [mojo repl](https://mojolang.org/docs/cli/repl/): Launches the Mojo REPL.
- [mojo run](https://mojolang.org/docs/cli/run/): Builds and executes a Mojo file.
- [Mojo standard library](https://mojolang.org/docs/std/): All the data types, structs, traits, functions, and other APIs included with Mojo.
