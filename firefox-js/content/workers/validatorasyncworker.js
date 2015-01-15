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


/*
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
*/



var gLibHandle = null;
var gAddonLocation = null;

/*
function loadLibrary (addonLocation)
{
  if (!addonLocation)
  {
    throw new Error ("WebCL addon location not available.");
  }

  var libName = "";

  // Select platform-specific default library name
  // See: http://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
  if (navigator.platform.startsWith("Linux"))
  {
    libName = addonLocation + "/lib/linux_x86_64/libclv_standalone.so";
  }
  else if (navigator.platform.startsWith("Win"))
  {
    libName = addonLocation + "\lib\libclv_standalone.dll";
  }
  else if (navigator.platform == "MacIntel")
  {
    libName = addonLocation + "/lib/libclv_standalone.dylib";
  }
  else
  {
    throw new Error ("Unsupported platform: " + navigator.platform);
  }

  let lib = ctypes.open (libName);
  return lib;
}
*/
function loadLibrary (libName)
{
  if (!libName)
  {
    throw new Error ("WebCL addon location not available.");
  }
  let lib = ctypes.open (libName);
  return lib;
}


function closeLibrary (handle)
{
  handle.close ();
}


function callValidate (source, extensions, userDefines)
{
  let T_clv_program = ctypes.voidptr_t;
  let T_callback_clv_validate = ctypes.FunctionType(ctypes.default_abi,
                                                    ctypes.void_t,
                                                    [ T_clv_program, ctypes.voidptr_t ]);

  let fn = gLibHandle.declare ("clvValidate",
                               ctypes.default_abi,
                               // RV
                               ctypes.voidptr_t,           // clv_program
                               // args
                               ctypes.char.ptr,            // input_source
                               ctypes.char.ptr.ptr,        // active_extensions
                               ctypes.char.ptr.ptr,        // user_defines
                               T_callback_clv_validate.ptr,// pfn_notify
                               ctypes.voidptr_t,           // notify_data
                               ctypes.int32_t.ptr);        // errcode_ret

  /*
  var notify = function (clv_program, notifyData)
  {
    // notifyData is always null
    postMessage({ "cmd": "validate-cb",
      "program": ctypes.cast(clv_program, ctypes.intptr_t).value.toString()
    });
  };
  // NOTE: notify is not used at the moment.
  */


  var clv_extensions = null;
  var clv_extensions_addr = null;

  // Temporary variable to store c-strings
  var c_extensions = [];

  if (extensions && Array.isArray(extensions) && extensions.length)
  {
    for (let i = 0; i < extensions.length; ++i)
    {
      c_extensions.push (ctypes.char.array()(extensions[i]));
    }
    // Reserve space for strings + null terminator
    clv_extensions = ctypes.char.ptr.array()(c_extensions.length + 1);
    for (let i = 0; i < c_extensions.length; ++i)
    {
      clv_extensions[i] = ctypes.cast(c_extensions[i].address(), ctypes.char.ptr);
    }
    clv_extensions[c_extensions.length] = null;  // terminator

    clv_extensions_addr = ctypes.cast (clv_extensions.address (), ctypes.char.ptr.ptr);
  }

  var clv_userDefines = null;
  var clv_userDefines_addr = null;

  // Temporary variable to store c-strings
  var c_userDefines = [];

  if (userDefines && Array.isArray(userDefines) && userDefines.length)
  {
    for (let i = 0; i < userDefines.length; ++i)
    {
      c_userDefines.push (ctypes.char.array()(userDefines[i]));
    }
    // Reserve space for strings + null terminator
    clv_userDefines = ctypes.char.ptr.array()(c_userDefines.length + 1);
    for (let i = 0; i < c_userDefines.length; ++i)
    {
      clv_userDefines[i] = ctypes.cast(c_userDefines[i].address(), ctypes.char.ptr);
    }
    clv_userDefines[c_userDefines.length] = null;  // terminator

    clv_userDefines_addr = ctypes.cast (clv_userDefines.address(), ctypes.char.ptr.ptr);
  }


  var clErr = new ctypes.int32_t (0);
  var rv_program = fn.call (null, source, //extensions, userDefines,
                            clv_extensions_addr,
                            clv_userDefines_addr,
                            null,  // notify
                            null,  // user data
                            clErr.address());
  return {
    err:     clErr.value,
    program: (rv_program ? ctypes.cast(rv_program, ctypes.intptr_t).value.toString() : null)
  };
}


onmessage = function (event)
{
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
          DEBUG ("Loading validator library, libname=" + event.data.libname);
          gLibHandle = loadLibrary (event.data.libname);
          break;

        case "unload":
          if (gLibHandle)
          {
            if (gLibHandle)
            {
              DEBUG ("Closing validator library.");
              closeLibrary (gLibHandle);
            }
            gLibHandle = null;
          }
          break;

        case "close":
          if (gLibHandle)
          {
            if (gLibHandle)
            {
              DEBUG ("Closing validator library.");
              closeCLLibrary (gLibHandle);
            }
            gLibHandle = null;
          }

          // Request this worker to close
          doClose = true;
          break;

        case "validate":
          var rv = callValidate (event.data.source,
                                 event.data.extensions,
                                 event.data.userDefines);
          event.data.err = rv.err;
          event.data.program = rv.program;
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


function INFO(msg)
{
  postMessage({ cmd: "text", type: "info", detail: String(msg) });
}

function LOG(msg)
{
  postMessage({ cmd: "text", type: "log", detail: String(msg) });
}

function ERROR(msg)
{
  postMessage({ cmd: "text", type: "error", detail: String(msg) });
}

function DEBUG(msg)
{
  postMessage({ cmd: "text", type: "debug", detail: String(msg) });
}


} catch(e) { ERROR ("validatorasyncworker.js: "+e+"\n"+e.stack); }
