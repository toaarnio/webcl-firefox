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

Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");



function WebCLAsyncWorker (libName, notify)
{
  TRACE ("WebCLAsyncWorker", "constructor", arguments);

  if (!(this instanceof WebCLAsyncWorker)) return new WebCLAsyncWorker (libName);

  this._worker = new ChromeWorker ("chrome://nrcwebcl/content/workers/webclasyncworker.js");

  this._hasLib = false;

  // property: working
  this._working = false;
  this.__defineGetter__("working", function () { return !!this._working; });
  this.__defineSetter__("working", function () { throw new Error ("'working' is read only."); });

  // property: inCallback
  this._inCallback = false;
  this.__defineGetter__("inCallback", function () { return !!this._inCallback; });
  this.__defineSetter__("inCallback", function () { throw new Error ("'inCallback' is read only."); });


  // Current notify callback.
  this._fnCurrentNotify = null;

  // Current command specific context. Generally and object that holds any
  // command specific data and a reference to any objects that must not be
  // GC'ed before the command completes.
  this._currentContext = null;

  // Currently active command. Available if this.working == true.
  this._currentCommand = null;

  // For command 'call': current symbol name.
  this._currentSymbol = null;


  var instance = this;
  this._worker.onmessage = function (event)
  {
    DEBUG ("WebCLAsyncWorker onmessage  cmd='"+event.data.cmd + "' symbol='"+event.data.symbol + "'");
    switch (event.data.cmd)
    {
      case "load":
        if (event.data.err)
        {
          ERROR ("WebCLAsyncWorker command 'load' failed. error: '" + event.data.err + "'.");
        }
        else
        {
          instance._hasLib = true;
        }
        break;

      case "unload":
        if (event.data.err)
        {
          ERROR ("WebCLAsyncWorker command 'unload' failed. error: '" + event.data.err + "'.");
        }
        instance._hasLib = false;
        break;

      case "close":
        if (event.data.err)
        {
          ERROR ("WebCLAsyncWorker command 'close' failed. error: '" + event.data.err + "'.");
        }
        instance._worker = null;
        break;

      case "call":
        if (event.data.err)
        {
          ERROR ("WebCLAsyncWorker command 'call' failed. symbol: '"+instance._currentSymbol+"' error: '" + event.data.err + "'.");
          // TODO: generate RV?
        }
        break;

      default:
        ERROR ("WebCLAsyncWorker: unknown command '" + event.data.cmd + "'.");
        break;
    }

    instance._working = false;

    let fnNotify = instance._fnCurrentNotify;
    instance._fnCurrentNotify = null;
    if (fnNotify)
    {
      instance._inCallback = true;
      fnNotify (event.data.err);
      instance._inCallback = false;
    }

    // Cleanup for next command
    instance._currentCommand = null;
    instance._currentSymbol = null;

  };


  this._loadLibrary (libName, notify);
}



// Unload library and close worker
WebCLAsyncWorker.prototype.close = function (notify)
{
  TRACE ("WebCLAsyncWorker", "close", arguments);

  if (!(this instanceof WebCLAsyncWorker)) throw new Error ("Invalid WebCLAsyncWorker instance.");
  if (!notify || typeof(notify) != "function") notify = new Function ();

  var instance = this;
  this._unloadLibrary (function ()
                       {
                         instance._fnCurrentNotify = notify;
                         instance._working = true;
                         instance._currentCommand = "close";
                         instance._worker.postMessage ({ cmd: instance._currentCommand });
                       });
};



WebCLAsyncWorker.prototype.finish = function (commandQueue, notify)
{
  TRACE ("WebCLAsyncWorker", "finish", arguments);

  if (!(this instanceof WebCLAsyncWorker)) throw new Error ("Invalid WebCLAsyncWorker instance.");
  if (!notify || typeof(notify) != "function") throw new TypeError ("'notify' must be a function.");

  if (this.working) throw new Error ("Already working!");

  this._working = true;
  this._fnCurrentNotify = notify;
  this._currentCommand = "call";
  this._currentSymbol = "clFinish";

  this._worker.postMessage (
    { cmd:    this._currentCommand,
      symbol: this._currentSymbol,
      args:   [ { "type": "voidptr",
                  "value": ctypes.cast(commandQueue._internal, ctypes.intptr_t).value.toString()
                } ]
    });
};



