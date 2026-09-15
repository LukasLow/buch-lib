# Self-referential structs

A struct has a fixed layout, so it cannot contain an instance of itself: the
compiler would have no finite size to reserve. Linked lists, trees and graphs
therefore need an indirection. In Mojo that indirection is a `Pointer`, combined
with heap allocation and explicit cleanup. This page covers why the direct form
fails, the pointer-based node pattern, allocation, linking, traversal, and
cleanup — including a complete linked-list example.

## Why a struct cannot contain itself

> Mojo won't let you build a type that stores another instance of itself,
> even when nested within an `Optional`:

```mojo
struct Node:
    var value: String
    var next: Optional[Node]  # ERROR: Recursive reference
```

> Each `struct` has a fixed layout. If `Node` held another `Node` directly, the
> compiler wouldn't know how much space to reserve. Optional fields don't help,
> because the outer value still needs room for the inner one.

Source: <https://mojolang.org/docs/manual/structs/reference/>.

The struct-declarations reference states the same rule and the reason it exists:

> Structs can't point to themselves. Mojo won't let you build a type that
> stores another instance of itself, even when nested within an Optional...
> To build recursive data structures such as linked lists and trees, you must
> use unsafe pointers.

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

The `Optional` attempt is worth understanding rather than memorizing: `Node`
would be `String` plus `Optional[Node]`, and `Optional[Node]` would need at
least as much space as `Node`. The definition has no base case.

> Pointers solve this problem. Pointers have a fixed size, and they let values
> point at each other without blowing up the type.

Source: <https://mojolang.org/docs/manual/structs/reference/>.

> **Open question:** the manual and reference pages describe the indirection as
> "unsafe pointers" and the walkthrough spells the type `UnsafePointer`. The
> 1.0 release notes unify `UnsafePointer` into the single `Pointer` type, so the
> 1.x spelling is `Pointer[Self, MutUntrackedOrigin]`. This page uses the
> unified spelling throughout; any `UnsafePointer` in the official walkthrough
> is documentation lag. Sources:
> <https://mojolang.org/releases/v1.0.0/> and
> <https://mojolang.org/docs/manual/structs/reference/>. The old→new table is in
> [`versions/1.0.0`](../versions/1.0.0.md).

## The node type

The manual builds up a node with a value slot and one link forward:

```mojo
struct Node[ElementType: ImplicitlyCopyable & Writable & Deinitable & Movable]:
    comptime NodePointer = Pointer[Self, MutUntrackedOrigin]

    var value: Optional[Self.ElementType]   # the node's value
    var next: Optional[Self.NodePointer]    # pointer to the next node

    # Uses an `Optional` value to allow 'empty' node construction
    # that can be moved into newly allocated memory.
    def __init__(out self, value: Optional[Self.ElementType] = None):
        self.value = value
        self.next = {}
```

Source (structure and comments):
<https://mojolang.org/docs/manual/structs/reference/>.

Four design points are packed into those few lines.

**A type-specific pointer alias.** `NodePointer` is a `comptime` member
naming `Pointer` to the node's own type. Using `Self` inside the alias is what
makes it type-specific, so `Node[String].NodePointer` and
`Node[Int].NodePointer` are different types. Source:
<https://mojolang.org/docs/manual/structs/reference/>.

**Why `MutUntrackedOrigin`.** The pointer refers to memory we allocate
ourselves, which the lifetime checker does not own:

> `MutUntrackedOrigin` lets the pointer represent dynamically-allocated memory
> that won't be tracked by the lifetime checker. You'll need to both allocate
> and deallocate memory as needed.

Source: <https://mojolang.org/docs/manual/structs/reference/>.

**Why `Optional[NodePointer]` rather than a null pointer.** `Pointer` is
non-nullable:

> The `next` field is an `Optional[Self.NodePointer]` because a node may or may
> not link to another node. `UnsafePointer` is non-nullable, so `Optional`
> provides the null state. `Optional[UnsafePointer]` has the same memory layout
> as a raw pointer, so there's no overhead.

Source: <https://mojolang.org/docs/manual/structs/reference/>. The 1.x spelling
of that sentence is `Optional[Pointer]`, and the layout guarantee is documented
on the using-pointers page: "`Optional[Pointer]` has the same memory layout as a
raw pointer, so you can pass it across FFI boundaries as `NULL`." Source:
<https://mojolang.org/docs/manual/pointers/using-pointers/>.

**Why `value` is itself optional in the node demo.** The manual's reason:

> The optional `value` lets you create "empty" nodes, enabling you to move
> new `Node` memory allocations into place.

Source: <https://mojolang.org/docs/manual/structs/reference/>. The allocation
pattern needs a value that can be moved into uninitialized memory, so the demo
node starts empty and is filled by `unsafe_write`.

## Building a node

The manual calls this "the key pattern you'll use in many reference
structures":

> 1. Allocate space.
> 1. Construct a value-holding node.
> 1. Move it into the allocated memory.
> 1. Return the pointer.

```mojo
@staticmethod
def make_node(value: Self.ElementType) -> Self.NodePointer:
    var node_ptr = alloc[Self](count=1)
    node_ptr.unsafe_write(Self(value))
    return node_ptr
```

Source: <https://mojolang.org/docs/manual/structs/reference/>. The summary is
worth keeping: "This 'allocate space, initialize, and move' approach creates
safe pointer-based structures in Mojo."

Note the two API shapes: `alloc[Self](count=1)` allocates one `Self`, and
`unsafe_write` moves a value into that uninitialized storage. The
using-pointers page documents both: `alloc()` returns an `Allocation`, and
`Pointer.unsafe_write()` "moves a value into the pointer's memory location."
Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

> **Open question:** the official walkthrough writes the allocation as
> `alloc[Self](1)`, while the using-pointers page documents the forms
> `alloc(Layout[Int](count=4))` and `alloc[Float64]({count = 64})`. The current
> exact argument spelling for `alloc[Self]` in the walkthrough context is not
> shown unambiguously in the Markdown rendering. This page uses
> `alloc[Self](count=1)`, matching the documented `count=` keyword. Verify
> against the `std.memory.alloc` API before copying. Sources:
> <https://mojolang.org/docs/manual/structs/reference/> and
> <https://mojolang.org/docs/manual/pointers/using-pointers/>.

## Linking nodes

To append, allocate a new node and point `next` at it — and free the old chain
first if `next` was already occupied:

```mojo
def append(mut self, value: Self.ElementType):
    # Free chain if replacing `next`
    if self.next:
        var next_ptr = self.next.value()
        next_ptr[].free_chain()
        next_ptr.unsafe_deinit_pointee()
        next_ptr.unsafe_free()

    self.next = Self.make_node(value)
```

Source: <https://mojolang.org/docs/manual/structs/reference/>.

Three facts about this method:

- It takes `mut self`, because it changes the node's `next` field. An
  unannotated `self` would be immutable. Source:
  <https://mojolang.org/docs/manual/structs/>.
- It tests `if self.next:` — the truthiness of the `Optional` — before
  unwrapping with `value()`. Source:
  <https://mojolang.org/docs/manual/structs/reference/>.
- The cleanup sequence is destroy-then-free:
  `unsafe_deinit_pointee()` destroys the pointee, then `unsafe_free()` releases
  the memory. Source:
  <https://mojolang.org/docs/manual/pointers/using-pointers/>.

> **Open question:** the walkthrough calls `next_ptr.unsafe_free()` directly on
> the node pointer, but the using-pointers page teaches layout-based allocation
> and `dealloc(allocation^)`, and the 1.0 notes say "Allocation should migrate
> to the layout-aware `memory.alloc` package." `unsafe_free()` is documented as
> the current spelling of the old `free()`, so both appear in the official
> material. Prefer the `Allocation`/`dealloc` form for new code; the
> walkthrough's raw `unsafe_free()` route is the lower-level alternative.
> Sources: <https://mojolang.org/releases/v1.0.0/> and
> <https://mojolang.org/docs/manual/pointers/using-pointers/>.

## Walking the list

Recursion makes traversal readable:

```mojo
@staticmethod
def print_list(node: Optional[Self.NodePointer]):
    if not node:
        print("Empty list")
        return

    var node_ptr = node.value()

    var current_value: Optional[Self.ElementType] = node_ptr[].value
    if current_value:
        print(current_value.value(), end=" ")

    if node_ptr[].next:
        Self.print_list(node_ptr[].next)
    else:
        print()
```

> The pattern is simple: check the value, print it if it exists, then move to
> the next link.

Source: <https://mojolang.org/docs/manual/structs/reference/>.

The three access forms in that snippet are the ones to read carefully:

- `node.value()` unwraps the `Optional[Pointer]`.
- `node_ptr[]` dereferences the pointer to the **pointee** node.
- `node_ptr[].next` reads the pointee's `next` field.

