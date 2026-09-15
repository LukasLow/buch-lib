# Editor and LSP

Mojo ships a language server and an official editor extension. This page covers
the LSP, the VS Code / Open VSX extension, and the official AI agent skills. The
official sources are the install page
(<https://mojolang.org/install/>), the debugging page
(<https://mojolang.org/docs/tools/debugging/>), the FAQ
(<https://mojolang.org/docs/faq/>), and the skills page
(<https://mojolang.org/docs/tools/skills/>). The agent-skills topic has its own
page in this buch: [Mojo AI skills](../intro/ai-agent-skills.md).

## The Mojo language server (LSP)

The `mojo` package includes an LSP server for editor integration. From the FAQ's
list of what the `mojo` package contains:

> - Mojo language server (LSP) for IDE/editor integration

Source: <https://mojolang.org/docs/faq/>.

The `mojo-compiler` package **does not** include it — it is for environments that
"only need to call or build existing Mojo code" (<https://mojolang.org/docs/faq/>).
So on a production image with `mojo-compiler`, there is no language server to
connect to.

The install page frames the extension's feature set as:

> For syntax highlighting, code completion, and debugging support, install the
> Mojo extension from:
>
> - [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=modular-mojotools.vscode-mojo)
> - [Open VSX Registry](https://open-vsx.org/extension/modular-mojotools/vscode-mojo)

Source: <https://mojolang.org/install/>.

### What the LSP does

The documented LSP behaviours appear in release notes because they are fixes to
specific client interactions:

- **Completion during a reparse.** v1.0.0b2: "The Mojo language server now
  returns `ContentModified` instead of `InvalidRequest` for completion requests
  that arrive during a reparse, fixing missing completions in clients such as
  Neovim's built-in LSP client." Source:
  <https://mojolang.org/releases/v1.0.0b2/>.
- **Aggregate performance telemetry.** The FAQ documents what the LSP reports:
  "The Mojo LSP reports aggregate data on how long it takes to respond to user
  input (parsing latency). The report includes only the milliseconds between user
  keystrokes and when the Mojo LSP is able to show appropriate error or warning
  messages." Source: <https://mojolang.org/docs/faq/>.

The Neovim mention is significant for non-VS-Code users: the language server is a
standard LSP server that any LSP client can drive; VS Code just has the official
extension. The official pages document no Mojo-specific LSP configuration
options, so a generic LSP client setup should work, but the details (server
command, initialization options) are not published on the 1.x pages.

> **Open question — how to launch the language server directly.** The official
> 1.x pages state that the `mojo` package includes the language server and that
> it works with clients such as Neovim, but they do not publish the executable
> name or command line used to start it. Integrate through the official
> extension, or inspect the installed package for the server entry point; do not
> guess a command. Sources: <https://mojolang.org/docs/faq/>,
> <https://mojolang.org/releases/v1.0.0b2/>,
> <https://mojolang.org/install/>.

## The VS Code extension

The extension is official and has two registries:

| Registry | URL |
|----------|-----|
| VS Code Marketplace | <https://marketplace.visualstudio.com/items?itemName=modular-mojotools.vscode-mojo> |
| Open VSX Registry | <https://open-vsx.org/extension/modular-mojotools/vscode-mojo> |

The Open VSX listing matters because it serves VS Code-compatible editors that
do not use the Microsoft marketplace, such as Cursor. The FAQ:

> Yes, we've published an official Mojo language extension for
> [Visual Studio Code](https://code.visualstudio.com/) and other editors that
> support VS Code extensions (such as [Cursor](https://cursor.com/home)). The
> extension supports various features including syntax highlighting, code
> completion, formatting, hover, etc. It works seamlessly with remote-ssh and dev
> containers to enable remote development in Mojo.

Source: <https://mojolang.org/docs/faq/>.

The extension identifier is `modular-mojotools.vscode-mojo`.

### Prerequisite: install Mojo, not just the extension

> To use the Mojo extension, you must also
> [install the `mojo` package](/install/)—or, if you're developing for the MAX
> framework, [install the `modular` package](https://max.modular.com/packages/),
> which includes the `mojo` package.

Source: <https://mojolang.org/docs/tools/debugging/>.

> **Open question — the `modular` package contradiction.** This debugging-page
> sentence is the only 1.0.0 place that still tells users to install `modular`,
> while the FAQ lists only `mojo` and `mojo-compiler` and no 1.0.0 release note
> announces `modular`'s retirement. The practical rule on
> [install](../intro/install.md) applies here too: install `mojo` (or `max` for
> GPU), and treat the `modular` instruction as stale until a release note says
> otherwise. Sources: <https://mojolang.org/docs/faq/>,
> <https://mojolang.org/docs/tools/debugging/>,
> <https://mojolang.org/releases/>.

### The extension needs Python found

> The Mojo extension relies on the Python extension for locating your Python
> environment. In some cases, this appears to default to your globally-installed
> environment, even when a virtual environment exists. If the Mojo extension
> cannot find your SDK installation, try invoking the "Python: Set Project
> Environment" command and selecting your virtual environment.

Source: <https://mojolang.org/docs/tools/debugging/>.

### Debugging from the editor

The extension is the UI for the debugger covered in
[debugging and profiling](debugging-and-profiling.md). Ways to start a session in
VS Code, all documented on the debugging page:

- The **Run or Debug** button for a file with a `def main()` entry point.
- The **Run and Debug** view (`Control+Shift+D`, `Command+Shift+D` on macOS).
- The **Command Palette** (`Control+Shift+P` / `Command+Shift+P`).
- The **File Explorer** context menu on a Mojo file.
- **F5** with the current debug configuration.

Launch configurations live in `launch.json`; the Mojo debugger types are
`mojo-lldb` (CPU) and `mojo-cuda-gdb` (GPU). Source:
<https://mojolang.org/docs/tools/debugging/>.

### What the extension does not do

- It does not compile for you with custom flags: "Mojo launch configurations
  don't allow you to specify compilation options." Build with `mojo build` first.
  Source: <https://mojolang.org/docs/tools/debugging/>.
- It does not replace the CLI: formatting is `mojo format`, building is
  `mojo build`, running is `mojo run`.

## Mojo AI agent skills

Modular publishes official agent skills for coding assistants:

> Mojo agent skills keep your AI coding assistants aligned with the latest
> language updates and best practices.
>
> Install with:
>
> ```sh
> npx skills add modular/skills
> ```

Source: <https://mojolang.org/install/>.

The skills page gives the full install surface:

| Task | Command |
|------|---------|
| Install all skills | `npx skills add modular/skills` |
| Install a specific skill | `npx skills add modular/skills --skill mojo-syntax` |
| Update skills | `npx skills update` |

Manual installation options (`git clone`, `gh repo clone`) and configuration
(copy or symlink skill files into your agent's configuration directory) are also
documented. Source: <https://mojolang.org/docs/tools/skills/>.

The rationale is exactly the problem this buch addresses:

> Many AI models are trained on older versions of Mojo and MAX. They aren't
> updated as quickly as the language evolves, so they often generate code that
> doesn't compile or reflects outdated usage.

Source: <https://mojolang.org/docs/tools/skills/>.

The quickstart and get-started pages both recommend installing them before
following the tutorial:

> If you're using an AI coding assistant while following this tutorial, install
> [Mojo agent skills](/docs/tools/skills) first. Models can fall behind the
> current language. The skills update regularly with the latest syntax and
> language features.

Source: <https://mojolang.org/docs/manual/get-started/>.

Skills also follow the [Agent Skills Standard](https://agentskills.io/specification)
and are licensed under Apache 2.0 (<https://mojolang.org/docs/tools/skills/>).
The FAQ notes a limitation: "Skills aren't versioned by Mojo release, so there
may be mismatches between the skill's guidance and your installed version."
Source: <https://mojolang.org/docs/tools/skills/>.

Read [Mojo AI skills](../intro/ai-agent-skills.md) for the topic in full,
including the docs MCP server.

## The docs MCP server

The skills page also documents connecting an AI assistant to the live
documentation over the Model Context Protocol:

```sh
claude mcp add --transport http mojo-docs https://mojo-mcp.modular.com/mcp/
```

With Cursor, add it to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "mojo-docs": {
      "url": "https://mojo-mcp.modular.com/mcp/"
    }
  }
}
```

"Any other client that supports MCP's streamable HTTP transport connects with the
same URL. The server indexes both the stable and nightly documentation." Source:
<https://mojolang.org/docs/tools/skills/>.

## Telemetry

The extension and SDK collect limited telemetry. The FAQ is specific about what:

> - **Crash reports**: When the Mojo compiler crashes with a stack trace, the
>   report includes only the OS version and MAX/Mojo version.
> - **LSP performance metrics**: The Mojo LSP reports aggregate data on how long
>   it takes to respond to user input (parsing latency). The report includes only
>   the milliseconds between user keystrokes and when the Mojo LSP is able to
>   show appropriate error or warning messages.
>
> We never collect or transmit any user information, such as source code,
> keystrokes, or any other user data.

Source: <https://mojolang.org/docs/faq/>.

## A minimal editor setup

All steps are documented individually; the order below is the practical one.

```sh
# 1. Install Mojo (the full package includes the LSP and debugger).
pixi add mojo            # or: uv pip install mojo

# 2. Install the extension from the VS Code Marketplace or Open VSX.

# 3. If the extension cannot find the SDK, run
#    "Python: Set Project Environment" and select the environment.

# 4. Optional: install the official agent skills for AI assistants.
npx skills add modular/skills

# 5. Everyday commands remain the CLI:
mojo run app.mojo
mojo format app.mojo
```

Sources: <https://mojolang.org/install/>,
<https://mojolang.org/docs/tools/debugging/>,
<https://mojolang.org/docs/tools/skills/>,
<https://mojolang.org/docs/cli/>.

## Pitfalls

- **Installing only the extension.** It needs the `mojo` package (or `modular`,
  which includes it) for the SDK. Source:
  <https://mojolang.org/docs/tools/debugging/>.
- **Using `mojo-compiler` and expecting an editor experience.** It has no LSP and
  no debugger. Source: <https://mojolang.org/docs/faq/>.
- **The extension pointing at the wrong Python.** Invoke "Python: Set Project
  Environment". Source: <https://mojolang.org/docs/tools/debugging/>.
- **Expecting launch configurations to accept compiler flags.** They do not;
  build first. Source: <https://mojolang.org/docs/tools/debugging/>.
- **Assuming skills are version-locked to your Mojo.** "Skills aren't versioned
  by Mojo release." Source: <https://mojolang.org/docs/tools/skills/>.
- **Assuming the marketplace is the only source.** Open VSX covers
  VS Code-compatible editors that do not use the Microsoft marketplace. Source:
  <https://mojolang.org/docs/faq/>.

## See also

- [Mojo AI skills](../intro/ai-agent-skills.md) — the skills page in full.
- [Debugging and profiling](debugging-and-profiling.md) — the debugger the
  extension drives.
- [Install](../intro/install.md) — which package includes the LSP, debugger and
  formatter.
- [`mojo format`](../cli/format.md), [`mojo run`](../cli/run.md) — the CLI
  commands the editor complements.
- [Testing](testing.md) — the correctness loop.

## Sources

- Install Mojo: <https://mojolang.org/install/>
- Mojo AI skills: <https://mojolang.org/docs/tools/skills/>
- Debugging (extension, Python environment, launch configurations):
  <https://mojolang.org/docs/tools/debugging/>
- Mojo FAQ (SDK contents, extension, telemetry):
  <https://mojolang.org/docs/faq/>
- Get started with Mojo (install agent skills first):
  <https://mojolang.org/docs/manual/get-started/>
- Mojo quickstart (agent skills): <https://mojolang.org/docs/manual/quickstart/>
- Mojo v1.0.0b2 release notes (LSP `ContentModified` fix):
  <https://mojolang.org/releases/v1.0.0b2/>
- Mojo CLI reference: <https://mojolang.org/docs/cli/>
- Mojo releases: <https://mojolang.org/releases/>
