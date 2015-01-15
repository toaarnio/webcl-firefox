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


var EXPORTED_SYMBOLS = [ "CommandQueue" ];


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
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/context.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/device.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/event.jsm");

  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_common.jsm");
}


} catch(e) { ERROR ("commandqueue.jsm failed to load modules: " + EXCEPTIONSTR(e) + "."); throw e; }
try {


function CommandQueue (internal, lib)
{
  if (!(this instanceof CommandQueue)) return new CommandQueue (internal, lib);
  loadLazyModules ();

  this.classDescription = "CommandQueue";
  TRACE (this, "CommandQueue", arguments);

  this._internal = internal || null;
  this._lib = lib || null;
}


CommandQueue.prototype.getIdentity = function ()
{
  TRACE (this, "getIdentity", arguments);
  return ocl_common.getObjectIdentity (this);
}


CommandQueue.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);

  var rv;

  try
  {
    switch (name)
    {
      // cl_context
      case ocl_info.CL_QUEUE_CONTEXT:
        var p = getInfo_plain (this._lib.clGetCommandQueueInfo, this._internal, name, T.cl_context);
        rv = new Context (p, this._lib);
        break;

      // cl_device_id
      case ocl_info.CL_QUEUE_DEVICE:
        var p = getInfo_plain (this._lib.clGetCommandQueueInfo, this._internal, name, T.cl_device_id);
        rv = new Device (p, this._lib);
        break;

      // cl_uint
      case ocl_info.CL_QUEUE_REFERENCE_COUNT:
        rv = getInfo_plain (this._lib.clGetCommandQueueInfo, this._internal, name, T.cl_uint).value;
        break;

      // bitfield
      case ocl_info.CL_QUEUE_PROPERTIES:
        rv = getInfo_plain (this._lib.clGetCommandQueueInfo, this._internal, name, T.cl_bitfield).value;
        rv = ctypes.UInt64.lo (rv);
        break;

      default:
        throw new CLUnsupportedInfo (name, null, "CommandQueue.getInfo");
    }
  }
  catch (e)
  {
    if (e instanceof CLException)
    {
      e.context = "CommandQueue.getInfo";
    }
    throw e;
  }

  return rv;
};


CommandQueue.prototype.enqueueNDRangeKernel = function (kernel, workDim,
                                                        globalWorkOffset, globalWorkSize,
                                                        localWorkSize, eventWaitList)
{
  TRACE (this, "enqueueNDRangeKernel", arguments);
  // TODO: validate kernel

  var clGlobalWorkOffset = globalWorkOffset ? ctypes.size_t.array()(globalWorkOffset) : null;
  var clGlobalWorkSize = ctypes.size_t.array()(globalWorkSize);
  var clLocalWorkSize = localWorkSize ? ctypes.size_t.array()(localWorkSize) : null;
  // TODO: checks

  if (clGlobalWorkOffset && clGlobalWorkOffset.length > 0 && clGlobalWorkOffset.length != workDim)
  {
    throw new CLInvalidArgument ("globalWorkOffset", null, "CommandQueue.enqueueNDRangeKernel");
  }

  if (clGlobalWorkSize.length != workDim)
  {
    throw new CLInvalidArgument ("globalWorkSize", null, "CommandQueue.enqueueNDRangeKernel");
  }

  if (clLocalWorkSize && clLocalWorkSize.length != workDim)
  {
    throw new CLInvalidArgument ("localWorkSize", null, "CommandQueue.enqueueNDRangeKernel");
  }

  if (clGlobalWorkOffset) clGlobalWorkOffset = ctypes.cast (clGlobalWorkOffset.address(), ctypes.size_t.ptr);
  if (clGlobalWorkSize) clGlobalWorkSize = ctypes.cast (clGlobalWorkSize.address(), ctypes.size_t.ptr);
  if (clLocalWorkSize) clLocalWorkSize = ctypes.cast (clLocalWorkSize.address(), ctypes.size_t.ptr);

  var clEventWaitListInfo = processEventWaitList (eventWaitList);

  var clEventOut = new T.cl_event();
  var clErr = this._lib.clEnqueueNDRangeKernel (this._internal,
                                                kernel._internal, workDim,
                                                clGlobalWorkOffset,
                                                clGlobalWorkSize,
                                                clLocalWorkSize,
                                                clEventWaitListInfo.length,
                                                clEventWaitListInfo.dataPtr,
                                                clEventOut.address());
  if (clErr) throw new CLError (clErr, null, "CommandQueue.enqueueNDRangeKernel");

  return new CLEvent (clEventOut, this._lib);
};


