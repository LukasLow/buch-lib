# Compound statements

This page is the **complete formal reference** for Mojo compound statements,
mirroring `/docs/reference/compound-statements/`. It covers `if`, `while`, `for`,
loop `else`, `try`/`except`/`else`/`finally`, `with`, `comptime if`/`comptime
for`, and scopes. The teaching version of control flow is on
[Control flow](../basics/control-flow.md); this page gives the exhaustive rules
and grammar.

## What a compound statement is

> A *compound statement* has a header and a body. The header ends with `:` and
> is followed by an indented block with the body.
>
> The body can contain simple statements, other compound statements, or both.

```mojo
if condition:       # Header
    do_something()  # Body
```

> The body must be indented more than the header. The first body statement sets
> the indentation for the rest of the body:

```mojo
if condition:
    do_something()
      do_more()    # Error because statement has excess indentation
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## Compound statements at a glance

| Statement | Header | Clauses |
|-----------|--------|---------|
| `if` | `if condition:` | `elif condition:`, `else:` |
| `while` | `while condition:` | `else:` |
| `for` | `for target in iterable:` | `else:` |
| `try` | `try:` | `except [name]:`, `else:`, `finally:` |
| `with` | `with manager [as name], ...:` | — |
| `comptime if` | `comptime if condition:` | `elif`, `else` (compile-time) |
| `comptime for` | `comptime for target in sequence:` | — |

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## If statements

> An `if` statement executes a block conditionally:

```mojo
if x > 0:
    print("positive")
elif x < 0:
    print("negative")
elif x == 0:
    print("zero")
else:
    print("you should never get here")
```

> Conditions are evaluated in order. Add as many as needed. The first true
> condition runs its block, and the statement exits. The `else` block runs if no
> condition is true.
>
> When the body is a single simple statement, you can write it on a single line,
> although many style guides discourage this.

```mojo
if x > 0: print("positive")
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

Shortcuts from other languages do not work:

```mojo
x > 0 and print("positive")  # Error because 'None' isn't truthy

print("positive") if x > 0 else pass
    # Error because 'pass' isn't an expression
```

Source: <https://mojolang.org/docs/reference/compound-statements/>. The
conditional *expression* form (`x if c else y`) is on
[Expressions](expressions.md); conditions are boolean or `Boolable`, see
[Operators](../basics/operators.md).

## While loops

> The `while` loop repeats its body while a condition is true:

```mojo
var count = 0
while count < 10:
    print(count)
    count += 1
```

> Use `break` to exit the loop early and `continue` to skip to the next
> iteration:

```mojo
while True:
    var item = get_next()
    if item is None:
        break       # Exit loop if no more items
    if not is_valid(item):
        continue    # Skip invalid items
    process(item)  # Only runs for valid items
```

Source: <https://mojolang.org/docs/reference/compound-statements/>. `break` and
`continue` are defined on [Simple statements](simple-statements.md).

## For loops

> The `for` statement iterates over a sequence:

```mojo
for item in items:
    process(item)

for i in range(10):   # [0, 10)
    print(i)
```

> To support iteration, a sequence must implement `__iter__()` and `__next__()`.
> A `for` loop desugars to a `while` loop that uses these methods.

> Destructuring works directly in the loop target. This lets you unpack tuple
> elements as you iterate. In this example, each item in `pairs` is unpacked into
> `key` and `value` for every iteration:

```mojo
for key, value in pairs:  # For example, [("a", 1), ("b", 2), ...]
    print(key, value)
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

### Loop variable bindings

> Use `var` and `ref` conventions to control ownership, copying, and mutability
> behavior in loop variables. By default, loop variables are immutable references
> to the iterated items (`imm`). To create a mutable copy, use `var`. To maintain
> value mutability, use `ref`:

```mojo
var list: List[String] = ["a", "b", "c", "d"]

for var item in list:
    item = item + "x" # works. item is mutable copy of list element
    print(item) # prints "ax", then "bx", "cx", and "dx"
print(list) # unchanged

for ref item in list:
    item = item + "x" # mutability picked up in reference to list element
    print(item) # prints "ax", then "bx", "cx", and "dx"
print(list) # changed to ["ax", "bx", "cx", "dx"]
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

| Loop target | Binding | Mutating the item affects |
|-------------|---------|---------------------------|
| `for item in c:` | Immutable reference (`imm`) | Nothing (read-only) |
| `for ref item in c:` | Reference with the element's mutability | The container |
| `for var item in c:` | Mutable owned copy | Only the copy |

## Loops and else clauses

