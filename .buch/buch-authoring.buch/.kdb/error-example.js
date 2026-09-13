// Produce the literal text of an inline error marker for the docs.
//
// Rendering scans a page's *source* for %%key%% references, never the text a
// value returns. Returning the marker here lets the docs show the exact marker
// while keeping every reference in the page resolvable.
"%%kdb error: unknown: no value configured%%";