CommandQueue.prototype.enqueueTask = function (kernel, eventWaitList)
{
  TRACE (this, "enqueueTask", arguments);
  // TODO: validate kernel

  var clEventWaitListInfo = processEventWaitList (eventWaitList);

  var clEventOut = new T.cl_event();
  var clErr = this._lib.clEnqueueTask (this._internal,
                                       kernel._internal,
                                       clEventWaitListInfo.length,
                                       clEventWaitListInfo.dataPtr,
                                       clEventOut.address());
  if (clErr) throw new CLError (clErr, null, "CommandQueue.enqueueTask");

  return new CLEvent (clEventOut, this._lib);
};


// CommandQueue.prototype.clEnqueueNativeKernel = function () {}


CommandQueue.prototype.enqueueWriteBuffer = function (buffer, blockingWrite, offset,
                                                      numBytes, data, eventWaitList)
{
  TRACE (this, "enqueueWriteBuffer", arguments);
  var clEventWaitListInfo = processEventWaitList (eventWaitList);

  try {
    var tmp = typedArrayToCTypesPtr (data);
    var clData = tmp.ptr;
    numBytes = numBytes || tmp.size;
  } catch (e) { e.context = "CommandQueue.enqueueWriteBuffer"; e.argName="hostPtr"; throw e; }

  // TODO: ensure data size

  var clEventOut = new T.cl_event();
  var clErr = this._lib.clEnqueueWriteBuffer (this._internal,
                                              buffer._internal, !!blockingWrite,
                                              +offset, +numBytes, clData || null,
                                              clEventWaitListInfo.length,
                                              clEventWaitListInfo.dataPtr,
                                              clEventOut.address());
  if (clErr) throw new CLError (clErr, null, "CommandQueue.enqueueWriteBuffer");

  return new CLEvent (clEventOut, this._lib);
};


CommandQueue.prototype.enqueueReadBuffer = function (buffer, blockingRead, offset,
                                                     numBytes, data, eventWaitList)
{
  TRACE (this, "enqueueReadBuffer", arguments);
  var clEventWaitListInfo = processEventWaitList (eventWaitList);

  try {
    var tmp = typedArrayToCTypesPtr (data);
    var clData = tmp.ptr;
    numBytes = numBytes || tmp.size;
  } catch (e) { e.context = "CommandQueue.enqueueReadBuffer"; e.argName="hostPtr"; throw e; }

  // TODO: ensure data size

  var clEventOut = new T.cl_event();
  var clErr = this._lib.clEnqueueReadBuffer (this._internal,
                                             buffer._internal, !!blockingRead,
                                             +offset, +numBytes, clData || null,
                                             clEventWaitListInfo.length,
                                             clEventWaitListInfo.dataPtr,
                                             clEventOut.address());
  if (clErr) throw new CLError (clErr, null, "CommandQueue.enqueueReadBuffer");

  return new CLEvent (clEventOut, this._lib);
};


