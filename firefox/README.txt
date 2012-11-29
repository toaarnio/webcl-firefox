-----------------------------------------------------------------------

                     WebCL - Web Computing Language

-----------------------------------------------------------------------

The WebCL project exposes OpenCL into JavaScript, allowing web developers
to tap into the massive parallel computing resources of modern GPUs and
multicore CPUs. This implementation provides the Nokia WebCL extension for
Mozilla Firefox.

Project home page: http://webcl.nokiaresearch.com/



LICENSING
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

This WebCL implementation is free software; you can redistribute it and/or
modify it under the terms of the Mozilla Public License, v. 2.0. See included
COPYING file for full license. If a copy of the MPL was not distributed with
the sources, You can obtain one at http://mozilla.org/MPL/2.0/. 

Copyright (C) 2011 Nokia Corporation and/or its subsidiary(-ies).

OpenCL is a trademark of Apple Inc.


ACKNOWLEDGEMENTS
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

Contact: Tomi Aarnio  tomi.aarnio@nokia.com

Developers:
    Janne Pietiäinen
    Jari Nikara
    Tomi Aarnio
    Eero Aho



PREREQUISITIES
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

On Unix-like systems, e.g. Linux:
  The following tools are required:

  * The g++ compiler

  * GNU Make

  * Doxygen for generating documentation from sources.
    http://www.doxygen.org/

  The following library and software dependencies must be fulfilled.

  * Xulrunner SDK
    http://ftp.mozilla.org/pub/mozilla.org/xulrunner/releases/<VERSION>/sdk
    
    Example:
    # wget http://ftp.mozilla.org/pub/mozilla.org/xulrunner/releases/17.0/sdk/xulrunner-17.0.en-US.linux-i686.sdk.tar.bz2    

  * OpenCL SDK
    An SDK is available from e.g. AMD, NVIDIA and INTEL for use with
    their respective hardware.

    Example:
    # wget http://registrationcenter.intel.com/irc_nas/2563/intel_sdk_for_ocl_applications_2012_x64.tgz
    # gunzip intel_sdk_for_ocl_applications_2012_x64.tgz
    # tar xvf intel_sdk_for_ocl_applications_2012_x64.tar
    # sudo yum install intel_ocl_sdk_2012_x64.rpm

  * Mozilla Firefox browser
    http://releases.mozilla.org/pub/mozilla.org/firefox/releases/latest/

    Example:
    # wget http://releases.mozilla.org/pub/mozilla.org/firefox/releases/latest/linux-i686/en-US/firefox-17.0.tar.bz2


On Windows:
  The following tools are required:

  * MozillaBuild for build shell and tools.
    https://wiki.mozilla.org/MozillaBuild
    https://developer.mozilla.org/en/Windows_Build_Prerequisites

  * Microsoft Visual C++ compiler.
    Microsoft Visual Studio Express is sufficient. Supported versions are
    2008 and 2010.

  * Microsoft Windows SDK
    See: https://developer.mozilla.org/En/Windows_SDK_versions .

  * Doxygen for generating documentation.
    http://www.doxygen.org/


  The following library and software dependencies must be fulfilled.

  * Xulrunner SDK
    http://ftp.mozilla.org/pub/mozilla.org/xulrunner/releases/<VERSION>/sdk

  * OpenCL SDK
    An SDK is available from e.g. AMD, NVIDIA and INTEL for use with
    their respective hardware.

  * Mozilla Firefox browser
    http://releases.mozilla.org/pub/mozilla.org/firefox/releases/latest/



BUILDING
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

On Unix-like systems, e.g. Linux:
  * Enter the firefox directory

  * Make sure the settings on buildconfig.inc are set properly and modify
    them if necessary. Configure at least the path to Xulrunner SDK
    (XULRUNNER_SDK_PATH). If the OpenCL SDK is not installed system wide,
    set the include path on CXXFLAGS, e.g.
      export CXXFLAGS=-I/opt/AMDAPP/include/

  * run make

On Windows:
  * Launch the MozillaBuild shell compatible with your compiler, e.g.
    C:\mozilla-build\start-msvc10.bat

  * Enter the firefox directory

  * Make sure the settings on buildconfig.inc are set properly and modify
    them if necessary. Configure at least the path to Xulrunner SDK
    (XULRUNNER_SDK_PATH). If the OpenCL SDK is not installed system wide,
    set the include path on CXXFLAGS, e.g.
      export CXXFLAGS=-I"C:\Program Files\AMD APP\include"


  * run make


INSTALLING
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

Open the resulting webcl-1.0.xpi on Mozilla Firefox to install the extension.

