/*
 * This file is part of WebCL – Web Computing Language.
 *
 * This Source Code Form is subject to the terms of the
 * Mozilla Public License, v. 2.0. If a copy of the MPL
 * was not distributed with this file, You can obtain
 * one at http://mozilla.org/MPL/2.0/.
 *
 * The Original Contributor of this Source Code Form is
 * Nokia Research Center Tampere (http://webcl.nokiaresearch.com).
 *
 */

var EXPORTED_SYMBOLS = [ "OCLLibraryInstance" ];

const Cu = Components.utils;

try {

Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/common.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/libloader.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_symbols.jsm");


function getDefaultLibraryNameForPlatform ()
{
  var rv = null;

  switch (getRuntimeOS ())
  {
    default:
    case "Linux":
      rv = "libOpenCL.so";
      break;
    case "WINNT":
      rv = "OpenCL.dll";
      break;
    case "Darwin":
      rv = "/System/Library/Frameworks/OpenCL.framework/OpenCL";
      break;
  }

  return rv;
}


function OCLLibraryInstance (libName)
{
  if (!(this instanceof OCLLibraryInstance)) return new OCLLibraryInstance (libName);
  TRACE ("OCLLibraryInstance", "constructor", arguments);

  return LibraryInstance.apply (libName, OCLSymbolDetails);
}
OCLLibraryInstance.prototype = Object.create (LibraryInstance.prototype);


function loadLibrary (libName)
{
  TRACE ("OCLLibraryInstance", "loadLibrary", arguments);

  libName = libName || getDefaultLibraryNameForPlatform ();
  var instance = LibraryInstance.loadLibrary(libName, OCLSymbolDetails);

  return instance;
}
OCLLibraryInstance.loadLibrary = loadLibrary;


function unloadLibrary (instance)
{
  TRACE ("OCLLibraryInstance", "unloadLibrary", arguments);
  return LibraryInstance.unloadLibrary (instance);
}
OCLLibraryInstance.unloadLibrary = unloadLibrary;


} catch(e) { ERROR ("ocl_libloader.jsm:\n" + String(e) + ":\n" + e.stack); throw e; }