CommandQueue.prototype.enqueueWriteBufferRect = function (buffer, blockingWrite,
                                                          bufferOrigin, hostOrigin, region,
                                                          bufferRowPitch, bufferSlicePitch,
                                                          hostRowPitch, hostSlicePitch,
                                                          data, eventWaitList)
{
  TRACE (this, "enqueueWriteBufferRect", arguments);
  // TODO: validate buffer

  if (!Array.isArray (bufferOrigin) && bufferOrigin.length == 3)
    throw new CLInvalidArgument ("bufferOrigin", null, "CommandQueue.enqueueWriteBufferRect");

  if (!Array.isArray (hostOrigin) && hostOrigin.length == 3)
    throw new CLInvalidArgument ("hostOrigin", null, "CommandQueue.enqueueWriteBufferRect");

  if (!Array.isArray (region) && region.length == 3)
    throw new CLInvalidArgument ("region", null, "CommandQueue.enqueueWriteBufferRect");

  var clBufferOriginPtr = ctypes.cast (T.size_t.array()(bufferOrigin).address(), T.size_t.ptr);
  var clHostOriginPtr = ctypes.cast (T.size_t.array()(hostOrigin).address(), T.size_t.ptr);
  var clRegionPtr = ctypes.cast (T.size_t.array()(region).address(), T.size_t.ptr);

  try {
    var tmp = typedArrayToCTypesPtr (data);
    var clData = tmp.ptr;
  } catch (e) { e.context = "CommandQueue.enqueueWriteBufferRect"; e.argName="hostPtr"; throw e; }

  // TODO: ensure data size

  var clEventWaitListInfo = processEventWaitList (eventWaitList);

  var clEventOut = new T.cl_event();
  var clErr = this._lib.clEnqueueWriteBufferRect (this._internal, buffer._internal,
                                                  !!blockingWrite, clBufferOriginPtr,
                                                  clHostOriginPtr, clRegionPtr,
                                                  +bufferRowPitch, +bufferSlicePitch,
                                                  +hostRowPitch, +hostSlicePitch,
                                                  clData || null,
                                                  clEventWaitListInfo.length,
                                                  clEventWaitListInfo.dataPtr,
                                                  clEventOut.address());
  if (clErr) throw new CLError (clErr, null, "CommandQueue.enqueueWriteBufferRect");

  return new CLEvent (clEventOut, this._lib);
};


CommandQueue.prototype.enqueueReadBufferRect = function (buffer, blockingRead,
                                                         bufferOrigin, hostOrigin, region,
                                                         bufferRowPitch, bufferSlicePitch,
                                                         hostRowPitch, hostSlicePitch,
                                                         data, eventWaitList)
{
  TRACE (this, "enqueueReadBufferRect", arguments);
  // TODO: validate buffer

  if (!Array.isArray (bufferOrigin) && bufferOrigin.length == 3)
    throw new CLInvalidArgument ("bufferOrigin", null, "CommandQueue.enqueueReadBufferRect");

  if (!Array.isArray (hostOrigin) && hostOrigin.length == 3)
    throw new CLInvalidArgument ("hostOrigin", null, "CommandQueue.enqueueReadBufferRect");

  if (!Array.isArray (region) && region.length == 3)
    throw new CLInvalidArgument ("region", null, "CommandQueue.enqueueReadBufferRect");

  var clBufferOriginPtr = ctypes.cast (T.size_t.array()(bufferOrigin).address(), T.size_t.ptr);
  var clHostOriginPtr = ctypes.cast (T.size_t.array()(hostOrigin).address(), T.size_t.ptr);
  var clRegionPtr = ctypes.cast (T.size_t.array()(region).address(), T.size_t.ptr);

  try {
    var tmp = typedArrayToCTypesPtr (data);
    var clData = tmp.ptr;
  } catch (e) { e.context = "CommandQueue.enqueueReadBufferRect"; e.argName="hostPtr"; throw e; }

  // TODO: ensure data size

  var clEventWaitListInfo = processEventWaitList (eventWaitList);

  var clEventOut = new T.cl_event();
  var clErr = this._lib.clEnqueueReadBufferRect (this._internal, buffer._internal,
                                                 !!blockingRead, clBufferOriginPtr,
                                                 clHostOriginPtr, clRegionPtr,
                                                 +bufferRowPitch, +bufferSlicePitch,
                                                 +hostRowPitch, +hostSlicePitch,
                                                 clData || null,
                                                 clEventWaitListInfo.length,
                                                 clEventWaitListInfo.dataPtr,
                                                 clEventOut.address());
  if (clErr) throw new CLError (clErr, null, "CommandQueue.enqueueReadBufferRect");

  return new CLEvent (clEventOut, this._lib);
};


