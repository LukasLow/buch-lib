# Expressions

This page is the **complete formal reference** for Mojo expressions, mirroring
`/docs/reference/expressions/`. It states every documented expression form with
its syntax and rules. Where a form is taught elsewhere in this buch, this page
gives the exhaustive form and links to the tour page:
[Operators](../basics/operators.md) owns the precedence table and
[Literals](../basics/literals.md) teaches the literal forms.

## What an expression is

> An *expression* is any piece of code that produces a value. Expressions are
> the building blocks of computation: you combine them with operators, pass them
> as arguments, assign their results to variables, and use them as conditions in
> control flow.

Source: <https://mojolang.org/docs/reference/expressions/>.

An expression is the value-producing half of the language; a *statement*
performs an action and is the subject of
[Simple statements](simple-statements.md) and
[Compound statements](compound-statements.md). Mojo draws the line sharply:
assignment (`=`) is a statement, not an expression; the walrus (`:=`) is its
expression form. Source: <https://mojolang.org/docs/reference/expressions/>.

## Expression forms at a glance

| Form | Syntax | Produces |
|------|--------|----------|
| Identifier | `score`, `Int`, `range` | The named variable, type, function or module |
| Parenthesized | `( expr )` | The inner expression, grouped |
| Tuple | `expr, expr, ...` | A fixed-size, ordered group of values |
| List display | `[ expr, ... ]` | A list (an `Array` in 1.x) |
| Dict display | `{ key: value, ... }` | A dictionary |
| Set display / initializer list | `{ expr, ... }` | A set, or an initializer list |
| Member access | `a.b` | The attribute or method `b` of `a` |
| Call | `f(args)`, `T(args)` | The call result or a constructed value |
| Subscript | `a[i]`, `a[i, j]` | The element or key looked up |
| Slice | `a[start:stop:stride]` | A range of elements |
| Ternary conditional | `x if cond else y` | Either branch's value |
| Walrus | `name := expr` | The assigned value |
| Compile-time expression | `comptime( expr )` | A compile-time-constant value |
| Reflection expression | `type_of(x)`, `conforms_to(T, Tr)`, `origin_of(x)` | Compiler-internal type/boolean/origin |
| Function type | `def(T, ...) -> U` | A function type |
| Lambda | `lambda ...: expr` | An anonymous function value |
| Comprehension | `[expr for p in it if c]`, `{...}`, `{k: v ...}` | A new list, set or dict |

Sources: <https://mojolang.org/docs/reference/expressions/> and
<https://mojolang.org/docs/reference/literals/>.

## Identifier expressions

> An identifier refers to a named element: a variable, function, type, or
> module. Using an identifier in an expression gives you the thing it refers to:

```mojo
score        # a variable
Int          # a type
range        # a function
```

Source: <https://mojolang.org/docs/reference/expressions/>. Naming rules,
including backtick-escaped identifiers, are in
[Keywords](../keywords/index.md); the reserve status of the 34 keywords is why an
escaped name such as `` `import` `` may be needed.

## Parenthesized expressions

> Parentheses group subexpressions, overriding default precedence:

```mojo
(a + b) * c  # add a and b, multiply by c
(x)          # just x
```

> Parentheses also let expressions span multiple lines without using backslash
> escapes:

```mojo
var result = (
    first_value
    + second_value
    + third_value
)
```

Source: <https://mojolang.org/docs/reference/expressions/>. `(x)` is *not* a
one-element tuple — a tuple needs a comma; see below. The full precedence and
associativity table is on [Operators](../basics/operators.md).

## Tuples

> A *tuple* is a fixed-size, ordered group of values. Commas create tuples, not
> parentheses:

```mojo
var a = 2, 3       # tuple without parentheses
var b = (2, 3)     # same tuple with parentheses
var x, y = b       # x is 2, y is 3
```

Source: <https://mojolang.org/docs/reference/expressions/>.

The comma, not the parentheses, is the tuple constructor. Its consequences:

| Syntax | Result |
|--------|--------|
| `()` | Empty tuple |
| `(1,)` | One-element tuple (trailing comma required) |
| `(1)` | Just the integer `1` in parentheses |
| `(1, 2, 3)` | Three-element tuple |
| `2, 3` | Two-element tuple, no parentheses needed |

Tuples support indexing:

```mojo
var point = (10, 20)
print(point[0])  # 10
```

Source: <https://mojolang.org/docs/reference/expressions/>. Tuples may appear on
the left of an assignment as a destructuring target; that statement form is on
[Simple statements](simple-statements.md).

