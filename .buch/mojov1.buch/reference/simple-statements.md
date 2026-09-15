# Simple statements

This page is the **complete formal reference** for Mojo simple statements,
mirroring `/docs/reference/simple-statements/`. A *simple statement* is one
action on one logical line; the compound forms (`if`, loops, `try`, `with`,
compile-time blocks) are on [Compound statements](compound-statements.md). The
tour pages that teach these forms are
[Variables and mutability](../basics/variables-and-mutability.md) and
[Operators](../basics/operators.md).

## What a simple statement is

> A *simple statement* performs a single action on one logical line. Multiple
> simple statements can share a line when separated by semicolons.

Source: <https://mojolang.org/docs/reference/simple-statements/>.

```mojo
var x = 1; var y = 2; print(x + y)   # three simple statements on one line
```

The distinction from an expression: an expression produces a value
([Expressions](expressions.md)); a statement performs an action.

## Simple statements at a glance

| Statement | Form | Purpose |
|-----------|------|---------|
| Module import | `import module` | Bring a module into scope |
| Selective import | `from module import name` | Import named members |
| Wildcard import | `from module import *` | Import all public names |
| Expression statement | `expr` | Evaluate for side effects |
| Discard | `_ = expr` | Explicitly discard a result |
| `var` declaration | `var name = value` / `var name: T` | Declare a new variable |
| `ref` declaration | `ref name = lvalue` | Reference binding to an existing value |
| Assignment | `name = value` | Assign to an existing binding |
| Multiple assignment | `var a = var b = value` | Right-associative chain |
| Destructuring | `var a, b = pair` / `var (a, b) = pair` | Unpack a tuple |
| Swap | `a, b = b, a` | Exchange values |
| Augmented assignment | `x += y` and the rest | In-place operation |
| `pass` | `pass` | No-op placeholder |
| `return` | `return` / `return value` | Exit a function |
| `raise` | `raise err` / `raise` | Raise or re-raise an error |
| `break` | `break` | Exit the innermost loop |
| `continue` | `continue` | Skip to the next iteration |
| `comptime` declaration | `comptime NAME = value` | Compile-time constant |

Source: <https://mojolang.org/docs/reference/simple-statements/>.

## Import statements

> *Import statements* expose modules and their members to the current scope.
> Imports can appear at module level, inside functions, or inside other scopes.
> They don't need to appear at the top of a file.

```mojo
import std.math
from std.collections import Dict, Set
```

> Use parentheses to import on multiple lines for readability and support clean
> commit diffs:

```mojo
from std.collections import (
    Dict,
    Set,
    List,    # Trailing comma is legal
)
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

### The three import forms

| Form | Syntax | Binds |
|------|--------|-------|
| Module import | `import std.math` | The module name `math` in the current scope |
| Module import with alias | `import numpy as np` | The alias `np` |
| Selective import | `from std.math import sqrt, pi` | The selected names |
| Selective import with alias | `from std.collections import Dict as Dictionary` | The alias `Dictionary` |
| Wildcard import | `from std.math import *` | All public names from the module |

```mojo
import std.math
import numpy as np            # Alias the module name to avoid collisions

from std.math import sqrt, pi
from std.collections import Dict as Dictionary   # Alias the imported name

from std.math import *  # Imports all public names from the std.math module
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

In 1.0, a newline may not appear inside an `import` statement except inside a
parenthesized import list. Source:
<https://mojolang.org/releases/v1.0.0/>.

An import brings a name in as a *non-function* reference, so it cannot be
extended by a local overload of the same name. See
[Function declarations](function-declarations.md).

## Expression statements

> An *expression statement* evaluates an expression for its side effects. When
> the result is unused (other than `None`), the compiler warns:

```mojo
x + y              # Warning: result is unused
```

> The compiler doesn't warn when the result is `None`, which is common for
> functions called for their side effects:

```mojo
print("hello")     # Side effect: prints
trigger()          # Side effect: called for behavior
```

> Assign the result to `_` to explicitly discard it and silence the warning:

```mojo
_ = update()       # Explicitly discard the result
```