> An optional `else` clause runs when the loop exits normally. It does not run if
> the loop exits with `break`:

```mojo
var found = False
for item in items:
    if item == target:
        found = True
        break
else:
    print("not found")  # Only runs if break was never hit
```

> Both `for` and `while` loops support `else`.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## Error handling

> A `try` statement executes code that may raise errors.

```mojo
var result: Bool
try:
    result = risky()
except e:
    handle(e)
```

### Structure

> Each `try` statement requires at least one `except` or `finally` clause:

```mojo
try:
    operation()
except e:
    handle_error(e)   # Runs if an error occurs
else:
    on_success()      # Runs only if no error occurred
finally:
    cleanup()         # Always runs
```

> Execution proceeds in a fixed order:
>
> 1. The `try` block runs first.
> 2. If an error occurs, the matching `except` block runs.
> 3. If no error occurs, the `else` block (if present) runs after the `try`
>    block.
> 4. If included, a `finally` block always runs last.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

### Error binding

> Bind the error to a name with `except name`:

```mojo
try:
    risky()
except e:
    print(e)   # e is the caught error
```

> Without a binding, the error is caught but not accessible. There is no default
> error variable. This is useful when you want to respond to an error state
> without needing the error details:

```mojo
try:
    risky()
except:
    print("something went wrong")
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

### Typed errors

> When a function declares a specific error type with `raises ErrorType`, the
> bound variable's type is inferred:

```mojo
@fieldwise_init
struct NetworkError:
    var message: String
    var code: Int

def fetch() raises NetworkError -> String:
    raise NetworkError("HTCPCP", 418)   # See RFC 2324

try:
    var result = fetch()
except e:              # e is inferred as `NetworkError`
    print(e.message)   # Known types support direct field access
    print(e.code)      # `.code` and `.message` only work because `e`
                        # is a known to be `NetworkError`
```

> A `try` block handles one error type. The compiler raises an error if code in
> the `try` block can raise more than one error type.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

| Clause | Runs when | Binds |
|--------|-----------|-------|
| `except name:` | An error occurs | The error as `name` |
| `except:` | An error occurs | Nothing (no default error variable) |
| `else:` | The `try` block completes with no error | — |
| `finally:` | Always, last | — |

The error model is taught on
[Raising and propagation](../errors/raising-and-propagation.md).

## Context managers

> A `with` statement manages resources using context managers. *Context
> managers* define setup (`__enter__`) and cleanup (`__exit__`) operations. The
> cleanup always runs when the block exits, even if an error occurs:

```mojo
with open("file.txt") as f:
    var content = f.read()
# File is closed here, even if an error occurred
```

> Multiple context managers can share a single `with` statement:

```mojo
with open("input.txt") as f_in, open("output.txt", "w") as f_out:
    f_out.write(f_in.read())
```

> This is equivalent to nested `with` statements.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

### How context managers work

> When a `with` block is entered, `__enter__()` is called on the context manager
> expression. The result is bound to the `as` target if present. A context
> manager that defines only `__enter__()` is valid; `__exit__()` is optional.
> When the block exits, `__exit__()` is called if it exists, even if an error
> occurs.

```mojo
struct Scope(ImplicitlyCopyable):
    var label: String

    def __init__(out self, label: String):
        self.label = label

    def __enter__(self) -> Self:
        # perform setup tasks
        print("entering", self.label)
        return self

    def __exit__(self):
        # perform cleanup tasks
        print("exiting", self.label)

def main():
    with Scope("setup") as s:
        print("inside", s.label)
    # entering setup
    # inside setup
    # exiting setup
```

> `__enter__` returns `self` so the `as` target binds to the manager. The
> `ImplicitlyCopyable` conformance lets the compiler return `self` by value.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## Compile-time control flow

> `comptime if` and `comptime for` run at compile time. The condition or sequence
> must be a compile-time value or expression.
>
> Use them to generate code based on compile-time conditions. You cannot use
> runtime values in `comptime` statements.

### comptime if

> `comptime if` selects a branch at compile time, pruning the unselected
> branches. Only the selected branch appears in the compiled program.

```mojo
from std.sys import size_of

comptime if size_of[Int]() == 8:
    print("64-bit")
else:
    print("Probably 32-bit")
```

> The condition must be a compile-time expression. In this example,
> `runtime_value` is not available at compile time, so the code errors during
> compilation:

```mojo
comptime if runtime_value > 0:   # Error because 'comptime if' requires
    pass                         # compile-time evaluation
