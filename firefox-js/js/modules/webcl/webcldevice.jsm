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

var EXPORTED_SYMBOLS = [ "WebCLDevice" ];


try {

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var Exception = Components.Exception;


Cu.import ("resource://gre/modules/Services.jsm");
Cu.import ("resource://gre/modules/XPCOMUtils.jsm");
Cu.import ("resource://nrcwebcl/modules/logger.jsm");
Cu.import ("resource://nrcwebcl/modules/webclutils.jsm");
Cu.import ("resource://nrcwebcl/modules/base.jsm");

Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");

Cu.import ("resource://nrcwebcl/modules/webclclasses.jsm");


function WebCLDevice ()
{
  TRACE (this, "WebCLDevice", arguments);
  try {
    if (!(this instanceof WebCLDevice)) return new WebCLDevice ();

    Base.apply(this);

    this.wrappedJSObject = this;

    this.__exposedProps__ =
    {
      getExternalIdentity: "r",
      getInfo: "r",
      getSupportedExtensions: "r",
      enableExtension: "r",

      classDescription: "r"
    };
  }
  catch (e)
  {
    ERROR ("webcldevice.jsm:WebCLDevice failed: " + e);
    throw webclutils.convertCLException (e);
  }
}

WEBCLCLASSES.WebCLDevice = WebCLDevice;
WebCLDevice.prototype = Object.create (Base.prototype);
WebCLDevice.prototype.classDescription = "WebCLDevice";



// getInfo(DEVICE_PLATFORM)._owner == this._owner == [WebCL]
//
WebCLDevice.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (!webclutils.validateInteger(name))
      throw new INVALID_VALUE("'name' must be a valid CLenum; was ", name);

    switch (name)
    {
      case ocl_info.CL_DEVICE_TYPE:                               break;
      case ocl_info.CL_DEVICE_VENDOR_ID:                          break;
      case ocl_info.CL_DEVICE_MAX_COMPUTE_UNITS:                  break;
      case ocl_info.CL_DEVICE_MAX_WORK_ITEM_DIMENSIONS:           break;
      case ocl_info.CL_DEVICE_MAX_WORK_ITEM_SIZES:                break;
      case ocl_info.CL_DEVICE_MAX_WORK_GROUP_SIZE:                break;
      case ocl_info.CL_DEVICE_PREFERRED_VECTOR_WIDTH_CHAR:        break;
      case ocl_info.CL_DEVICE_PREFERRED_VECTOR_WIDTH_SHORT:       break;
      case ocl_info.CL_DEVICE_PREFERRED_VECTOR_WIDTH_INT:         break;
      case ocl_info.CL_DEVICE_PREFERRED_VECTOR_WIDTH_LONG:        break;
      case ocl_info.CL_DEVICE_PREFERRED_VECTOR_WIDTH_FLOAT:       break;
      //case ocl_info.CL_DEVICE_PREFERRED_VECTOR_WIDTH_DOUBLE:      throw new CLError(ocl_errors.CL_INVALID_VALUE);
      //case ocl_info.CL_DEVICE_PREFERRED_VECTOR_WIDTH_HALF:        throw new CLError(ocl_errors.CL_INVALID_VALUE);
      case ocl_info.CL_DEVICE_NATIVE_VECTOR_WIDTH_CHAR:           break;
      case ocl_info.CL_DEVICE_NATIVE_VECTOR_WIDTH_SHORT:          break;
      case ocl_info.CL_DEVICE_NATIVE_VECTOR_WIDTH_INT:            break;
      case ocl_info.CL_DEVICE_NATIVE_VECTOR_WIDTH_LONG:           break;
      case ocl_info.CL_DEVICE_NATIVE_VECTOR_WIDTH_FLOAT:          break;
      //case ocl_info.CL_DEVICE_NATIVE_VECTOR_WIDTH_DOUBLE:         throw new CLError(ocl_errors.CL_INVALID_VALUE);
      //case ocl_info.CL_DEVICE_NATIVE_VECTOR_WIDTH_HALF:           throw new CLError(ocl_errors.CL_INVALID_VALUE);
      case ocl_info.CL_DEVICE_MAX_CLOCK_FREQUENCY:                break;
      case ocl_info.CL_DEVICE_ADDRESS_BITS:                       break;
      case ocl_info.CL_DEVICE_MAX_MEM_ALLOC_SIZE:                 break;
      case ocl_info.CL_DEVICE_IMAGE_SUPPORT:                      return true;
      case ocl_info.CL_DEVICE_MAX_READ_IMAGE_ARGS:                break;
      case ocl_info.CL_DEVICE_MAX_WRITE_IMAGE_ARGS:               break;
      case ocl_info.CL_DEVICE_IMAGE2D_MAX_WIDTH:                  break;
      case ocl_info.CL_DEVICE_IMAGE2D_MAX_HEIGHT:                 break;
      case ocl_info.CL_DEVICE_IMAGE3D_MAX_WIDTH:                  return 0;
      case ocl_info.CL_DEVICE_IMAGE3D_MAX_HEIGHT:                 return 0;
      case ocl_info.CL_DEVICE_IMAGE3D_MAX_DEPTH:                  return 0;
      case ocl_info.CL_DEVICE_MAX_SAMPLERS:                       break;
      case ocl_info.CL_DEVICE_MAX_PARAMETER_SIZE:                 break;
      case ocl_info.CL_DEVICE_MEM_BASE_ADDR_ALIGN:                break;
      //case ocl_info.CL_DEVICE_MIN_DATA_TYPE_ALIGN_SIZE:
      case ocl_info.CL_DEVICE_SINGLE_FP_CONFIG:                   return (this._internal.getInfo (name) & 0x7F);
      case ocl_info.CL_FP_ROUND_TO_NEAREST:                       break;
      case ocl_info.CL_DEVICE_GLOBAL_MEM_CACHE_TYPE:              break;
      case ocl_info.CL_DEVICE_GLOBAL_MEM_CACHELINE_SIZE:          break;
      case ocl_info.CL_DEVICE_GLOBAL_MEM_CACHE_SIZE:              break;
      case ocl_info.CL_DEVICE_GLOBAL_MEM_SIZE:                    break;
      case ocl_info.CL_DEVICE_MAX_CONSTANT_BUFFER_SIZE:           break;
      case ocl_info.CL_DEVICE_MAX_CONSTANT_ARGS:                  break;
      case ocl_info.CL_DEVICE_LOCAL_MEM_TYPE:                     break;
      case ocl_info.CL_DEVICE_LOCAL_MEM_SIZE:                     break;
      case ocl_info.CL_DEVICE_ERROR_CORRECTION_SUPPORT:           break;
      case ocl_info.CL_DEVICE_HOST_UNIFIED_MEMORY:                break;
      case ocl_info.CL_DEVICE_PROFILING_TIMER_RESOLUTION:         break;
      case ocl_info.CL_DEVICE_ENDIAN_LITTLE:                      break;
      case ocl_info.CL_DEVICE_AVAILABLE:                          break;
      case ocl_info.CL_DEVICE_COMPILER_AVAILABLE:                 break;
      case ocl_info.CL_DEVICE_EXECUTION_CAPABILITIES:             return ocl_const.CL_EXEC_KERNEL;
      case ocl_info.CL_DEVICE_QUEUE_PROPERTIES:                   break;
      case ocl_info.CL_DEVICE_PLATFORM:                           break;
      case ocl_info.CL_DEVICE_NAME:                               break;
      case ocl_info.CL_DEVICE_VENDOR:                             break;
      case ocl_info.CL_DRIVER_VERSION:                            break;
      case ocl_info.CL_DEVICE_PROFILE:                            return "WEBCL_PROFILE";
      case ocl_info.CL_DEVICE_VERSION:                            return "WebCL 1.0";
      case ocl_info.CL_DEVICE_OPENCL_C_VERSION:                   return "WebCL C 1.0";
      case ocl_info.CL_DEVICE_EXTENSIONS:                         break;
      default:
        throw new INVALID_VALUE("'name' must be one of the accepted CLenums; was ", name);
    }

    return this._wrapInternal (this._internal.getInfo (name));
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLDevice.prototype.getSupportedExtensions = function ()
{
  TRACE (this, "getSupportedExtensions", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    // TODO!
    return [];
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLDevice.prototype.enableExtension = function (extensionName)
{
  TRACE (this, "enableExtension", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    // TODO;
    return false;
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


} catch(e) { ERROR ("webcldevice.jsm: "+e); }