CommandQueue.prototype.enqueueWriteImage = function (image, blockingWrite,
                                                     origin, region,
                                                     inputRowPitch, inputSlicePitch,
                                                     data, eventWaitList)
{
  TRACE (this, "enqueueWriteImage", arguments);
  // TODO: validate image

  if (!Array.isArray (origin) && origin.length == 3)
    throw new CLInvalidArgument ("origin", null, "CommandQueue.enqueueWriteImage");

  if (!Array.isArray (region) && region.length == 3)
    throw new CLInvalidArgument ("region", null, "CommandQueue.enqueueWriteImage");

  var clOriginPtr = ctypes.cast (T.size_t.array()(origin).address(), T.size_t.ptr);
  var clRegionPtr = ctypes.cast (T.size_t.array()(region).address(), T.size_t.ptr);

  try {
    var tmp = typedArrayToCTypesPtr (data);
    var clData = tmp.ptr;
  } catch (e) { e.context = "CommandQueue.enqueueWriteImage"; e.argName="hostPtr"; throw e; }

  // TODO: ensure data size

  var clEventWaitListInfo = processEventWaitList (eventWaitList);

  var clEventOut = new T.cl_event();
  var clErr = this._lib.clEnqueueWriteImage (this._internal, image._internal,
                                             !!blockingWrite,
                                             clOriginPtr, clRegionPtr,
                                             +inputRowPitch, +inputSlicePitch,
                                             clData || null,
                                             clEventWaitListInfo.length,
                                             clEventWaitListInfo.dataPtr,
                                             clEventOut.address());
  if (clErr) throw new CLError (clErr, null, "CommandQueue.enqueueWriteImage");

  return new CLEvent (clEventOut, this._lib);
};


CommandQueue.prototype.enqueueReadImage = function (image, blockingRead,
                                                    origin, region,
                                                    hostRowPitch, hostSlicePitch,
                                                    data, eventWaitList)
{
  TRACE (this, "enqueueReadImage", arguments);
  // TODO: validate image

  if (!Array.isArray (origin) && origin.length == 3)
    throw new CLInvalidArgument ("origin", null, "CommandQueue.enqueueReadImage");

  if (!Array.isArray (region) && region.length == 3)
    throw new CLInvalidArgument ("region", null, "CommandQueue.enqueueReadImage");

  var clOriginPtr = ctypes.cast (T.size_t.array()(origin).address(), T.size_t.ptr);
  var clRegionPtr = ctypes.cast (T.size_t.array()(region).address(), T.size_t.ptr);

  try {
    var tmp = typedArrayToCTypesPtr (data);
    var clData = tmp.ptr;
  } catch (e) { e.context = "CommandQueue.enqueueReadImage"; e.argName="hostPtr"; throw e; }

  // TODO: ensure data size

  var clEventWaitListInfo = processEventWaitList (eventWaitList);

  var clEventOut = new T.cl_event();
  var clErr = this._lib.clEnqueueReadImage (this._internal, image._internal,
                                            !!blockingRead,
                                            clOriginPtr, clRegionPtr,
                                            +hostRowPitch, +hostSlicePitch,
                                            clData || null,
                                            clEventWaitListInfo.length,
                                            clEventWaitListInfo.dataPtr,
                                            clEventOut.address());
  if (clErr) throw new CLError (clErr, null, "CommandQueue.enqueueReadImage");

  return new CLEvent (clEventOut, this._lib);
};


CommandQueue.prototype.enqueueCopyImage = function (srcImage, dstImage,
                                                    srcOrigin, dstOrigin, region,
                                                    eventWaitList)
{
  TRACE (this, "enqueueCopyImage", arguments);
  // TODO: validate srcImage
  // TODO: validate dstImage

  if (!Array.isArray (srcOrigin) && srcOrigin.length == 3)
    throw new CLInvalidArgument ("srcOrigin", null, "CommandQueue.enqueueCopyImage");

  if (!Array.isArray (dstOrigin) && dstOrigin.length == 3)
    throw new CLInvalidArgument ("dstOrigin", null, "CommandQueue.enqueueCopyImage");

  if (!Array.isArray (region) && region.length == 3)
    throw new CLInvalidArgument ("region", null, "CommandQueue.enqueueCopyImage");

  var clSrcOriginPtr = ctypes.cast (T.size_t.array()(srcOrigin).address(), T.size_t.ptr);
  var clDstOriginPtr = ctypes.cast (T.size_t.array()(dstOrigin).address(), T.size_t.ptr);
  var clRegionPtr = ctypes.cast (T.size_t.array()(region).address(), T.size_t.ptr);

  var clEventWaitListInfo = processEventWaitList (eventWaitList);

  var clEventOut = new T.cl_event();
  var clErr = this._lib.clEnqueueCopyImage (this._internal,
                                            srcImage._internal, dstImage._internal,
                                            clSrcOriginPtr, clDstOriginPtr, clRegionPtr,
                                            clEventWaitListInfo.length,
                                            clEventWaitListInfo.dataPtr,
                                            clEventOut.address());
  if (clErr) throw new CLError (clErr, null, "CommandQueue.enqueueCopyImage");

  return new CLEvent (clEventOut, this._lib);
};


