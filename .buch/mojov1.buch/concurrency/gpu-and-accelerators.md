# GPU and accelerators

Mojo is designed to target CPUs and accelerators, but the boundary between "the
Mojo language" and "the accelerator stack" is sharp in 1.x: **low-level GPU
primitives stay in the Mojo standard library, while the tensor and
accelerator APIs live in the separate MAX package.** This page covers what Mojo
targets, what an agent needs to know to write GPU code, and what the hardware
must provide.

Sources are the requirements page
(<https://mojolang.org/docs/requirements/>), the compilation-targets page
(<https://mojolang.org/docs/tools/compilation/>), the `std.gpu` package index
(<https://mojolang.org/docs/std/gpu/>), the 1.0.0 release notes
(<https://mojolang.org/releases/v1.0.0/>), the FAQ
(<https://mojolang.org/docs/faq/>) and the roadmap
(<https://mojolang.org/docs/roadmap/>).

## What Mojo targets

> "When the compiler generates machine code, it needs a few key details about the
> hardware it targets:
>
> - The **architecture** defines the base instruction set, such as x86-64 or
>   AArch64.
> - The **CPU model** adds processor-specific behavior and may enable instructions
>   beyond the base.
> - The **feature set** controls individual hardware capabilities that can be
>   enabled or disabled, such as AVX-512 or Neon.
>
> For accelerator targets, one more detail applies:
>
> - The **accelerator architecture** identifies the GPU or other accelerator to
>   generate device code for."
>
> — <https://mojolang.org/docs/tools/compilation/>

The registered targets that the compiler can emit for are queryable:

```sh
mojo build --print-supported-targets
```

The official sample output includes:

```output
Registered Targets:
  arm64 - ARM64 (little endian)
  arm64_32 - ARM64 (little endian ILP32)
  aarch64 - AArch64 (little endian)
  aarch64_32 - AArch64 (little endian ILP32)
  aarch64_be - AArch64 (big endian)
  r600 - AMD GPUs HD2XXX-HD6XXX
  amdgcn - AMD GCN GPUs
  hexagon - Hexagon
  ...
```

And the accelerator architectures:

```sh
mojo build --print-supported-accelerators
```

```output
Supported Accelerator Architectures:

NVIDIA (CUDA):
  sm_52       - Maxwell (GTX 970)
  sm_60       - Pascal (Tesla P100)
  sm_90       - Hopper (H100)
  ...

AMD (ROCm/HIP):
  gfx942      - CDNA3 (MI300X)
  mi300x      - (alias) -> gfx942
  ...

Apple Silicon GPU:
  apple-m1    - Apple M1
  apple-m2    - Apple M2
  ...

Other:
  cuda        - Generic CUDA
```

Sources: <https://mojolang.org/docs/tools/compilation/>.

So Mojo targets:

- **CPUs**: x86-64-v3 and newer, ARM64 (Neoverse N1+/Apple silicon), Hexagon.
- **NVIDIA GPUs** via the CUDA/NVPTX path.
- **AMD GPUs** via ROCm/HIP (AMDGCN targets such as `gfx942`, `gfx950`).
- **Apple silicon GPUs** via Metal.
- **NPUs** are named in the GPU info API (`is_npu`), but no NPU target is
  documented in the supported-targets output.

### Heterogeneous builds

> "Mojo supports _heterogeneous builds_ that generate host code for the CPU and
> device code for a GPU in a single build. Use `--target-accelerator` to specify
> the GPU architecture:"

```sh
mojo build --target-accelerator=sm_90 myapp.mojo
```

> "For NVIDIA and AMD targets, use a prefix to select the platform:"

```sh
mojo build --target-accelerator=nvidia:sm_90 myapp.mojo   # NVIDIA H100
mojo build --target-accelerator=amdgpu:gfx942 myapp.mojo  # AMD MI300X
```

> "When you use `--emit asm` with a GPU target, the compiler produces a separate
> file for each kernel alongside the host assembly: `.ptx` for NVIDIA, `.amdgcn`
> for AMD, and `.ll` for Metal."
> — <https://mojolang.org/docs/tools/compilation/>

**Pitfall:** the two flag families cannot be mixed. "Using `--target-cpu` or
`--target-features` with `--march` or `--mcpu` in the same command produces an
error." (<https://mojolang.org/docs/tools/compilation/>)

## Hardware and software requirements

> "Mojo runs on Mac, Linux, and Windows (with WSL). You don't need a GPU to
> program with Mojo—GPU support is optional."
> — <https://mojolang.org/docs/requirements/>

GPU support requires, per vendor, a specific minimum. The requirements page
splits compatibility into two levels:

> "We categorize GPU compatibility into two levels:
>
> - **Continuously tested:** Run in Modular's CI on every release. High
>   confidence that GPU code compiles and executes correctly.
> - **Known compatible:** Confirmed to work by Modular or community members, but
>   not continuously tested. These GPUs share an architecture with a tested GPU
>   and should work without issues."

### NVIDIA

- Driver **580 or later**.
- Older drivers: set `MODULAR_NVPTX_COMPILER_PATH` to a system `ptxas`:

  ```bash
  export MODULAR_NVPTX_COMPILER_PATH=/usr/local/cuda/bin/ptxas
  ```

  This "bypasses the bundled compiler's driver version check".

**Continuously tested:** B200 (`sm_100`).

**Known compatible:** B300 (`sm_103`), B100 (`sm_100`), DGX Spark (`sm_121`),
H200/H100 (`sm_90`), L4/L40 (`sm_89`), RTX 50XX (`sm_120`), RTX 40XX (`sm_89`),
A100 (`sm_80`), A10/A1000/RTX 30XX (`sm_86`), Jetson Orin/Orin Nano (`sm_87`),
Jetson Thor (`sm_110`), T4/RTX 20XX (`sm_75`).

Pre-Turing GPUs "are not supported out of the box" and need the same
`MODULAR_NVPTX_COMPILER_PATH` workaround.

### AMD

- Driver **6.3.3 or later**; MI355X requires ROCm 7.0 or later.

**Continuously tested:** MI355X (`gfx950`), MI300X (`gfx942`).

**Known compatible:** MI325X (`gfx942`), MI250X (`gfx90a`), Radeon RX 9070
(`gfx1201`), RX 9060 (`gfx1200`), Radeon 880M/890M (`gfx1150`), 860M (`gfx1152`),
8060S (`gfx1151`), RX 7900 (`gfx1100`), RX 7800/7700 (`gfx1101`), RX 7600
(`gfx1102`), Radeon 780M (`gfx1103`), RX 6900 (`gfx1030`), Steam Deck
(`gfx1033`).

### Apple silicon

- macOS Sequoia (15) or later **and** Xcode 16 or later.
- After upgrading macOS or Xcode you may need the Metal toolchain:

  ```bash
  xcodebuild -downloadComponent MetalToolchain
  ```

**Known compatible:** M5, M4, M3, M2, M1. None is listed as continuously tested.

Source for all of the above: <https://mojolang.org/docs/requirements/>.

### CPU and memory

The CPU/OS requirements apply whether or not a GPU is used:

- Linux: glibc 2.34+, x86-64-v3 or ARM64 Neoverse N1+.
- macOS: Sequoia 15+, Apple silicon M1–M5.
- Windows: only via WSL.
- RAM: 8 GiB minimum; "MAX inference and model serving require significantly
  more memory".

## The MAX boundary: where the APIs live

This is the single most important organisational fact on this page.

> "Most standard library APIs related to accelerator programming have moved to a
> new `max` Mojo package, including:
>
> - `std.benchmark.Bench.bench_multicontext` -> `max.benchmark.bench_multicontext`
> - `std.benchmark.Bencher.iter_custom(DeviceContext)` -> `max.benchmark.bencher_iter_custom`
> - `std.gpu.compute` -> `max.gpu.compute`
> - `std.gpu.host` -> `max.gpu.host`
> - `std.gpu.memory` -> `max.gpu.memory`
> - `std.gpu.sync` -> `max.gpu.sync`
>
> The `layout` package is now bundled with MAX instead of Mojo.
>
> Some low-level APIs related to GPU programming remain in the standard library."
> — <https://mojolang.org/releases/v1.0.0/>

The release notes group this under "a clearer boundary between Mojo and MAX":

> "some standard library APIs related to accelerator programming have moved to a
> new `max` Mojo package, and the `layout` package is now bundled with MAX
> instead of Mojo. Relatedly, `Int` and `UInt` no longer conform to
> `DevicePassable` and can no longer be passed to GPU kernels: they are
> platform-sized index types, so passing them to an accelerator miscompiles when
> the host and device disagree on the width. Use a fixed-width type such as
> `Int32` instead."
> — <https://mojolang.org/releases/v1.0.0/>

And the FAQ makes the package split concrete:

> "If you're interested in GPU programming, install the `max` package, which
> includes the MAX framework and Mojo."
> — <https://mojolang.org/docs/faq/>

### What stayed in the Mojo stdlib

`std.gpu` is still documented:

> "GPU programming primitives.
>
> These low level constructs allow you to write code that runs on the GPU with
> traditional programming style--partitioning work across threads that are mapped
> onto 1-, 2-, or 3-dimensional blocks. The thread blocks can subsequently be
> grouped into a grid of thread blocks.
>
> A _kernel_ is a function that runs on the GPU in parallel across many threads.
> Currently, the `DeviceContext` struct provides the interface for compiling and
> launching GPU kernels inside MAX custom operations."
> — <https://mojolang.org/docs/std/gpu/>

Its structure (module and package index,
<https://mojolang.org/docs/std/gpu/>):

| Item | Contents |
|---|---|
| `gpu.host` | host ↔ device interaction; the surviving module is `host.info` (GPU architecture info) |
| `gpu.primitives` | warp, block and cluster operations; `primitives.id` and `primitives.warp` |
| `gpu.globals` | `WARP_SIZE`, `WARPGROUP_SIZE`, `MAX_THREADS_PER_BLOCK_METADATA` |
| `gpu.intrinsics` | low-level GPU intrinsics and memory access primitives |
| `gpu.profiler` | GPU profiling (`ProfileBlock`) |

The exported grid/thread aliases come straight from `gpu`:

```mojo
from std.gpu import block_dim, block_idx, thread_idx, global_idx
```

> — <https://mojolang.org/docs/std/gpu/>

`gpu.primitives.id` documents the full set of `comptime` accessors:
`block_dim`, `block_id_in_cluster`, `block_idx`, `cluster_dim`, `cluster_idx`,
`global_idx`, `grid_dim`, `thread_idx`, plus `lane_id()`, `sm_id()` and
`warp_id()`. (<https://mojolang.org/docs/std/gpu/primitives/id/>)

`gpu.globals` documents the two constants an agent will use most:

> "`WARP_SIZE`: The number of threads that execute in lockstep within a warp on
> the GPU. … The value is architecture-dependent:
>
> - 32 threads per warp on NVIDIA GPUs
> - 32 threads per warp on AMD RDNA GPUs
> - 64 threads per warp on AMD CDNA GPUs
> - 0 if no GPU is detected"
>
> — <https://mojolang.org/docs/std/gpu/globals/>

**Pitfall:** `WARP_SIZE` is target-dependent (32 or 64) and is `0` when no GPU is
detected. Never hard-code 32.

**Pitfall:** `std.gpu.host.info` is the surviving `gpu.host` module, but
`DeviceContext` itself is documented at MAX
(`max.gpu.host.DeviceContext`) and the requirements-page GPU check imports
`from max.gpu.host import DeviceContext`. Do not assume `std.gpu.host` still
exports the launcher; see the open question at the end of this page.

### What lives in MAX (not the Mojo stdlib)

From the 1.0.0 notes and the MAX documentation links
(<https://mojolang.org/releases/v1.0.0/>):

- `max.gpu.host` — `DeviceContext`, host ↔ device, memory transfer.
- `max.gpu.compute`, `max.gpu.memory`, `max.gpu.sync` — compute, device memory,
  synchronization.
- The `layout` package — tensor layout and tiling (`TileTensor`, `LayoutTensor`).
- `max.algorithm` — `parallelize` and friends (see
  [async and parallelism](async-and-parallelism.md)).
- Tensor and neural-network APIs — there is **no `tensor` or `nn` package in the
  Mojo standard library**.

> "No `tensor`/`nn` at the std top level — those moved to the separate MAX
> package."
> — <https://mojolang.org/releases/v1.0.0/>

The FAQ states the division of labour in one line:

> "Does Mojo support distributed execution? Not alone. Mojo is one component of
> the Modular Platform, which makes it easier for you to author highly
> performant, portable CPU and GPU graph operations, but you'll also need a
> runtime (or "OS") that supports graph-level transformations and heterogeneous
> compute, which the MAX framework provides."
> — <https://mojolang.org/docs/faq/>

**The practical rule:** if a task involves tensors, layouts or launching a
kernel, the answer is in MAX's documentation, not in the Mojo manual. If it
involves thread/block indices, warp shuffles or GPU intrinsics inside a kernel,
it is in `std.gpu`.

## What a GPU kernel author needs to know

### The execution hierarchy

The `primitives` module describes the levels:

> "This package provides low-level GPU execution primitives at various levels of
> the GPU hierarchy:
>
> - **warp**: Warp-level operations (shuffle, reduce, broadcast)
> - **block**: Block-level operations (reductions across thread blocks)
> - **cluster**: Cluster-level synchronization (SM90+)
> - **grid_controls**: Grid dependency control (Hopper PDL)
> - **id**: Thread/block/grid indexing and dimensions"
> — <https://mojolang.org/docs/std/gpu/primitives/>

A kernel is a plain Mojo function that reads its position from `thread_idx` /
`block_idx` / `grid_dim` and does work; the host side launches it across a
dispatch geometry. The warp primitives (`shuffle_down`, `shuffle_xor`,
`shuffle_idx`, `reduce`, `prefix_sum`, `vote`, `match_any`, `broadcast`, …)
are documented in `gpu.primitives.warp`
(<https://mojolang.org/docs/std/gpu/primitives/warp/>).

### Device passability

Not every Mojo type can cross to the device. The rule:

> "This trait marks types as passable to accelerator devices."
> — `DevicePassable`, <https://mojolang.org/docs/std/builtin/device_passable/DevicePassable/>

And the 1.0.0 change that matters most:

> "`Int` and `UInt` no longer conform to `DevicePassable` and can no longer be
> passed to GPU kernels: they are platform-sized index types, so passing them to
> an accelerator miscompiles when the host and device disagree on the width. Use
> a fixed-width type such as `Int32` instead."
> — <https://mojolang.org/releases/v1.0.0/>

**Pitfall:** this is a silent-miscompile class of bug, not a compile error in
every case. Pass fixed-width types such as `Int32`, `Int64`, `Float32` to
kernels. `SIMD` types are explicitly fine:

> "SIMD types are remapped to the same type when passed to accelerator devices."
> — `SIMD.device_type`, <https://mojolang.org/docs/std/builtin/simd/SIMD/>

### Memory safety on the device

The 1.0.0 notes also made GPU memory safer in `Span`:

> "`Span` now has a keyword-only `address_space` parameter (defaulting to
> `AddressSpace.GENERIC`), so a span can view memory in a non-default address
> space, such as GPU shared memory. Address-only operations (indexing, slicing,
> `unsafe_ptr()`, `as_imm()`, and the SIMD search helpers) work in any address
> space and preserve it in their results … The remaining element-copying
> operations (iteration, `copy_from()`, hashing, equality, and writing) are still
> restricted to the default address space."
> — <https://mojolang.org/releases/v1.0.0/>

**Pitfall:** a `Span` over GPU shared memory supports only address-only
operations. Iteration, equality, hashing and writing are restricted to the
default address space.

### Bounds checks differ on GPU

`check_bounds` documentation: "Bounds check which is on by default for CPU, and
off by default for GPU."
(<https://mojolang.org/docs/std/collections/check_bounds/check_bounds/>)

**Pitfall:** an out-of-bounds access that aborts on CPU may silently corrupt on
GPU because the check is off by default there. Index carefully in kernels.

### Inline MLIR for hardware intrinsics

When Mojo does not surface an operation, the inline-MLIR reference is the
documented escape hatch — including for GPU dialect operations:

> "Mojo is built on MLIR and exposes it directly to developers. When you need an
> operation that Mojo doesn't surface, such as hardware intrinsics, atomic memory
> orderings, or custom dialect operations, you can write the MLIR operation
> yourself instead of waiting for a language feature."
> — <https://mojolang.org/docs/reference/inline-mlir/>

The dialect table includes `nvvm.*` ("NVIDIA GPU intrinsics: barriers, async
copies, tensor ops") and `co.*` ("Coroutine ops: suspend, resume, destroy,
await"). (<https://mojolang.org/docs/reference/inline-mlir/>)

**Pitfall:** "The `pop`, `kgen`, `co` and `lit` dialects are internal
implementation details of the compiler and may change without notice."
(<https://mojolang.org/docs/reference/inline-mlir/>) Prefer the `std.gpu`
intrinsics; use inline MLIR only when no documented API covers the operation.

### Profiling

`std.gpu.profiler` provides GPU profiling functionality with a `ProfileBlock`
struct (<https://mojolang.org/docs/std/gpu/profiler/>). CPU-side timing uses
`std.time` (monotonic clocks, performance counters,
<https://mojolang.org/docs/std/time/>).

## Verifying GPU access

The requirements page gives a minimal check:

```mojo title="check_gpu.mojo"
from max.gpu.host import DeviceContext

def main():
    var ctx = DeviceContext()
    print("GPU:", ctx.name())
```

```bash
mojo check_gpu.mojo
```

> "If Mojo can't find a GPU, this raises an error explaining what it tried."
> — <https://mojolang.org/docs/requirements/>

The runtime tries vendor libraries in this order:

1. **NVIDIA** (CUDA): loads `libcuda.so.1` and `libnvidia-ml.so.1`
2. **AMD** (HIP): loads `libamdhip64.so`
3. **Apple** (Metal): uses the Metal framework

> "If Mojo can't load any of these libraries, it falls back to CPU execution."
> — <https://mojolang.org/docs/requirements/>

Common documented causes (all environment-level, not Mojo-level):

- **NVIDIA**: driver older than 580; `libcuda.so.1` not on the library path; a
  container started without GPU access (`docker run --gpus all`). Set
  `MLRT_CUDA_DEBUG=1` for detailed CUDA detection logging.
- **AMD**: missing ROCm/HIP; user not in the `render` and `video` groups.
- **Apple**: below macOS 15; missing Metal toolchain; missing Xcode Command Line
  Tools.
- **WSL**: use the WSL-specific vendor instructions; for NVIDIA on WSL the GPU
  driver belongs on the **Windows host**, not inside WSL.

**Pitfall:** `mojo build --target-accelerator=...` compiles for a GPU
architecture; it does not guarantee a GPU is present at run time. Compilation and
execution are separate checks.

## Distributed execution is not Mojo's job

> "Does Mojo support distributed execution? Not alone. … you'll also need a
> runtime (or "OS") that supports graph-level transformations and heterogeneous
> compute, which the MAX framework provides."
> — <https://mojolang.org/docs/faq/>

The roadmap lists "Initial distributed programming support" as an unstarted
phase-2 item: "Leveraging Mojo across multiple machines."
(<https://mojolang.org/docs/roadmap/>)

## Practical guidance

| Task | Where it lives |
|---|---|
| Write a kernel body | Mojo, using `std.gpu` primitives |
| Get thread/block/grid IDs | `std.gpu.primitives.id` (`thread_idx`, `block_idx`, …) |
| Warp-level shuffle/reduce | `std.gpu.primitives.warp` |
| GPU intrinsics and memory ops | `std.gpu.intrinsics` |
| Query target GPU info | `std.gpu.host.info` (`GPUInfo`, `is_gpu`, …) |
| Launch a kernel, manage device memory | MAX (`max.gpu.*`, `DeviceContext`) |
| Tensors, layouts, tiling | MAX (`layout`, `TileTensor`, `LayoutTensor`) |
| Data-parallel CPU/accelerator work | MAX (`max.algorithm.parallelize`) |
| Compile for a GPU | `mojo build --target-accelerator=...` |
| Runtime setup in a non-Mojo host | `initialize_runtime()` |

Three rules for an agent writing GPU code:

1. **Pass fixed-width types to kernels.** `Int`/`UInt` are no longer
   `DevicePassable`.
2. **Do not hard-code `WARP_SIZE`.** It is 32 or 64 depending on the
   architecture and 0 with no GPU.
3. **Re-check import paths against the installed package.** The 1.0.0
   accelerator boundary moved many APIs from `std.*` to `max.*`, and the
   `std.gpu.host` vs `max.gpu.host` question is not settled on a single page.

## Pitfalls

- **Looking for tensors in the Mojo stdlib.** There is no `tensor` or `nn`
  package; they are in MAX.
- **Passing `Int` to a kernel.** It no longer conforms to `DevicePassable`;
  use `Int32`.
- **Hard-coding warp size 32.** AMD CDNA uses 64.
- **Assuming bounds checks run on GPU.** They are off by default there.
- **Iterating a `Span` over GPU shared memory.** Only address-only operations
  are allowed in a non-default address space.
- **Mixing `--target-cpu` with `--mcpu`/`--march`.** The compiler rejects the
  combination.
- **Assuming `--target-accelerator` proves a GPU is present at run time.** It
  only affects code generation.
- **Assuming Mojo alone gives distributed execution.** It does not; MAX provides
  the runtime.
- **Using internal MLIR dialects in portable code.** `pop`, `kgen`, `co` and
  `lit` may change without notice.
- **Forgetting `MODULAR_NVPTX_COMPILER_PATH` on an older NVIDIA driver.** GPU
  code then fails to compile, not merely to run.
- **Running in a container without GPU passthrough.** The documented cause:
  `docker run --gpus all`.

## Open questions

> **Open question:** the official `std.gpu` index says `DeviceContext` "provides
> the interface for compiling and launching GPU kernels inside MAX custom
> operations", while the 1.0.0 notes moved `std.gpu.host` to `max.gpu.host` and
> the requirements page imports `from max.gpu.host import DeviceContext`. The
> current home of `DeviceContext` is not stated consistently. Confirm with
> `mojo doc` or the installed package before writing an import.

> **Open question:** the Mojo stdlib has no documented tensor type, and the
> roadmap's phase-1 item "GPU programmability abstractions: Built rich and
> easy-to-use abstractions for a tensor type, data layout, and basic algorithms"
> is marked done (✅) — but those abstractions now live in MAX. The Mojo docs do
> not point to a specific MAX page for them; follow the MAX documentation for
> current APIs.

> **Open question:** the supported-targets output lists `hexagon` and the GPU
> info API exposes `is_npu`, but no NPU target or NPU programming guide is
> documented. Treat NPU support as declared-but-undocumented.

## Sources

- <https://mojolang.org/docs/requirements/>
- <https://mojolang.org/docs/tools/compilation/>
- <https://mojolang.org/docs/std/gpu/>
- <https://mojolang.org/docs/std/gpu/globals/>
- <https://mojolang.org/docs/std/gpu/primitives/>
- <https://mojolang.org/docs/std/gpu/primitives/id/>
- <https://mojolang.org/docs/std/gpu/primitives/warp/>
- <https://mojolang.org/docs/std/gpu/host/info/>
- <https://mojolang.org/docs/std/gpu/intrinsics/>
- <https://mojolang.org/docs/std/gpu/profiler/>
- <https://mojolang.org/docs/std/atomic/>
- <https://mojolang.org/docs/std/builtin/device_passable/DevicePassable/>
- <https://mojolang.org/docs/std/builtin/simd/SIMD/>
- <https://mojolang.org/docs/std/collections/check_bounds/check_bounds/>
- <https://mojolang.org/docs/reference/inline-mlir/>
- <https://mojolang.org/docs/faq/>
- <https://mojolang.org/docs/roadmap/>
- <https://mojolang.org/releases/v1.0.0/>
