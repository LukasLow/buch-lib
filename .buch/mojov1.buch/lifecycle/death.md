# Value destruction

Destruction is where Mojo's ownership model becomes visible. It is not deferred
to the end of a scope: it happens as soon as a value is no longer used.

> As soon as a value/object is no longer used, Mojo destroys it. Mojo does *not*
> wait until the end of a code block — or even until the end of an expression — to
> destroy an unused value. It destroys values using an "as soon as possible" (ASAP)
> destruction policy that runs after every sub-expression. Even within an
> expression like `a+b+c+d`, Mojo destroys the intermediate values as soon as
> they're no longer needed.

> Mojo uses static analysis at compile-time to determine the last use of a value.
> At that point, it immediately ends the value's lifetime and calls the *implicit*
> `__deinit__()` destructor. You can override `__deinit__()` in your structs to
> perform any required cleanup.

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

This page covers `__deinit__()`, default destruction, the benefits of ASAP,
explicitly-destroyed types and `@explicit_destroy`, the `deinit` convention,
field lifetimes, and explicit lifetime extension.

## Seeing ASAP destruction

```mojo
@fieldwise_init
struct Balloon(Writable):
    var color: String

    def write_to(self, mut writer: Some[Writer]):
        writer.write(String("a ", self.color, " balloon"))

    def __deinit__(deinit self):
        print("Destroyed", String(self))

def main():
    var a = Balloon("red")
    var b = Balloon("blue")
    print(a)
    # a.__deinit__() runs here for the "red" Balloon

    a = Balloon("green")
    # a.__deinit__() runs immediately because the "green" Balloon is never used

    print(b)
    # b.__deinit__() runs here
```

```output
a red balloon
Destroyed a red balloon
Destroyed a green balloon
a blue balloon
Destroyed a blue balloon
```

> Notice that each initialization of a value is matched with a call to the
> destructor, and `a` is actually destroyed multiple times — once for each time it
> receives a new value.

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

`__deinit__()` takes its argument with the `deinit` convention, "which indicates
that the value is being deinitialized." Source:
<https://mojolang.org/docs/manual/lifecycle/death/>.

## Default destruction

A type that is a simple collection of fields needs no custom destructor: Mojo
destroys the fields.

> The `__deinit__()` method is an "extra" cleanup event, and your implementation
> does not override any default destruction behaviors. For example, Mojo still
> destroys all the fields in `Balloons` even if you add a `__deinit__()` method
> that does nothing.

The reason a no-op destructor is useful:

> Since `String` doesn't require any custom destructor logic, it has a no-op
> destructor: literally, a `__deinit__()` method that doesn't do anything. This
> may seem pointless, but it means that Mojo can call the destructor on any value
> when its lifetime ends. This makes it easier to write type-generic containers and
> algorithms.

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

> Most structs don't require a custom destructor, and Mojo automatically adds a
> no-op destructor if you don't define one.

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

## Benefits of ASAP destruction

> - Destroying values immediately at last-use composes nicely with the "move"
>   optimization, which transforms a "copy+del" pair into a "move" operation.
> - Destroying values at end-of-scope in C++ is problematic for some common
>   patterns like tail recursion, because the destructor call happens after the
>   tail call. This can be a significant performance and memory problem for
>   certain functional programming patterns, which is not a problem in Mojo,
>   because the destructor call always happens before the tail call.

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

The comparison with Rust and Swift is worth quoting, because it names a concrete
cost Mojo avoids:

> One difference is that Rust and Swift require the use of a dynamic "drop flag" —
> they maintain hidden shadow variables to keep track of the state of your values
> to provide safety. These are often optimized away, but the Mojo approach
> eliminates this overhead entirely, making the generated code faster and avoiding
> ambiguity.

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

## Implicit destructors

> Mojo calls a value's destructor after the value's last use unless a type opts out
> of `Deinitable` destruction. The deletable trait provides a default no-op
> destructor (`__deinit__()`), which you can override.

