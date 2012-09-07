#
# This file is part of WebCL.
# Project home page: http://webcl.nokiaresearch.com/
#

include buildconfig.inc

export MKFILE_MAGIC=bab7e365-4d06-4ebb-89bf-d5cd239fbad7

export REAL_SDK_PATH:=$(realpath $(XULRUNNER_SDK_PATH))

ifeq ($(wildcard $(REAL_SDK_PATH)),)
  $(error Unable to locate Xulrunner SDK. Please check GECKO_SDK_PATH in buildconfig.inc .)
endif


# The official WebCL version information.
# These values can be overridden in buildconfig.inc
# Major API version
ifeq ($(VERSION_MAJOR),)
 export VERSION_MAJOR=1
endif
# Minor API version
ifeq ($(VERSION_MINOR),)
 export VERSION_MINOR=0
endif
# Patch release
ifeq ($(VERSION_RELEASE),)
 export VERSION_RELEASE=3
endif

# If BUILD_DATE is empty, attempt to get the current date from system
ifeq ($(BUILD_DATE),)
  BUILD_DATE:=$(shell date '+%F' 2>/dev/null)
  ifeq ($(BUILD_DATE),)
   # Failed to get date.
   $(warning Warning: Failed to set VERSION_REV using revision number from svn. Using default value 0.)
   BUILD_DATE=
  endif
endif
export BUILD_DATE

ifeq ($(BUILD_DATE),)
  # Drop revision info if it was not available.
  export VERSION_STR=$(VERSION_MAJOR).$(VERSION_MINOR).$(VERSION_RELEASE)
else
  export VERSION_STR=$(VERSION_MAJOR).$(VERSION_MINOR).$(VERSION_RELEASE).$(BUILD_DATE)
endif

ifeq ($(PACKAGE),)
  export PACKAGE=$(COMPONENT_NAME)-$(VERSION_MAJOR).$(VERSION_MINOR).xpi
endif
ifeq ($(SRC_PACKAGE),)
  export SRC_PACKAGE=$(COMPONENT_NAME)-$(VERSION_STR)-src.zip
endif



# On Windows platform this makefile is intended to be used
# in Mozilla Build shell.
TMP?=/tmp
export WCL_PLATFORM := $(shell (uname|cut -d_ -f1))
$(info Platform: $(WCL_PLATFORM))
ifeq ($(WCL_PLATFORM), MINGW32)
 $(info Windows platform detected.)
 export WCL_WINDOWS_BUILD = 1

 # Fix path names so that they work with Mozilla Build shell on Windows.
 # realpath gives us paths starting with /c/ which needs to be changed
 # to C:/ for MS compiler.
 export MS_REAL_SDK_PATH:=$(shell echo "$(REAL_SDK_PATH)"|sed -e 's/^\/\([a-zA-Z]\)\//\1:\//g')
 ifeq ($(wildcard $(MS_REAL_SDK_PATH)),)
   $(error Unable to locate Xulrunner SDK. Please check GECKO_SDK_PATH in buildconfig.inc .)
 endif

 # Modify Makefile.inc to enable/disable debug build
 ifeq ($(ENABLE_DEBUG),1)
  $(info Debug build!)
  export RELEASE = Debug
 else
  export RELEASE = Release
 endif

 $(info MSVC Version: $(MOZ_MSVCVERSION))
 ifeq ($(MOZ_MSVCVERSION),)
  $(error Unable to detect MSVC version. Please use Mozilla Build shell on Windows.)
 endif

else
 $(info Assuming unix build (g++))
 export WCL_WINDOWS_BUILD = 0
endif


all: build dist

build: public src

public:
	cd public && $(SUBMAKE) $(SUBMFLAGS)

src:
ifeq ($(WCL_WINDOWS_BUILD), 1)
	cd src && $(SUBMAKE) $(SUBMFLAGS) -f Makefile.windows
else
	cd src && $(SUBMAKE) $(SUBMFLAGS)
endif


# Documentation targets
docs-api: doxygen-api.conf
	doxygen $<

docs: docs-api

docs-full: doxygen-full.conf
	doxygen $<


# Packaging targets
package: xpi

xpi: $(PACKAGE)

ifeq ($(WCL_WINDOWS_BUILD), 1)
TARGET_LIB = $(COMPONENT_NAME).dll
TARGET_PATH = $(RELEASE)
else
TARGET_LIB = lib$(COMPONENT_NAME).so
TARGET_PATH = src
endif

# Note: the sed command included in MozillaBuild doesn't seem to support in-place editing.
$(PACKAGE): $(TARGET_PATH)/$(TARGET_LIB) install.rdf.in chrome.manifest
	sed -e 's/<em:version>.*<\/em:version>/<em:version>$(VERSION_STR)<\/em:version>/g' install.rdf.in > install.rdf
	rm -rf components ; true
	mkdir components
	cp -a public/*.xpt components/
	cp -a $< components/
	echo "$(TARGET_LIB)" > components/components.list
	zip -r $@ install.rdf chrome.manifest components content COPYING -x content/.svn/\*

content:
	@mkdir -p content

$(SRC_PACKAGE): install.rdf.in chrome.manifest Makefile buildconfig.inc content \
 public/Makefile public/*.idl src/Makefile src/Makefile.windows \
 src/*.h src/*.cpp README.txt COPYING \
 doxygen-api.conf doxygen-full.conf docs/doxymain.txt
	rm -f $@
	zip $@ $^

dist-src: $(SRC_PACKAGE)

dist: xpi dist-src


# Clean targets
clean:
	@cd public && $(SUBMAKE) $(SUBMFLAGS) $@ ; true
ifeq ($(WCL_WINDOWS_BUILD), 1)
	@cd src && $(SUBMAKE) $(SUBMFLAGS) -f Makefile.windows $@ ; true
else
	@cd src && $(SUBMAKE) $(SUBMFLAGS) $@ ; true
endif
	@rm -f $(PACKAGE) 2>/dev/null ; true
	@rm -f $(SRC_PACKAGE) 2>/dev/null ; true
	@rm -rf components 2>/dev/null ; true
	@rm -rf docs/html 2>/dev/null ; true
	@rm -f install.rdf


# Get rid of file backups as well.
ultra-clean: clean
	@rm -f ./*~ public/*~ docs/*~ 2>/dev/null ; true
ifeq ($(WCL_WINDOWS_BUILD), 1)
	@cd src && $(SUBMAKE) $(SUBMFLAGS) -f Makefile.windows $@ ; true
else
	@cd src && $(SUBMAKE) $(SUBMFLAGS) $@ ; true
endif
	@rm -f $(PACKAGE) $(SRC_PACKAGE)


.PHONY: all build build-win public src content package xpi dist-src dist clean ultra-clean docs docs-api docs-full
