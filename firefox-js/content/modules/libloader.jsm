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

Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/common.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");


// Global: library instances
var gInstances = {};


try {

function LibraryInstance (libName, symbolDetails)
{
  if (!(this instanceof LibraryInstance)) return new LibraryInstance (libName);

  TRACE ("LibraryInstance", "constructor", arguments);

  // Set initial ref count to zero
  this._refCnt = 0;
  this._libName = libName;

  LOG ("Loading library \"" + this._libName + "\".");
  try
  {
    this._handle = ctypes.open (this._libName);

    this._loadSymbols (symbolDetails);

    // Library loaded succesfully, bump ref count to 1
    this._refCnt = 1;
  }
  catch (e)
  {
    ERROR ("Failed to load library \"" + this._libName + "\":\n"
           + String(e) + "\n" + e.stack + ".");
    throw e;
  }
}


LibraryInstance.prototype.retain = function ()
{
  TRACE ("LibraryInstance", "retain", arguments);

  if (this._refCnt == 0)
  {
    throw new Error ("LibraryInstance  INTERNAL ERROR: " +
                     "retain invoked on object with reference count zero.");
  }
  ++this._refCnt;
  DEBUG ("LibraryInstance.retain  refCnt is now " + this._refCnt);
};


LibraryInstance.prototype.release = function ()
{
  TRACE ("LibraryInstance", "release", arguments);

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
      ERROR ("Failed to unload library \"" + this._libName + "\":\n"
             + String(e) + "\n" + e.stack + ".");
    }
    this._handle = null;
  }
  DEBUG ("LibraryInstance.release  refCnt is now " + this._refCnt);
};


LibraryInstance.prototype.unload = function ()
{
  TRACE ("LibraryInstance", "unload", arguments);
  this.release ();
};


LibraryInstance.prototype._loadSymbols = function (symbolDetails)
{
  DEBUG ("Loading symbols from from \"" + this._libName + "\".");
  if (!symbolDetails || !Array.isArray(symbolDetails))
  {
    throw new Error ("Invalid type or value for symbolDetails: " + typeof(symbolDetails));
  }

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
      LOG ("Failed to load library symbol " + detail.name + ": " + e.stack);
    }
  }
  DEBUG ("Loaded " + cnt + " symbols.");
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


function loadSymbol (lib, symbolInfo)
{
  DEBUG("Loading symbol: " + symbolInfo.name + argsToString(symbolInfo.args));
  INFO("Loading symbol: " + symbolInfo.name + argsToString(symbolInfo.args));

  var tmp = [ symbolInfo.name, ctypes.default_abi, symbolInfo.rv ].concat(symbolInfo.args);
  var fn = lib.declare.apply (lib, tmp);

  return fn;
}


function loadLibrary (libName, symbolDetails)
{
  TRACE ("LibraryInstance", "loadLibrary", arguments);

  if (libName in gInstances)
  {
    // Library is already loaded
    var instance = gInstances[libName];
    instance.retain ();
    return instance;
  }

  // Library is not loaded
  var instance = new LibraryInstance (libName, symbolDetails);
  gInstances[libName] = instance;

  return instance;
}
LibraryInstance.loadLibrary = loadLibrary;


// Unload is here for symmetry, it just relays the call to the libwrapper instance.
function unloadLibrary (instance)
{
  TRACE ("LibraryInstance", "unloadLibrary", arguments);

  if (!instance || !(instance instanceof LibraryInstance))
  {
    throw new Error ("Invalid library wrapper instance.");
  }

  instance.unload ();
}
LibraryInstance.unloadLibrary = unloadLibrary;



} catch(e) { ERROR ("libloader.jsm:\n" + String(e) + ":\n" + e.stack); throw e; }