CommandQueue.prototype.enqueueCopyImageToBuffer = function (srcImage, dstBuffer,
                                                            srcOrigin, region, dstOffset,
                                                            eventWaitList)
{
  TRACE (this, "enqueueCopyImageToBuffer", arguments);
  // TODO: validate srcImage
  // TODO: validate dstBuffer

  if (!Array.isArray (srcOrigin) && srcOrigin.length == 3)
    throw new CLInvalidArgument ("srcOrigin", null, "CommandQueue.enqueueCopyImageToBuffer");

  if (!Array.isArray (region) && region.length == 3)
    throw new CLInvalidArgument ("region", null, "CommandQueue.enqueueCopyImageToBuffer");

  var clSrcOriginPtr = ctypes.cast (T.size_t.array()(srcOrigin).address(), T.size_t.ptr);
  var clRegionPtr = ctypes.cast (T.size_t.array()(region).address(), T.size_t.ptr);

  var clEventWaitListInfo = processEventWaitList (eventWaitList);

  var clEventOut = new T.cl_event();
  var clErr = this._lib.clEnqueueCopyImageToBuffer (this._internal,
                                                    srcImage._internal, dstBuffer._internal,
                                                    clSrcOriginPtr, clRegionPtr, +dstOffset,
                                                    clEventWaitListInfo.length,
                                                    clEventWaitListInfo.dataPtr,
                                                    clEventOut.address());
  if (clErr) throw new CLError (clErr, null, "CommandQueue.enqueueCopyImageToBuffer");

  return new CLEvent (clEventOut, this._lib);
};


CommandQueue.prototype.enqueueCopyBuffer = function (srcBuffer, dstBuffer,
                                                     srcOffset, dstOffset, numBytes,
                                                     eventWaitList)
{
  TRACE (this, "enqueueCopyBuffer", arguments);
  // TODO: validate args

  var clEventWaitListInfo = processEventWaitList (eventWaitList);

  var clEventOut = new T.cl_event();
  var clErr = this._lib.clEnqueueCopyBuffer (this._internal,
                                             srcBuffer._internal, dstBuffer._internal,
                                             +srcOffset, +dstOffset, +numBytes,
                                             clEventWaitListInfo.length,
                                             clEventWaitListInfo.dataPtr,
                                             clEventOut.address());
  if (clErr) throw new CLError (clErr, null, "CommandQueue.enqueueCopyBuffer");

  return new CLEvent (clEventOut, this._lib);
};


CommandQueue.prototype.enqueueCopyBufferRect = function (srcBuffer, dstBuffer,
                                                         srcOrigin, dstOrigin, region,
                                                         srcRowPitch, srcSlicePitch,
                                                         dstRowPitch, dstSlicePitch,
                                                         eventWaitList)
{
  TRACE (this, "enqueueCopyBufferRect", arguments);
  // TODO: validate args

  var clSrcOriginPtr = ctypes.cast (T.size_t.array()(srcOrigin).address(), T.size_t.ptr);
  var clDstOriginPtr = ctypes.cast (T.size_t.array()(dstOrigin).address(), T.size_t.ptr);
  var clRegionPtr = ctypes.cast (T.size_t.array()(region).address(), T.size_t.ptr);

  var clEventWaitListInfo = processEventWaitList (eventWaitList);

  var clEventOut = new T.cl_event();
  var clErr = this._lib.clEnqueueCopyBufferRect (this._internal,
                                                 srcBuffer._internal, dstBuffer._internal,
                                                 clSrcOriginPtr, clDstOriginPtr, clRegionPtr,
                                                 +srcRowPitch, +srcSlicePitch,
                                                 +dstRowPitch, +dstSlicePitch,
                                                 clEventWaitListInfo.length,
                                                 clEventWaitListInfo.dataPtr,
                                                 clEventOut.address());
  if (clErr) throw new CLError (clErr, null, "CommandQueue.enqueueCopyBufferRect");

  return new CLEvent (clEventOut, this._lib);
};


