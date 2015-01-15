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

var EXPORTED_SYMBOLS = [ "CLVLibraryInstance", "loadLibrary", "unloadLibrary" ];

const Cu = Components.utils;

try {

Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/common.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/libloader.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_clv/clv_symbols.jsm");

Cu.import ("resource://gre/modules/ctypes.jsm");


function CLVLibraryInstance (addonLocation)
{
  if (!(this instanceof CLVLibraryInstance)) return new CLVLibraryInstance ();
  TRACE ("CLVLibraryInstance", "constructor", arguments);

  this._addonLocation = addonLocation;

  return LibraryInstance.apply (getLibraryNameForPlatform (addonLocation),
                                CLVSymbolDetails);
}
CLVLibraryInstance.prototype = Object.create (LibraryInstance.prototype);


function getLibraryNameForPlatform (addonLocation)
{
  var rv = null;

  switch (getRuntimeOS ())
  {
    default:
    case "Linux": {
      if (ctypes.intptr_t.size == 8)
        rv = addonLocation + "/lib/linux_x86_64/libclv_standalone.so";
      else if (ctypes.intptr_t.size == 4)
        rv = addonLocation + "/lib/linux_x86_32/libclv_standalone.so";
      break;
    }
    case "WINNT": {
      if (ctypes.intptr_t.size == 8)
        rv = addonLocation + "\\lib\\win_64\\clv_standalone.dll";
      else if (ctypes.intptr_t.size == 4)
        rv = addonLocation + "\\lib\\win_32\\clv_standalone.dll";
      break;
    }
    case "Darwin": {
      rv = addonLocation + "/lib/libclv_standalone.dylib";
      break;
    }
  }

  return rv;
}
CLVLibraryInstance.getLibraryNameForPlatform = getLibraryNameForPlatform;


function loadLibrary (addonLocation)
{
  TRACE ("CLVLibraryInstance", "loadLibrary", arguments);
  var instance = LibraryInstance.loadLibrary(getLibraryNameForPlatform (addonLocation),
                                             CLVSymbolDetails);
  if (instance)
  {
    instance._addonLocation = addonLocation;
  }
  return instance;
}
CLVLibraryInstance.loadLibrary = loadLibrary;


function unloadLibrary (instance)
{
  TRACE ("CLVLibraryInstance", "unloadLibrary", arguments);
  return LibraryInstance.unloadLibrary (instance);
}
CLVLibraryInstance.unloadLibrary = unloadLibrary;


} catch(e) { ERROR ("clv_libloader.jsm:\n" + String(e) + ":\n" + e.stack); throw e; }
