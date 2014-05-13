BUILD_DATE = $(shell date +%Y-%m-%d)
GIT_LATEST_COMMIT = $(shell git log | head -1 | cut -c 8-)

ifeq ($(COMPONENT_NAME),)
  export COMPONENT_NAME=webcl
endif
ifeq ($(PACKAGE),)
  export PACKAGE=$(COMPONENT_NAME).xpi
endif
ifeq ($(SRC_PACKAGE),)
  export SRC_PACKAGE=$(COMPONENT_NAME)-src.zip
endif


all: dist dist-src


COMPONENTS = webclloader.js

MODULES = logger.jsm common.jsm webclutils.jsm base.jsm webclconstructors.jsm \
  mixin.jsm webclclasses.jsm webclasyncworkerapi.jsm
MODULES_WEBCL = webcl.jsm webclplatform.jsm webcldevice.jsm webclcontext.jsm \
  webclcommandqueue.jsm webclevent.jsm webclmemoryobject.jsm webclprogram.jsm \
  webclkernel.jsm webclsampler.jsm webclimagedescriptor.jsm
MODULES_OCL = ocl_constants.jsm ocl_symbols.jsm ocl_types.jsm ocl_getinfo.jsm \
  ocl_exception.jsm ocl_libloader.jsm ocl_common.jsm \
  wrapper.jsm platform.jsm device.jsm commandqueue.jsm context.jsm event.jsm \
  kernel.jsm memoryobject.jsm program.jsm sampler.jsm

MIXINS = owner.jsm

WORKERS = webclasyncworker.js

SOURCE_FILES = $(COMPONENTS:%=js/%) $(MODULES:%=js/modules/%) $(MODULES_WEBCL:%=js/modules/webcl/%) $(MODULES_OCL:%=js/modules/lib_ocl/%) $(MIXINS:%=js/modules/mixins/%) $(WORKERS:%=js/workers/%)

dist: xpi

package: xpi

xpi: $(PACKAGE)

$(PACKAGE): install.rdf chrome.manifest $(SOURCE_FILES) COPYING $(wildcard defaults/preferences/*.js) $(wildcard content/*.js)
	@rm -f $(PACKAGE)
	@mkdir -p dist/components
	@cp $(COMPONENTS:%=js/%) dist/components/
	@mkdir -p dist/resources/modules
	@cp $(MODULES:%=js/modules/%) dist/resources/modules/
	@mkdir -p dist/resources/modules/webcl
	@cp $(MODULES_WEBCL:%=js/modules/webcl/%) dist/resources/modules/webcl/
	@mkdir -p dist/resources/modules/lib_ocl
	@cp $(MODULES_OCL:%=js/modules/lib_ocl/%) dist/resources/modules/lib_ocl/
	@mkdir -p dist/resources/modules/mixins
	@cp $(MIXINS:%=js/modules/mixins/%) dist/resources/modules/mixins/
	@mkdir -p dist/resources/workers
	@cp $(WORKERS:%=js/workers/%) dist/resources/workers
	@mkdir -p dist/defaults/preferences
	@cp defaults/preferences/*.js dist/defaults/preferences/
	@cp -r content dist/
	@(cd dist/content; sed --in-place 's/YYYY-MM-DD/$(BUILD_DATE)\.$(GIT_LATEST_COMMIT)/' webclclientwrapper.js)
	@cp install.rdf chrome.manifest COPYING dist/
	@(cd dist; sed --in-place 's/YYYY-MM-DD/$(BUILD_DATE)\.$(GIT_LATEST_COMMIT)/' install.rdf)
	@cd dist && zip -r ../$@ install.rdf chrome.manifest \
	    components content resources defaults COPYING -x@../zipexclude.lst


dist-src: $(SRC_PACKAGE)

$(SRC_PACKAGE): Makefile install.rdf chrome.manifest $(SOURCE_FILES) COPYING zipexclude.lst
	@rm -f $(SRC_PACKAGE)
	zip -r $@ $^ content defaults -x@zipexclude.lst


docs:


clean:
	@rm -rf dist
	@rm -f $(PACKAGE)
	@rm -f $(SRC_PACKAGE)


ultra-clean: clean
	@find . -name "*~" -exec rm -f "{}" \;


.PHONY: all dist package xpi dist-src docs clean ultra-clean