## Collection displays

The compiler calls these *displays*:

> Displays are similar to literals, but unlike literals, displays can contain
> expressions as well as fixed values. Literals cannot contain expressions.

```mojo
[1, 2, 3]        # list literal
[1, 1+1, 1+1+1]  # list display
```

Source: <https://mojolang.org/docs/reference/expressions/>. The literal-only
forms are on [Literals](literals.md).

### Lists

> A *list display* creates a list from comma-separated values:

```mojo
var empty: List[Float32] = []
var numbers = [1, 2, 3]
var strings = ["one", "two", "three",]
```

> Mojo allows trailing commas after all collection elements, including the final
> one.

Source: <https://mojolang.org/docs/reference/expressions/>. In 1.x a list
expression builds an `Array`; the display-vs-type relationship is taught on
[Collections](../types/collections.md).

### Dictionaries

> A *dict display* maps keys to values with `:` between each pair:

```mojo
var empty: Dict[String, Int] = {}
var ages = {"Alice": 30, "Bob": 25}
```

Source: <https://mojolang.org/docs/reference/expressions/>.

### Sets and initializer lists

> A *set display* uses braces with values but no colons:

```mojo
var primes = {2, 3, 5, 7}
```

> Don't mix set and dict syntax. `{1, 2}` is a set. `{1: 2}` is a dict.

```mojo
{"a": 1, 2}   # Error: expected 'key: value' in dictionary expression
{1, "b": 2}   # Error: cannot have a 'key: value' pair in set initializer
```

Source: <https://mojolang.org/docs/reference/expressions/>.

Brace syntax has a second, distinct meaning:

> **Sets are not initializer lists**. Brace syntax also serves as an *initializer
> list* that creates an instance of an inferred type. Without type context, the
> compiler can't distinguish a set from an initializer list, so the distinction
> is resolved at type-check time. Initializer lists can include positional values
> and keyword arguments:

```mojo
{x, y}           # set or initializer list, without context
{z=4, "foo"}     # initializer list with keyword argument
```

> Initializer lists are syntactic sugar for constructor calls. `{1, "hello"}` is
> equivalent to `T(1, "hello")` when the type `T` is known from context.

```mojo
process({1, "hello"})  # type inferred from signature

var x: T = {}  # type inferred from variable declaration, calls T()
```

Source: <https://mojolang.org/docs/reference/expressions/>.

> **Sharp edge: set displays are core Mojo syntax but the `Set` type is not**.
> You must import `Set` from the standard library to use it as a type:

```mojo
from std.collections import Set # Required to use Set type
from std.testing import assert_equal

def main() raises:
    var display_set = {1, 2, 3}        # A set with elements 1, 2, and 3
    assert_equal(len(display_set), 3)  # The length of the set is 3

    var empty_set = Set[Int]()         # An empty set
    empty_set.add(4)                   # Add an element to the set
    empty_set.add(4)
    assert_equal(len(empty_set), 1)    # Sets do not allow duplicate elements
```

Source: <https://mojolang.org/docs/reference/expressions/>.

## Member access

> The dot operator accesses an attribute or method on a value:

```mojo
var length = text.count()
var x = point.x
var name = person.name.upper()
```

> Chaining is left to right: `a.b.c` accesses `c` on the result of `a.b`.

Source: <https://mojolang.org/docs/reference/expressions/>. Dot access binds
tightest, with calls and subscripts; see
[Operators](../basics/operators.md).

## Calls

> A *call expression* invokes a function or constructs a value by appending `()`
> to an expression:

```mojo
print("hello")
var result = compute(a, b)
var p = Point(1.0, 2.0)
```

Source: <https://mojolang.org/docs/reference/expressions/>.

### Positional and keyword arguments

> Arguments before any keyword argument are positional. Keyword arguments use
> `name=value` syntax.

```mojo
def greet(name: String, loud: Bool = False):
    print(t"Hello, {name if not loud else name.upper()}!")

greet("Alice")  # Hello, Alice!
greet("Alice", loud=True)  # Hello, ALICE!
greet(name="Bob") # Hello, Bob!
```

> Positional arguments can't follow keyword arguments:

```mojo
    # greet(loud=True, "Alice")
    # Error: positional argument follows keyword argument
```

> Keyword arguments can't be repeated:

```mojo
greet(name="Alice", name="Bob")
# Error: duplicate keyword argument 'name'
```

Source: <https://mojolang.org/docs/reference/expressions/>. The declaration side
of calls — markers, defaults, infer-only parameters — is on
[Function declarations](function-declarations.md).

