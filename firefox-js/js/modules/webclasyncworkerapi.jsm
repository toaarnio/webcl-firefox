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


var EXPORTED_SYMBOLS = [ "WebCLAsyncWorker" ];


try {


const Cu = Components.utils;

Cu.import ("resource://nrcwebcl/modules/logger.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");


function WebCLAsyncWorker (libName)
{
  if (!(this instanceof WebCLAsyncWorker)) return new WebCLAsyncWorker (libName);

  this._worker = new ChromeWorker ("resource://nrcwebcl/workers/webclasyncworker.js");

  this._hasLib = false;

  // property: working
  this._working = false;
  this.__defineGetter__("working", function () { return !!this._working; });
  this.__defineSetter__("working", function () { throw new Error ("'working' is read only."); });

  // property: inCallback
  this._inCallback = false;
  this.__defineGetter__("inCallback", function () { return !!this._inCallback; });
  this.__defineSetter__("inCallback", function () { throw new Error ("'inCallback' is read only."); });

  // for cmd 'call': current notify callback
  this._fnNotify = null;
  // for cmd 'call': current symbol name
  this._curSymbol = null;


  var instance = this;
  this._worker.onmessage = function (event)
  {
    switch (event.data.cmd)
    {
      case "load":
        if (event.data.err)
        {
          ERROR ("WebCLAsyncWorker load failed. error: '" + event.data.err + "'.");
        }
        else
        {
          instance._hasLib = true;
        }
        break;

      case "unload":
        if (event.data.err)
        {
          ERROR ("WebCLAsyncWorker unload failed. error: '" + event.data.err + "'.");
        }
        instance._hasLib = false;
        break;

      case "call":
        if (event.data.err)
        {
          ERROR ("WebCLAsyncWorker call failed. symbol: '"+instance._curSymbol+"' error: '" + event.data.err + "'.");
          // TODO: generate RV?
        }

        if (instance._fnNotify)
        {
          instance._inCallback = true;
          instance._fnNotify (event.data.rv);
          instance._inCallback = false;
        }

        instance._fnNotify = null;
        instance._curSymbol = null;
        break;
    }

    instance._working = false;
  };


  _loadLibrary (this._worker, libName);
}


WebCLAsyncWorker.prototype.close = function ()
{
  if (this._hasLib)
  {
    _unloadLibrary (this._worker);
  }
};


WebCLAsyncWorker.prototype.finish = function (notify, commandQueue)
{
  if (!(this instanceof WebCLAsyncWorker)) throw new Error ("Invalid WebCLAsyncWorker instance.");
  if (!notify || typeof(notify) != "function") throw new TypeError ("'notify' must be a function.");

  if (this.working) throw new Error ("Already working!");
  if (this._fnNotify) throw new Error ("WebCLAsyncWorker.finish: UNEXPECTED: I already have a notify function!");

  this._working = true;
  this._fnNotify = notify;
  this._curSymbol = "clFinish";

  this._worker.postMessage (
    { "cmd":    "call",
      "symbol": this._curSymbol,
      "args":   [ { "type": "voidptr",
                    "value": ctypes.cast(commandQueue, ctypes.intptr_t).value.toString()
                  } ]
    });
};


WebCLAsyncWorker.prototype.waitForEvents = function (notify)
{
  if (!(this instanceof WebCLAsyncWorker)) throw new Error ("Invalid WebCLAsyncWorker instance.");
  if (!notify || typeof(notify) != "function") throw new TypeError ("'notify' must be a function.");

  if (this.working) throw new Error ("Already working!");
  if (this._fnNotify) throw new Error ("WebCLAsyncWorker.finish: UNEXPECTED: I already have a notify function!");

  this._working = true;
  this._fnNotify = notify;
  this._curSymbol = "clWaitForEvents";

  throw new Error ("WebCLAsyncWorker.waitForEvents: TODO");
};


WebCLAsyncWorker.prototype.buildProgram = function (notify)
{
  if (!(this instanceof WebCLAsyncWorker)) throw new Error ("Invalid WebCLAsyncWorker instance.");
  if (!notify || typeof(notify) != "function") throw new TypeError ("'notify' must be a function.");

  if (this.working) throw new Error ("Already working!");
  if (this._fnNotify) throw new Error ("WebCLAsyncWorker.finish: UNEXPECTED: I already have a notify function!");

  this._working = true;
  this._fnNotify = notify;
  this._curSymbol = "clBuildProgram";

  throw new Error ("WebCLAsyncWorker.buildProgram: TODO");
};



function _loadLibrary (worker, libName)
{
  worker.postMessage (
    { "cmd":       "load",
      "libname":   libName
    });
}


function _unloadLibrary (worker)
{
  worker.postMessage (
    { "cmd":       "unload"
    });
}


} catch (e) { ERROR ("webclasyncworkerapi.jsm: " + e + "."); throw e; }

