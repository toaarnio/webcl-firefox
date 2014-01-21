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


var EXPORTED_SYMBOLS = [ "Kernel" ];


try {

const Cu = Components.utils;

Cu.import ("resource://nrcwebcl/modules/logger.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_types.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_symbols.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_getinfo.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");

function loadLazyModules ()
{
  Cu.import ("resource://nrcwebcl/modules/lib_ocl/context.jsm");
  Cu.import ("resource://nrcwebcl/modules/lib_ocl/program.jsm");
  Cu.import ("resource://nrcwebcl/modules/lib_ocl/memoryobject.jsm");
  Cu.import ("resource://nrcwebcl/modules/lib_ocl/sampler.jsm");

  Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_common.jsm");
}


} catch(e) { ERROR ("kernel.jsm failed to load modules: " + EXCEPTIONSTR(e) + "."); throw e; }
try {


function Kernel (internal, lib)
{
  if (!this instanceof Kernel) return new Kernel (internal);
  loadLazyModules ();

  this.classDescription = "Kernel";
  TRACE (this, "Kernel", arguments);

  this._internal = internal || null;
  this._lib = lib || null;
}


Kernel.prototype.getIdentity = function ()
{
  TRACE (this, "getIdentity", arguments);
  return ocl_common.getObjectIdentity (this);
}


Kernel.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);

  var rv;

  try
  {
    switch (name)
    {
      // String
      case ocl_info.CL_KERNEL_FUNCTION_NAME:
        rv = getInfo_string (this._lib.clGetKernelInfo, this._internal, name);
        break;

      // cl_uint
      case ocl_info.CL_KERNEL_NUM_ARGS:
      case ocl_info.CL_KERNEL_REFERENCE_COUNT:
        rv = getInfo_plain (this._lib.clGetKernelInfo, this._internal, name, T.cl_uint).value;
        break;

      // cl_context
      case ocl_info.CL_KERNEL_CONTEXT:
        var p = getInfo_plain (this._lib.clGetKernelInfo, this._internal, name, T.cl_context);
        rv = new Context (p, this._lib);
        break;

      // cl_program
      case ocl_info.CL_KERNEL_PROGRAM:
        var p = getInfo_plain (this._lib.clGetKernelInfo, this._internal, name, T.cl_program);
        rv = new Program (p, this._lib);
        break;

      default:
        throw new CLUnsupportedInfo (name, null, "Kernel.getInfo");
    }
  }
  catch (e)
  {
    if (e instanceof CLException)
    {
      e.context = "Kernel.getInfo";
    }
    throw e;
  }

  return rv;
};


Kernel.prototype.getWorkGroupInfo = function (device, name)
{
  TRACE (this, "getWorkGroupInfo", arguments);

  // TODO: Kernel.getWorkGroupInfo: validate device
  var rv;

  try
  {
    switch (name)
    {
      // size_t
      case ocl_info.CL_KERNEL_WORK_GROUP_SIZE:
      case ocl_info.CL_KERNEL_PREFERRED_WORK_GROUP_SIZE_MULTIPLE:
        rv = getInfo_plain (this._lib.clGetKernelWorkGroupInfo, this._internal,
                            name, T.size_t,
                            device._internal).value;
        rv = ctypes.UInt64.lo (rv);
        break;

      // [size_t]
      case ocl_info.CL_KERNEL_COMPILE_WORK_GROUP_SIZE: // size_t[3]
        rv = getInfo_array (this._lib.clGetKernelWorkGroupInfo, this._internal,
                            name, T.size_t,
                            device._internal);
        for (var i in rv) rv[i] = ctypes.UInt64.lo (rv[i]);
        break;

      // cl_ulong
      case ocl_info.CL_KERNEL_LOCAL_MEM_SIZE:
      case ocl_info.CL_KERNEL_PRIVATE_MEM_SIZE:
        rv = getInfo_plain (this._lib.clGetKernelWorkGroupInfo, this._internal,
                            name, T.cl_ulong,
                            device._internal).value;
        rv = ctypes.UInt64.lo (rv);
        break;

      default:
        throw new CLUnsupportedInfo (name, null, "Kernel.getWorkGroupInfo");
    }
  }
  catch (e)
  {
    if (e instanceof CLException)
    {
      e.context = "Kernel.getWorkGroupInfo";
    }
    throw e;
  }

  return rv;
};