## Subscripts and slices

> Square brackets after an expression look up a value by index(es) or key(s):

```mojo
var item = collection[0]
var value = mapping["key"]
var cell = matrix[i, j]
```

Source: <https://mojolang.org/docs/reference/expressions/>. A multi-argument
subscript passes a tuple of indices and dispatches to `__getitem__`; negative
indices are a compile-time error in 1.x — see
[Operators](../basics/operators.md) and
[Collections](../types/collections.md).

### Slices

> Colons inside square brackets create *slices*. Slices select a range of
> elements using `start:stop` or `start:stop:stride`:

```mojo
var items = [0, 1, 2, 3, 4, 5]

var first_three = items[0:3]   # [0, 1, 2] (3 not included)
var from_three  = items[3:]    # [3, 4, 5]
var every_other = items[::2]   # [0, 2, 4]
var reversed    = items[::-1]  # [5, 4, 3, 2, 1, 0]
```

> All three parts are optional. Start defaults to the beginning, stop defaults
> to the end, and stride defaults to 1. The element at the stop position isn't
> included in the result.

Source: <https://mojolang.org/docs/reference/expressions/>.

| Slice form | Meaning |
|------------|---------|
| `a[:]` | Whole sequence |
| `a[start:]` | From `start` to the end |
| `a[:stop]` | From the beginning, excluding `stop` |
| `a[start:stop]` | The half-open range `[start, stop)` |
| `a[::stride]` | Every `stride`-th element |
| `a[start:stop:stride]` | The full three-part form |
| `a[::-1]` | Reverse |

## Ternary conditional

> The `if`-`else` expression selects between two values based on a condition:

```mojo
var label = "even" if x % 2 == 0 else "odd"
```

> The condition follows `if`, and the alternate value follows `else`. If the
> condition is true, the expression evaluates to the first value. If false, the
> alternate.

```mojo
var size = (
    "small" if n < 10
        else "large" if n > 100
        else "medium"
)
```

> This groups as
> `"small" if n < 10 else ("large" if n > 100 else "medium")`.

Source: <https://mojolang.org/docs/reference/expressions/>. Ternary is
right-associative; the precedence table is on
[Operators](../basics/operators.md).

## Walrus operator

> Regular assignments (`=`) are statements, not expressions. They don't produce
> a value.
>
> The walrus operator (:=) is the expression form of assignment. It binds a
> value to a name and evaluates to that value. You can assign and use the result
> in a single step:

```mojo
var n: Int
if (n := len(items)) > 10:
    print(n)

var name: String
while (name := input("Prompt: ")) != "quit":
    print(name)
```

> The name can be declared beforehand, as in the examples above, or introduced
> by the walrus itself. It's most often used for temporary values created as
> part of a statement, although the binding remains available for the rest of
> its scope.
>
> The value on the right side of a walrus assignment doesn't have to exist in
> memory. For example, it might be a computed value that exists only in
> registers. The walrus operator doesn't imply anything about ownership or
> reference semantics.

> The walrus operator has the lowest precedence of any expression operator. Use
> parentheses when needed to make your intent clear:

```mojo
if item := list[idx] < 50:        # binds comparison result
    print(t"{item} is under 50")  # "True is under 50"

if (item := list[idx]) < 50:      # binds list item
    print(t"{item} is under 50")  # "(actual number) is under 50"
```

Source: <https://mojolang.org/docs/reference/expressions/>.

> **Open question:** the official operator reference and the expressions
> reference both call the walrus the loosest expression operator, but they place
> it relative to each other's tables slightly differently. Parenthesize a walrus
> when you combine it with `and`/`or`. Sources:
> <https://mojolang.org/docs/reference/operators/> and
> <https://mojolang.org/docs/reference/expressions/>.

## Compile-time expressions

> `comptime` forces an expression to evaluate at compile time. Parentheses are
> required:

```mojo
def heavy_calculation() -> Int:
    var sum = 0
    for i in range(1_000_000):
        sum += i
    return sum

# var x = comptime heavy_calculation()
# Error: requires parentheses

var x = comptime(heavy_calculation())  # O(1) at runtime
print(x)  # 499999500000
```

> The loop runs once during compilation. At runtime, `x` is a constant. If the
> expression can't be evaluated at compile time, the compiler reports an error.

Source: <https://mojolang.org/docs/reference/expressions/>. The `comptime`
*statement* form (declaration) is on
[Simple statements](simple-statements.md); compile-time control flow is on
[Compound statements](compound-statements.md).