WebCLAsyncWorker.prototype.waitForEvents = function (eventList, notify)
{
  TRACE ("WebCLAsyncWorker", "waitForEvents", arguments);

  if (!(this instanceof WebCLAsyncWorker)) throw new Error ("Invalid WebCLAsyncWorker instance.");
  if (!notify || typeof(notify) != "function") throw new TypeError ("'notify' must be a function.");

  if (this.working) throw new Error ("Already working!");

  this._working = true;
  this._fnCurrentNotify = notify;
  this._currentCommand = "call";
  this._currentSymbol = "clWaitForEvents";

  let clNumEvents = 0;
  let clEventArray = null;
  let clEventArrayPtr = null;

  if (eventList && eventList.length > 0)
  {
    clNumEvents = eventList.length;
    clEventArray = ctypes.voidptr_t.array(clNumEvents)();

    for (var i = 0; i < clNumEvents; ++i)
    {
      clEventArray[i] = eventList[i]._internal;
    }
    clEventArrayPtr = ctypes.cast (clEventArray.address(), ctypes.voidptr_t);
  }

  // Hold reference to clEventArray
  this._currentContext = { eventArray: clEventArray };

  this._worker.postMessage (
    { cmd:    this._currentCommand,
      symbol: this._currentSymbol,
      args:   [
                { type: "uint32", value: clNumEvents },
                { type: "voidptr", value: ctypes.cast(clEventArrayPtr, ctypes.intptr_t).value.toString() }
              ]
    });
};



WebCLAsyncWorker.prototype.buildProgram = function (program, devices, options, notify)
{
  TRACE ("WebCLAsyncWorker", "buildProgram", arguments);

  if (!(this instanceof WebCLAsyncWorker)) throw new Error ("Invalid WebCLAsyncWorker instance.");
  if (!notify || typeof(notify) != "function") throw new TypeError ("'notify' must be a function.");

  if (this.working) throw new Error ("Already working!");

  this._working = true;
  this._fnCurrentNotify = notify;
  this._currentCommand = "call";
  this._currentSymbol = "clBuildProgram";

  let clProgramPtr = program._internal;
  let clNumDevices = 0;
  let clDeviceArray = null;
  let clDeviceArrayPtr = null;

  if (devices && devices.length > 0)
  {
    clNumDevices = devices.length;
    clDeviceArray = ctypes.voidptr_t.array(clNumDevices)();

    for (var i = 0; i < clNumDevices; ++i)
    {
      clDeviceArray[i] = devices[i]._internal;
    }

    clDeviceArrayPtr = ctypes.cast (clDeviceArray.address(), ctypes.intptr_t).value.toString();
  }

  // Hold reference to clDeviceArray
  this._currentContext = { deviceArray: clDeviceArray }

  this._worker.postMessage (
    { cmd:    this._currentCommand,
      symbol: this._currentSymbol,
      args:   [
                { type: "voidptr", value: ctypes.cast(clProgramPtr, ctypes.intptr_t).value.toString() },
                { type: "uint32", value: clNumDevices },
                { type: "voidptr", value: clDeviceArrayPtr },
                { type: "charptr", value: String(options) },
                // NOTE: notify callback and user data are always null since we're
                // implementing async mode using worker.
                { type: "voidptr", value: 0 },
                { type: "voidptr", value: 0 }
              ]
    });
};



WebCLAsyncWorker.prototype._loadLibrary = function (libName, notify)
{
  TRACE ("WebCLAsyncWorker", "_loadLibrary", arguments);

  if (!(this instanceof WebCLAsyncWorker)) throw new Error ("Invalid WebCLAsyncWorker instance.");
  if (!notify || typeof(notify) != "function") throw new TypeError ("'notify' must be a function.");

  this._working = true;
  this._fnCurrentNotify = notify;
  this._currentCommand = "load";

  this._worker.postMessage (
    { cmd:       this._currentCommand,
      libname:   libName
    });
}



WebCLAsyncWorker.prototype._unloadLibrary = function (notify)
{
  TRACE ("WebCLAsyncWorker", "_unloadLibrary", arguments);

  if (!(this instanceof WebCLAsyncWorker)) throw new Error ("Invalid WebCLAsyncWorker instance.");
  if (!notify || typeof(notify) != "function") throw new TypeError ("'notify' must be a function.");

  this._working = true;
  this._fnCurrentNotify = notify;
  this._currentCommand = "unload";

  this._worker.postMessage (
    { cmd:       this._currentCommand
    });
}




} catch (e) { ERROR ("webclasyncworkerapi.jsm:\n" + e + "\n" + e.stack); throw e; }

