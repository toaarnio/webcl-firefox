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

  //if (value instanceof Int8Array)
  if (className == "Int8Array")
  {
    //ptr = ctypes.int8_t.ptr (value);
    ptr = ctypes.voidptr_t (value.buffer);
    size = value.length * value.BYTES_PER_ELEMENT;
  }
  //else if (value instanceof Uint8Array)
  else if (className == "Uint8Array")
  {
    //ptr = ctypes.uint8_t.ptr (value);
    ptr = ctypes.voidptr_t (value.buffer);
    size = value.length * value.BYTES_PER_ELEMENT;
  }
  //else if (value instanceof Uint8ClampedArray)
  else if (className == "Uint8ClampedArray")
  {
    //ptr = ctypes.uint8_t.ptr (value);
    ptr = ctypes.voidptr_t (value.buffer);
    size = value.length * value.BYTES_PER_ELEMENT;
  }
  //else if (value instanceof Int16Array)
  else if (className == "Int16Array")
  {
    //ptr = ctypes.int16_t.ptr (value);
    ptr = ctypes.voidptr_t (value.buffer);
    size = value.length * value.BYTES_PER_ELEMENT;
  }
  //else if (value instanceof Uint16Array)
  else if (className == "Uint16Array")
  {
    //ptr = ctypes.uint16_t.ptr (value);
    ptr = ctypes.voidptr_t (value.buffer);
    size = value.length * value.BYTES_PER_ELEMENT;
  }
  //else if (value instanceof Int32Array)
  else if (className == "Int32Array")
  {
    //ptr = ctypes.int32_t.ptr (value);
    ptr = ctypes.voidptr_t (value.buffer);
    size = value.length * value.BYTES_PER_ELEMENT;
  }
  //else if (value instanceof Uint32Array)
  else if (className == "Uint32Array")
  {
    //ptr = ctypes.uint32_t.ptr (value);
    ptr = ctypes.voidptr_t (value.buffer);
    size = value.length * value.BYTES_PER_ELEMENT;
  }
  //else if (value instanceof Float32Array)
  else if (className == "Float32Array")
  {
    //ptr = ctypes.float.ptr (value);
    ptr = ctypes.voidptr_t (value.buffer);
    size = value.length * value.BYTES_PER_ELEMENT;
  }
  //else if (value instanceof Float64Array)
  else if (className == "Float64Array")
  {
    //ptr = ctypes.double.ptr (value);
    ptr = ctypes.voidptr_t (value.buffer);
    size = value.length * value.BYTES_PER_ELEMENT;
  }
  //else if (value instanceof ArrayBuffer)
  else if (className == "ArrayBuffer")
  {
    ptr = T.voidptr_t (value);
    size = value.byteLength;
  }
  else
  {
    throw new CLInvalidArgument ("");
  }

  return { ptr: ptr, size: size };
}

