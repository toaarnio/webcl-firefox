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


var EXPORTED_SYMBOLS = [ "MemoryObject" ];


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
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/context.jsm");

  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_common.jsm");
}


} catch(e) { ERROR ("memoryobject.jsm failed to load modules: " + EXCEPTIONSTR(e) + "."); throw e; }
try {


function MemoryObject (internal, lib)
{
  if (!(this instanceof MemoryObject)) return new MemoryObject (internal);
  loadLazyModules ();

  this.classDescription = "MemoryObject";
  TRACE (this, "MemoryObject", arguments);

  this._internal = internal || null;
  this._lib = lib || null;
}


MemoryObject.prototype.getIdentity = function ()
{
  TRACE (this, "getIdentity", arguments);
  return ocl_common.getObjectIdentity (this);
}


MemoryObject.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);

  var rv;

  try
  {
    switch (name)
    {
      // cl_uint
      case ocl_info.CL_MEM_TYPE: // cl_mem_object_type
      case ocl_info.CL_MEM_MAP_COUNT:
      case ocl_info.CL_MEM_REFERENCE_COUNT:
        rv = getInfo_plain (this._lib.clGetMemObjectInfo, this._internal, name, T.cl_uint).value;
        break;

      // bitfield
      case ocl_info.CL_MEM_FLAGS: // cl_mem_flags
        rv = getInfo_plain (this._lib.clGetMemObjectInfo, this._internal, name, T.cl_bitfield).value;
        rv = ctypes.UInt64.lo (rv);
        break;

      // size_t
      case ocl_info.CL_MEM_SIZE: // size_t
      case ocl_info.CL_MEM_OFFSET:
        rv = getInfo_plain (this._lib.clGetMemObjectInfo, this._internal, name, T.size_t).value;
        rv = ctypes.UInt64.lo (rv);
        break;

      // voidptr_t
      case ocl_info.CL_MEM_HOST_PTR:
        rv = getInfo_plain (this._lib.clGetMemObjectInfo, this._internal, name, T.voidptr_t);
        break;

      // cl_context
      case ocl_info.CL_MEM_CONTEXT:
        var val = getInfo_plain (this._lib.clGetMemObjectInfo, this._internal, name, T.cl_context);
        rv = new Context (val, this._lib);
        break;

      // cl_mem
      case ocl_info.CL_MEM_ASSOCIATED_MEMOBJECT:
        var val = getInfo_plain (this._lib.clGetMemObjectInfo, this._internal, name, T.cl_mem);
        rv = val.isNull() ? null : new MemoryObject (val, this._lib);
        break;

      case ocl_info.CL_MEM_D3D10_RESOURCE_KHR:
      default:
        throw new CLUnsupportedInfo (name, null, "MemoryObject.getInfo");
    }
  }
  catch (e)
  {
    if (e instanceof CLException)
    {
      e.context = "MemoryObject.getInfo";
    }
    throw e;
  }

  return rv;
};


MemoryObject.prototype.getImageInfo = function (name)
{
  TRACE (this, "getImageInfo", arguments);

  var rv;

  try
  {
    switch (name)
    {
      // cl_image_format
      case ocl_info.CL_IMAGE_FORMAT:
        var val = getInfo_plain (this._lib.clGetImageInfo, this._internal, name, T.cl_image_format)
        rv = { image_channel_order: val.image_channel_order,
               image_channel_data_type: val.image_channel_data_type };
        break;

      // size_t
      case ocl_info.CL_IMAGE_ELEMENT_SIZE:
      case ocl_info.CL_IMAGE_ROW_PITCH:
      case ocl_info.CL_IMAGE_SLICE_PITCH:
      case ocl_info.CL_IMAGE_WIDTH:
      case ocl_info.CL_IMAGE_HEIGHT:
      case ocl_info.CL_IMAGE_DEPTH:
        rv = getInfo_plain (this._lib.clGetImageInfo, this._internal, name, T.size_t).value;
        rv = ctypes.UInt64.lo (rv);
        break;

      case ocl_info.CL_IMAGE_D3D10_SUBRESOURCE_KHR:
      default:
        throw new CLUnsupportedInfo (name, null, "MemoryObject.getInfo");
    }
  }
  catch (e)
  {
    if (e instanceof CLException)
    {
      e.context = "MemoryObject.getInfo";
    }
    throw e;
  }

  return rv;
};


// bufferCreateType: only CL_BUFFER_CREATE_TYPE_REGION supported
// data: region
MemoryObject.prototype.createSubBuffer = function (flags, bufferCreateType, data)
{
  TRACE (this, "createSubBuffer", arguments);

  if (isNaN(+flags))
  {
    throw new CLInvalidArgument ("flags", null, "MemoryObject.createSubBuffer");
  }
  if (bufferCreateType != ocl_const.CL_BUFFER_CREATE_TYPE_REGION)
  {
    throw new CLInvalidArgument ("bufferCreateType", null, "MemoryObject.createSubBuffer");
  }
  if (typeof(data) != "object" ||
      !data.hasOwnProperty("origin") ||
      !data.hasOwnProperty("size"))
  {
    throw new CLInvalidArgument ("data", null, "MemoryObject.createSubBuffer");
  }

  var clRegion = new T.cl_buffer_region();
  clRegion.origin = data.origin;
  clRegion.size = data.size;

  var clErr = new T.cl_int (0);
  var clMem = this._lib.clCreateSubBuffer (this._internal, flags, bufferCreateType,
                                           ctypes.cast(clRegion.address(), T.voidptr_t),
                                           clErr.address());
  if (clErr.value) throw new CLError (clErr.value, null, "MemoryObject.createSubBuffer");

  return new MemoryObject (clMem, this._lib);
};


MemoryObject.prototype.retain = function ()
{
  TRACE (this, "retain", arguments);

  var err = this._lib.clRetainMemObject (this._internal);
  if (err) throw new CLError (err, null, "MemoryObject.retain");
};


MemoryObject.prototype.release = function ()
{
  TRACE (this, "release", arguments);

  var err = this._lib.clReleaseMemObject (this._internal);
  if (err) throw new CLError (err, null, "MemoryObject.release");
};



} catch (e) { ERROR ("memoryobject.jsm: " + EXCEPTIONSTR(e) + "."); throw e; }