Override `__deinit__()` to free dynamically allocated memory or release
long-lived resources such as file handles. Types that are simple collections of
other types usually do not need to.

```mojo
struct HeapArray(Writable):
    var data: ThinAllocation[Int]
    var size: Int

    def __deinit__(deinit self):
        print("Destroying", self.size, "elements")
        var ptr = self.data.unsafe_ptr()
        for i in range(self.size):
            ptr.unsafe_offset(i).unsafe_deinit_pointee()
        dealloc(self.data^.unsafe_with_layout({count = self.size}))
```

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

Two crucial facts about pointers and destruction:

> Note that a pointer doesn't *own* any values in the memory it points to, so when
> a pointer is destroyed, Mojo doesn't call the destructors on those values.

> To invoke the destructors, use the `unsafe_deinit_pointee()` method provided by
> the `UnsafePointer` type.

Source: <https://mojolang.org/docs/manual/lifecycle/death/>. In current naming
that is a `Pointer`; see [allocators](../memory/allocators.md) and the rename
table in [`versions/1.0.0`](../versions/1.0.0.md).

> **Don't call the destructor explicitly.** "If you need to ensure that a
> destructor is called at a specific point, use the discard pattern described in
> [explicit lifetime extension](#explicit-lifetime-extension)."

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

## Explicitly-destroyed types

> With *implicit destruction*, the compiler manages cleanup. It automatically
> calls `__deinit__()` when a value has no further uses, based on lifetime
> analysis. You do not invoke the destructor yourself.

> With *explicit destruction*, you take over cleanup responsibilities. You must
> define and call a named cleanup method (such as `cleanup()` or `save_and_close()`)
> and you must call that cleanup method before the end of the scope in which your
> value lives. The compiler disables automatic destruction. It requires you to
> consume the value. Failing to do so results in a compiler error.

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

The conceptual framing the docs use:

> One way to think about explicitly destroyed types is that they create a future
> requirement, a promise of action. Creating an instance commits you to performing
> specific actions (for example, flushing, closing, committing, or discarding) when
> the value has no further uses.

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

### `@explicit_destroy`

> The `@explicit_destroy` decorator disables automatic destruction. Instead, you
> define named destructor methods that must be called intentionally. The compiler
> enforces this requirement: failing to destroy the value produces a compile-time
> error.

Define a method that takes a `deinit self` argument and decorate the type:

```mojo
@explicit_destroy("Must call save_and_close() or discard()")
struct FileBuffer(Deinitable where False):
    var path: String
    var data: String

    def __init__(out self, path: String):
        self.path = path
        self.data = ""

    def write(mut self, content: String):
        self.data += content

    # Choose one cleanup path from these two options
    def save_and_close(deinit self) raises:
        write_to_disk(self.path, self.data)

    def discard(deinit self):
        pass
```

Use must invoke one of the destructors:

```mojo
def write_log(path: String, message: String) raises:
    var buffer = FileBuffer(path)
    buffer.write(message)
    buffer^.save_and_close()   # Required: explicit destruction
```

> The compiler verifies that a destructor is called for each explicitly destroyed
> value and emits an error if it cannot find one. If you supply a custom message to
> `@explicit_destroy`, that message appears in the error output.

```mojo
def broken_write(path: String, message: String):
    var buffer = FileBuffer(path)
    buffer.write(message)
    # ERROR: 'buffer' abandoned without being explicitly destroyed:
    #        Must call save_and_close() or discard()
```

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

Two properties to note:

- **Named explicit destructors can raise.** "Unlike the `__deinit__()` method,
  named explicit destructors can raise errors. ... If a destructor raises an
  error, the call stack can return to logic that selects an alternative cleanup
  path, such as invoking a secondary destructor."
- **1.0 form.** The current opt-out is `Deinitable where False`; the old
  `@explicit_destroy` opt-out was changed, and using `@explicit_destroy` without
  an error-string argument is now an error. Source:
  <https://mojolang.org/releases/v1.0.0/>.

> **Open question:** the destruction page marks its `@explicit_destroy` section
> with an upstream `TODO(DOCS-2253): Reflect changes to @explicit_destroy`, and the
> 1.0.0 notes describe the `Deinitable where False` change. The page's examples
> already show the string argument and `Deinitable where False`; the exact
> interaction of the two mechanisms is not spelled out beyond that.

### When to use explicit destruction

The documented cases:

- Cleanup can fail and requires error handling.
- Multiple cleanup paths are possible.
- The order of cleanup operations matters.
- Cleanup is expensive and should be deliberate.

The docs' examples: a `Transaction` with `commit()`/`rollback()`, a `MutexGuard`
with `unlock()`, a `BatchProcessor` with `finalize()`. Source:
<https://mojolang.org/docs/manual/lifecycle/death/>.

### Explicit destruction in parameterized code

Code parameterized over `AnyType` accepts both kinds of type but "cannot
automatically destroy values that require explicit destruction":

```mojo
def parameterized_function_1[T: AnyType](var value: T):
    # ERROR: 'value' abandoned without being explicitly destroyed:
    #        Unhandled explicitly destroyed type AnyType
    pass

def parameterized_function_2[T: Deinitable](var value: T):
    # OK: T can be implicitly destroyed
    # value.__deinit__() called automatically
    pass
```

The three documented approaches when your function may consume its argument:

- Accept the value by mutable or immutable reference so you do not consume it.
- Return the value or transfer ownership instead of consuming it.
- Require implicit destruction with `Deinitable`.

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

## The `deinit` argument convention

> In a method, adding the `deinit` convention to `self` means the method fully
> consumes the value by the time it returns. Specifically, `deinit self` signals
> that:
> - The method takes ownership of `self`.
> - No automatic destructor is called after the method returns.
> - Fields may be transferred or explicitly destroyed inside the method.
> - Additional cleanup work may take place within the method.
> - The value is considered destroyed when the method completes.

```mojo
def cleanup_method1(deinit self):
    self^.cleanup_method2()

def cleanup_method2(deinit self):
    pass
```

> Methods marked with `deinit self` can transfer ownership of `self` to other
> `deinit` methods. Chaining deinitialization methods allows cleanup
> responsibilities to be delegated.

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

## Field lifetimes

Mojo tracks each field independently, and applies ASAP destruction to fields too:

```mojo
def main():
    var balloons = Balloons("red", 5)
    print(balloons.color)
    # balloons.color.__deinit__() runs here, because this instance is
    # no longer used; it's replaced below

    balloons.color = "blue"
    print(balloons.color)
    # balloons.__deinit__() runs here
```

> The `balloons.color` field is destroyed after the first `print()`, because Mojo
> knows that it will be overwritten below.

The rule that keeps the model sound:

> Mojo's policy here is powerful and intentionally straight-forward: fields can be
> temporarily transferred, but the "whole object" must be constructed with the
> aggregate type's initializer and destroyed with the aggregate destructor. This
> means it's impossible to create an object by initializing only its fields, and
> it's likewise impossible to destroy an object by destroying only its fields.

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

If a field is transferred and not reinitialized by the end of the object's
lifetime, the compiler complains because it cannot destroy a partially
initialized object. Source:
<https://mojolang.org/docs/manual/lifecycle/death/>.

### Field lifetimes during move and destruction

> Both the consuming move constructor and the destructor take their operand with
> the `deinit` argument convention. This grants exclusive ownership of the value
> and marks it as destroyed at the end of the function. Within the function body,
> Mojo's ASAP policy still applies to fields: each field is destroyed immediately
> after its last use.

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

## Explicit lifetime extension

Sometimes you need to control exactly when a value dies. The documented tool is
to mark the last use by assigning to the discard pattern `_`:

```mojo
# Without explicit extension: s is last used in the print() call, so it is
# destroyed immediately afterwards.
var s = "abc"
print(s)   # s.__deinit__() runs after this line

# With explicit extension: push last-use to the discard line.
var t = "xyz"
print(t)

# ... some time later
_ = t   # t.__deinit__() runs after this line
```

The docs frame the use cases narrowly:

> Think of this as an explicit last-use marker for the lifetime checker, not a
> general-purpose pattern.

Use it when writing tests that intentionally create otherwise-unused values, when
writing unsafe/advanced code that manipulates a value's origin, or when you need
deterministic destructor timing relative to side effects such as logging or
profiling. Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

> **Note:** older Mojo required the transfer sigil (`^`) when discarding a
> move-only type. "This is no longer required, since the compiler doesn't actually
> move the discarded value." Source:
> <https://mojolang.org/docs/manual/lifecycle/death/>.

## Pitfalls

- **Expecting end-of-scope destruction.** Mojo destroys at last use, possibly in
  the middle of an expression. Source:
  <https://mojolang.org/docs/manual/lifecycle/death/>.
- **Calling a destructor explicitly.** Don't; use the discard pattern to control
  timing. Source: <https://mojolang.org/docs/manual/lifecycle/death/>.
- **Assuming `dealloc()`/a pointer destroys pointees.** It does not; call
  `unsafe_deinit_pointee()`. Source:
  <https://mojolang.org/docs/manual/lifecycle/death/>.
- **Leaving a field transferred when the object dies.** The compiler rejects
  destroying a partially initialized object; reinitialize or use `deinit self`.
  Source: <https://mojolang.org/docs/manual/lifecycle/death/>.
- **Writing `Deinitable where False` without a named destructor.** An explicitly
  destroyed type must define at least one custom destructor. Source:
  <https://mojolang.org/docs/manual/lifecycle/death/>.
- **Using `@explicit_destroy` with no message argument.** It is an error in 1.0.
  Source: <https://mojolang.org/releases/v1.0.0/>.
- **Consuming a `T: AnyType` in parameterized code.** An explicitly destroyed
  argument is rejected as abandoned; constrain with `Deinitable` or borrow it.
  Source: <https://mojolang.org/docs/manual/lifecycle/death/>.
- **Writing `__del__`.** The current destructor name is `__deinit__`. See
  [`versions/1.0.0`](../versions/1.0.0.md).

## Open questions

> **Open question:** the destruction page's `__deinit__` section is correct and
> current, but the surrounding manual (`lifecycle`, `lifecycle/life`,
> `lifecycle/initialization`) still writes `__del__` in several places, and the
> `death` page itself links to "a `__del__()` method" in the `@explicit_destroy`
> description. This book teaches `__deinit__` as current and flags the rest as
> documentation lag; the rename is recorded in
> [`versions/1.0.0`](../versions/1.0.0.md).

> **Open question:** the `@explicit_destroy` section carries an upstream
> `TODO(DOCS-2253)` and does not restate the full current construction. Verify the
> exact decorator/argument rules against the next upstream release.

> **Open question:** the death page's `HeapArray` example still writes
> `unsafe_free()` in prose while its current code uses `dealloc()`; the pointer
> operation renames are listed in [`versions/1.0.0`](../versions/1.0.0.md).

## Sources

- Mojo manual — Value destruction: <https://mojolang.org/docs/manual/lifecycle/death/>
- Mojo manual — Deep dive — Instance initialization: <https://mojolang.org/docs/manual/lifecycle/initialization/>
- Mojo manual — Intro to value lifecycle: <https://mojolang.org/docs/manual/lifecycle/>
- Mojo manual — Ownership (`deinit` convention): <https://mojolang.org/docs/manual/values/ownership/>
- Mojo reference — Function declarations (`__deinit__`): <https://mojolang.org/docs/reference/function-declarations/>
- Mojo reference — Decorators (`@explicit_destroy`): <https://mojolang.org/docs/reference/decorators/>
- Mojo v1.0.0 release notes (`@explicit_destroy` change): <https://mojolang.org/releases/v1.0.0/>
