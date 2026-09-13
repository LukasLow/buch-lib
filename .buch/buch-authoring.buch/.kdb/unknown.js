// A key whose script fails at run time, used to demonstrate inline errors.
//
// The value is a function so it is only invoked when rendering runs; it throws
// on purpose. The renderer catches this and substitutes an inline
// `%%kdb error: ...%%` marker instead of failing the whole page.
function () {
  throw new Error("no value configured");
}
