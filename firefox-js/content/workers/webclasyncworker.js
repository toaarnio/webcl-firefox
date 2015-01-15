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


try {


var ENABLE_DEBUG = false;
var ENABLE_CONSOLE = false;


var puts = null;
if (ENABLE_CONSOLE) {
  let libc = ctypes.open("libc.so.6");
  puts = libc.declare("puts", ctypes.default_abi, ctypes.int, ctypes.char.ptr);
}
function ERROR(msg) {
  console.log ("WebCLAsyncWorker  ERROR: " + msg);
  if (puts) puts("WebCLAsyncWorker  ERROR: " + msg);
}
function DEBUG(msg) {
  if (ENABLE_DEBUG)
  {
    console.log("WebCLAsyncWorker  DEBUG: " + msg);
    if (puts) puts("WebCLAsyncWorker  DEBUG: " + msg);
  }
}



var gLibHandle = null;



function loadCLLibrary (libName)
{
  if (!libName)
  {
    // Select platform-specific default OpenCL library name
    // See: http://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
    if (navigator.platform.startsWith("Linux"))
    {
      libName = "libOpenCL.so";
    }
    else if (navigator.platform.startsWith("Win"))
    {
      libName = "OpenCL.dll";
    }
    else if (navigator.platform == "MacIntel")
    {
      libName = "/System/Library/Frameworks/OpenCL.framework/OpenCL";
    }
    else
    {
      throw new Error ("Unsupported platform: " + navigator.platform);
    }
  }

  let lib = ctypes.open (libName);
  return lib;
}



function closeCLLibrary (handle)
{
  handle.close ();
}



function importArgs (args)
{
  if (!Array.isArray(args)) throw new TypeError ("args is not an Array.");

  return args.map (
          function (cur, idx)
          {
            DEBUG ("  converting arg " + idx + "  " + JSON.stringify(cur));
            switch (cur.type)
            {
              case "int32":
                return ctypes.int32_t(+cur.value);
                break;

              case "uint32":
                return ctypes.uint32_t(+cur.value);
                break;

              case "voidptr":
                return ctypes.cast(ctypes.intptr_t(cur.value), ctypes.voidptr_t);
                break;

              case "charptr":
                return cur.value;
                break;

              default:
                throw new TypeError("Failed to convert arg at index " + idx + ": unknown type " + cur.type + ".");
            }
          });
}



function callSymbol (data)
{
  if (!gLibHandle) throw new Error ("Invalid library handle. cmd="+data.cmd+", symbol="+data.symbol);
  if (!data || typeof(data) != "object") throw new Error ("Invalid data!");

  // data.symbol: Symbol name, String
  // data.args  : Array of CData values stored as String

  let args = importArgs (data.args);

  let fn = null;

  DEBUG ("symbol="+data.symbol);
  switch (data.symbol)
  {
    case "clFinish":
      // rv:   T.cl_int
      // args: T.cl_command_queue
      fn = gLibHandle.declare (data.symbol, ctypes.default_abi,
                               ctypes.int32_t,
                               ctypes.voidptr_t);
      break;

    case "clWaitForEvents":
      // rv:   T.cl_int
      // args: T.cl_uint, T.cl_event.ptr
      fn = gLibHandle.declare (data.symbol, ctypes.default_abi,
                               ctypes.int32_t,
                               ctypes.uint32_t, ctypes.voidptr_t);
      break;

    case "clBuildProgram":
      // rv:   T.cl_int,
      // args: T.cl_program, T.cl_uint, T.cl_device_id.ptr, T.char.ptr, T.callback_buildProgram.ptr, T.voidptr_t
      fn = gLibHandle.declare (data.symbol, ctypes.default_abi,
                               ctypes.int32_t,
                               ctypes.voidptr_t, ctypes.uint32_t, ctypes.voidptr_t,
                               ctypes.char.ptr, ctypes.voidptr_t, ctypes.voidptr_t);
      break;

    case "clSetEventCallback":
      // rv:   T.cl_int,
      // args: [ T.cl_event, T.cl_int, T.callback_event.ptr, T.voidptr_t ]
      fn = gLibHandle.declare (data.symbol, ctypes.default_abi,
                               ctypes.int32_t,
                               ctypes.voidptr_t, ctypes.int32_t,
                               ctypes.voidptr_t, ctypes.voidptr_t);
      break;

    default:
      throw new Error ("Invalid symbol ID \"" + data.symbol + "\".");
      break;
  }

  DEBUG("Calling " + data.symbol);

  data.rv = fn.apply (null, args);

  DEBUG(data.symbol + " finished, rv=" + data.rv);
}



onmessage = function (event)
{
  DEBUG ("onmessage  cmd='"+event.data.cmd+"'");
  try
  {
    if (!event.isTrusted) {
      ERROR ("Untrusted event received! data="+event.data);
      return;
    }

    if (event.data)
    {
      let cmd = event.data.cmd;
      event.data.err = null;
      event.data.rv = 0;

      let doClose = false;

      switch (cmd)
      {
        case "load":
          DEBUG ("Loading OpenCL library " + event.data.libname);
          gLibHandle = loadCLLibrary (event.data.libname);
          break;

        case "unload":
          if (gLibHandle)
          {
            if (gLibHandle)
            {
              DEBUG ("Closing OpenCL library.");
              closeCLLibrary (gLibHandle);
            }
            gLibHandle = null;
          }
          break;

        case "close":
          if (gLibHandle)
          {
            if (gLibHandle)
            {
              DEBUG ("Closing OpenCL library.");
              closeCLLibrary (gLibHandle);
            }
            gLibHandle = null;
          }

          // Request this worker to close
          doClose = true;
          break;

        case "call":
          callSymbol (event.data);
          // Note: callSymbol sets event.data.rv
          break;

        default:
          event.data.err = "Unknown command '" + cmd + "'."
          ERROR (event.data.err);
          break;
      }

      postMessage(event.data);

      if (doClose)
      {
        DEBUG ("Closing worker.");
        self.close ();
      }
    }
  }
  catch (e)
  {
    ERROR (e);
    event.data.err = String(e);
    postMessage (event.data);
  }
}



} catch(e) { ERROR ("webclasyncworker.js: "+e+"\n"+e.stack); }


