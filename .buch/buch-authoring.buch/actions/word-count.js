// Count the arguments passed after `--`.
// A function-valued action receives { action, buch, args } as input.
function (input) {
  var args = (input && input.args) || [];
  return args.length;
}
