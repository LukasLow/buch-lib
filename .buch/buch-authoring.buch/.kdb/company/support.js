// Example of a nested key: %%company.support%% resolves here.
//
// The value returns its own placeholder syntax verbatim. Replacement output is
// never rescanned, so this is the supported way to show a placeholder literally
// in a page while keeping `buch validate` happy (the reference resolves).
"%%company.support%%";
