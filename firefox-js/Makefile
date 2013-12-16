include buildconfig.inc

export REAL_SDK_PATH:=$(realpath $(XULRUNNER_SDK_PATH))
ifeq ($(wildcard $(REAL_SDK_PATH)),)
  $(error Unable to locate Xulrunner SDK. Please check GECKO_SDK_PATH in buildconfig.inc .)
endif


ifeq ($(COMPONENT_NAME),)
  export COMPONENT_NAME=webcl
endif
ifeq ($(PACKAGE),)
  export PACKAGE=$(COMPONENT_NAME).xpi
endif
ifeq ($(SRC_PACKAGE),)
  export SRC_PACKAGE=$(COMPONENT_NAME)-src.zip
endif


all: typelib dist dist-src


INTERFACES = IWebCL.idl IWebCLPlatform.idl IWebCLDevice.idl IWebCLContext.idl \
  IWebCLCommandQueue.idl  IWebCLEvent.idl IWebCLMemoryObject.idl IWebCLBuffer.idl \
  IWebCLImage.idl IWebCLProgram.idl IWebCLKernel.idl IWebCLSampler.idl \
  IWebCLException.idl IWebCLImageDescriptor.idl
TYPELIBS = $(INTERFACES:%.idl=dist/components/%.xpt)
INTERFACE_FILES = $(INTERFACES:%=interfaces/%)


typelib: $(TYPELIBS)

dist/components/%.xpt: interfaces/%.idl
	@mkdir -p dist/components
	python $(REAL_SDK_PATH)/sdk/bin/typelib.py -I$(REAL_SDK_PATH)/idl --cachedir=. -o $@ $<


COMPONENTS = webcl.js webclplatform.js webcldevice.js webclcontext.js webclcommandqueue.js \
  webclevent.js webclmemoryobject.js webclprogram.js webclkernel.js webclsampler.js \
  webclimagedescriptor.js \
  clientwrapperloader.js
MODULES = logger.jsm common.jsm webclutils.jsm base.jsm webclconstructors.jsm \
  mixin.jsm
MODULES_OCL = ocl_constants.jsm ocl_symbols.jsm ocl_types.jsm ocl_getinfo.jsm \
  ocl_exception.jsm ocl_libloader.jsm \
  wrapper.jsm platform.jsm device.jsm commandqueue.jsm context.jsm event.jsm \
  kernel.jsm memoryobject.jsm program.jsm sampler.jsm
MIXINS = owner.jsm securitycheckedcomponent.jsm

SOURCE_FILES = $(COMPONENTS:%=js/%) $(MODULES:%=js/modules/%) $(MODULES_OCL:%=js/modules/lib_ocl/%) $(MIXINS:%=js/modules/mixins/%)

dist: xpi

package: xpi

xpi: $(PACKAGE)

$(PACKAGE): install.rdf chrome.manifest $(TYPELIBS) $(SOURCE_FILES) COPYING
	@rm -f $(PACKAGE)
	@mkdir -p dist/components
	@cp $(COMPONENTS:%=js/%) dist/components/
	@mkdir -p dist/resources/modules
	@cp $(MODULES:%=js/modules/%) dist/resources/modules/
	@mkdir -p dist/resources/modules/lib_ocl
	@cp $(MODULES_OCL:%=js/modules/lib_ocl/%) dist/resources/modules/lib_ocl/
	@mkdir -p dist/resources/modules/mixins
	@cp $(MIXINS:%=js/modules/mixins/%) dist/resources/modules/mixins/
	@mkdir -p dist/defaults/preferences
	@cp defaults/preferences/*.js dist/defaults/preferences/
	@cp -r content dist/
	@cp install.rdf chrome.manifest COPYING dist/
	@cd dist && zip -r ../$@ install.rdf chrome.manifest \
	    components content resources defaults COPYING -x@../zipexclude.lst


dist-src: $(SRC_PACKAGE)

$(SRC_PACKAGE): Makefile buildconfig.inc install.rdf chrome.manifest $(INTERFACE_FILES) $(SOURCE_FILES) COPYING zipexclude.lst
	@rm -f $(SRC_PACKAGE)
	zip -r $@ ^ content defaults -x@zipexclude.lst


docs:


clean:
	@rm -rf dist
	@rm -f $(PACKAGE)
	@rm -f $(SRC_PACKAGE)


ultra-clean: clean
	@find . -name "*~" -exec rm -f "{}" \;


.PHONY: all typelib dist package xpi dist-src docs clean ultra-clean
