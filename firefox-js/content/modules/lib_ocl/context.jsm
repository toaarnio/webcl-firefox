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


var EXPORTED_SYMBOLS = [ "Context" ];


try {

const Cu = Components.utils;

Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_types.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_symbols.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_getinfo.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_exception.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/common.jsm");

function loadLazyModules ()
{
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/device.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/platform.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/commandqueue.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/event.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/memoryobject.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/program.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/sampler.jsm");

  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_common.jsm");
}


} catch(e) { ERROR ("context.jsm failed to load modules: " + EXCEPTIONSTR(e) + "."); throw e; }
try {


function Context (internal, lib)
{
  if (!this instanceof Context) return new Context (internal);
  loadLazyModules ();

  this.classDescription = "Context";
  TRACE (this, "Context", arguments);

  this._internal = internal || null;
  this._lib = lib || null;
}


Context.prototype.getIdentity = function ()
{
  TRACE (this, "getIdentity", arguments);
  return ocl_common.getObjectIdentity (this);
};


Context.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);

  var rv;

  try
  {
    switch (name)
    {
      // cl_uint
      case ocl_info.CL_CONTEXT_REFERENCE_COUNT:
      case ocl_info.CL_CONTEXT_NUM_DEVICES:
        rv = getInfo_plain (this._lib.clGetContextInfo, this._internal, name, T.cl_uint).value;
        break;

      // [cl_device_id]
      case ocl_info.CL_CONTEXT_DEVICES:
        var val = getInfo_array (this._lib.clGetContextInfo, this._internal, name, T.cl_device_id);
        rv = [];
        for (var i = 0; i < val.length; ++i)
        {
          var p = new Device (val[i]);
          p._lib = this._lib;
          rv.push (p);
        }
        break;

      // [cl_context_properties]
      case ocl_info.CL_CONTEXT_PROPERTIES:
        var val = getInfo_array (this._lib.clGetContextInfo, this._internal, name, T.cl_context_properties);
        rv = [];
        for (var i = 0; i < val.length; ++i)
        {
          if (i > 0 && ctypes.cast(val[i-1], ctypes.int).value == ocl_const.CL_CONTEXT_PLATFORM)
          {
            var p = new Platform (val[i]);
            p._lib = this._lib;
            rv[i] = p;
          }
          else
          {
            rv[i] = ctypes.cast(val[i], ctypes.int).value;
          }
        }
        break;

      case ocl_info.CL_CONTEXT_D3D10_PREFER_SHARED_RESOURCES_KHR:
      default:
        throw new CLUnsupportedInfo (name, null, "Context.getInfo");
    }
  }
  catch (e)
  {
    if (e instanceof CLException)
    {
      e.context = "Context.getInfo";
    }
    throw e;
  }

  return rv;
};


Context.prototype.retain = function ()
{
  TRACE (this, "retain", arguments);

  var err = this._lib.clRetainContext (this._internal);
  if (err) throw new CLError (err, null, "Context.retain");
};


Context.prototype.release = function ()
{
  TRACE (this, "release", arguments);

  var err = this._lib.clReleaseContext (this._internal);
  if (err) throw new CLError (err, null, "Context.release");
};


Context.prototype.createCommandQueue = function (device, properties)
{
  TRACE (this, "createCommandQueue", arguments);

  if (!device || !(device instanceof Device))
  {
    throw new CLInvalidArgument ("device", null, "Context.createCommandQueue");
  }
  if (isNaN(+properties))
  {
    throw new CLInvalidArgument ("properties", null, "Context.createCommandQueue");
  }

  var clErr = new T.cl_int (0);
  var clCommandQueue = this._lib.clCreateCommandQueue (this._internal,
                                                       device._internal,
                                                       +properties,
                                                       clErr.address());
  if (clErr.value) throw new CLError (clErr.value, null, "Context.createCommandQueue");

  return new CommandQueue (clCommandQueue, this._lib);
};