### Reflection expressions

> Mojo also provides built-in expressions for compile-time type introspection.
> These look like function calls but they're keywords that operate on types and
> traits at compile time:

```mojo
type_of(x)             # type of an expression
conforms_to(T, Trait)  # test trait conformance
origin_of(x)           # origin of a reference
```

> These three expressions are used for reflection, conditional type conformance,
> and origin sets. They return compiler-internal types and won't print.

Source: <https://mojolang.org/docs/reference/expressions/>.

| Expression | Argument | Result | Typical use |
|------------|----------|--------|-------------|
| `type_of(x)` | Any expression | The expression's type | Introspection, `reflect[type_of(x)]` |
| `conforms_to(T, Trait)` | A type and a trait | `Bool` | `where` clauses, `comptime if` |
| `origin_of(x)` | A reference | An origin value | Origin sets, `ref` return types |

Sources: <https://mojolang.org/docs/reference/expressions/> and
<https://mojolang.org/docs/reference/function-declarations/>.

## Function type expressions

> A function type expression describes the signature of a function as a type:

```mojo
def() -> Int
def(Int, Int) -> Int
def(var value: String) -> None
def() raises -> String
def(T) -> T
```

> Function type expressions can include argument types with conventions, return
> types, and effects like `raises`.

Source: <https://mojolang.org/docs/reference/expressions/>. The `thin` and
`abi("C")` effects appear only in function *types*, not in declarations; see
[Function declarations](function-declarations.md).

## Lambda expressions

> A `lambda` is an anonymous, single-expression function. Its arguments are
> parenthesized and typed, like a function declaration, and its body is a single
> expression with no `return`:

```text
lambda [[parameter-list]] [(argument-list)] [effects]
       [{capture-list}] [-> ResultType] : expression
```

```mojo
var inc = lambda (x: Int) {} -> Int: x + 1
var y = inc(4)  # 5
```

Source: <https://mojolang.org/docs/reference/expressions/>. The complete
signature grammar — captures, thin vs. closure lambdas — is taught on
[Closures and lambdas](../functions/closures-and-lambdas.md) and the closure
declaration form is on [Closure declarations](closure-declarations.md).

## Comprehension expressions

> A comprehension is a concise way to build a new collection by iterating over
> existing values and optionally filtering or transforming them. It replaces
> common loop-and-append patterns with a single expression.

### List comprehensions

```mojo
var squares = [x * x for x in [0, 1, 2, 3, 4] if x % 2 == 0]
# [0, 4, 16]

var positive = [x for x in range(-3, 3) if x > 0]
# [1, 2]
```

> **Syntax:** `[expr for pattern in iterable if condition]`
>
> - Multiple `for` clauses create nested iteration
> - `if` clauses filter elements

### Set comprehensions

```mojo
var fibs = {fib(x) for x in range(6)}
# {1, 2, 3, 5, 8}, 5 elements from 6 iterations
```

> **Syntax:** `{expr for pattern in iterable if condition}`

### Dictionary comprehensions

```mojo
var dict_squares = {x: x * x for x in range(3)}
# {0: 0, 1: 1, 2: 4}

var lengths: Dict[String, Int] = {
    k: len(k) for k in ["one", "two", "three", "four"]
}
# {one: 3, two: 3, three: 5, four: 4}
```

> **Syntax:**
> `{key_expr: value_expr for pattern in iterable if condition}`

### Comprehension clauses

```mojo
var products = [
    (x, y, x * y)
    for x in range(3)
    for y in range(3)
    if (x + y) % 2 == 0
]
# [(0, 0, 0), (0, 2, 0), (1, 1, 1), (2, 0, 0), (2, 2, 4)]
```

> Clauses are evaluated left to right:
>
> - Each `for` introduces a new iteration variable
> - Each `if` filters based on the current values

Source: <https://mojolang.org/docs/reference/expressions/>.

| Comprehension | Delimiters | Result |
|---------------|------------|--------|
| List | `[` … `]` | A list (`Array` in 1.x) |
| Set | `{` … `}` | A set (deduplicated); the `Set` type still needs its import |
| Dict | `{k: v` … `}` | A dictionary |

Comprehension targets are a binding form and are exempt from the 1.0
implicit-declaration deprecation. Source:
<https://mojolang.org/releases/v1.0.0/>.

## Expression grammar (consolidated)

The official reference presents the forms separately rather than as one
production. The following is the consolidated syntax the separate sections
define; the `literals` productions are reproduced verbatim on
[Literals](literals.md).

