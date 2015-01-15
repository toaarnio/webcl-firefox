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


var EXPORTED_SYMBOLS = [ "ValidatorAsyncWorker" ];


try {


const Cu = Components.utils;

Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");


function ValidatorAsyncWorker (libName, notify)
{
  TRACE ("ValidatorAsyncWorker", "constructor", arguments);

  if (!(this instanceof ValidatorAsyncWorker)) return new ValidatorAsyncWorker (libName);

  this._worker = new ChromeWorker ("chrome://nrcwebcl/content/workers/validatorasyncworker.js");

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

  // Currently active command. Available if this.working == true.
  this._currentCommand = null;


  var instance = this;
  this._worker.onmessage = function (event)
  {
    var notifyReplyData = null;

    DEBUG ("ValidatorAsyncWorker onmessage  cmd='"+event.data.cmd + "'");
    switch (event.data.cmd)
    {
      case "load":
        if (event.data.err)
        {
          ERROR ("ValidatorAsyncWorker command 'load' failed. error: '" + event.data.err + "'.");
        }
        else
        {
          instance._hasLib = true;
        }
        notifyReplyData = event.data.err;
        break;

      case "unload":
        if (event.data.err)
        {
          ERROR ("ValidatorAsyncWorker command 'unload' failed. error: '" + event.data.err + "'.");
        }
        instance._hasLib = false;
        notifyReplyData = event.data.err;
        break;

      case "close":
        if (event.data.err)
        {
          ERROR ("ValidatorAsyncWorker command 'close' failed. error: '" + event.data.err + "'.");
        }
        instance._worker = null;
        notifyReplyData = event.data.err;
        break;

      case "validate":
        let programdata = undefined;
        if (event.data.err)
        {
          ERROR ("ValidatorAsyncWorker command 'validate' failed. error: '" + event.data.err + "'.");
          // TODO: generate RV?
        }
        else
        {
          programdata = ctypes.cast(ctypes.intptr_t(event.data.program), ctypes.voidptr_t);
        }
        notifyReplyData = { err: event.data.err,
                            program: programdata };
        break;

      case "text":
        {
          switch (event.data.type)
          {
            case "info":  INFO(event.data.detail); break;
            case "log":   LOG(event.data.detail); break;
            case "error": ERROR(event.data.detail); break;
            case "debug": DEBUG(event.data.detail); break;
          }
        }
        // Ensure text messages don't tamper worker state!
        return;
        break;

      default:
        ERROR ("ValidatorAsyncWorker: unknown command '" + event.data.cmd + "'.");
        break;
    }

    instance._working = false;

    let fnNotify = instance._fnCurrentNotify;
    instance._fnCurrentNotify = null;
    if (fnNotify)
    {
      instance._inCallback = true;
      fnNotify (notifyReplyData);
      instance._inCallback = false;
    }

    // Cleanup for next command
    instance._currentCommand = null;
  };


  this._loadLibrary (libName, notify);
}


ValidatorAsyncWorker.prototype.validate = function (source, extensions, userDefines, notify)
{
  TRACE ("ValidatorAsyncWorker", "validate", arguments);

  if (!(this instanceof ValidatorAsyncWorker)) throw new Error ("Invalid ValidatorAsyncWorker instance.");
  if (!notify || typeof(notify) != "function") throw new TypeError ("'notify' must be a function.");

  if (this.working) throw new Error ("Already working!");

  this._working = true;
  this._fnCurrentNotify = notify;
  this._currentCommand = "validate";

  this._worker.postMessage (
    { cmd:         this._currentCommand,
      source:      source,
      extensions:  extensions,
      userDefines: userDefines
    });
};


// Unload library and close worker
ValidatorAsyncWorker.prototype.close = function (notify)
{
  TRACE ("ValidatorAsyncWorker", "close", arguments);

  if (!(this instanceof ValidatorAsyncWorker)) throw new Error ("Invalid ValidatorAsyncWorker instance.");
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


ValidatorAsyncWorker.prototype._loadLibrary = function (libName, notify)
{
  TRACE ("ValidatorAsyncWorker", "_loadLibrary", arguments);

  if (!(this instanceof ValidatorAsyncWorker)) throw new Error ("Invalid ValidatorAsyncWorker instance.");
  if (!notify || typeof(notify) != "function") throw new TypeError ("'notify' must be a function.");

  this._working = true;
  this._fnCurrentNotify = notify;
  this._currentCommand = "load";

  this._worker.postMessage (
    { cmd:       this._currentCommand,
      libname:   libName
    });
}



ValidatorAsyncWorker.prototype._unloadLibrary = function (notify)
{
  TRACE ("ValidatorAsyncWorker", "_unloadLibrary", arguments);

  if (!(this instanceof ValidatorAsyncWorker)) throw new Error ("Invalid ValidatorAsyncWorker instance.");
  if (!notify || typeof(notify) != "function") throw new TypeError ("'notify' must be a function.");

  this._working = true;
  this._fnCurrentNotify = notify;
  this._currentCommand = "unload";

  this._worker.postMessage (
    { cmd:       this._currentCommand
    });
}



} catch (e) { ERROR ("validatorasyncworkerapi.jsm:\n" + e + "\n" + e.stack); throw e; }
