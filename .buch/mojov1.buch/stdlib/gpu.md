# gpu

`gpu` contains the GPU programming primitives that remain in the Mojo standard
library.

> GPU programming primitives.

> These low level constructs allow you to write code that runs on the GPU with
> traditional programming style--partitioning work across threads that are mapped
> onto 1-, 2-, or 3-dimensional blocks. The thread blocks can subsequently be
> grouped into a grid of thread blocks.

Source: <https://mojolang.org/docs/std/gpu/>.

## The MAX split — read this first

The single most important fact about this package is what is **not** in it:

> Currently, the `DeviceContext` struct provides the interface for compiling and
> launching GPU kernels inside MAX [custom operations](https://max.modular.com/develop/custom-ops/).

Source: <https://mojolang.org/docs/std/gpu/>.

The 1.0.0 release notes add that `layout` is now bundled with MAX instead of
Mojo, and that some accelerator-related standard-library APIs moved to the `max`
Mojo package. Source: <https://mojolang.org/releases/v1.0.0/>.

So there are two layers:

| Layer | Where it lives | What it covers |
|-------|----------------|----------------|
| Kernel body primitives | `std.gpu` (this page) | Thread/block indices, warp operations, GPU intrinsics, host-side target info |
| Kernel launch and device/stream management | MAX | `DeviceContext`, contexts, launching, the `layout` package |

The book covers the split in context in
[GPU and accelerators](../concurrency/gpu-and-accelerators.md).

## Indexing: where am I?

The package exports aliases for the grid and thread position, and the docs show
the import path:

```mojo
from std.gpu import block_dim, block_idx, thread_idx, global_idx
```

Source: <https://mojolang.org/docs/std/gpu/>.

The `primitives.id` module adds lower-level thread identifiers:

| Function | What it returns |
|----------|-----------------|
| `lane_id` | "the lane ID of the current thread within its warp." |
| `warp_id` | "the warp ID of the current thread within its block ... ranging from 0 to BLOCK_SIZE." |
| `sm_id` | "the Streaming Multiprocessor (SM) ID of the current thread." |

Source: <https://mojolang.org/docs/std/gpu/primitives/id/>.

## The package layout

| Unit | Contents |
|------|----------|
| `host` subpackage | Host ↔ device interaction |
| `primitives` subpackage | Warp, block and cluster operations |
| `globals` module | GPU-specific global constants and configuration |
| `intrinsics` module | Low-level GPU intrinsics and memory-access primitives |
| `profiler` module | GPU profiling (`ProfileBlock`) |

Source: <https://mojolang.org/docs/std/gpu/>.

### `host` — target information

The `gpu.host` package "includes APIs to manage interaction between the *host*
(that is, the CPU) and *device* (that is, the GPU or accelerator)." Source:
<https://mojolang.org/docs/std/gpu/>.

Its `info` module provides compile-time target queries:

| Function | What it checks |
|----------|----------------|
| `is_cpu()` | Target is a CPU (compile-time). |
| `is_gpu()` | Target is a GPU (compile-time). |
| `is_npu()` | Target is an NPU (compile-time). |
| `is_accelerator()` | Target is an accelerator (compile-time). |
| `is_valid_target()` | Target is valid (compile-time). |
| `get_gpu_target(...)` | GPU target information for an architecture. |

Source: <https://mojolang.org/docs/std/gpu/host/info/>. `GPUInfo` and
`AcceleratorArchitectureFamily` describe "Comprehensive information about a GPU
architecture" and "common defaults for a GPU architecture family".

### `primitives.warp` — warp-level operations

The warp module is the richest part of `std.gpu`. Its documented operations:

| Group | Functions |
|-------|-----------|
| Reductions | `sum`, `max`, `min`, `reduce` (generic), `lane_group_sum`, `lane_group_max`, `lane_group_min`, `lane_group_reduce` |
| Shuffles | `shuffle_down`, `shuffle_up`, `shuffle_idx`, `shuffle_xor`, `broadcast` |
| Scan | `prefix_sum` |
| Votes / masks | `vote`, `match_all`, `match_any` |

Source: <https://mojolang.org/docs/std/gpu/primitives/warp/>.

The docstrings state the semantics plainly, for example:

- `sum`: "Computes the sum of values across all lanes in a warp."
- `shuffle_xor`: "Exchanges values between threads in a warp using a butterfly
  pattern."
- `vote`: "Creates a 32 or 64 bit mask among all threads in the warp, where each
  bit is set to 1 if the corresponding thread voted True, and 0 otherwise."

Source: <https://mojolang.org/docs/std/gpu/primitives/warp/>.

### `intrinsics` — vendor-specific primitives

The `intrinsics` module "provides low-level GPU intrinsic operations and memory
access primitives". Its symbols are explicitly hardware-oriented:
`AMDBufferResource` (128-bit AMD buffer descriptor), `CacheOperation`, `Scope`,
`byte_permute`, `cvt_pk_fp8_f32_raw`, `ds_read_tr8_b64`, `ds_read_tr16_b64`,
`ldg`, `lop`, `mulhi`, `mulwide`, `permlane_shuffle`, `permlane_swap`,
`threadfence`, `warpgroup_reg_alloc`, `warpgroup_reg_dealloc`. Source:
<https://mojolang.org/docs/std/gpu/intrinsics/>.

These are named after ISA instructions. They are for kernel code that needs exact
hardware control, not for ordinary device code.

### `profiler`

`ProfileBlock` is "A struct for profiling code blocks." Source:
<https://mojolang.org/docs/std/gpu/profiler/ProfileBlock/>.

## Idioms

- **Write kernels with the block/thread idiom.** Compute a global index from
  `block_idx`, `block_dim` and `thread_idx`, then bound-check against the problem
  size.
- **Ask the target at compile time.** Use `is_gpu()`/`is_cpu()` and
  `has_accelerator()`-style queries from [`sys`](sys.md) rather than assuming a
  device.
- **Use warp primitives instead of shared memory when the reduction fits a
  warp.** `sum`, `max`, `shuffle_*` and `prefix_sum` are the documented tools.
- **Reach for `intrinsics` only per architecture.** They are vendor-specific by
  name and are not portable across NVIDIA/AMD/Apple.
- **Launch through MAX.** Kernel *bodies* are in this package; the launch
  interface is MAX's `DeviceContext`.

## Pitfalls

- **Looking for `DeviceContext` in the standard library.** It is in MAX. Source:
  <https://mojolang.org/docs/std/gpu/>.
- **Looking for `layout` in the standard library.** It moved to MAX. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Writing warp code without a warp-synchronous guarantee.** The docs describe
  the operations; correct use still requires the kernel's execution model.
- **Assuming a vendor intrinsic exists on all targets.** `permlane_*` and
  `ds_read_tr*` are AMD; `warpgroup_reg_*` is NVIDIA.
- **Assuming a stable API.** See below.

This page is a **curated selection**: the package has many more intrinsic
symbols than are listed here. The complete list is on the module pages.

## Stability

The `gpu` package page and the `intrinsics`, `primitives`, `host`, `globals` and
`profiler` pages show **no `@stable(since=...)` markers** and no stability
badges. Under the standard-library rule — "We consider standard library APIs
unstable unless specifically marked stable" — these APIs are **unstable by
default**. This is also implied by the architecture note in the package
description itself and by the 1.0.0 statement that accelerator APIs moved
between packages. Sources: <https://mojolang.org/docs/std/gpu/>,
<https://mojolang.org/docs/api-docs/stability/>,
<https://mojolang.org/releases/v1.0.0/>.

## Sources

- Mojo `gpu` package: <https://mojolang.org/docs/std/gpu/>
- Mojo `gpu.host` subpackage: <https://mojolang.org/docs/std/gpu/host/>
- Mojo `gpu.host.info` module: <https://mojolang.org/docs/std/gpu/host/info/>
- Mojo `gpu.primitives` subpackage: <https://mojolang.org/docs/std/gpu/primitives/>
- Mojo `gpu.primitives.id` module: <https://mojolang.org/docs/std/gpu/primitives/id/>
- Mojo `gpu.primitives.warp` module: <https://mojolang.org/docs/std/gpu/primitives/warp/>
- Mojo `gpu.intrinsics` module: <https://mojolang.org/docs/std/gpu/intrinsics/>
- Mojo `gpu.profiler` module: <https://mojolang.org/docs/std/gpu/profiler/>
- Mojo `ProfileBlock`: <https://mojolang.org/docs/std/gpu/profiler/ProfileBlock/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