```text
expression      → ternary
ternary         → or_expr "if" or_expr "else" ternary        # right-assoc
                | walrus
walrus          → NAME ":=" expression                       # loosest
or_expr         → and_expr ("or" and_expr)*
and_expr        → not_expr ("and" not_expr)*
not_expr        → "not" not_expr | comparison
comparison      → bitwise_or (comp_op bitwise_or)*           # chainable
bitwise_or      → bitwise_xor ("|" bitwise_xor)*
bitwise_xor     → bitwise_and ("^" bitwise_and)*
bitwise_and     → shift ("&" shift)*
shift           → additive (("<<" | ">>") additive)*
additive        → multiplicative (("+" | "-") multiplicative)*
multiplicative  → unary (("*" | "@" | "/" | "//" | "%") unary)*
unary           → ("-" | "+" | "~") unary | power
power           → postfix ("**" unary)?                      # right-assoc
postfix         → primary ( call | subscript | "." NAME )*
primary         → NAME | literal | "(" expression ")" | tuple
                | list_display | dict_display | set_display
                | comprehension | lambda | function_type
                | "comptime" "(" expression ")"
                | "type_of" "(" expression ")"
                | "conforms_to" "(" type "," trait ")"
                | "origin_of" "(" expression ")"
tuple           → expression "," (expression ",")*
list_display    → "[" (expression ",")* "]"
dict_display    → "{" (expression ":" expression ",")* "}"
set_display     → "{" (expression ",")+ "}"
comprehension   → "[" expression for_clauses "]"
                | "{" expression for_clauses "}"
                | "{" expression ":" expression for_clauses "}"
for_clauses     → ("for" pattern "in" expression)+ ("if" expression)*
call            → "(" (argument ",")* ")"
argument        → expression | NAME "=" expression
subscript       → "[" slice_item ("," slice_item)* "]"
slice_item      → expression
                | [expression] ":" [expression] [":" [expression]]
function_type   → "def" [ "[" parameter_list "]" ]
                  "(" [argument_type ("," argument_type)*] ")"
                  [effects] ["->" type]
lambda          → "lambda" ["[" parameter_list "]"]
                  ["(" argument_list ")"]
                  [effects] ["{" capture_list "}"]
                  ["->" type] ":" expression
```

Sources: <https://mojolang.org/docs/reference/expressions/>,
<https://mojolang.org/docs/reference/literals/> and
<https://mojolang.org/docs/reference/operators/>.

## Pitfalls

- **Treating `(x)` as a tuple.** Commas create tuples; a trailing comma makes a
  one-element tuple `(1,)`. Verified above.
- **Writing `(1, 2,)` in a dict display.** `{1, 2}` is a set and `{1: 2}` is a
  dict; mixing them is a type error. Verified above.
- **Using a set display without importing `Set`.** Set *displays* are core
  syntax, but the `Set` *type* needs `from std.collections import Set`. Verified
  above.
- **Expecting a display to be an initializer list everywhere.** `{...}` resolves
  to a set or a constructor call at type-check time; with no context it is a set.
  Verified above.
- **Putting a positional argument after a keyword argument.** That is an error;
  order keywords last. Verified above.
- **Repeating a keyword argument.** That is a duplicate-argument error. Verified
  above.
- **Assuming a subscript's `stop` is included.** Slices are half-open:
  `items[0:3]` excludes index 3. Verified above.
- **Chaining ternaries without parentheses.** It is right-associative and can be
  misread; parenthesize. Verified above.
- **Combining a walrus with `and`/`or` unparenthesized.** The walrus is the
  loosest operator; use parentheses. Verified above.
- **Forgetting the parentheses on `comptime`.** `comptime(expr)` requires them;
  a bare `comptime expr` is an error. Verified above.
- **Calling a reflection built-in at runtime.** `type_of`, `conforms_to` and
  `origin_of` are compile-time constructs that return compiler-internal values
  and do not print. Verified above.
- **Using `thin` or `abi("C")` in a declaration.** They are function-*type*
  effects; see [Function declarations](function-declarations.md). Verified above.
- **Confusing a lambda `{}` capture list with a set display.** In a lambda, the
  braces are the capture list. Verified above.

## Sources

- Mojo expression reference: <https://mojolang.org/docs/reference/expressions/>
- Mojo literals reference: <https://mojolang.org/docs/reference/literals/>
- Mojo operator reference: <https://mojolang.org/docs/reference/operators/>
- Mojo function declarations reference: <https://mojolang.org/docs/reference/function-declarations/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