> Expressions are not valid at module scope or in struct bodies outside of
> methods.

Source: <https://mojolang.org/docs/reference/simple-statements/>. The `_` discard
is an identifier, not a keyword; see [Literals](literals.md).

## Assignment statements

> *Assignment statements* bind values to names with `=`. Use `var` declarations
> to declare new variables:

```mojo
var x = 42
var name = "Alice"
var result = compute()
```

> Use `ref` declarations to create reference bindings:

```mojo
ref y = my_list[3]  # `y` is a reference to the value at `my_list[3]`
```

> The `y` reference binding does not create a new value. It creates a reference
> to the existing value at `my_list[3]`. Modifying `y` modifies the value in
> `my_list[3]`; modifying `my_list[3]` modifies what `y` reads.

Source: <https://mojolang.org/docs/reference/simple-statements/>.

### Annotated declarations

> Annotated assignments bind a type to a name, with an optional initializer. Type
> annotations aren't required, but they improve readability and catch errors:

```mojo
var x: Int = 42
var name: String = "Alice"
var values: List[Float64] = []
```

> A `var` without a type *and* without an initializer is an error:

```mojo
var x        # Error: declaration must have either a type or an initializer
var x: Int   # OK: type provided, value uninitialized
var x = 42   # OK: type inferred from initializer
```

> When types are complex and long to write, you can use comptime aliases to keep
> your code concise:

```mojo
comptime Vec3 = List[Float64]
var position: Vec3 = [0.0, 0.0, 0.0]
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

| Declaration | Type | Initializer | Valid |
|-------------|------|-------------|-------|
| `var x` | absent | absent | Error |
| `var x: Int` | present | absent | Valid — uninitialized |
| `var x = 42` | inferred | present | Valid |
| `var x: Int = 42` | present | present | Valid |

Every variable declaration must use `var`; the bare implicit declaration form is
deprecated in 1.x. Source: <https://mojolang.org/releases/v1.0.0/>.

### Multiple assignment

> Multiple assignments give you a concise syntax for initializing variables.
>
> Assign the same value to multiple names. This is right-associative. `z` is
> assigned first, then `y`, then `x`. If the RHS has side effects, they run once:

```mojo
# Good for initializing counters/flags to the same literal.
var x = var y = var z = "Hello"
print(x, y, z) # Hello Hello Hello

# Mixing conventions
ref a = var b = var c = "Hello"
print(a, b, c)

a = "World"
print(b) # World
```

> Destructuring assignment:

```mojo
var a, b = 1, 2          # Destructuring assignment
var (c, d) = (1, 2)      # Equivalent destructuring
                         # not "assign tuple to tuple"
print(a, b, c, d)  # 1 2 1 2

def returns_pair() -> Tuple[Int, Int]:
    return (1, 2)

var e, f = returns_pair()
print(e, f)  # 1 2
```

> Avoid multiple assignments for destructuring unrelated values.

```mojo
var temperature, name = 98.6, "Bob"
```

> reads worse than two lines:

```mojo
var temperature = 98.6
var name = "Bob"
```

> Simple swaps:

```mojo
var a, b, c = 1, 2, 3
a, b, c = c, a, b
print(a, b, c)  # 3 1 2
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

| Form | Meaning |
|------|---------|
| `var x = var y = v` | Chain assignment; right-associative, `v` evaluated once |
| `var a, b = 1, 2` | Destructuring assignment from the tuple `(1, 2)` |
| `var (c, d) = (1, 2)` | Equivalent parenthesized destructuring |
| `var e, f = returns_pair()` | Unpack a returned tuple |
| `a, b, c = c, a, b` | Swap via destructuring |

Destructuring is not "assign tuple to tuple" — it binds each name to one element.
Source: <https://mojolang.org/docs/reference/simple-statements/>.

### Augmented assignment

> Augmented assignment is syntactic sugar that combines an operation with
> assignment. The left-hand side is evaluated once:

```mojo
x += 5       # x = x + 5
x -= 2       # x = x - 2
x *= 3       # x = x * 3
x /= 4       # x = x / 4
x //= 2      # x = x // 2
x %= 7       # x = x % 7
x **= 2      # x = x ** 2
x @= m       # x = x @ m  (matrix multiply)
x &= mask    # x = x & mask
x |= flags   # x = x | flags
x ^= bits    # x = x ^ bits
x <<= 1      # x = x << 1
x >>= 1      # x = x >> 1
```

Source: <https://mojolang.org/docs/reference/simple-statements/>. The complete
set is `+= -= *= /= //= %= **= @= &= |= ^= <<= >>=`. These are statements, not
expressions, and a type must implement its in-place method to support one; the
operator-to-dunder mapping is on
[Operator support](../types/operator-support.md).

## The `pass` statement

> `pass` is a no-op. Use it as a placeholder where a statement is required but
> no action is needed:

```mojo
def not_ready():
    pass

struct Empty:
    pass
```

> `pass` is required in empty function and struct bodies to avoid syntax errors.

Source: <https://mojolang.org/docs/reference/simple-statements/>. In a trait
body, `pass` means a *provided* (empty) implementation and is only valid when the
method returns `None`; `...` means *required*. See
[Trait declarations](trait-declarations.md).

## The `return` statement

> `return` exits a function and optionally returns a value:

```mojo
def greet(name: String):
    if not name:  # String is falsy when empty
        return
    print(t"Hello, {name}!")

def get_value() -> Int:
    return 42

def early_exit(items: List[Int], target: Int) -> Bool:
    for item in items:
        if item == target:
            return True
    return False
```

> A function without an explicit `return` implicitly returns `None`. `return` is
> only valid inside a function:

```mojo
return 42    # Error: cannot return from this context
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

## The `raise` statement

> `raise` raises an error. The function must be declared with `raises` or
> included within a `try` block:

```mojo
def validate(value: Int) raises -> Bool:
    if value < 0:
        raise Error("value must be non-negative")
    return True

def mitigate_risk():
    try:
        if not perform_some_test():
            raise Error("test failed")
        # perform risky work, knowing test passed
    except e:
        log(e)
```

> To propagate errors from a `try` block, use a bare `raise` to re-raise the
> current error:

```mojo
try:
    validate(value)
    # perform work, knowing value is valid
except e:
    raise  # Re-raises current error to the next handler
```

> Raising outside a valid context is an error:

```mojo
raise Error("oops")   # Error: cannot raise error in this context
                      # (surround with try, or mark function as raises)

raise                 # Error: no contextual error to reraise
                      # (bare raise requires an active except block)
```

Source: <https://mojolang.org/docs/reference/simple-statements/>. The error model
is on [Raising and propagation](../errors/raising-and-propagation.md).

## `break` and `continue`

> `break` exits the innermost loop immediately. `continue` skips to the next
> iteration:

```mojo
for x in range(10):
    if x == 5:
        break        # Stop at 5
    if x % 2 == 0:
        continue     # Skip even numbers
    print(x)         # Prints 1, 3
```

Source: <https://mojolang.org/docs/reference/simple-statements/>. Both are only
valid inside a loop; the loop `else` clause and the full loop forms are on
[Compound statements](compound-statements.md).

## Compile-time declarations

> `comptime` declares a compile-time constant. The value must be computable at
> compile time:

```mojo
comptime SIZE = 256
comptime MAX = SIZE * 2
```

> `comptime` declares associated types in traits, and can be used to create type
> aliases and trait composition aliases:

```mojo
comptime Permissive = ImplicitlyCopyable & Deinitable

trait SimpleTrait(Writable):  # `SimpleTrait` refines `Writable`
    comptime Element = Permissive  # Associated type with a comptime alias
```

> A trailing `where` clause constrains a parametric declaration's parameters. The
> compiler checks the condition at each use:

```mojo
comptime AscendingMidpoint[lo: Int, hi: Int]: Int where lo < hi = (lo + hi) / 2

def main():
    comptime mid = AscendingMidpoint[2, 10]    # 6
    # comptime bad = AscendingMidpoint[10, 2]  # Error: lo < hi not satisfied
