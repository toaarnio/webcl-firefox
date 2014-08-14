// Enable / disable webcl.
//  -1: Prompt before allowing access to WebCL functionality (default).
//   0: Disabled, no prompt.
//   1: Enabled, no prompt.
pref("extensions.webcl.allowed", -1);

// Enable / disable WebCL validator. true=enabled, false=disabled.
pref("extensions.webcl.enable-validator", false);

// Set explicit OpenCL library file with path. Default is "": autodetect.
pref("extensions.webcl.opencllib", "");

// Logging and debug messages
pref("extensions.webcl.log", false);
pref("extensions.webcl.debug", false);
pref("extensions.webcl.trace", false);
pref("extensions.webcl.trace-resources", false);
pref("extensions.webcl.os-console-output", false);

