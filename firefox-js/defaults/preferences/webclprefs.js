// Enable / disable webcl.
//  -1: Prompt before allowing access to WebCL functionality (default).
//   0: Disabled, no prompt.
//   1: Enabled, no prompt.
pref("extensions.webcl.allowed", -1);

// Set explicit OpenCL library file with path. Default is "": autodetect.
pref("extensions.webcl.opencllib", "");

// Logging and debug messages
pref("extensions.webcl.log", false);
pref("extensions.webcl.debug", false);
pref("extensions.webcl.trace", false);

// Select API mode
//                   "": Default API
//   "deprecated-1.0.3": Emulate old Nokia WebCL API
pref("extensions.webcl.api-mode", "");