// index: (Number)
// value: (MemoryObject | Sampler | ArrayBufferView | ArrayBuffer | Number)
//        Note: if value is Number, it's treated as integer local arg size.
Kernel.prototype.setArg = function (index, value)
{
  TRACE (this, "setArg", arguments);

  if (isNaN(+index)) throw new CLInvalidArgument ("index", null, "Kernel.setArg");

  var ptr = null, size = 0;

  // NOTE: instanceof doesn't work when the object originates from different
  //       context or something. E.g. (value instanceof Int8Array) produces
  //       false even though value.toString() gives "[object Int8Array]".
  //       Workaround is to extract type name and compare against that.

  if (value && typeof(value) == "object")
  {
    className = Object.prototype.toString.call(value).substr(8);
    className = className.substring(0, className.lastIndexOf("]"));
  }

  if (!isNaN(+value) && +value > 0)
  {
    // If value is a number, assume it's local arg size.
    ptr = new ctypes.voidptr_t (0);
    size = Math.floor(+value);
  }
  else if (value instanceof MemoryObject)
  {
    ptr = value._internal.address();
    size = T.cl_mem.size;
  }
  else if (value instanceof Sampler)
  {
    ptr = value._internal.address();
    size = T.cl_sampler.size;
  }
  //if (value instanceof Int8Array)
  else if (className == "Int8Array")
  {
    ptr = ctypes.voidptr_t (value.buffer);
    size = value.length * value.BYTES_PER_ELEMENT;
  }
  //else if (value instanceof Uint8Array)
  else if (className == "Uint8Array")
  {
    ptr = ctypes.voidptr_t (value.buffer);
    size = value.length * value.BYTES_PER_ELEMENT;
  }
  //else if (value instanceof Uint8ClampedArray)
  else if (className == "Uint8ClampedArray")
  {
    ptr = ctypes.voidptr_t (value.buffer);
    size = value.length * value.BYTES_PER_ELEMENT;
  }
  //else if (value instanceof Int16Array)
  else if (className == "Int16Array")
  {
    ptr = ctypes.voidptr_t (value.buffer);
    size = value.length * value.BYTES_PER_ELEMENT;
  }
  //else if (value instanceof Uint16Array)
  else if (className == "Uint16Array")
  {
    ptr = ctypes.voidptr_t (value.buffer);
    size = value.length * value.BYTES_PER_ELEMENT;
  }
  //else if (value instanceof Int32Array)
  else if (className == "Int32Array")
  {
    ptr = ctypes.voidptr_t (value.buffer);
    size = value.length * value.BYTES_PER_ELEMENT;
  }
  //else if (value instanceof Uint32Array)
  else if (className == "Uint32Array")
  {
    ptr = ctypes.voidptr_t (value.buffer);
    size = value.length * value.BYTES_PER_ELEMENT;
  }
  //else if (value instanceof Float32Array)
  else if (className == "Float32Array")
  {
    ptr = ctypes.voidptr_t (value.buffer);
    size = value.length * value.BYTES_PER_ELEMENT;
  }
  //else if (value instanceof Float64Array)
  else if (className == "Float64Array")
  {
    ptr = ctypes.voidptr_t (value.buffer);
    size = value.length * value.BYTES_PER_ELEMENT;
  }
  //else if (value instanceof ArrayBuffer)
  else if (className == "ArrayBuffer")
  {
    ptr = ctypes.voidptr_t (value);
    size = value.byteLength;
  }
  else
  {
    throw new CLInvalidArgument ("value", null, "Kernel.setArg");
  }

  var err = this._lib.clSetKernelArg (this._internal, +index, size,
                                      ctypes.cast(ptr, ctypes.voidptr_t));
  if (err) throw new CLError (err, null, "Kernel.setArg");
};


Kernel.prototype.retain = function ()
{
  TRACE (this, "retain", arguments);

  var err = this._lib.clRetainKernel (this._internal);
  if (err) throw new CLError (err, null, "Kernel.retain");
};


Kernel.prototype.release = function ()
{
  TRACE (this, "release", arguments);

  var err = this._lib.clReleaseKernel (this._internal);
  if (err) throw new CLError (err, null, "Kernel.release");
};



} catch (e) { ERROR ("kernel.jsm: " + EXCEPTIONSTR(e) + "."); throw e; }
