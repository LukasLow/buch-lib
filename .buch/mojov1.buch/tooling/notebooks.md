# Notebooks

Mojo runs in Jupyter notebooks, both locally and on Google Colab. This page
covers the official notebook workflow from the
[Jupyter notebooks](https://mojolang.org/docs/tools/notebooks/) page: the two
environments, the `%%mojo` cell magic, complete examples, and GPU notebooks.

## Two environments

> This page assumes you'll work with Mojo notebooks in one of two ways:
>
> - **Google Colab** — Fast setup, optional GPU acceleration, ideal for quick
>   experiments and for learning GPU programming when you don't have a
>   compatible GPU-enabled computer on-hand.
> - **Local JupyterLab** — Private environment with full control of code, data,
>   and dependencies.
>
> Both options use the same notebook model and the same Mojo cell magic.

Source: <https://mojolang.org/docs/tools/notebooks/>.

## The cell magic

Mojo code runs in cells marked with the `%%mojo` directive. A key constraint:

> Each Mojo cell must contain a complete program, including a `main()` function.

Source: <https://mojolang.org/docs/tools/notebooks/>.

The magic is registered by importing a Python module:

```python
import mojo.notebook
```

The same line enables it in both Colab and local JupyterLab
(<https://mojolang.org/docs/tools/notebooks/>).

## Local JupyterLab

The official local path uses `pixi` to build the environment. The full sequence:

```shell
pixi init notebooks \
    -c https://conda.modular.com/max-nightly/ \
    -c conda-forge
cd notebooks
pixi shell
```

```shell
pixi add max jupyterlab ipykernel
```

```shell
jupyter lab
```

Then, in the browser:

1. Select _File > New > Notebook_.
2. Choose the _Python_ kernel.
3. In the first cell run `import mojo.notebook` to register the `%%mojo` magic.

Source: <https://mojolang.org/docs/tools/notebooks/>.

The page explains why it installs `max` and not `mojo`:

> This installs:
> - Mojo, by way of `max` — see the note above on why this page installs `max`
>   rather than `mojo`
> - JupyterLab
> - The Python kernel required for notebook execution

and the note it refers to:

> For most notebook work, the `mojo` package is all you need. This page installs
> `max` instead, because it includes the Mojo compiler—so `%%mojo` cells behave
> exactly the same—and it adds the MAX accelerator library that the GPU examples
> later on this page import.

Source: <https://mojolang.org/docs/tools/notebooks/>.

So the general rule is: **`mojo` is enough for CPU notebooks; `max` is needed
when the notebook imports GPU/MAX libraries.** `max` includes Mojo. See
[install](../intro/install.md) and [pixi](pixi.md).

## Google Colab

1. Create a new notebook at [Google Colab](https://colab.google).
2. Install Mojo — `max` for the GPU examples on the page:

   ```python
   # Nightly
   !pip install --pre max --extra-index-url https://whl.modular.com/nightly/simple/
   ```

   ```python
   # Stable
   !pip install max
   ```

3. In the first cell, enable Mojo:

   ```python
   import mojo.notebook
   ```

Source: <https://mojolang.org/docs/tools/notebooks/>.

The page's rationale for `max` in Colab matches the local path: "it includes the
Mojo compiler—so `%%mojo` cells behave exactly the same—and it adds the MAX
accelerator library that the GPU examples later on this page import."

## Writing and running Mojo code

### Hello Mojo

```mojo
%%mojo

def main():
  print("Hello Mojo")
```

```output
Hello Mojo
```

Source: <https://mojolang.org/docs/tools/notebooks/>.

### Parameterized compilation

```mojo
%%mojo

# Compiler-parameterized function
def repeat[count: Int](msg: String):
    comptime for i in range(count):
        print(msg)

# Compiler-argumented function
def threehello():
    repeat[3]("Hello 🔥!")

# Run
def main():
    threehello()
```

```output
Hello 🔥!
Hello 🔥!
Hello 🔥!
```

Source: <https://mojolang.org/docs/tools/notebooks/>.

Note that this is ordinary Mojo: a parameterized function (`[count: Int]`),
a `comptime for`, and a `main()` entry point. The notebook wrapper changes
nothing about the language. (The fetched Markdown of the source page renders
`repeat[3]("Hello 🔥!")` with a stray link artifact; the code above is the
intended Mojo, matching the documented output.)

## GPU notebooks

Before running GPU code in Colab, select _Runtime > Change runtime type > [GPU]_.
The specific accelerator "depends on your Colab tier; see GPU compatibility for
the list of accelerators supported by Mojo." Source:
<https://mojolang.org/docs/tools/notebooks/>.

### GPU Hello World

```mojo
%%mojo

from max.gpu.host import DeviceContext

def kernel():
    print("Hello from the GPU")

def main() raises:
    # Launch GPU kernel
    with DeviceContext() as ctx:
        ctx.enqueue_function[kernel](grid_dim=1, block_dim=1)
        ctx.synchronize()
```

```output
Hello from the GPU
```

Source: <https://mojolang.org/docs/tools/notebooks/>.

### Device memory: write and read back

```mojo
%%mojo
from std.memory import UnsafePointer
from max.gpu.host import DeviceContext

comptime `✅`: Int32 = 1
comptime `❌`: Int32 = 0

def kernel(value: UnsafePointer[Scalar[DType.int32], MutAnyOrigin]):
    value[unsafe_offset=0] = `✅`

def main() raises:
    with DeviceContext() as ctx:
        var out = ctx.enqueue_create_buffer[DType.int32](1)
        out.enqueue_fill(`❌`)

        ctx.enqueue_function[kernel](out, grid_dim=1, block_dim=1)

        with out.map_to_host() as out_host:
            print("GPU responded:", \
                "👋, 🔥" if out_host[0] == `✅` else "😢")
```

```output
GPU responded: 👋, 🔥
```

Source: <https://mojolang.org/docs/tools/notebooks/>.

This example shows escaped backtick identifiers (`` `✅` ``, `` `❌` ``) — a
documented language feature for identifiers that are not valid ordinary names
(<https://mojolang.org/docs/reference/keywords/>).

> **Open question:** the official notebooks page still spells the pointer type
> `UnsafePointer` in this example, but 1.0 unified `UnsafePointer` into the
> single `Pointer` type (with unsafety marked per operation via `unsafe_*`
> names). The example is kept verbatim; in current code write
> `Pointer[Scalar[DType.int32], MutAnyOrigin]`. Source:
> <https://mojolang.org/releases/v1.0.0/>. See
> [`versions/1.0.0`](../versions/1.0.0.md).

### GPU vector addition

The page's third GPU example runs elementwise addition with `TileTensor`,
`layout.row_major`, `thread_idx` and `has_accelerator`. The essential shape:

```mojo
%%mojo

from std.gpu import thread_idx
from max.gpu.host import DeviceContext
from layout import TileTensor, row_major
from std.sys import has_accelerator

comptime VECTOR_WIDTH = 10
comptime layout = row_major[VECTOR_WIDTH]()

def vector_addition(
    left: TileTensor[...],
    right: TileTensor[...],
    output: TileTensor[...],
):
    var idx = thread_idx.x
    output[idx] = left[idx] + right[idx]

def main() raises:
    comptime assert has_accelerator(), "This example requires a supported GPU"
    # create buffers, launch kernel with grid_dim=1, block_dim=VECTOR_WIDTH,
    # map results back to host.
```

Source: <https://mojolang.org/docs/tools/notebooks/>.

The notebook's GPU examples depend on the `layout` package, which — as of 1.0 —
"is now bundled with MAX instead of Mojo"
(<https://mojolang.org/releases/v1.0.0/>). That is why the page installs `max`.
For the GPU topic itself, see
[GPU and accelerators](../concurrency/gpu-and-accelerators.md).

## Notebooks versus files

| Aspect | Notebook | `.mojo` file |
|--------|----------|--------------|
| Entry point | a `main()` in each `%%mojo` cell | one `main()` |
| Compilation | via the `%%mojo` magic / `mojo.notebook` | `mojo run` / `mojo build` |
| Best for | exploration, teaching, GPU experiments | programs, libraries, CI |
| GPU support | Colab GPU runtimes; local with `max` | `--target-accelerator` etc. |

Notebook cells are still compiled, not interpreted — Mojo is a compiled language
(<https://mojolang.org/docs/faq/>).

## Pitfalls

- **A cell without `main()` fails.** "Each Mojo cell must contain a complete
  program, including a `main()` function." Source:
  <https://mojolang.org/docs/tools/notebooks/>.
- **Forgetting `import mojo.notebook`.** Without it the `%%mojo` magic is not
  registered. Source: <https://mojolang.org/docs/tools/notebooks/>.
- **Installing `mojo` but importing MAX/GPU libraries.** The GPU examples need
  `max` (which includes Mojo) and the `layout` package it bundles. Source:
  <https://mojolang.org/docs/tools/notebooks/>,
  <https://mojolang.org/releases/v1.0.0/>.
- **Choosing the Python kernel, then forgetting the magic import.** The kernel is
  Python; `mojo.notebook` is what adds Mojo cells. Source:
  <https://mojolang.org/docs/tools/notebooks/>.
- **No GPU runtime selected in Colab.** Use _Runtime > Change runtime type >
  [GPU]_, and check the accelerator against the requirements page. Source:
  <https://mojolang.org/docs/tools/notebooks/>.
- **Mixing stable and nightly installs.** Colab nightly uses
  `!pip install --pre max --extra-index-url https://whl.modular.com/nightly/simple/`;
  stable is `!pip install max`. Source:
  <https://mojolang.org/docs/tools/notebooks/>.
- **Expecting the local path to work without Pixi.** The documented local setup
  builds the environment with `pixi` (`pixi add max jupyterlab ipykernel`).
  Source: <https://mojolang.org/docs/tools/notebooks/>.

## See also

- [Pixi](pixi.md) — the environment manager behind the local notebook setup.
- [Install](../intro/install.md) — `mojo` vs `max`.
- [GPU and accelerators](../concurrency/gpu-and-accelerators.md) — the topic
  behind the GPU examples.
- [Supported platforms](../intro/supported-platforms.md) — GPU compatibility.
- [Testing](testing.md) and [`mojo run`](../cli/run.md) — file-based workflows
  for production code.

## Sources

- Jupyter notebooks: <https://mojolang.org/docs/tools/notebooks/>
- Pixi basics: <https://mojolang.org/docs/pixi/>
- System requirements (GPU compatibility):
  <https://mojolang.org/docs/requirements/>
- Mojo v1.0.0 release notes (`layout` bundled with MAX):
  <https://mojolang.org/releases/v1.0.0/>
- Mojo identifiers, keywords, and conventions (escaped identifiers):
  <https://mojolang.org/docs/reference/keywords/>
- Mojo FAQ (compiled language): <https://mojolang.org/docs/faq/>