CommandQueue.prototype.enqueueCopyBufferToImage = function (srcBuffer, dstImage,
                                                            srcOffset, dstOrigin, region,
                                                            eventWaitList)
{
  TRACE (this, "enqueueCopyBufferToImage", arguments);
  // TODO: validate srcBuffer
  // TODO: validate dstImage

  if (!Array.isArray (dstOrigin) && dstOrigin.length == 3)
    throw new CLInvalidArgument ("dstOrigin", null, "CommandQueue.enqueueCopyBufferToImage");

  if (!Array.isArray (region) && region.length == 3)
    throw new CLInvalidArgument ("region", null, "CommandQueue.enqueueCopyBufferToImage");

  var clDstOriginPtr = ctypes.cast (T.size_t.array()(dstOrigin).address(), T.size_t.ptr);
  var clRegionPtr = ctypes.cast (T.size_t.array()(region).address(), T.size_t.ptr);

  var clEventWaitListInfo = processEventWaitList (eventWaitList);

  var clEventOut = new T.cl_event();
  var clErr = this._lib.clEnqueueCopyBufferToImage (this._internal,
                                                    srcBuffer._internal, dstImage._internal,
                                                    +srcOffset, clDstOriginPtr, clRegionPtr,
                                                    clEventWaitListInfo.length,
                                                    clEventWaitListInfo.dataPtr,
                                                    clEventOut.address());
  if (clErr) throw new CLError (clErr, null, "CommandQueue.enqueueCopyBufferToImage");

  return new CLEvent (clEventOut, this._lib);
};


// returns { ptr: ctypes.voidptr_t, event: CLEvent }
CommandQueue.prototype.enqueueMapBuffer = function (buffer, blockingMap, mapFlags,
                                                    offset, numBytes, eventWaitList)
{
  TRACE (this, "enqueueMapBuffer", arguments);
  // TODO: validate buffer

  var clEventWaitListInfo = processEventWaitList (eventWaitList);

  var clEventOut = new T.cl_event();
  var clErr = new T.cl_int (0);
  var ptr = this._lib.clEnqueueMapBuffer (this._internal,
                                          buffer._internal,
                                          !!blockingMap,
                                          mapFlags,
                                          +offset,
                                          +numBytes,
                                          clEventWaitListInfo.length,
                                          clEventWaitListInfo.dataPtr,
                                          clEventOut.address(),
                                          clErr.address());
  if (clErr.value) throw new CLError (clErr.value, null, "CommandQueue.enqueueMapBuffer");

  return { ptr: ptr, event: new CLEvent (clEventOut, this._lib) };
};


// returns { ptr: ctypes.voidptr_t, event: CLEvent, rowPitch: Number, slicePitch: Number }
CommandQueue.prototype.enqueueMapImage = function (image, blockingMap, mapFlags,
                                                   origin, region,
                                                   eventWaitList)
{
  TRACE (this, "enqueueMapImage", arguments);
  // TODO: validate image

  if (!Array.isArray (origin) && origin.length == 3)
    throw new CLInvalidArgument ("origin", null, "CommandQueue.enqueueMapImage");

  if (!Array.isArray (region) && region.length == 3)
    throw new CLInvalidArgument ("region", null, "CommandQueue.enqueueMapImage");

  var clEventWaitListInfo = processEventWaitList (eventWaitList);

  var clOriginPtr = ctypes.cast (T.size_t.array()(origin).address(), T.size_t.ptr);
  var clRegionPtr = ctypes.cast (T.size_t.array()(region).address(), T.size_t.ptr);

  var clRowPitchOut = new T.size_t (0);
  var clSlicePitchOut = new T.size_t (0);
  var clEventOut = new T.cl_event();
  var clErr = new T.cl_int (0);
  var ptr = this._lib.clEnqueueMapImage (this._internal,
                                         image._internal,
                                         !!blockingMap,
                                         mapFlags,
                                         clOriginPtr,
                                         clRegionPtr,
                                         clRowPitchOut.address(),
                                         clSlicePitchOut.address(),
                                         clEventWaitListInfo.length,
                                         clEventWaitListInfo.dataPtr,
                                         clEventOut.address(),
                                         clErr.address());
  if (clErr.value) throw new CLError (clErr.value, null, "CommandQueue.enqueueMapImage");

  return { ptr: ptr,
           event: new CLEvent (clEventOut, this._lib),
           rowPitch: clRowPitchOut.value,
           slicePitch: clSlicePitchOut.value };
};