// flags: (Number)
// hostData: (ArrayBufferView | ArrayBuffer)
Context.prototype.createBuffer = function (flags, size, hostData)
{
  TRACE (this, "createBuffer", arguments);

  if (isNaN(+flags))
  {
    throw new CLInvalidArgument ("flags", null, "Context.createBuffer");
  }
  if (isNaN(+size))
  {
    throw new CLInvalidArgument ("size", null, "Context.createBuffer");
  }

  var hostPtr = null;

  if (flags & ocl_const.CL_MEM_COPY_HOST_PTR)
  {
    try {
      let tmp = typedArrayToCTypesPtr (hostData);
      if (tmp !== null && !tmp.ptr.isNull())
      {
        //hostPtr = ctypes.cast(tmp.ptr.address(), T.voidptr_t)
        hostPtr = ctypes.cast(tmp.ptr, T.voidptr_t)
        if (tmp.size < size)
        {
          throw new CLInvalidArgument ("hostData",
                                       "Size of hostData must be equal to or larger than ",
                                       "Context.createBuffer");
        }
        //size = tmp.size;
      }
    } catch (e) {
      if (e instanceof CLException)
      {
        throw new CLInvalidArgument ("hostData", null, "Context.createBuffer");
      }
      else throw e;
    }
  }

  var clErr = new T.cl_int (0);
  var clMem = this._lib.clCreateBuffer (this._internal,
                                        +flags,
                                        +size,
                                        hostPtr,
                                        clErr.address());
  if (clErr.value) throw new CLError (clErr.value, null, "Context.createBuffer");

  return new MemoryObject (clMem, this._lib);
};


// imageFormat: { channelOrder: Number, channelType: Number }
Context.prototype.createImage2D = function (flags, imageFormat, width, height, rowPitch,
                                            hostData)
{
  TRACE (this, "createImage2D", arguments);

  if (isNaN(+flags)) throw new CLInvalidArgument ("flags", null, "Context.createImage2D");
  if (isNaN(+width)) throw new CLInvalidArgument ("width", null, "Context.createImage2D");
  if (isNaN(+height)) throw new CLInvalidArgument ("height", null, "Context.createImage2D");
  if (isNaN(+rowPitch)) throw new CLInvalidArgument ("rowPitch", null, "Context.createImage2D");

  var clImageFormat = new T.cl_image_format();
  clImageFormat.image_channel_order = imageFormat.channelOrder;
  clImageFormat.image_channel_data_type = imageFormat.channelType;

  var hostPtr = null;
  if (flags & ocl_const.CL_MEM_COPY_HOST_PTR)
  {
    try {
      let tmp = typedArrayToCTypesPtr (hostData);
      if (tmp !== null && !tmp.ptr.isNull())
      {
        hostPtr = ctypes.cast(tmp.ptr, T.voidptr_t)
        // TODO: validate tmp.size against width, height and rowPitch.
      }
    } catch (e) {
      if (e instanceof CLException)
      {
        throw new CLInvalidArgument ("hostData", null, "Context.createImage2D");
      }
      else throw e;
    }
  }

  var clErr = new T.cl_int (0);
  var clMem = this._lib.clCreateImage2D (this._internal,
                                         +flags, clImageFormat.address(),
                                         +width, +height, +rowPitch,
                                         hostPtr,
                                         clErr.address());
  if (clErr.value) throw new CLError (clErr.value, null, "Context.createImage2D");

  return new MemoryObject (clMem, this._lib);
};


