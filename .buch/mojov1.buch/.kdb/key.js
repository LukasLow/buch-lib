// Echo the generic placeholder syntax for documentation purposes.
//
// The sequence "%%key%%" is reserved by the renderer: a page that needs to
// display it literally cannot type it directly, because the renderer would try
// to resolve the key `key`. A KDB value may return the token verbatim instead —
// replacement output is not scanned again. This module backs the literal token
// shown on intro/how-to-read-this-buch.md.
"%%key%%";
