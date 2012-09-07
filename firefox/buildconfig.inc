# This file contains the build settings for WebCL.


# Variable CXX and LD can be used to override the default C++ compiler
# (Linux: g++, Windows: CL.exe) and linker (Linux: g++, Windows: link.exe).
# Leave these commented to use environment defaults
export CXX =
export LD =


# User/environment specific build flags.
# E.g. OpenCL library and include paths can be set here if they are not
# in system wide settings.
# NOTE: on Windows platform use dash (-) for options instead of forward
# slash (/), e.g. -I instead of /I . This is necessary due to the use of
# Mozilla Build shell.
export CXXFLAGS +=
export LDFLAGS +=


# Name used as base of the filename for XPCOM component DLL.
# E.g. lib$(COMPONENT_NAME).so for Linux and $(COMPONENT_NAME).dll for Windows.
export COMPONENT_NAME=webcl


# path to Xulrunner SDK dir
XULRUNNER_SDK_PATH=../../xulrunner-sdk


# Override the version number of the component. Leave these empty to
# use the official values in Makefile.
# Format: MAJOR.MINOR.RELEASE.BUILD_DATE
# NOTE: If BUILD_DATE is left empty, the Makefile will try to use
#       the current date as provided by command date '+%F'. If that fails,
#       an empty string is used. Valid form is YYYY-MM-DD, no quotes.
export VERSION_MAJOR=
export VERSION_MINOR=
export VERSION_RELEASE=
export BUILD_DATE=


# Build flags:

# The make command for recursive calls to subdirectories.
export SUBMAKE=make

# Extra flags for recursive make calls
export SUBMFLAGS=

# The extension package name (XPI). Leave empty to use the default name:
#   $(COMPONENT_NAME)-$(VERSION_MAJOR).$(VERSION_MINOR).$(VERSION_RELEASE).$(BUILD_DATE).xpi
export PACKAGE=

# The source package name. Leave empty to use the default name:
#   $(COMPONENT_NAME)-$(VERSION_MAJOR).$(VERSION_MINOR).$(VERSION_RELEASE).$(BUILD_DATE)-src.zip
export SRC_PACKAGE=


# Enable debug build.
# Set value to 1 to enable. Comment out or set any other value to disable.
export ENABLE_DEBUG ?= 0

# Enable logging.
# Set value to 1 to enable. Comment out or set any other value to disable.
export ENABLE_LOG ?= 0

# Default logging level, higher levels include lower level messages.
#   0: none
#   1: errors
#   2: warnings
#   3: info
#   4: debug
export LOG_LEVEL_DEFAULT ?= 2

# Track function calls to log using D_METHOD_START.
# Set value to 1 to enable. Comment out or set any other value to disable.
export ENABLE_TRACE_FUNCTIONS ?= 0

# Enable logging to file. Comment out to disable.
# Note: value must be given within escaped quotes, e.g. \"log_file.txt\" .
#export LOG_TO_FILE = \"webcl.log\"
