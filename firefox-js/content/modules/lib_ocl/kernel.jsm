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

Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/common.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_types.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_symbols.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_getinfo.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_exception.jsm");

function loadLazyModules ()
{
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/context.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/program.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/memoryobject.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/sampler.jsm");

  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_common.jsm");
}


} catch(e) { ERROR ("kernel.jsm failed to load modules: " + EXCEPTIONSTR(e) + "."); throw e; }
try {


function Kernel (internal, lib)
{
  if (!(this instanceof Kernel)) return new Kernel (internal);
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

  var clDevice = (device === null)? null : device._internal;
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
                            clDevice).value;
        rv = ctypes.UInt64.lo (rv);
        break;

      // [size_t]
      case ocl_info.CL_KERNEL_COMPILE_WORK_GROUP_SIZE: // size_t[3]
        rv = getInfo_array (this._lib.clGetKernelWorkGroupInfo, this._internal,
                            name, T.size_t,
                            clDevice);
        for (var i in rv) rv[i] = ctypes.UInt64.lo (rv[i]);
        break;

      // cl_ulong
      case ocl_info.CL_KERNEL_LOCAL_MEM_SIZE:
      case ocl_info.CL_KERNEL_PRIVATE_MEM_SIZE:
        rv = getInfo_plain (this._lib.clGetKernelWorkGroupInfo, this._internal,
                            name, T.cl_ulong,
                            clDevice).value;
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

  if (typeof(value) === 'number' && !isNaN(+value) && +value >= 0)
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
  else {
    let tmp = typedArrayToCTypesPtr(value);
    ptr = tmp.ptr;
    size = tmp.size;
  }

  var err = this._lib.clSetKernelArg (this._internal, +index, size, ptr);
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
