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


var EXPORTED_SYMBOLS = [ "LibraryInstance", "loadLibrary", "unloadLibrary" ];

const Cu = Components.utils;

Cu.import ("resource://nrcwebcl/modules/logger.jsm");
Cu.import ("resource://nrcwebcl/modules/common.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_symbols.jsm");


// Global: library instances
var gInstances = {};


try {

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


function LibraryInstance (libName)
{
  TRACE ("LibraryInstance", "load", arguments);

  // Set initial ref count to zero
  this._refCnt = 0;
  this._libName = libName;

  LOG ("Loading library \"" + this._libName + "\".");
  try
  {
    this._handle = ctypes.open (this._libName);

    this._loadSymbols ();

    // Library loaded succesfully, bump ref count to 1
    this._refCnt = 1;
  }
  catch (e)
  {
    ERROR ("Failed to load library \"" + this._libName + "\"" + e + ".");
    throw e;
  }
}


LibraryInstance.prototype._retain = function ()
{
  TRACE ("LibraryInstance", "_retain", arguments);

  if (this._refCnt == 0)
  {
    throw new Error ("LibraryInstance  INTERNAL ERROR: " +
                     "retain invoked on object with reference count zero.");
  }
  ++this._refCnt;
  DEBUG ("LibraryInstance._retain  refCnt is now " + this._refCnt);
};


LibraryInstance.prototype._release = function ()
{
  TRACE ("LibraryInstance", "_release", arguments);

  if (this._refCnt == 0)
  {
    throw new Error ("LibraryInstance  INTERNAL ERROR: " +
    "release invoked on object with reference count zero or below.");
  }

  if ((--this._refCnt) == 0)
  {
    LOG ("Unloading library \"" + this._libName + "\".");
    delete gInstances[this._libName];
    try
    {
      this._handle.close ();
    }
    catch (e)
    {
      ERROR ("Failed to unload library \"" + this._libName + "\":" + e + ".");
    }
    this._handle = null;
  }
  DEBUG ("LibraryInstance._release  refCnt is now " + this._refCnt);
};


LibraryInstance.prototype._loadSymbols = function ()
{
  DEBUG ("Loading symbols from from \"" + this._libName + "\".");
  var cnt = 0;
  for (var i = 0; i < symbolDetails.length; ++i)
  {
    var detail = symbolDetails[i];
    try
    {
      this[detail.name] = loadSymbol (this._handle, detail);
      ++cnt;
    }
    catch (e)
    {
      LOG ("Failed to load OpenCL library symbol " + detail.name + ": " + e);
    }
  }
  DEBUG ("Loaded " + cnt + " symbols.");
};


LibraryInstance.prototype.unload = function ()
{
  TRACE ("LibraryInstance", "unload", arguments);
  this._release ();
};



function argsToString (args)
{
  var tmp = [];
  for (var i in args)
  {
    tmp.push (args[i].name);
  }
  return "(" + tmp.join(", ") + ")";
}


function loadSymbol (lib, details)
{
  DEBUG("Loading symbol: " + details.name + argsToString(details.args));
  var tmp = [ details.name, ctypes.default_abi, details.rv ].concat(details.args);
  var fn = lib.declare.apply (lib, tmp);
  return fn;
}


function loadLibrary (libName)
{
  TRACE ("libwrapper", "load", arguments);

  libName = libName || getDefaultLibraryNameForPlatform ();

  if (libName in gInstances)
  {
    // Library is already loaded
    var instance = gInstances[libName];
    instance._retain ();
    return instance;
  }

  // Library is not loaded
  var instance = new LibraryInstance (libName);
  gInstances[libName] = instance;

  return instance;
}


// Unload is here for symmetry, it just relays the call to the libwrapper instance.
function unloadLibrary (instance)
{
  TRACE ("libwrapper", "unload", arguments);

  if (!instance || !(instance instanceof LibraryInstance))
  {
    throw new Error ("Invalid library wrapper instance.");
  }

  instance.unload ();
}



} catch(e) { ERROR ("lib_ocl_loader failed: " + e); throw e; }