Context.prototype.createImage3D = function (flags, imageFormat, width, height, depth,
                                            rowPitch, slicePitch, hostData)
{
  TRACE (this, "createImage3D", arguments);

  if (isNaN(+flags)) throw new CLInvalidArgument ("flags", null, "Context.createImage3D");
  if (isNaN(+width)) throw new CLInvalidArgument ("width", null, "Context.createImage3D");
  if (isNaN(+height)) throw new CLInvalidArgument ("height", null, "Context.createImage3D");
  if (isNaN(+depth)) throw new CLInvalidArgument ("depth", null, "Context.createImage3D");
  if (isNaN(+rowPitch)) throw new CLInvalidArgument ("rowPitch", null, "Context.createImage3D");
  if (isNaN(+slicePitch)) throw new CLInvalidArgument ("slicePitch", null, "Context.createImage3D");

  var clImageFormat = new T.cl_image_format();
  clImageFormat.image_channel_order = imageFormat.channelOrder;
  clImageFormat.image_channel_data_type = imageFormat.channelType;

  var hostPtr = null;
  if (flags & ocl_const.CL_MEM_COPY_HOST_PTR)
  {
    try {
      let tmp = typedArrayToCTypesPtr (hostData);
      if (tmp !== null && !tmp.ptr.isNull())
      {
        hostPtr = ctypes.cast(tmp.ptr, T.voidptr_t)
        // TODO: validate tmp.size against width, height, depth, rowPitch and slicePitch.
      }
    } catch (e) {
      if (e instanceof CLException)
      {
        throw new CLInvalidArgument ("hostData", null, "Context.createImage3D");
      }
      else throw e;
    }
  }

  var clErr = new T.cl_int (0);
  var clMem = this._lib.clCreateImage3D (this._internal,
                                         +flags, clImageFormat.address(),
                                         +width, +height, +depth, +rowPitch, +slicePitch,
                                         hostPtr,
                                         clErr.address());
  if (clErr.value) throw new CLError (clErr.value, null, "Context.createImage3D");

  return new MemoryObject (clMem, this._lib);
};


// returns: [{ channelOrder: Number, channelType: Number }, ...]
Context.prototype.getSupportedImageFormats = function (flags, imageType)
{
  TRACE (this, "getSupportedImageFormats", arguments);

  var n = new T.cl_uint (0);
  var err = 0;
  err = this._lib.clGetSupportedImageFormats (this._internal, +flags, +imageType,
                                              0, null, n.address());
  if (err) throw new CLError (err, null, "Context.getSupportedImageFormats");

  var values = T.cl_image_format.array(n.value)();
  err = this._lib.clGetSupportedImageFormats (this._internal, +flags, +imageType,
                                              n.value,
                                              ctypes.cast (values.address(), T.cl_image_format.ptr),
                                              null);
  if (err) throw new CLError (err, null, "Context.getSupportedImageFormats");

  var result = [];
  for (var i = 0; i < values.length; ++i)
  {
    result.push ({ channelOrder: values[i].image_channel_order,
                   channelType: values[i].image_channel_data_type });
  }

  return result;
};


Context.prototype.createSampler = function (normalizedCoords, addressingMode, filterMode)
{
  var clErr = new T.cl_int (0);
  var clSampler = this._lib.clCreateSampler (this._internal, !!normalizedCoords,
                                             +addressingMode, +filterMode,
                                             clErr.address());
  if (clErr.value) throw new CLError (clErr.value, null, "Context.createSampler");

  return new Sampler (clSampler, this._lib);
};


Context.prototype.createProgramWithSource = function (source)
{
  TRACE (this, "createProgramWithSource", arguments);

  if (typeof (source) != "string")
  {
    throw new CLInvalidArgument ("source", null, "Context.createProgramWithSource");
  }

  var str = T.char.array() (source);
  var sizes = ctypes.size_t.array(1) ([str.length - 1]);   // exclude zero terminator

  var clErr = new T.cl_int (0);
  var clProgram = this._lib.clCreateProgramWithSource (this._internal,
                                                       1,
                                                       ctypes.cast (str.address().address(), T.char.ptr.ptr),
                                                       ctypes.cast (sizes.address(), T.size_t.ptr),
                                                       clErr.address());
  if (clErr.value) throw new CLError (clErr.value, null, "Context.createProgramWithSource");

  return new Program (clProgram, this._lib);
};


Context.prototype.createProgramWithBinary = function ()
{
  throw new CLNotImplemented ("TODO: Context.createProgramWithBinary");
};


Context.prototype.createUserEvent = function ()
{
  TRACE (this, "createUserEvent", arguments);

  var clErr = new T.cl_int (0);
  var clEvent = this._lib.clCreateUserEvent (this._internal, clErr.address());
  if (clErr.value) throw new CLError (clErr.value, null, "Context.createUserEvent");

  return new CLEvent (clEvent, this._lib);
};


} catch (e) { ERROR ("context.jsm: " + EXCEPTIONSTR(e) + "."); throw e; }
