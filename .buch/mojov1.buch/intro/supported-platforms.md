# Supported platforms

Mojo does not run everywhere, and the official requirements page is specific
about where it does. The summary line is:

> "Mojo runs on Mac, Linux, and Windows (with WSL). You don't need a GPU to
> program with Mojo—GPU support is optional."
> — [system requirements](https://mojolang.org/docs/requirements/)

That sentence contains two facts that are easy to miss: **GPU support is
optional**, and **Windows is only supported through WSL**, not natively.

## Requirements at a glance

| Category | Requirement | Notes |
|----------|-------------|-------|
| **Linux OS** | glibc 2.34 or later (Ubuntu 22.04 LTS+) | Other distros meeting glibc 2.34+ "are expected to work but aren't continuously tested" |
| **macOS OS** | macOS Sequoia (15) or later | Apple silicon only |
| **macOS CPU** | Apple silicon M1–M5 | No Intel Mac support is documented |
| **Windows** | WSL with a compatible Ubuntu | "Mojo doesn't natively support Windows" |
| **Linux CPU** | x86-64-v3 (Haswell-class, ~2013+) or ARM64 Neoverse N1+ | Graviton2 and later for ARM |
| **RAM** | 8 GiB minimum | MAX inference/serving needs significantly more |
| **Linux software** | A C compiler (`cc`, `gcc` or `clang`) | Used as a linker |
| **macOS software** | Xcode or Xcode Command Line Tools 16+ | |
| **Python** | 3.10–3.14 | Only for Python interop; Mojo itself does not require Python |
| **GPU** | Optional | NVIDIA, AMD or Apple silicon; see below |

Every row above is from
[system requirements](https://mojolang.org/docs/requirements/) unless stated
otherwise.

## Operating system

### Linux

- glibc 2.34 or later, for example Ubuntu 22.04 LTS or later.

The page carries an explicit support note:

> "Modular tests Mojo on Ubuntu 22.04 LTS or later. Other Linux distributions
> that meet the glibc 2.34+ requirement are expected to work but aren't
> continuously tested. If your system has an older glibc version, run Mojo
> inside a container with a compatible base image such as Ubuntu 22.04."
> — [system requirements](https://mojolang.org/docs/requirements/)

For an agent this matters: "runs on Linux" is not the same as "is tested on your
distro". If glibc is older than 2.34, the documented workaround is a container
with Ubuntu 22.04.

### macOS

- macOS Sequoia (15) or later.
- Apple silicon (M1–M5 processor).

Both lines are required. There is no documented Intel-Mac path.

### Windows

- Mojo "doesn't natively support Windows". The supported route is
  [Windows with WSL](https://learn.microsoft.com/en-us/windows/wsl/install)
  using a compatible version of Ubuntu, i.e. the Linux requirements apply.

## Hardware

### CPU

The CPU requirement is one of:

- **x86-64-v3** (Haswell-class or newer; CPUs from approximately 2013 onward)
  on Linux.
- **ARM64 Neoverse N1 or newer** on Linux, for example AWS Graviton2 and later.
- **Apple silicon** on macOS.

The page spells out the x86-64-v3 instruction set, because "x86-64-v3" is a
microarchitecture level rather than a product name:

> "The x86-64-v3 microarchitecture level requires AVX, AVX2, BMI1, BMI2, F16C,
> FMA, LZCNT, MOVBE, and XSAVE instructions. To verify your x86-64 CPU on Linux,
> run `cat /proc/cpuinfo | grep flags` and confirm those flags are present.
> This requirement doesn't apply to ARM64 or Apple silicon hosts."
> — [system requirements](https://mojolang.org/docs/requirements/)

### RAM

- **8 GiB minimum** for Mojo development.
- MAX inference and model serving "require significantly more memory, with the
  exact amount varying by model".

### Software

- On Linux, a C compiler (such as `cc`, `gcc`, or `clang`) — "used as a
  linker".
- On macOS, Xcode or Xcode Command Line Tools 16 or later.

## Python is only required for interop

This is a frequent misconception and the docs address it directly:

> "Mojo itself doesn't require Python. To use the Mojo ↔ Python
> interoperability features described in this section, you need Python
> 3.10–3.14."
> — [Python interoperability](https://mojolang.org/docs/manual/python/)

So a pure-Mojo program needs no Python at all. Python 3.10–3.14 is the supported
window only when you import Python modules from Mojo or bind Mojo for Python.

## GPU compatibility (optional)

The requirements page splits GPU support into **two compatibility levels**:

- **Continuously tested:** "Run in Modular's CI on every release. High
  confidence that GPU code compiles and executes correctly."
- **Known compatible:** "Confirmed to work by Modular or community members, but
  not continuously tested. These GPUs share an architecture with a tested GPU
  and should work without issues."

That distinction is the honest answer to "will GPU X work?" — only the
continuously-tested device is guaranteed on every release.

### NVIDIA

**Software requirement:** NVIDIA GPU driver **580 or later**.

For older drivers (common on some cloud providers) the documented workaround is
to point `MODULAR_NVPTX_COMPILER_PATH` at a system `ptxas` from a CUDA Toolkit
installation:

```bash
export MODULAR_NVPTX_COMPILER_PATH=/usr/local/cuda/bin/ptxas
```

This "bypasses the bundled compiler's driver version check".

**Hardware compatibility:**

| Level | GPUs (architecture, arch target) |
|-------|----------------------------------|
| Continuously tested | B200 (Blackwell, `sm_100`) |
| Known compatible | B300 (`sm_103`), B100 (`sm_100`), DGX Spark (`sm_121`), H200/H100 (Hopper, `sm_90`), L4/L40 (Ada, `sm_89`), RTX 50XX (Blackwell, `sm_120`), RTX 40XX (Ada, `sm_89`), A100 (Ampere, `sm_80`), A10/A1000/RTX 30XX (Ampere, `sm_86`), Jetson Orin / Orin Nano (`sm_87`), Jetson Thor (`sm_110`), T4/RTX 20XX (Turing, `sm_75`) |

Pre-Turing GPUs (for example Pascal-generation GTX 10XX and Tesla P100) "are not
supported out of the box"; they require the same
`MODULAR_NVPTX_COMPILER_PATH` workaround.

### AMD

**Software requirement:** AMD GPU driver **6.3.3 or later**; MI355X requires
ROCm 7.0 or later.

**Hardware compatibility:**

| Level | GPUs (architecture, arch target) |
|-------|----------------------------------|
| Continuously tested | MI355X (CDNA4, `gfx950`), MI300X (CDNA3, `gfx942`) |
| Known compatible | MI325X (`gfx942`), MI250X (CDNA2, `gfx90a`), Radeon RX 9070 (`gfx1201`), RX 9060 (`gfx1200`), Radeon 880M/890M (`gfx1150`), 860M (`gfx1152`), 8060S (`gfx1151`), RX 7900 (`gfx1100`), RX 7800/7700 (`gfx1101`), RX 7600 (`gfx1102`), Radeon 780M (`gfx1103`), RX 6900 (RDNA2, `gfx1030`), Van Gogh / Steam Deck (`gfx1033`) |

### Apple silicon GPUs

**Software requirements:** macOS Sequoia (15) or later **and** Xcode 16 or
later. After upgrading macOS or Xcode you may need the Metal toolchain:

```bash
xcodebuild -downloadComponent MetalToolchain
```

**Hardware compatibility:** every listed chip — M5, M4, M3, M2, M1 — is
**Known compatible**. None is listed as continuously tested.

## Troubleshooting GPU detection

The runtime tries vendor libraries in a fixed order:

1. **NVIDIA** (CUDA): loads `libcuda.so.1` and `libnvidia-ml.so.1`
2. **AMD** (HIP): loads `libamdhip64.so`
3. **Apple** (Metal): uses the Metal framework (built into macOS)

"If Mojo can't load any of these libraries, it falls back to CPU execution."

Two documented verification paths:

```bash
mojo build --target-accelerator=sm_90 my_kernel.mojo
```

```mojo
from max.gpu.host import DeviceContext

def main():
    var ctx = DeviceContext()
    print("GPU:", ctx.name())
```

"If Mojo can't find a GPU, this raises an error explaining what it tried."

Common documented causes worth knowing, because they are environment-level
rather than Mojo-level:

- NVIDIA: driver older than 580; `libcuda.so.1` missing from the library path;
  a container started without GPU access (`docker run --gpus all`). Set
  `MLRT_CUDA_DEBUG=1` for detailed CUDA detection logging.
- AMD: missing ROCm/HIP; user not in the `render` and `video` groups.
- Apple: not on macOS 15+; missing Metal toolchain; missing Xcode Command Line
  Tools.
- WSL: use the WSL-specific vendor instructions; for NVIDIA on WSL the GPU
  driver belongs on the **Windows host**, not inside WSL.

## Telemetry

Mojo's SDK collects telemetry, and the FAQ documents exactly what:

> "Yes, the Mojo SDK collects some basic system information, crash reports, and
> some LSP events that enable us to identify, analyze, and prioritize Mojo
> issues. v25.6 and earlier versions also collected compiler/runtime events,
> but we've since removed them."
> — [FAQ](https://mojolang.org/docs/faq/)

Specifically:

- **Crash reports:** when the Mojo compiler crashes with a stack trace, the
  report "includes only the OS version and MAX/Mojo version".
- **LSP performance metrics:** aggregate latency data — "only the milliseconds
  between user keystrokes and when the Mojo LSP is able to show appropriate
  error or warning messages".

The FAQ adds the scope limit: "We never collect or transmit any user
information, such as source code, keystrokes, or any other user data."

Separately, the release notes record that all telemetry-related code was removed
from the **Mojo compiler** in v0.25.7, and that v25.6 and earlier collected
compiler/runtime events. The two statements are consistent but worth keeping
apart: the compiler-side telemetry removal is a release-note fact, the
crash/LSP telemetry is the current documented FAQ position
([v0.25.7](https://mojolang.org/releases/v0.25.7/),
[FAQ](https://mojolang.org/docs/faq/)).

## Sources

- https://mojolang.org/docs/requirements/
- https://mojolang.org/docs/manual/python/
- https://mojolang.org/docs/faq/
- https://mojolang.org/releases/v0.25.7/
