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


var EXPORTED_SYMBOLS = [ "Device" ];


try {

const Cu = Components.utils;

Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_types.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_symbols.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_getinfo.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_exception.jsm");

function loadLazyModules ()
{
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/platform.jsm");

  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_common.jsm");
}


} catch(e) { ERROR ("device.jsm failed to load modules: " + EXCEPTIONSTR(e) + "."); throw e; }
try {


function Device (internal, lib)
{
  if (!(this instanceof Device)) return new Device (internal);
  loadLazyModules ();

  this.classDescription = "Device";
  TRACE (this, "Device", arguments);

  this._internal = internal || null;
  this._lib = lib || null;
}


Device.prototype.getIdentity = function ()
{
  TRACE (this, "getIdentity", arguments);
  return ocl_common.getObjectIdentity (this);
}


Device.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);

  var rv;

  try
  {
    switch (name)
    {
      // cl_uint
      case ocl_info.CL_DEVICE_ADDRESS_BITS:
      case ocl_info.CL_DEVICE_GLOBAL_MEM_CACHELINE_SIZE:
      case ocl_info.CL_DEVICE_MAX_CLOCK_FREQUENCY:
      case ocl_info.CL_DEVICE_MAX_COMPUTE_UNITS:
      case ocl_info.CL_DEVICE_MAX_CONSTANT_ARGS:
      case ocl_info.CL_DEVICE_MAX_READ_IMAGE_ARGS:
      case ocl_info.CL_DEVICE_MAX_SAMPLERS:
      case ocl_info.CL_DEVICE_MAX_WORK_ITEM_DIMENSIONS:
      case ocl_info.CL_DEVICE_MAX_WRITE_IMAGE_ARGS:
      case ocl_info.CL_DEVICE_MEM_BASE_ADDR_ALIGN:
      case ocl_info.CL_DEVICE_NATIVE_VECTOR_WIDTH_CHAR:
      case ocl_info.CL_DEVICE_NATIVE_VECTOR_WIDTH_SHORT:
      case ocl_info.CL_DEVICE_NATIVE_VECTOR_WIDTH_INT:
      case ocl_info.CL_DEVICE_NATIVE_VECTOR_WIDTH_LONG:
      case ocl_info.CL_DEVICE_NATIVE_VECTOR_WIDTH_FLOAT:
      case ocl_info.CL_DEVICE_NATIVE_VECTOR_WIDTH_DOUBLE:
      case ocl_info.CL_DEVICE_NATIVE_VECTOR_WIDTH_HALF:
      case ocl_info.CL_DEVICE_PREFERRED_VECTOR_WIDTH_CHAR:
      case ocl_info.CL_DEVICE_PREFERRED_VECTOR_WIDTH_SHORT:
      case ocl_info.CL_DEVICE_PREFERRED_VECTOR_WIDTH_INT:
      case ocl_info.CL_DEVICE_PREFERRED_VECTOR_WIDTH_LONG:
      case ocl_info.CL_DEVICE_PREFERRED_VECTOR_WIDTH_FLOAT:
      case ocl_info.CL_DEVICE_PREFERRED_VECTOR_WIDTH_DOUBLE:
      case ocl_info.CL_DEVICE_PREFERRED_VECTOR_WIDTH_HALF:
      case ocl_info.CL_DEVICE_VENDOR_ID:
      case ocl_info.CL_DEVICE_GLOBAL_MEM_CACHE_TYPE: // T.cl_device_mem_cache_type
      case ocl_info.CL_DEVICE_LOCAL_MEM_TYPE: // T.cl_device_local_mem_type
        rv = getInfo_plain (this._lib.clGetDeviceInfo, this._internal, name, T.cl_uint).value;
        break;

      // cl_bool
      case ocl_info.CL_DEVICE_AVAILABLE:
      case ocl_info.CL_DEVICE_COMPILER_AVAILABLE:
      case ocl_info.CL_DEVICE_ENDIAN_LITTLE:
      case ocl_info.CL_DEVICE_ERROR_CORRECTION_SUPPORT:
      case ocl_info.CL_DEVICE_HOST_UNIFIED_MEMORY:
      case ocl_info.CL_DEVICE_IMAGE_SUPPORT:
        return !!getInfo_plain (this._lib.clGetDeviceInfo, this._internal, name, T.cl_bool).value;
        break;

      // cl_ulong (truncated to 52 low-order bits)
      case ocl_info.CL_DEVICE_GLOBAL_MEM_CACHE_SIZE:
      case ocl_info.CL_DEVICE_GLOBAL_MEM_SIZE:
      case ocl_info.CL_DEVICE_LOCAL_MEM_SIZE:
      case ocl_info.CL_DEVICE_MAX_CONSTANT_BUFFER_SIZE:
      case ocl_info.CL_DEVICE_MAX_MEM_ALLOC_SIZE:
        rv = getInfo_plain (this._lib.clGetDeviceInfo, this._internal, name, T.cl_ulong).value;
        rv = 0x100000000 * (ctypes.UInt64.hi(rv) & 0xfffff) + ctypes.UInt64.lo(rv);
        break;

      // size_t
      case ocl_info.CL_DEVICE_IMAGE2D_MAX_HEIGHT:
      case ocl_info.CL_DEVICE_IMAGE2D_MAX_WIDTH:
      case ocl_info.CL_DEVICE_IMAGE3D_MAX_DEPTH:
      case ocl_info.CL_DEVICE_IMAGE3D_MAX_HEIGHT:
      case ocl_info.CL_DEVICE_IMAGE3D_MAX_WIDTH:
      case ocl_info.CL_DEVICE_MAX_PARAMETER_SIZE:
      case ocl_info.CL_DEVICE_MAX_WORK_GROUP_SIZE:
      case ocl_info.CL_DEVICE_PROFILING_TIMER_RESOLUTION:
        rv = getInfo_plain (this._lib.clGetDeviceInfo, this._internal, name, T.size_t).value;
        rv = ctypes.UInt64.lo (rv);
        break;

      // bitfield
      case ocl_info.CL_DEVICE_DOUBLE_FP_CONFIG: // T.cl_device_fp_config;
      case ocl_info.CL_DEVICE_EXECUTION_CAPABILITIES: // T.cl_device_exec_capabilities;
      case ocl_const.CL_DEVICE_HALF_FP_CONFIG: // T.cl_device_fp_config;
      case ocl_info.CL_DEVICE_QUEUE_PROPERTIES: // T.cl_command_queue_properties;
      case ocl_info.CL_DEVICE_SINGLE_FP_CONFIG: // T.cl_device_fp_config;
      case ocl_info.CL_DEVICE_TYPE: // T.cl_device_type;
        rv = getInfo_plain (this._lib.clGetDeviceInfo, this._internal, name, T.cl_bitfield).value;
        rv = ctypes.UInt64.lo (rv);
        break;


      // [size_t]
      case ocl_info.CL_DEVICE_MAX_WORK_ITEM_SIZES:
        rv = getInfo_array (this._lib.clGetDeviceInfo, this._internal, name, T.size_t);
        for (var i in rv) rv[i] = ctypes.UInt64.lo (rv[i]);
        break;

      // String
      case ocl_info.CL_DEVICE_EXTENSIONS:
      case ocl_info.CL_DEVICE_NAME:
      case ocl_info.CL_DEVICE_OPENCL_C_VERSION:
      case ocl_info.CL_DEVICE_PROFILE:
      case ocl_info.CL_DEVICE_VENDOR:
      case ocl_info.CL_DEVICE_VERSION:
      case ocl_info.CL_DRIVER_VERSION:
        rv = getInfo_string (this._lib.clGetDeviceInfo, this._internal, name);
        break;

      // cl_platform_id
      case ocl_info.CL_DEVICE_PLATFORM:
        var val = getInfo_plain (this._lib.clGetDeviceInfo, this._internal, name, T.cl_platform_id);
        rv = new Platform (val, this._lib);
        break;

      default:
        throw new CLUnsupportedInfo (name, null, "Device");
    }
  }
  catch (e)
  {
    if (e instanceof CLException)
    {
      e.context = "Device.getInfo";
    }
    throw e;
  }

  return rv;
};


} catch (e) { ERROR ("device.jsm: " + EXCEPTIONSTR(e) + "."); throw e; }
