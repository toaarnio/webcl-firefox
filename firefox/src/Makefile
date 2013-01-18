#
# This file is part of WebCL.
# Project home page: http://webcl.nokiaresearch.com/
#

# This makefile relies on certain variables exported from parent makefile.
ifneq ($(MKFILE_MAGIC),bab7e365-4d06-4ebb-89bf-d5cd239fbad7)
$(error Build configuration not loaded! Run make from parent directory.)
endif

# Default compiler and linker. These settings can be overridden
# in buildoncig.inc .
ifeq ($(CXX),)
 CXX = g++
endif
ifeq ($(LD),)
 LD = g++
endif


# Gecko
GECKO_DEFINES = -DXPCOM_GLUE -DXPCOM_GLUE_USE_NSPR -DJS_NO_JSVAL_JSID_STRUCT_TYPES -D__STDC_LIMIT_MACROS
GECKO_INCLUDES = -I$(REAL_SDK_PATH)/include -I$(REAL_SDK_PATH)/include/nspr
GECKO_CXXFLAGS = -Os -shared -fPIC \
 -fno-exceptions -fno-strict-aliasing \
 -freorder-blocks -fno-reorder-functions \
 -pthread -pipe -fshort-wchar \
 -Wno-invalid-offsetof \
 -std=gnu++0x
GECKO_LDFLAGS = -L$(REAL_SDK_PATH)/lib \
  -shared -fPIC -pthread -pipe \
  -Wl,-Bsymbolic -Wl,-z,defs \
  -lxul -lxpcom -lxpcomglue_s_nomozalloc -lnspr4 \
  -ldl -lm


# WebCL
WEBCL_DEFINES = \
 -DWEBCL_VERSION_MAJOR=$(VERSION_MAJOR) -DWEBCL_VERSION_MINOR=$(VERSION_MINOR) \
 -DWEBCL_VERSION_RELEASE=$(VERSION_RELEASE) -DWEBCL_BUILD_DATE="\"$(BUILD_DATE)\""
WEBCL_INCLUDES = -I../public -I.
WEBCL_CXXFLAGS =
WEBCL_LDFLAGS =
ifeq ($(ENABLE_DEBUG), 1)
WEBCL_DEFINES += -DWEBCL_ENABLE_DEBUG
WEBCL_CXXFLAGS += -g
endif
ifeq ($(ENABLE_LOG), 1)
WEBCL_DEFINES += -DWEBCL_ENABLE_LOG -DWEBCL_LOG_LEVEL_DEFAULT=$(LOG_LEVEL_DEFAULT)
endif
ifdef LOG_TO_FILE
WEBCL_DEFINES += -DWEBCL_LOG_TO_FILE=$(LOG_TO_FILE)
endif
ifeq ($(ENABLE_TRACE_FUNCTIONS), 1)
WEBCL_DEFINES += -DWEBCL_TRACE_FUNCTIONS
endif


DEFINES += $(GECKO_DEFINES) $(WEBCL_DEFINES)
INCLUDES += $(GECKO_INCLUDES) $(WEBCL_INCLUDES)
CXXFLAGS += $(GECKO_CXXFLAGS) $(WEBCL_CXXFLAGS) -Wall
LDFLAGS += $(GECKO_LDFLAGS) $(WEBCL_LDFLAGS)



TARGET_PREFIX = ../public/
DEPS_PREFIX = .deps/
BUILD_PREFIX = .build/
TARGET_NAME = $(COMPONENT_NAME)
DEP = $(CXX) -MM
TARGET = lib$(TARGET_NAME).so


# Default target
all: $(TARGET)


# Source files
SOURCES =$(wildcard *.cpp)
OBJECTS =$(SOURCES:%.cpp=$(BUILD_PREFIX)%.o)

# Dependency files are only generated if the goal does not include "clean"
xblockdeps=
ifeq ($(findstring clean, $(MAKECMDGOALS)),) # findstring evaluates to empty if no clean
# Include a dependency file for each source file.
-include $(SOURCES:%.cpp=$(DEPS_PREFIX)%.dep)
endif



# Targets

# Dependency files
$(DEPS_PREFIX)%.dep: %.cpp
	@if ! test -z "$(DEPS_PREFIX)"; then mkdir -p $(DEPS_PREFIX) >/dev/null 2>&1 ; fi ; true
	$(DEP) $(DEFINES) $(INCLUDES) $(CXXFLAGS) $< > $@


# Compile objects
$(BUILD_PREFIX)%.o: %.cpp
	@if ! test -z "$(BUILD_PREFIX)"; then mkdir -p $(BUILD_PREFIX) >/dev/null 2>&1 ; fi ; true
	$(CXX) $^ $(DEFINES) $(INCLUDES) $(CXXFLAGS) -c -o $@


# Link the library
$(TARGET): $(OBJECTS)
	$(LD) $^ $(LDFLAGS) -o $@
	chmod +x $@
ifneq ($(ENABLE_DEBUG), 1)
	strip $@
endif


# Clean
clean:
	@rm -f $(DEPS_PREFIX)*.dep 2>/dev/null ; true
	@rm -f $(BUILD_PREFIX)*.o 2>/dev/null ; true
	@rm -f $(TARGET) 2>/dev/null ; true


# In addition to clean: remove backup files and build dirs
ultra-clean: clean
	@rm -f ./*~ 2>/dev/null ; true
	@if ! test -z "$(DEPS_PREFIX)"; then rmdir "$(DEPS_PREFIX)" 2>/dev/null ; fi ; true
	@if ! test -z "$(BUILD_PREFIX)"; then rmdir "$(BUILD_PREFIX)" 2>/dev/null ; fi ; true


.PHONY: all clean ultra-clean
