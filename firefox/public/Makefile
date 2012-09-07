#
# This file is part of WebCL.
# Project home page: http://webcl.nokiaresearch.com/
#

# This makefile relies on certain variables exported from parent makefile.
ifneq ($(MKFILE_MAGIC),bab7e365-4d06-4ebb-89bf-d5cd239fbad7)
$(error Build configuration not loaded! Run make from parent directory.)
endif

all: header typelib

INTERFACES = $(wildcard *.idl)

header: $(INTERFACES:.idl=.h) WebCL.h WebCL_types.h

typelib: $(INTERFACES:.idl=.xpt)

%.h: %.idl
	python $(REAL_SDK_PATH)/sdk/bin/header.py -I$(REAL_SDK_PATH)/idl --cachedir=. -o $@ $<

%.xpt: %.idl
	python $(REAL_SDK_PATH)/sdk/bin/typelib.py -I$(REAL_SDK_PATH)/idl --cachedir=. -o $@ $<

clean:
	@rm WebCL*.h IWebCL*.h *.xpt 2>/dev/null  ; true

.PHONY: all header typelib clean
