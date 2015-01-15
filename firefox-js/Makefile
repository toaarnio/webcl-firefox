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


COMPONENTS = webclinit.js

FRAMESCRIPT = main.js

PAGESCRIPT = clientwrapper.js

MODULES = logger.jsm common.jsm webclutils.jsm \
   base.jsm mixin.jsm libloader.jsm releasemanager.jsm webclclasses.jsm \
   webclconstructors.jsm \
   webclasyncworkerapi.jsm validatorasyncworkerapi.jsm webclcallbackworkerapi.jsm

MODULES_WEBCL = webcl.jsm webclplatform.jsm webcldevice.jsm webclcontext.jsm \
  webclcommandqueue.jsm webclevent.jsm webclmemoryobject.jsm webclprogram.jsm \
  webclvalidatedprogram.jsm webclkernel.jsm webclsampler.jsm webclimagedescriptor.jsm

MODULES_OCL = ocl_constants.jsm ocl_symbols.jsm ocl_types.jsm ocl_getinfo.jsm \
  ocl_exception.jsm ocl_libloader.jsm ocl_common.jsm \
  wrapper.jsm platform.jsm device.jsm commandqueue.jsm context.jsm event.jsm \
  kernel.jsm memoryobject.jsm program.jsm sampler.jsm

MODULES_CLV = clv_symbols.jsm clv_libloader.jsm clv_wrapper.jsm clv_program.jsm

MODULES_FRAMESCRIPT = webcl.jsm webclplatform.jsm webcldevice.jsm webclcontext.jsm \
  webclcommandqueue.jsm webclevent.jsm webclmemoryobject.jsm webclprogram.jsm \
  webclkernel.jsm webclsampler.jsm \
  enums.jsm misc.jsm

MIXINS = owner.jsm

WORKERS = webclasyncworker.js validatorasyncworker.js webclcallbackworker.js


SOURCE_FILES = $(COMPONENTS:%=components/%) \
  $(FRAMESCRIPT:%=content/framescript/%) \
  $(PAGESCRIPT:%=content/page/%) \
  $(MODULES:%=content/modules/%) \
  $(MODULES_WEBCL:%=content/modules/webcl/%) \
  $(MODULES_OCL:%=content/modules/lib_ocl/%) \
  $(MODULES_CLV:%=content/modules/lib_clv/%) \
  $(MODULES_FRAMESCRIPT:%=content/modules/framescript/%) \
  $(MIXINS:%=content/modules/mixins/%) \
  $(WORKERS:%=content/workers/%) \
  content/webclversion.jsm


PREF_FILES = defaults/preferences/webclprefs.js


all: dist dist-src

xpi: $(PACKAGE)

dist: $(PACKAGE)

dist-src: $(SRC_PACKAGE)


content/webclversion.jsm: content/webclversion.jsm.in
	@cp content/webclversion.jsm.in content/webclversion.jsm
	@sed -i 's/YYYY-MM-DD/$(BUILD_DATE)\.$(GIT_LATEST_COMMIT)/' content/webclversion.jsm;

$(PACKAGE): install.rdf chrome.manifest COPYING $(SOURCE_FILES) $(PREF_FILES)
	@rm -f $(PACKAGE)
	@zip -r $@ install.rdf chrome.manifest COPYING $(SOURCE_FILES) $(PREF_FILES) lib


$(SRC_PACKAGE):
	@zip -r $@ chrome.manifest install.rdf Makefile COPYING content defaults components lib


clean:
	@rm -f $(PACKAGE)
	@rm -f $(SRC_PACKAGE)
	@rm -f content/webclversion.jsm

ultra-clean: clean
	@find . -name "*~" -exec rm -f "{}" \;


.PHONY: all dist dist-src xpi clean ultra-clean