```

> `comptime if` supports `elif` and `else` like the regular `if` statement.

### comptime for

> `comptime for` unrolls a loop at compile time. Each iteration is compiled as
> separate code. This creates a bigger binary but improves runtime performance by
> eliminating loop overhead and enabling further optimizations.

```mojo
comptime for i in range(3):
    print(i)   # Compiled as: print(0); print(1); print(2)
```

> Use `comptime for` to generate repeated code patterns or iterate over
> compile-time sequences.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

> **Open question:** the official compound-statements reference documents
> `comptime if`/`comptime for` but does not spell out their interaction with
> runtime control statements (for example, whether a `break` is legal inside a
> `comptime for`). Do not assume runtime `break`/`continue` behave inside a
> compile-time loop. Source:
> <https://mojolang.org/docs/reference/compound-statements/>.

## Scopes

> Each compound statement body creates a new scope. Variables declared inside a
> body are not visible outside it:

```mojo
if condition:
    var x = 10
print(x)   # Error: x is not in scope
```

> `with` statement variables bound with `as` are scoped to the `with` block:

```mojo
with open("file.txt") as f:
    var data = f.read()
# f is not accessible here
```

> Nested functions create their own scope and can capture variables from
> enclosing functions with capture lists:

```mojo
def outer():
    var count = 0

    def inner() {mut count}:  # Capture count by mutable reference
        count += 1            # Updates captured count

    inner()
    print(count)     # 1
```

Source: <https://mojolang.org/docs/reference/compound-statements/>. Capture-list
syntax is the subject of [Closure declarations](closure-declarations.md).

## Compound statement grammar (consolidated)

```text
compound_stmt   → if_stmt | while_stmt | for_stmt | try_stmt
                | with_stmt | comptime_if_stmt | comptime_for_stmt

if_stmt         → "if" expression ":" suite
                  ("elif" expression ":" suite)*
                  ("else" ":" suite)?
while_stmt      → "while" expression ":" suite
                  ("else" ":" suite)?
for_stmt        → "for" target "in" expression ":" suite
                  ("else" ":" suite)?
target          → NAME | "ref" NAME | "var" NAME
                | NAME ("," NAME)+

try_stmt        → "try" ":" suite
                  ("except" NAME? ":" suite)+
                  ("else" ":" suite)?
                  ("finally" ":" suite)?
                | "try" ":" suite "finally" ":" suite

with_stmt       → "with" with_item ("," with_item)* ":" suite
with_item       → expression ("as" NAME)?

comptime_if_stmt  → "comptime" "if" expression ":" suite
                    ("elif" expression ":" suite)*
                    ("else" ":" suite)?
comptime_for_stmt → "comptime" "for" target "in" expression ":" suite

suite           → NEWLINE INDENT statement+ DEDENT
                | simple_stmt
```

Sources: <https://mojolang.org/docs/reference/compound-statements/> and
<https://mojolang.org/docs/reference/simple-statements/>.

## Pitfalls

- **Writing `x > 0 and print(...)` as a conditional.** `print` returns `None`,
  which is not truthy; use `if`. Verified above.
- **Using `pass` as a ternary branch.** `pass` is a statement, not an
  expression. Verified above.
- **Over-indenting a body line.** The first body statement fixes the indentation;
  extra indentation is an error. Verified above.
- **Expecting the loop `else` to run after `break`.** It runs only on normal
  completion. Verified above.
- **Mutating a container through a default loop variable.** The default is an
  immutable reference; use `ref` to mutate elements, `var` for a copy. Verified
  above.
- **Writing a `try` with no `except` or `finally`.** At least one is required.
  Verified above.
- **Expecting a default error variable.** `except:` binds nothing. Verified
  above.
- **Letting a `try` block raise more than one error type.** A `try` handles one
  error type; the compiler rejects the mix. Verified above.
- **Assuming `__exit__` is required.** A context manager with only `__enter__`
  is valid. Verified above.
- **Returning the manager by value without `ImplicitlyCopyable`.** The
  `__enter__` example needs the conformance to return `self`. Verified above.
- **Using a runtime value in a `comptime` condition.** Only compile-time values
  and expressions are allowed. Verified above.
- **Reaching for a variable from an enclosing block.** Every compound body is a
  new scope. Verified above.
- **Capturing an outer name without a capture list.** Nested functions require an
  explicit capture list to reference enclosing values. Verified above.

## Sources

- Mojo compound statements reference: <https://mojolang.org/docs/reference/compound-statements/>
- Mojo simple statements reference: <https://mojolang.org/docs/reference/simple-statements/>
- Control flow (manual): <https://mojolang.org/docs/manual/control-flow/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