```

> A `where` clause requires conditions the compiler can evaluate at compile time,
> such as comparisons, boolean combinations, and `conforms_to()`.

Source: <https://mojolang.org/docs/reference/simple-statements/>.

| `comptime` form | Example | Purpose |
|-----------------|---------|---------|
| Value constant | `comptime SIZE = 256` | Compile-time value |
| Type alias | `comptime Vec3 = List[Float64]` | Name a type |
| Trait composition alias | `comptime Permissive = ImplicitlyCopyable & Deinitable` | Name a trait set |
| Parametric with constraint | `comptime Mid[lo: Int, hi: Int]: Int where lo < hi = …` | Constrained compile-time function |

`comptime` declarations are valid at module scope, unlike `var`. Source:
<https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

## Statement grammar (consolidated)

```text
simple_stmt     → import_stmt | from_import_stmt | expr_stmt
                | var_stmt | ref_stmt | assign_stmt | pass_stmt
                | return_stmt | raise_stmt | break_stmt | continue_stmt
                | comptime_decl

import_stmt     → "import" dotted_name ("as" NAME)?
from_import_stmt→ "from" dotted_name "import" "*"
                | "from" dotted_name "import" import_list
import_list     → "(" (NAME ("as" NAME)? ",")* ")"
                | NAME ("as" NAME)? ("," NAME ("as" NAME)?)*

expr_stmt       → expression
discard_stmt    → "_" "=" expression

var_stmt        → "var" target (":" type)? ("=" expression)?
ref_stmt        → "ref" NAME "=" expression
assign_stmt     → target ("=" | augop) expression
target          → NAME | NAME ("," NAME)+ | "(" NAME ("," NAME)* ")"
chain_assign    → "var" NAME "=" var_chain
var_chain       → "var" NAME "=" var_chain | expression
augop           → "+=" | "-=" | "*=" | "/=" | "//=" | "%=" | "**="
                | "@=" | "&=" | "|=" | "^=" | "<<=" | ">>="

pass_stmt       → "pass"
return_stmt     → "return" expression?
raise_stmt      → "raise" expression?          # bare raise re-raises
break_stmt      → "break"
continue_stmt   → "continue"
comptime_decl   → "comptime" NAME ("[" parameter_list "]")? (":" type)?
                  ("where" expression)? "=" expression
```

Sources: <https://mojolang.org/docs/reference/simple-statements/> and
<https://mojolang.org/docs/reference/expressions/>.

## Pitfalls

- **Declaring without `var`.** Implicit declarations are deprecated and warn with
  a fix-it; always write `var`. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **A `var` with neither type nor initializer.** That is an error; give one or
  both. Verified above.
- **Assuming a destructuring assignment is a tuple assignment.** It binds each
  name to one element. Verified above.
- **Expecting chained assignment to evaluate the RHS more than once.** The RHS
  runs once. Verified above.
- **Forgetting that `return` needs a function.** `return` at module scope is an
  error. Verified above.
- **Calling `raise` in a non-raising context without a `try`.** The function
  must be `raises` or the `raise` must be inside a `try`. Verified above.
- **Using a bare `raise` outside an `except` block.** Bare `raise` needs an
  active contextual error. Verified above.
- **Depending on `+=` because `+` exists.** In-place operators are opt-in per
  type. Verified above.
- **Putting an expression at module scope.** Expressions are not valid outside a
  function or method body; use `comptime` for compile-time values. Verified
  above.
- **Ignoring an unused-result warning instead of using `_`.** Assign to `_` to
  state the discard explicitly. Verified above.
- **Newline inside an `import` statement.** Allowed only within a parenthesized
  import list. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Calling a `comptime` value's constraint a runtime condition.** A `where`
  clause is checked at compile time; comparisons and `conforms_to()` are legal,
  runtime values are not. Verified above.

## Sources

- Mojo simple statements reference: <https://mojolang.org/docs/reference/simple-statements/>
- Mojo expression reference: <https://mojolang.org/docs/reference/expressions/>
- Compile-time evaluation (manual): <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
