# Version history

> **This page is history.** Everything below documents how Mojo's version
> scheme changed over time. Pre-1.0 spellings (for example a version named
> `25.5` or a release page slug of `v0.25.5`) appear here only as historical
> facts. For current syntax and APIs, read the content tree, not this page.

The version number of Mojo is not a straight line. It has passed through four
distinct eras, and in one of them **the same release had two different version
numbers depending on the channel** — the reason a version number alone can
mislead you. That ambiguity is important enough to get its own section below.

## The four eras at a glance

| Era | Scheme | Example version | Dates |
|-----|--------|-----------------|-------|
| 1. 2023 pre-1.0 line | plain `0.x` | `v0.7.0` | 2023 (archive also lists 2022 monthlies) |
| 2. 2024–2025 MAX-bundled CalVer | `YY.MAJOR.MINOR` | `24.1`, `25.5` | 2024-02-29 → 2025-08-05 |
| 3. 2025 `0.` prefix on PyPI | `0.YY.MINOR` | `0.25.6` | 2025-09-22 → 2026-03-19 |
| 4. 2026 semver | `MAJOR.MINOR.PATCH` | `1.0.0` | 2026-08-11 → |

## Era 1 — 2023: the pre-1.0 `0.x` line

The [release archive](https://mojolang.org/releases/archive/) groups 2023 as:
`Mojo v0.6.1`, `v0.6.0`, `v0.5.0`, `v0.4.0 for Mac`, `v0.4.0`, `v0.3.1`,
`v0.3.0`, `v0.2.1`, plus monthly pages `Mojo August 2023` … `Mojo January
2023`. It also carries 2022 monthly pages back to September 2022. Example dates
from the individual pages:

- `Mojo v0.6.1` — December 18, 2023 ([v0.6.1](https://mojolang.org/releases/v0.6.1/))
- `Mojo v0.7.0` — January 25, 2024, listed under **2024** in the archive: the
  last `0.x` release before the scheme switch
  ([v0.7.0](https://mojolang.org/releases/v0.7.0/),
  [archive](https://mojolang.org/releases/archive/))

The archive's URL slug and the page's displayed name match in this era:
`/releases/v0.6.1/` is titled "Mojo v0.6.1".

## Era 2 — 2024-02-29: MAX-bundled CalVer (`YY.MAJOR.MINOR`)

The scheme change is documented in the v24.1 release itself:

> "Mojo is now bundled with the MAX platform! As such, the Mojo package version
> now matches the MAX version, which follows a `YY.MAJOR.MINOR` version scheme.
> Because this is our first release in 2024, that makes this version `24.1`."
> — [v24.1](https://mojolang.org/releases/v0.24.1/)

Release page: "Mojo v24.1 — February 29, 2024". The archive lists the rest of
this era as `Mojo v24.6` (2024) and `Mojo v25.1` … `Mojo v25.5` (2025). The
last release in the scheme is displayed as "Mojo v25.5 — August 5, 2025"
([v0.25.5](https://mojolang.org/releases/v0.25.5/)).

**URL vs. displayed name discrepancy (already present in this era).** The
archive links use the slug `/releases/v0.25.5/` while the page title has no
`v0.` prefix: "Mojo v25.5". This matters when you cite a release: the URL and
the name can disagree, and both are official.

## Era 3 — 2025-09-22: the `0.` prefix returns

The v0.25.6 release announces the change under its own caution heading:

> "This release is technically a version *downgrade* because we've added a `0.`
> at the beginning: `0.25.6`. This is necessary because we started publishing
> `mojo` packages on pypi.org and it's important that we don't publish a
> package greater than 1.0 yet."
> — [v0.25.6](https://mojolang.org/releases/v0.25.6/)

The tooling notes on the same page add the forward-looking reason: "In
preparation for a future Mojo 1.0, the `mojo` and `mojo-compiler` packages have
a `0.` prefixed to the version."

The release carried a `pip install mojo` first: "You can now **`pip install
mojo`**!"

Releases in this era, with package versions from the
[releases index](https://mojolang.org/releases/):

| Release name | Date | Package version |
|--------------|------|-----------------|
| Mojo v0.25.6 | Sep 22, 2025 | `mojo==0.25.6.0` |
| Mojo v0.25.7 | Nov 20, 2025 | `mojo==0.25.7.0` |
| Mojo v0.26.1 | Jan 29, 2026 | `mojo==0.26.1.0` |
| Mojo v0.26.2 | Mar 19, 2026 | `mojo==0.26.2.0` |

### The channel ambiguity: conda `25.5` vs PyPI `0.25.6`

This is the trap the whole page exists to flag. Quoted in full from v0.25.6:

> "Shortly after the 0.25.6 release, we "yanked" all Conda packages that are
> greater than 1.0 so they won't be installed unless you explicitly specify the
> version. So you'll still get the latest version like this:
>
> ```sh
> pixi add mojo
> ```
>
> And if you want an older version, just specify the version like this:
>
> ```sh
> pixi add "mojo==25.5"
> ```
>
> However, if you're installing `mojo` as a Python package with `pip` or `uv`,
> the oldest version available is `0.25.6`."
> — [v0.25.6](https://mojolang.org/releases/v0.25.6/)

Read that carefully, because it encodes three separate facts:

1. **Conda packages greater than 1.0 were yanked** and will not be picked up
   "unless you explicitly specify the version".
2. **`pixi add mojo` and `pip`/`uv` can resolve to different version numbers.**
   The conda channel's newest *un-yanked* package after this point is still
   named `25.5`-style, while the Python package path starts at `0.25.6`.
3. **The `0.` prefix was applied to `mojo` and `mojo-compiler`** in preparation
   for 1.0.

Concrete consequence: if someone says "I'm on Mojo 25.5", they mean a
MAX-bundled conda-era release. If someone says "I'm on Mojo 0.25.6", they mean
the same calendar window on the PyPI path. Neither number alone tells you the
channel. When you record a version in a project, record the channel too.

Corroboration that the two channels really do use different numbers for the same
release window: the v25.5 page (conda era) is served from the URL
`/releases/v0.25.5/` and is titled "Mojo v25.5"; the PyPI-era `mojo` package
versions carry a trailing `.0` (`mojo==0.25.6.0`)
([v0.25.5](https://mojolang.org/releases/v0.25.5/),
[releases](https://mojolang.org/releases/)).

## Era 4 — 2026: betas, then 1.0.0 and semver

The transition ran through two public betas and then the first stable release:

| Release | Date | Package version |
|---------|------|-----------------|
| Mojo v1.0.0b1 | May 7, 2026 | `mojo==1.0.0b1` |
| Mojo v1.0.0b2 | Jun 18, 2026 | `mojo==1.0.0b2` |
| **Mojo v1.0.0** | **Aug 11, 2026** | **`mojo==1.0.0`** |

Sources: the [releases index](https://mojolang.org/releases/) and the individual
pages [v1.0.0b1](https://mojolang.org/releases/v1.0.0b1/),
[v1.0.0b2](https://mojolang.org/releases/v1.0.0b2/),
[v1.0.0](https://mojolang.org/releases/v1.0.0/).

Semver starts here:

> "Starting with Mojo 1.0, Mojo follows semantic versioning for the core
> language and stable portions of the standard library."
> — [FAQ](https://mojolang.org/docs/faq/)

And the stability framing for the release:

> "With Mojo 1.0 we're beginning to define the stability policies for the Mojo
> language and standard library. During the 1.x timeframe, changes should mostly
> be additive."
> — [v1.0.0](https://mojolang.org/releases/v1.0.0/)

The betas carried the final migration steps. `fn` was deprecated with a warning
in b1 and became a hard error in b2; implicit `std` imports became an error in
b2; `mojo package` was renamed `mojo precompile` with `.mojopkg` → `.mojoc`
([v1.0.0b1](https://mojolang.org/releases/v1.0.0b1/),
[v1.0.0b2](https://mojolang.org/releases/v1.0.0b2/)). Those renames are
described as history here; for current syntax see the rest of the buch and the
`versions/` chapter.

At the time of writing the current nightly is
`mojo==1.1.0.dev2026091005` (Sep 10, 2026), i.e. the 1.1 development line
([releases](https://mojolang.org/releases/)).

## Release cadence

The FAQ states the cadence in a single sentence:

> "Mojo development is moving fast and we are regularly releasing updates. We
> aim to produce stable releases every six weeks, and nightly builds almost
> every night."
> — [FAQ](https://mojolang.org/docs/faq/)

The dates in the table below corroborate the six-week rhythm (all from
[releases](https://mojolang.org/releases/)):

| Date | Release |
|------|---------|
| Aug 5, 2025 | v25.5 |
| Sep 22, 2025 | v0.25.6 |
| Nov 20, 2025 | v0.25.7 |
| Jan 29, 2026 | v0.26.1 |
| Mar 19, 2026 | v0.26.2 |
| May 7, 2026 | v1.0.0b1 |
| Jun 18, 2026 | v1.0.0b2 |
| Aug 11, 2026 | v1.0.0 |
| Sep 10, 2026 | nightly `1.1.0.dev2026091005` |

The releases index also states a hard availability limit: "Older versions are no
longer available to install."

## Timeline: which scheme applies when

```text
2022-09 .. 2023     0.x line            v0.2.1 … v0.7.0
2024-02-29          scheme switch       24.1  (bundled with MAX; YY.MAJOR.MINOR)
2024 .. 2025-08      CalVer              24.2 … 24.6, 25.1 … 25.5
2025-09-22          back to 0. prefix    0.25.6, 0.25.7, 0.26.1, 0.26.2
2026-05-07          betas               1.0.0b1
2026-06-18          betas               1.0.0b2
2026-08-11          semver begins       1.0.0
```

## Why this history matters for an agent

- **A version number without a channel is ambiguous for the 2024–2025 window.**
  Record both.
- **A URL slug is not the release name.** `/releases/v0.25.5/` is titled "Mojo
  v25.5".
- **Package versions on the releases index carry a fourth component**
  (`mojo==0.26.2.0`); the individual release pages do not repeat it. Quote dates
  from the release page and package versions from the index.
- **Pre-1.0 syntax found in pre-1.0 release notes is history.** The
  [migration record](../versions/index.md) tells you what moved; this page tells
  you when.

## Sources

- https://mojolang.org/releases/
- https://mojolang.org/releases/archive/
- https://mojolang.org/releases/v0.6.1/
- https://mojolang.org/releases/v0.7.0/
- https://mojolang.org/releases/v0.24.1/
- https://mojolang.org/releases/v0.25.5/
- https://mojolang.org/releases/v0.25.6/
- https://mojolang.org/releases/v0.25.7/
- https://mojolang.org/releases/v1.0.0b1/
- https://mojolang.org/releases/v1.0.0b2/
- https://mojolang.org/releases/v1.0.0/
- https://mojolang.org/docs/faq/
