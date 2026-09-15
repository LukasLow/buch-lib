# base64

`base64` encodes and decodes binary data as text, using Base64 and Base16
(hexadecimal).

> Binary data encoding: base64 and base16 encode/decode functions.

> The `base64` package provides functions for encoding and decoding binary data
> using Base64 and Base16 (hexadecimal) encoding schemes. Base64 encoding
> converts binary data into ASCII text for transmission over text-based
> protocols, while Base16 provides a simpler hexadecimal representation.

> Use this package for encoding binary data in JSON or XML, transmitting binary
> data over text protocols (HTTP, email), embedding images or files in text
> formats, or converting between binary and text representations while
> preserving data integrity.

Source: <https://mojolang.org/docs/std/base64/>.

## The four functions

The package has exactly four functions:

| Function | What it does |
|----------|--------------|
| `b64encode` | "Performs base64 encoding on the input string." |
| `b64decode` | "Performs base64 decoding on the input string." |
| `b16encode` | "Performs base16 encoding on the input string slice." |
| `b16decode` | "Performs base16 decoding on the input string." |

Source: <https://mojolang.org/docs/std/base64/base64/>.

The import path is the package root, as the official example shows:

```mojo
from std.base64 import b64encode
```

Source: <https://mojolang.org/docs/std/base64/base64/>.

## A runnable round trip

```mojo
from std.base64 import b64encode, b64decode, b16encode, b16decode

def main() raises:
    var original = "Hello, Mojo!"

    # Base64
    var encoded_b64 = b64encode(original)
    print(encoded_b64)                       # SGVsbG8sIE1vam8h
    print(b64decode(encoded_b64) == original)  # True

    # Base16 (hexadecimal)
    var encoded_b16 = b16encode(original)
    print(encoded_b16)                       # 48656c6c6f2c204d6f6a6f21
    print(b16decode(encoded_b16) == original)  # True
```

## Idioms

- **Encode at the boundary, decode at the boundary.** Encode when binary data
  leaves the program (JSON, URL, HTTP header, file in a text format) and decode
  immediately on entry. Keep the working value as bytes.
- **Use Base16 for debugging.** It is a direct byte-for-byte hex representation;
  Base64 is compact but opaque.
- **Round-trip as the test.** The reliable check is always
  `b64decode(b64encode(x)) == x`.
- **Remember the size difference.** Base64 turns 3 bytes into 4 characters;
  Base16 turns 1 byte into 2 characters. Base16 is therefore roughly 33% larger
  than Base64 for the same input.

## Pitfalls

- **Both decoders can fail.** The docs describe decoding the input string; the
  correct habit is to call the decoders from a raising function (the example's
  `main() raises`) or inside `try`, and to treat malformed input as an error
  rather than trusting it.
- **Encoders take strings, not arbitrary `Span[UInt8]`.** `b64encode` "Performs
  base64 encoding on the input string"; `b16encode` operates on a **string
  slice**. If you hold raw bytes, convert with `String(from_utf8_lossy=...)` (or
  validate with `String(from_utf8=...)`) first, and be aware that lossy
  conversion replaces invalid UTF-8 with `U+FFFD`.
- **Assuming Base64 is encryption.** It is a reversible encoding; it hides
  nothing.
- **Building your own alphabet/table unless you need it.** The package exposes
  the standard functions; there is no exposed alphabet parameter on these four.

> **Open question:** the official package Markdown gives only one-line
> descriptions for `b64encode`/`b64decode`/`b16encode`/`b16decode` and does not
> show their full signatures (parameter names, return types, `raises` clauses)
> at the package level. Read the individual function pages
> (<https://mojolang.org/docs/std/base64/base64/b64encode/> etc.) to confirm
> the exact signature before wrapping them in your own API.

## Stability

The `base64` package page and its module page show **no `@stable(since=...)`
marker** and no stability badge. Under the standard-library rule — "We consider
standard library APIs unstable unless specifically marked stable" — these
functions are **unstable by default**. Sources:
<https://mojolang.org/docs/std/base64/>,
<https://mojolang.org/docs/std/base64/base64/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `base64` package: <https://mojolang.org/docs/std/base64/>
- Mojo `base64` module: <https://mojolang.org/docs/std/base64/base64/>
- Mojo `b64encode`: <https://mojolang.org/docs/std/base64/base64/b64encode/>
- Mojo `b64decode`: <https://mojolang.org/docs/std/base64/base64/b64decode/>
- Mojo `b16encode`: <https://mojolang.org/docs/std/base64/base64/b16encode/>
- Mojo `b16decode`: <https://mojolang.org/docs/std/base64/base64/b16decode/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
