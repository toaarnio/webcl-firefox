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


var EXPORTED_SYMBOLS = [ "WebCLCallbackWorker" ];


try {

  const Cu = Components.utils;

  Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/common.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/webclutils.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/base.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_exception.jsm");
  Cu.import ("resource://gre/modules/ctypes.jsm");


  var gCbId = 0;

  // Generate 32-bit unsigned value that increases on each call and wraps on overflow.
  function getUInt32CallbackId ()
  {
    let t = new Uint32Array([gCbId]);
    ++t[0];
    gCbId = t[0];
    return gCbId;
  }


  function WebCLCallbackWorker (ctorNotify)
  {
    TRACE ("WebCLCallbackWorker", "constructor", arguments);

    this._worker = new ChromeWorker ("chrome://nrcwebcl/content/workers/webclcallbackworker.js");
    this._hasLib = false;
    this._callbacks = {};
    this._pendingCloseCallbacks = [];


    let instance = this;
    this._worker.onmessage = function (event)
    {
//INFO ("WebCLCallbackWorker onmessage  cmd='"+event.data.cmd + "'");
      DEBUG ("WebCLCallbackWorker onmessage  cmd='"+event.data.cmd + "'");
      switch (event.data.cmd)
      {
        case "load": {
          if (event.data.err) {
            ERROR ("WebCLCallbackWorker command 'load' failed. error: '" + event.data.err + "'.");
          }
          else {
            instance._hasLib = true;
          }

          if (ctorNotify && typeof(ctorNotify) == "function") {
            ctorNotify (event.data.err);
          }
          break;
        }

        case "close": {
          if (event.data.err) {
            ERROR ("WebCLCallbackWorker command 'close' failed. error: '" + event.data.err + "'.");
          }
          instance._hasLib = false;
          instance._worker = null;

          // Clear pending close callbacks
          let list = Array.prototype.splice.call (this._pendingCloseCallbacks, 0);

          for (let i in list){
            list[i].fn.call ();
          }

          break;
        }

        case "setEventCallback": {
          if (event.data.err) {
            ERROR ("WebCLCallbackWorker command 'setEventCallback' failed. error: '" + event.data.err + "'.");
          }
          break;
        }

        case "callback": {
          if (event.data.err) {
            ERROR ("WebCLCallbackWorker callback failed. error: '" + event.data.err + "'.");
          }
          else {
            let id = event.data.id;
            if (id in instance._callbacks)
            {
              try {
                let cb = instance._callbacks[id];
                delete instance._callbacks[id];

                // Call the callback
                cb.fn.call (cb.ctx);
              }
              catch (e) {
                let s = (e&&stack ? "\n"+e.stack : "");
                ERROR ("WebCLCallbackWorker failed to invoke callback with ID '"+id+"':\n"+
                       e+s);
              }
              delete instance._callbacks[id];
            }
            else
            {
              // Unknown callback: ignored
              ERROR ("WebCLCallbackWorker received unknown callback with ID '"+id+"'.");
            }
          }
          break;
        }

      }
    };


    let libName = webclutils.getPref_openclLib (false);
    if (!libName)
    {
      switch (getRuntimeOS ())
      {
        default:
        case "Linux":
          libName = "libOpenCL.so";
          break;
        case "WINNT":
          libName = "OpenCL.dll";
          break;
        case "Darwin":
          libName = "/System/Library/Frameworks/OpenCL.framework/OpenCL";
          break;
      }
    }

    // Load library. When done, ctorNotify is called from onmessage handler.
    this._worker.postMessage (
      { cmd:       "load",
        libname:   libName
      });
  }


  WebCLCallbackWorker.prototype.close = function (notify)
  {
    if (notify && typeof(notify) == "function") {
      this._pendingCloseCallbacks.push (notify)
    }

    this._worker.postMessage ({ cmd: "close" });
  }


  WebCLCallbackWorker.prototype.setEventCallback = function (event, commandExecCallbackType, callback, ctx)
  {
    const MAX_ID_GENERATION_RETRIES = 10;

    let callbackId = getUInt32CallbackId(),
        clEventPtr;

    if (event instanceof Base) {
      // Assume event is WebCLEvent
      clEventPtr = event._internal._internal;
    }
    else {
      // Assume event is libOcl wrapper Event
      clEventPtr = event._internal;
    }

    for (var i = 0; (callbackId in this._callbacks) && i < MAX_ID_GENERATION_RETRIES; ++i) {
      callbackId = getUInt32CallbackId();
    }
    if (i == MAX_ID_GENERATION_RETRIES) {
      ERROR ("WebCLCallbackWorker failed to generate callback ID.");
      throw new CLInternalError();
    }

    this._callbacks[callbackId] = { fn: callback, ctx: ctx };

    this._worker.postMessage (
      {
        cmd: "setEventCallback",
        event: ctypes.cast(clEventPtr, ctypes.intptr_t).value.toString(),
        callbackType: +commandExecCallbackType,
        callbackId: callbackId
      });
  }


} catch (e) { ERROR ("webclcallbackworkerapi.jsm:\n" + e + "\n" + e.stack); throw e; }
