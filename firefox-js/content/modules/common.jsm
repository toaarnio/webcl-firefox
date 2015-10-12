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


// Functionality shared between WebCL and lib_ocl


var EXPORTED_SYMBOLS =
[ "getRuntimeABI", "getRuntimeOS", "typedArrayToCTypesPtr"
];


const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var Exception = Components.Exception;


Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_exception.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");


var console = Cu.import("resource://gre/modules/devtools/Console.jsm", {}).console;


function getRuntimeABI ()
{
  var xulRuntime = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime);
  return xulRuntime.XPCOMABI;
}


function getRuntimeOS ()
{
  var xulRuntime = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime);
  return xulRuntime.OS;
}


function typedArrayToCTypesPtr (value)
{
  var ptr = null, size = 0;

  if (value.wrappedJSObject) value = value.wrappedJSObject;

  // NOTE: instanceof doesn't work when the object originates from different
  //       context or something. E.g. (value instanceof Int8Array) produces
  //       false even though value.toString() gives "[object Int8Array]".
  //       Workaround is to extract type name and compare against that.

  if (typeof(value) == "object")
  {
    var className = Object.prototype.toString.call(value).substr(8);
    className = className.substring(0, className.lastIndexOf("]"));
  }

  switch(className) {
    case "Int8Array":
    case "Uint8Array":
    case "Uint8ClampedArray":
    case "Int16Array":
    case "Uint16Array":
    case "Int32Array":
    case "Uint32Array":
    case "Float32Array":
    case "Float64Array":
      // ptr = value.buffer;
      // size = value.byteLength;
      // break;
    case "ArrayBuffer":
      ptr = value;
      size = value.byteLength;
      break;
  default:
    throw new CLInvalidArgument ("value", null, "Kernel.setArg");
  }

  return { ptr: ptr, size: size };
}