The manual notes the method could be an instance method as well as a static one.
Source: <https://mojolang.org/docs/manual/structs/reference/>.

## Cleaning up

Allocation is manual, so deallocation is manual. The chain walk is the inverse
of the append:

```mojo
def free_chain(self):
    var current = self.next
    while current:
        var current_ptr = current.value()
        var next_node = current_ptr[].next
        current_ptr.unsafe_deinit_pointee()
        current_ptr.unsafe_free()
        current = next_node
```

Source: <https://mojolang.org/docs/manual/structs/reference/>. Two facts the
manual states with the code:

> The 'head' node stays allocated unless you explicitly free it yourself:
>
> ```mojo
> list_head[].free_chain()
> list_head.unsafe_deinit_pointee()
> list_head.unsafe_free()
> ```

And the safety warning:

> In short-lived programs, the OS reclaims memory at exit.

Source: <https://mojolang.org/docs/manual/structs/reference/>. The last point is
not permission to leak: rely on process exit only for throwaway demos, and write
the destructor for a real container (below).

### Destructors

A real data structure hides the raw pointers behind a safe API, and the owning
container performs cleanup in its destructor:

> When you build real Mojo data structures, you usually want a safe API that
> hides raw pointers from users. In a complete linked-list type (rather than a
> small demo of linkable nodes) the parent list handles node allocation and
> freeing. Because it owns the nodes, it also performs cleanup in its
> destructor.

Source: <https://mojolang.org/docs/manual/structs/reference/>.

```mojo
struct LinkedList[T]:
    var _head: Optional[Self._NodePointer]

    def __deinit__(deinit self):
        var curr = self._head
        while curr:
            var next = curr.value()[].next
            curr.value().unsafe_deinit_pointee()
            curr.value().unsafe_free()
            curr = next
```

Source (structure): <https://mojolang.org/docs/manual/structs/reference/>. The
1.x destructor spelling is `__deinit__(deinit self)`; `__del__` is the deprecated
pre-1.0 name. Sources: <https://mojolang.org/releases/v1.0.0/> and
<https://mojolang.org/docs/manual/lifecycle/death/>.

The destructor's `deinit self` convention "indicates that the value is being
deinitialized." The death page adds that fields are still whole inside the
destructor and are destroyed normally afterwards: "your implementation does not
override any default destruction behaviors." Source:
<https://mojolang.org/docs/manual/lifecycle/death/>.

## The complete example

The manual's full sample, adapted to the 1.x spellings covered above:

```mojo
comptime Element = String
comptime ListNode = Node[Element]

struct Node[ElementType: ImplicitlyCopyable & Writable & Deinitable & Movable]:
    comptime NodePointer = Pointer[Self, MutUntrackedOrigin]

    var value: Optional[Self.ElementType]
    var next: Optional[Self.NodePointer]

    def __init__(out self, value: Optional[Self.ElementType] = None):
        self.value = value
        self.next = {}

    @staticmethod
    def make_node(value: Self.ElementType) -> Self.NodePointer:
        var node_ptr = alloc[Self](count=1)
        node_ptr.unsafe_write(Self(value))
        return node_ptr

    def append(mut self, value: Self.ElementType):
        if self.next:
            var next_ptr = self.next.value()
            next_ptr[].free_chain()
            next_ptr.unsafe_deinit_pointee()
            next_ptr.unsafe_free()
        self.next = Self.make_node(value)

    @staticmethod
    def print_list(node: Optional[Self.NodePointer]):
        if not node:
            print("Empty list")
            return
        var node_ptr = node.value()
        var current_value: Optional[Self.ElementType] = node_ptr[].value
        if current_value:
            print(current_value.value(), end=" ")
        if node_ptr[].next:
            Self.print_list(node_ptr[].next)
        else:
            print()

    def free_chain(self):
        var current = self.next
        while current:
            var current_ptr = current.value()
            var next_node = current_ptr[].next
            current_ptr.unsafe_deinit_pointee()
            current_ptr.unsafe_free()
            current = next_node

def main():
    var values: List[Element] = ["one", "one", "two", "three", "five", "eight"]
    var list_head = ListNode.make_node(values[0])
    var current = list_head
    for idx in range(1, len(values), 1):
        current[].append(values[idx])
        current = current[].next.value()

    ListNode.print_list(list_head)
    # one one two three five eight

    list_head[].free_chain()
    list_head.unsafe_deinit_pointee()
    list_head.unsafe_free()
```

Official output:

```output
one one two three five eight
```

Source: <https://mojolang.org/docs/manual/structs/reference/>. The manual's
version spells the pointer `UnsafePointer` and uses `__del__`, both of which are
pre-1.0 in 1.x; the code above uses the unified `Pointer` and `__deinit__`.

## What a tree would look like

The same pattern generalizes. A binary tree node simply has two optional
pointers instead of one, and the cleanup becomes a post-order walk:

```text
struct TreeNode[T: ...]:
    comptime NodePointer = Pointer[Self, MutUntrackedOrigin]

    var value: Optional[Self.T]
    var left: Optional[Self.NodePointer]
    var right: Optional[Self.NodePointer]
```

There is no official tree walkthrough in the 1.x manual; the linked-list page is
the documented reference for the pattern, and a tree applies it with two links.
Source: <https://mojolang.org/docs/manual/structs/reference/>.

> **Open question:** the manual documents the linked-list pattern only. The
> tree sketch above applies the documented node/allocate/link/cleanup pattern
> mechanically, but it is not itself an official example. Verify the free order
> (children before parent, and before freeing the parent's storage) against the
> `unsafe_deinit_pointee`/`unsafe_free` contracts when you write one. Source:
> <https://mojolang.org/docs/manual/pointers/using-pointers/>.

## Alternatives to hand-written nodes

The standard library already contains owned pointer types for single values, and
one of them may remove the need for the manual pattern:

- `OwnedPointer[T]` is a smart pointer with exclusive ownership that allocates
  implicitly; it is movable but not copyable.
- `ArcPointer[T]` is reference-counted and copyable, and is the tool for a
  shared node in a DAG.

Sources: <https://mojolang.org/docs/manual/pointers/> and
<https://mojolang.org/docs/manual/pointers/using-pointers/>. For a plain
container that already links nodes for you, the stdlib has `LinkedList`,
`Deque` and `BinaryHeap`; the `collections` package lists them. Source:
<https://mojolang.org/docs/std/collections/>.

Reach for the hand-written pattern when you need a custom shape (a tree, a
graph, an intrusive list) that the standard containers do not provide.

## Pitfalls

- **Trying to store `Self` or `Optional[Self]` as a field.** Recursive reference
  error; the type has no finite size. Use a pointer. Verified above.
- **Using a plain `Pointer[Self]` as the field type without an origin.** The
  field must name a concrete origin; heaps are `MutUntrackedOrigin` (or an
  `Origin` parameter). Verified above.
- **Treating a pointer as nullable.** `Pointer` is non-nullable; the link field
  is `Optional[Self.NodePointer]`, which costs nothing extra in layout. Verified
  above.
- **Writing `ptr[i]` to reach a link.** Use `node_ptr[].next`, where `[]` is the
  safe dereference. Offset access is `unsafe_offset` and is deprecated in its
  bare form. Verified above.
- **Forgetting to deinitialize before freeing.** `unsafe_free()` releases memory
  without running destructors; call `unsafe_deinit_pointee()` first for every
  initialized value. Verified above.
- **Leaking the head node.** `free_chain()` only frees the links after `self`;
  the head itself must be deinitialized and freed explicitly. Verified above.
- **Relying on process exit to reclaim memory.** Fine for a short demo, not for
  a container; write `__deinit__`. Verified above.
- **Writing `__del__` in new code.** It is the deprecated pre-1.0 destructor
  name; use `__deinit__(deinit self)`. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Writing `UnsafePointer` in new code.** The 1.x type is `Pointer`; the old
  name still compiles but warns. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Forgetting `mut self` on `append`.** An unannotated receiver is immutable,
  so assigning to `self.next` fails. Verified above.
- **Freeing a node twice.** `next_ptr` is freed through the chain and then the
  pointer is deinitialized and freed; make sure each node is released on exactly
  one path. Verified above.

## Sources

- Self-referential structs (manual): <https://mojolang.org/docs/manual/structs/reference/>
- Mojo struct declarations reference: <https://mojolang.org/docs/reference/struct-declarations/>
- Using pointers (manual): <https://mojolang.org/docs/manual/pointers/using-pointers/>
- Intro to pointers (manual): <https://mojolang.org/docs/manual/pointers/>
- Value destruction (manual): <https://mojolang.org/docs/manual/lifecycle/death/>
- Mojo structs (manual): <https://mojolang.org/docs/manual/structs/>
- Mojo `collections` package: <https://mojolang.org/docs/std/collections/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