// mappedPtr: ctypes.voidptr_t
CommandQueue.prototype.enqueueUnmapMemObject = function (memObj, mappedPtr, eventWaitList)
{
  TRACE (this, "enqueueUnmapMemObject", arguments);
  // TODO: validate memObj
  // TODO: validate mappedPtr?

  var clEventWaitListInfo = processEventWaitList (eventWaitList);

  var clEventOut = new T.cl_event();
  var clErr = this._lib.clEnqueueUnmapMemObject (this._internal,
                                                 memObj._internal,
                                                 mappedPtr,
                                                 clEventWaitListInfo.length,
                                                 clEventWaitListInfo.dataPtr,
                                                 clEventOut.address());
  if (clErr) throw new CLError (clErr, null, "CommandQueue.enqueueUnmapMemObject");

  return new CLEvent (clEventOut, this._lib);
};


CommandQueue.prototype.enqueueMarker = function ()
{
  TRACE (this, "enqueueMarker", arguments);
  var clEventOut = new T.cl_event();
  var clErr = this._lib.clEnqueueMarker (this._internal,
                                         clEventOut.address());
  if (clErr) throw new CLError (clErr, null, "CommandQueue.enqueueMarker");

  return new CLEvent (clEventOut, this._lib);
};


CommandQueue.prototype.enqueueWaitForEvents = function (eventWaitList)
{
  TRACE (this, "enqueueWaitForEvents", arguments);
  var clEventWaitListInfo = processEventWaitList (eventWaitList);
  var clErr = this._lib.clEnqueueWaitForEvents (this._internal,
                                                clEventWaitListInfo.length,
                                                clEventWaitListInfo.dataPtr);
  if (clErr) throw new CLError (clErr, null, "CommandQueue.enqueueWaitForEvents");
};


CommandQueue.prototype.enqueueBarrier = function ()
{
  TRACE (this, "enqueueBarrier", arguments);
  var err = this._lib.clEnqueueBarrier (this._internal);
  if (err) throw new CLError (err, null, "CommandQueue.enqueueBarrier");
};


CommandQueue.prototype.flush = function ()
{
  TRACE (this, "flush", arguments);
  var err = this._lib.clFlush (this._internal);
  if (err) throw new CLError (err, null, "CommandQueue.flush");
};


CommandQueue.prototype.finish = function ()
{
  TRACE (this, "finish", arguments);
  var err = this._lib.clFinish (this._internal);
  if (err) throw new CLError (err, null, "CommandQueue.finish");
};


CommandQueue.prototype.retain = function ()
{
  TRACE (this, "retain", arguments);
  var err = this._lib.clRetainCommandQueue (this._internal);
  if (err) throw new CLError (err, null, "CommandQueue.retain");
};


CommandQueue.prototype.release = function ()
{
  TRACE (this, "release", arguments);
  var err = this._lib.clReleaseCommandQueue (this._internal);
  if (err) throw new CLError (err, null, "CommandQueue.release");
};



function processEventWaitList (eventWaitList)
{
  var len = 0;
  var ptr = new T.cl_event.ptr(0);

  if (eventWaitList && Array.isArray(eventWaitList) && eventWaitList.length)
  {
    var clEventWaitList = T.cl_event.array(eventWaitList.length)();
    for (var i = 0; i < eventWaitList.length; ++i)
    {
      clEventWaitList[i] = eventWaitList[i]._internal;
    }
    // Convert clEventWaitList to compatible CData pointer
    len = clEventWaitList.length;
    ptr = ctypes.cast(clEventWaitList.address(), T.cl_event.ptr);
  }

  return { dataPtr: ptr, length: len };
}



} catch (e) { ERROR ("commandqueue.jsm: " + e + "."); throw e; }
