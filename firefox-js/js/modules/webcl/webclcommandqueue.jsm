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

var EXPORTED_SYMBOLS = [ "WebCLCommandQueue" ];


try {

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var Exception = Components.Exception;


Cu.import ("resource://gre/modules/Services.jsm");
Cu.import ("resource://gre/modules/XPCOMUtils.jsm");
Cu.import ("resource://nrcwebcl/modules/logger.jsm");
Cu.import ("resource://nrcwebcl/modules/webclutils.jsm");
Cu.import ("resource://nrcwebcl/modules/common.jsm");
Cu.import ("resource://nrcwebcl/modules/base.jsm");

Cu.import ("resource://nrcwebcl/modules/mixin.jsm");

Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");

Cu.import ("resource://nrcwebcl/modules/webclclasses.jsm");


function WebCLCommandQueue ()
{
  TRACE (this, "WebCLCommandQueue", arguments);
  try {
    if (!(this instanceof WebCLCommandQueue)) return new WebCLCommandQueue ();

    Base.apply(this);

    this.wrappedJSObject = this;

    this.__exposedProps__ =
    {
      getExternalIdentity: "r",
      enqueueCopyBuffer: "r",
      enqueueCopyBufferRect: "r",
      enqueueCopyImage: "r",
      enqueueCopyImageToBuffer: "r",
      enqueueCopyBufferToImage: "r",
      enqueueReadBuffer: "r",
      enqueueReadBufferRect: "r",
      enqueueReadImage: "r",
      enqueueWriteBuffer: "r",
      enqueueWriteBufferRect: "r",
      enqueueWriteImage: "r",
      enqueueNDRangeKernel: "r",
      enqueueMarker: "r",
      enqueueBarrier: "r",
      enqueueWaitForEvents: "r",
      finish: "r",
      flush: "r",
      getInfo: "r",
      release: "r",

      classDescription: "r"
    };
  }
  catch (e)
  {
    ERROR ("webclcommandqueue.jsm:WebCLCommandQueue failed: " + e);
    throw webclutils.convertCLException (e);
  }
}

WEBCLCLASSES.WebCLCommandQueue = WebCLCommandQueue;
WebCLCommandQueue.prototype = Object.create (Base.prototype);
WebCLCommandQueue.prototype.classDescription = "WebCLCommandQueue";




WebCLCommandQueue.prototype.enqueueCopyBuffer = function (srcBuffer, dstBuffer,
                                                          srcOffset, dstOffset, numBytes,
                                                          eventWaitList, eventOut)
{
  TRACE (this, "enqueueCopyBuffer", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    /*
    INVALID_VALUE -- if srcOffset, dstOffset, numBytes, srcOffset+numBytes, or dstOffset+numBytes require 
      accessing elements outside the srcBuffer and dstBuffer buffer objects respectively
    MEM_COPY_OVERLAP -- if srcBuffer and dstBuffer are the same WebCLBuffer object and the source and destination regions overlap
    MISALIGNED_SUB_BUFFER_OFFSET -- if srcBuffer or dstBuffer is a sub-buffer object and the offset specified when the sub-buffer
      object was created is not aligned to the DEVICE_MEM_BASE_ADDR_ALIGN value for the device associated with this WebCLCommandQueue
    */

    this._validateNumArgs(arguments.length, 5, 7);
    this._validateBuffer(srcBuffer, "srcBuffer");
    this._validateBuffer(dstBuffer, "dstBuffer");
    this._validateNonNegativeInt32(srcOffset, "srcOffset");
    this._validateNonNegativeInt32(dstOffset, "dstOffset");
    this._validateNonNegativeInt32(numBytes, "numBytes");
    this._validateEventOut(eventOut);

    var clSrcBuffer = this._unwrapInternalOrNull (srcBuffer);
    var clDstBuffer = this._unwrapInternalOrNull (dstBuffer);

    var clEventWaitList = [];
    if (eventWaitList)
    {
      clEventWaitList = this._convertEventWaitList (eventWaitList);
    }

    var ev = this._internal.enqueueCopyBuffer (clSrcBuffer, clDstBuffer,
                                               srcOffset, dstOffset, numBytes,
                                               clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLCommandQueue.prototype.enqueueCopyBufferRect = function (srcBuffer, dstBuffer,
                                                              srcOrigin, dstOrigin, region,
                                                              srcRowPitch, srcSlicePitch,
                                                              dstRowPitch, dstSlicePitch,
                                                              eventWaitList, eventOut)
{
  TRACE (this, "enqueueCopyBufferRect", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    this._validateNumArgs(arguments.length, 9, 11);
    this._validateBuffer(srcBuffer, "srcBuffer");
    this._validateBuffer(dstBuffer, "dstBuffer");
    this._validateNonNegativeInt32(srcRowPitch, "srcRowPitch");
    this._validateNonNegativeInt32(srcSlicePitch, "srcSlicePitch");
    this._validateNonNegativeInt32(dstRowPitch, "dstRowPitch");
    this._validateNonNegativeInt32(dstSlicePitch, "dstSlicePitch");
    this._validateEventOut(eventOut);

    if (!webclutils.validateArrayLength(srcOrigin, function(arr) { return arr.length === 3; }))
      throw new CLInvalidArgument ("srcOrigin");
    if (!webclutils.validateArrayLength(dstOrigin, function(arr) { return arr.length === 3; }))
      throw new CLInvalidArgument ("dstOrigin");
    if (!webclutils.validateArrayLength(region, function(arr) { return arr.length === 3; }))
      throw new CLInvalidArgument ("region");

    var clSrcBuffer = this._unwrapInternalOrNull (srcBuffer);
    var clDstBuffer = this._unwrapInternalOrNull (dstBuffer);

    var clEventWaitList = [];
    if (eventWaitList)
    {
      clEventWaitList = this._convertEventWaitList (eventWaitList);
    }

    var ev = this._internal.enqueueCopyBufferRect (clSrcBuffer, clDstBuffer,
                                                   srcOrigin, dstOrigin, region,
                                                   srcRowPitch, srcSlicePitch,
                                                   dstRowPitch, dstSlicePitch,
                                                   clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLCommandQueue.prototype.enqueueCopyImage = function (srcImage, dstImage,
                                                         srcOrigin, dstOrigin,
                                                         region,
                                                         eventWaitList, eventOut)
{
  TRACE (this, "enqueueCopyImage", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    this._validateNumArgs(arguments.length, 5, 7);
    this._validateImage(srcImage, "srcImage");
    this._validateImage(dstImage, "dstImage");
    this._validateEventOut(eventOut);

    var clSrcImage = this._unwrapInternalOrNull (srcImage);
    var clDstImage = this._unwrapInternalOrNull (dstImage);

    // TODO: validate srcOrigin, dstOrigin, region

    var clEventWaitList = [];
    if (eventWaitList)
    {
      clEventWaitList = this._convertEventWaitList (eventWaitList);
    }

    var ev = this._internal.enqueueCopyImage (clSrcImage, clDstImage,
                                              srcOrigin, dstOrigin, region,
                                              clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLCommandQueue.prototype.enqueueCopyImageToBuffer = function (srcImage, dstBuffer,
                                                                 srcOrigin, srcRegion, dstOffset,
                                                                 eventWaitList, eventOut)
{
  TRACE (this, "enqueueCopyImageToBuffer", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    this._validateNumArgs(arguments.length, 5, 7);
    this._validateImage(srcImage, "srcImage");
    this._validateBuffer(dstBuffer, "dstBuffer");
    this._validateNonNegativeInt32(dstOffset, "dstOffset");
    this._validateEventOut(eventOut);

    var clSrcImage = this._unwrapInternalOrNull (srcImage);
    var clDstBuffer = this._unwrapInternalOrNull (dstBuffer);

    // TODO: validate srcOrigin, srcRegion, dstOffset

    var clEventWaitList = [];
    if (eventWaitList)
    {
      clEventWaitList = this._convertEventWaitList (eventWaitList);
    }

    var ev = this._internal.enqueueCopyImageToBuffer (clSrcImage, clDstBuffer,
                                                      srcOrigin, srcRegion, dstOffset,
                                                      clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
}


WebCLCommandQueue.prototype.enqueueCopyBufferToImage = function (srcBuffer, dstImage,
                                                                 srcOffset, dstOrigin, dstRegion,
                                                                 eventWaitList, eventOut)
{
  TRACE (this, "enqueueCopyBufferToImage", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    this._validateNumArgs(arguments.length, 5, 7);
    this._validateBuffer(srcBuffer, "srcBuffer");
    this._validateImage(dstImage, "dstImage");
    this._validateNonNegativeInt32(srcOffset, "srcOffset");
    this._validateEventOut(eventOut);

    var clSrcBuffer = this._unwrapInternalOrNull (srcBuffer);
    var clDstImage = this._unwrapInternalOrNull (dstImage);

    // TODO: validate srcOffset, dstOrigin, region

    var clEventWaitList = [];
    if (eventWaitList)
    {
      clEventWaitList = this._convertEventWaitList (eventWaitList);
    }

    var ev = this._internal.enqueueCopyBufferToImage (clSrcBuffer, clDstImage,
                                                      srcOffset, dstOrigin, region,
                                                      clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLCommandQueue.prototype.enqueueReadBuffer = function (buffer, blockingRead,
                                                          bufferOffset, numBytes, hostPtr,
                                                          eventWaitList, eventOut)
{
  TRACE (this, "enqueueReadBuffer", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    /*
    INVALID_OPERATION -- if the blocking form of this function is called from a WebCLCallback
  x INVALID_CONTEXT -- if this WebCLCommandQueue is not associated with the same WebCLContext as buffer
  x INVALID_MEM_OBJECT -- if buffer is not a valid buffer object
  x INVALID_VALUE -- if any part of the region being read, specified by bufferOffset and numBytes, is out of bounds of buffer
  x INVALID_VALUE -- if any part of the region being written, specified by hostPtr and numBytes is out of bounds of hostPtr
  x INVALID_VALUE -- if numBytes % hostPtr.BYTES_PER_ELEMENT !== 0
    */

    this._validateNumArgs(arguments.length, 5, 7);
    this._validateBuffer(buffer, "buffer");
    this._validateBoolean(blockingRead, "blockingRead");
    this._validateNonNegativeInt32(bufferOffset, "bufferOffset");
    this._validateNonNegativeInt32(numBytes, "numBytes");
    this._validateArrayBufferView(hostPtr, "hostPtr");
    this._validateEventOut(eventOut);

    if (numBytes > hostPtr.byteLength)
      throw new INVALID_VALUE("numBytes = "+numBytes+" must not be greater than hostPtr.byteLength = ", hostPtr.byteLength);

    if (numBytes % hostPtr.BYTES_PER_ELEMENT !== 0)
      throw new INVALID_VALUE("'numBytes' = "+numBytes+" must be zero or a multiple of hostPtr.BYTES_PER_ELEMENT = ", hostPtr.BYTES_PER_ELEMENT);

    if ((range = bufferOffset + numBytes) > (bufferSize = buffer.getInfo(ocl_info.CL_MEM_SIZE)))
      throw new INVALID_VALUE("bufferOffset + numBytes = "+range+" must not be greater than buffer size = ", bufferSize);

    // TODO validate eventWaitList

    var clEventWaitList = [];
    if (eventWaitList) clEventWaitList = this._convertEventWaitList (eventWaitList);

    var clBuffer = this._unwrapInternalOrNull (buffer);
    var ev = this._internal.enqueueReadBuffer (clBuffer, blockingRead, bufferOffset, numBytes, hostPtr, clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLCommandQueue.prototype.enqueueReadBufferRect = function (buffer, blockingRead,
                                                              bufferOrigin, hostOrigin, region,
                                                              bufferRowPitch, bufferSlicePitch,
                                                              hostRowPitch, hostSlicePitch,
                                                              hostPtr,
                                                              eventWaitList, eventOut)
{
  TRACE (this, "enqueueReadBufferRect", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    this._validateNumArgs(arguments.length, 10, 12);

    this._validateBuffer(buffer, "buffer");
    this._validateBoolean(blockingRead, "blockingRead");
    this._validateNonNegativeInt32(bufferRowPitch, "bufferRowPitch");
    this._validateNonNegativeInt32(bufferSlicePitch, "bufferSlicePitch");
    this._validateNonNegativeInt32(hostRowPitch, "hostRowPitch");
    this._validateNonNegativeInt32(hostSlicePitch, "hostSlicePitch");
    this._validateArrayBufferView(hostPtr, "hostPtr");
    this._validateEventOut(eventOut);

    // TODO: validate bufferOrigin, hostOrigin, region, bufferRowPitch, bufferSlicePitch,
    //       hostRowPitch, hostSlicePitch, hostPtr

    // TODO validate eventWaitList

    var clEventWaitList = [];
    if (eventWaitList) clEventWaitList = this._convertEventWaitList (eventWaitList);

    var clBuffer = this._unwrapInternalOrNull (buffer);

    var ev = this._internal.enqueueReadBufferRect (clBuffer, !!blockingRead,
                                                  bufferOrigin, hostOrigin, region,
                                                  bufferRowPitch, bufferSlicePitch,
                                                  hostRowPitch, hostSlicePitch,
                                                  hostPtr,
                                                  clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLCommandQueue.prototype.enqueueReadImage = function (image, blockingRead,
                                                         origin, region, hostRowPitch,
                                                         hostPtr, eventWaitList, eventOut)
{
  TRACE (this, "enqueueReadImage", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    /*
    INVALID_OPERATION -- if the blocking form of this function is called from a WebCLCallback
  x INVALID_CONTEXT -- if this WebCLCommandQueue is not associated with the same WebCLContext as image
  x INVALID_MEM_OBJECT -- if image is not a valid WebCLImage object
    INVALID_IMAGE_SIZE -- if the image dimensions of image are not supported by this WebCLCommandQueue
  x INVALID_VALUE -- if origin or region does not have exactly two elements
  x INVALID_VALUE -- if any part of the region being read, specified by origin and region, is out of bounds of image
  x INVALID_VALUE -- if any part of the region being written, specified by region and hostRowPitch, is out of bounds of hostPtr
  x INVALID_VALUE -- if hostRowPitch % hostPtr.BYTES_PER_ELEMENT !== 0
    */

    this._validateNumArgs(arguments.length, 6, 8);
    this._validateImage(image, "image");
    this._validateBoolean(blockingRead, "blockingRead");
    this._validateNonNegativeInt32(hostRowPitch, "hostRowPitch");
    this._validateArrayBufferView(hostPtr, "hostPtr");
    this._validateEventOut(eventOut);

    if (!webclutils.validateArrayLength(origin, function(arr) { return arr.length === 2; }))
      throw new INVALID_VALUE("'origin' must be an Array with exactly two elements; was ", origin);

    if (!webclutils.validateArrayLength(region, function(arr) { return arr.length === 2; }))
      throw new INVALID_VALUE("'region' must be an Array with exactly two elements; was ", region);

    if (!webclutils.validateArray(origin, webclutils.validateNonNegativeInt32))
      throw new INVALID_VALUE("'origin' must be an Array of integers in [0, 2^32); was ", origin);

    if (!webclutils.validateArray(region, webclutils.validateNonNegativeInt32))
      throw new INVALID_VALUE("'region' must be an Array of integers in [0, 2^32); was ", region);

    if (hostRowPitch !== 0 && hostRowPitch % hostPtr.BYTES_PER_ELEMENT !== 0)
      throw new INVALID_VALUE("'hostRowPitch' = "+hostRowPitch+" must be zero or a multiple of hostPtr.BYTES_PER_ELEMENT = ", hostPtr.BYTES_PER_ELEMENT);

    if (hostRowPitch !== 0 && (regionSize = hostRowPitch*region[1]) > hostPtr.byteLength)
      throw new INVALID_VALUE("hostRowPitch * region[1] = "+regionSize+" must not be greater than hostPtr.byteLength = ", hostPtr.byteLength);

    var descriptor = image.getInfo();
    var width = descriptor.width;
    var height = descriptor.height;
    var rowPitch = descriptor.rowPitch;
    var numChannels = webclutils.getNumChannels(descriptor);

    if (origin[0] + region[0] > width || origin[1] + region[1] > height)
      throw new INVALID_VALUE("area specified by 'origin' and 'region' must fit inside image; image [width, height] = ", [width, height]);

    if (hostRowPitch !== 0 && hostRowPitch < rowPitch)
      throw new INVALID_VALUE("'hostRowPitch' = "+hostRowPitch+" must not be less than image.getInfo().rowPitch = ", rowPitch);

    if (hostRowPitch === 0 && (regionSize = region[0]*region[1]*numChannels) > hostPtr.length)
      throw new INVALID_VALUE("region[0] * region[1] * numChannels = "+regionSize+" must not be greater than hostPtr.length = ", hostPtr.length);

    // TODO validate eventWaitList

    var clEventWaitList = [];
    if (eventWaitList) clEventWaitList = this._convertEventWaitList (eventWaitList);

    var clImage = this._unwrapInternalOrNull (image);
    var clOrigin = [ origin[0], origin[1], 0 ];
    var clRegion = [ region[0], region[1], 1 ];
    var hostSlicePitch = 0;
    var ev = this._internal.enqueueReadImage (clImage, blockingRead, clOrigin, clRegion, hostRowPitch, hostSlicePitch, hostPtr, clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLCommandQueue.prototype.enqueueWriteBuffer = function (buffer,         // WebCLBuffer
                                                           blockingWrite,  // CLboolean
                                                           bufferOffset,   // CLuint
                                                           numBytes,       // CLuint
                                                           hostPtr,        // ArrayBufferView
                                                           eventWaitList,  // sequence<WebCLEvent>?
                                                           eventOut)       // optional WebCLEvent?
{
  TRACE (this, "enqueueWriteBuffer", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    /*
    INVALID_OPERATION -- if the blocking form of this function is called from a WebCLCallback
  x INVALID_CONTEXT -- if this WebCLCommandQueue is not associated with the same WebCLContext as buffer
  x INVALID_MEM_OBJECT -- if buffer is not a valid buffer object
  x INVALID_VALUE -- if any part of the region being written, specified by bufferOffset and numBytes, is out of bounds of buffer
  x INVALID_VALUE -- if any part of the region being read, specified by hostPtr and numBytes, is out of bounds of hostPtr
  x INVALID_VALUE -- if numBytes % hostPtr.BYTES_PER_ELEMENT !== 0
    */
    this._validateNumArgs(arguments.length, 5, 7);
    this._validateBuffer(buffer, "buffer");
    this._validateBoolean(blockingWrite, "blockingWrite");
    this._validateNonNegativeInt32(bufferOffset, "bufferOffset");
    this._validateNonNegativeInt32(numBytes, "numBytes");
    this._validateArrayBufferView(hostPtr, "hostPtr");
    this._validateEventOut(eventOut);

    if (numBytes > hostPtr.byteLength)
      throw new INVALID_VALUE("numBytes = "+numBytes+" must not be greater than hostPtr.byteLength = ", hostPtr.byteLength);

    if (numBytes % hostPtr.BYTES_PER_ELEMENT !== 0)
      throw new INVALID_VALUE("'numBytes' = "+numBytes+" must be zero or a multiple of hostPtr.BYTES_PER_ELEMENT = ", hostPtr.BYTES_PER_ELEMENT);

    if ((range = bufferOffset + numBytes) > (bufferSize = buffer.getInfo(ocl_info.CL_MEM_SIZE)))
      throw new INVALID_VALUE("bufferOffset + numBytes = "+range+" must not be greater than buffer size = ", bufferSize);

    // TODO: validate eventWaitList

    var clEventWaitList = [];
    if (eventWaitList) clEventWaitList = this._convertEventWaitList (eventWaitList);

    var clBuffer = this._unwrapInternalOrNull (buffer);
    var ev = this._internal.enqueueWriteBuffer (clBuffer, blockingWrite, bufferOffset, numBytes, hostPtr, clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLCommandQueue.prototype.enqueueWriteBufferRect = function (buffer, 
                                                               blockingWrite,
                                                               bufferOrigin,
                                                               hostOrigin,
                                                               region,
                                                               bufferRowPitch,
                                                               bufferSlicePitch,
                                                               hostRowPitch,
                                                               hostSlicePitch,
                                                               hostPtr,
                                                               eventWaitList,
                                                               eventOut)
{
  TRACE (this, "enqueueWriteBufferRect", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    this._validateNumArgs(arguments.length, 10, 12);
    this._validateBuffer(buffer, "buffer");
    this._validateBoolean(blockingWrite, "blockingWrite");
    this._validateNonNegativeInt32(bufferRowPitch, "bufferRowPitch");
    this._validateNonNegativeInt32(bufferSlicePitch, "bufferSlicePitch");
    this._validateNonNegativeInt32(hostRowPitch, "hostRowPitch");
    this._validateNonNegativeInt32(hostSlicePitch, "hostSlicePitch");
    this._validateArrayBufferView(hostPtr, "hostPtr");
    this._validateEventOut(eventOut);

    var clBuffer = this._unwrapInternalOrNull (buffer);

    // TODO: validate bufferOrigin, hostOrigin, region, bufferRowPitch, bufferSlicePitch,
    //       hostRowPitch, hostSlicePitch, hostPtr

    var clEventWaitList = [];
    if (eventWaitList) clEventWaitList = this._convertEventWaitList (eventWaitList);

    var ev = this._internal.enqueueWriteBufferRect (clBuffer, !!blockingWrite,
                                                    bufferOrigin, hostOrigin, region,
                                                    bufferRowPitch, bufferSlicePitch,
                                                    hostRowPitch, hostSlicePitch,
                                                    hostPtr,
                                                    clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLCommandQueue.prototype.enqueueWriteImage = function (image, 
                                                          blockingWrite,
                                                          origin,
                                                          region,
                                                          hostRowPitch,
                                                          hostPtr,
                                                          eventWaitList,
                                                          eventOut)
{
  TRACE (this, "enqueueWriteImage", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    this._validateNumArgs(arguments.length, 6, 8);
    this._validateImage(image, "image");
    this._validateBoolean(blockingWrite, "blockingWrite");
    this._validateNonNegativeInt32(hostRowPitch, "hostRowPitch");
    this._validateArrayBufferView(hostPtr, "hostPtr");
    this._validateEventOut(eventOut);

    if (!webclutils.validateArrayLength(origin, function(arr) { return arr.length === 2; }))
      throw new INVALID_VALUE("'origin' must be an Array with exactly two elements; was ", origin);

    if (!webclutils.validateArrayLength(region, function(arr) { return arr.length === 2; }))
      throw new INVALID_VALUE("'region' must be an Array with exactly two elements; was ", region);

    if (!webclutils.validateArray(origin, webclutils.validateNonNegativeInt32))
      throw new INVALID_VALUE("'origin' must be an Array of integers in [0, 2^32); was ", origin);

    if (!webclutils.validateArray(region, webclutils.validateNonNegativeInt32))
      throw new INVALID_VALUE("'region' must be an Array of integers in [0, 2^32); was ", region);

    if (hostRowPitch !== 0 && hostRowPitch % hostPtr.BYTES_PER_ELEMENT !== 0)
      throw new INVALID_VALUE("'hostRowPitch' = "+hostRowPitch+" must be zero or a multiple of hostPtr.BYTES_PER_ELEMENT = ", hostPtr.BYTES_PER_ELEMENT);

    if (hostRowPitch !== 0 && (regionSize = hostRowPitch*region[1]) > hostPtr.byteLength)
      throw new INVALID_VALUE("hostRowPitch * region[1] = "+regionSize+" must not be greater than hostPtr.byteLength = ", hostPtr.byteLength);

    var descriptor = image.getInfo();
    var width = descriptor.width;
    var height = descriptor.height;
    var rowPitch = descriptor.rowPitch;
    var numChannels = webclutils.getNumChannels(descriptor);

    if (origin[0] + region[0] > width || origin[1] + region[1] > height)
      throw new INVALID_VALUE("area specified by 'origin' and 'region' must fit inside image; image [width, height] = ", [width, height]);

    if (hostRowPitch !== 0 && hostRowPitch < rowPitch)
      throw new INVALID_VALUE("'hostRowPitch' = "+hostRowPitch+" must not be less than image.getInfo().rowPitch = ", rowPitch);

    if (hostRowPitch === 0 && (regionSize = region[0]*region[1]*numChannels) > hostPtr.length)
      throw new INVALID_VALUE("region[0] * region[1] * numChannels = "+regionSize+" must not be greater than hostPtr.length = ", hostPtr.length);

    var clImage = this._unwrapInternalOrNull (image);

    // TODO: validate origin, region, hostRowPitch, hostPtr

    var clEventWaitList = [];
    if (eventWaitList) clEventWaitList = this._convertEventWaitList (eventWaitList);

    var ev = this._internal.enqueueWriteImage (clImage, !!blockingWrite,
                                               origin, region,
                                               hostRowPitch, 0,
                                               hostPtr,
                                               clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLCommandQueue.prototype.enqueueNDRangeKernel = function (kernel,
                                                             workDim,
                                                             globalWorkOffset,
                                                             globalWorkSize,
                                                             localWorkSize,
                                                             eventWaitList,
                                                             eventOut)
{
  TRACE (this, "enqueueNDRangeKernel", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    /*
    x INVALID_CONTEXT -- if this WebCLCommandQueue is not associated with the same WebCLContext as kernel
      INVALID_CONTEXT -- if this WebCLCommandQueue is not associated with the same WebCLContext as all events in eventWaitList
    x INVALID_KERNEL -- if kernel is not a valid WebCLKernel object
      INVALID_PROGRAM_EXECUTABLE -- if there is no successfully built program executable of kernel available for 
         the device associated with this WebCLCommandQueue
      INVALID_KERNEL_ARGS -- if any kernel argument values have not been specified for kernel
    x INVALID_WORK_DIMENSION -- if workDim is not equal to 1, 2, or 3

    x INVALID_GLOBAL_WORK_SIZE -- if globalWorkSize.length != workDim
    x INVALID_GLOBAL_WORK_SIZE -- if globalWorkSize[i] > 2^32-1 for any i

    x INVALID_GLOBAL_OFFSET -- if globalWorkOffset != null && (globalWorkOffset.length != workDim)
    x INVALID_GLOBAL_OFFSET -- if globalWorkOffset != null && (globalWorkSize[i] + globalWorkOffset[i] > 2^32-1) for any i

    x INVALID_WORK_GROUP_SIZE -- if localWorkSize != null && (localWorkSize.length != workDim)
    x INVALID_WORK_GROUP_SIZE -- if localWorkSize != null && (globalWorkSize[i] % localWorkSize[i] !== 0) for any i
      INVALID_WORK_GROUP_SIZE -- if localWorkSize != null && (localWorkSize[i] !== requiredSize[i]) for any i,
         where requiredSize is specified using the reqd_work_group_size qualifier in kernel source
    x INVALID_WORK_GROUP_SIZE -- if localWorkSize != null and the total number of work-items in a work-group (that is, the
         product of all elements in localWorkSize) is greater than the value of DEVICE_MAX_WORK_GROUP_SIZE
         queried from the device associated with this queue
      INVALID_WORK_GROUP_SIZE -- if localWorkSize == null and the reqd_work_group_size qualifier is present in kernel source

    x INVALID_WORK_ITEM_SIZE -- if localWorkSize != null && (localWorkSize[i] > DEVICE_MAX_WORK_ITEM_SIZES[i]) for any i

      INVALID_IMAGE_SIZE -- if an image object is specified as an argument to kernel, and the image dimensions 
         (width, height, pitch) are not supported by the device associated with this queue
      MEM_OBJECT_ALLOCATION_FAILURE -- if there is a failure to allocate memory for data store associated with image or buffer
         objects specified as arguments to kernel
      INVALID_EVENT_WAIT_LIST -- if any event in eventWaitList is invalid
    x INVALID_EVENT -- if event is not a newly created empty WebCLEvent
    */

    this._validateNumArgs(arguments.length, 4, 7);
    this._validateKernel(kernel, "kernel");
    this._validateEventOut(eventOut);

    if (!webclutils.validateInteger(workDim) || !(workDim === 1 || workDim === 2 || workDim === 3))
      throw new CLError(ocl_errors.CL_INVALID_WORK_DIMENSION, "'workDim' must be 1, 2, or 3; was " + workDim);

    this._validateArray (globalWorkSize, workDim, webclutils.validatePositiveInt32,
                         ocl_errors.CL_INVALID_GLOBAL_WORK_SIZE, "globalWorkSize", "integers in [1, 2^32)");

    this._validateArrayOrNull (localWorkSize, workDim, webclutils.validatePositiveInt32, 
                               ocl_errors.CL_INVALID_WORK_GROUP_SIZE, "localWorkSize", "integers in [1, 2^32)");

    this._validateArrayOrNull (globalWorkOffset, workDim, webclutils.validateNonNegativeInt32, 
                               ocl_errors.CL_INVALID_GLOBAL_OFFSET, "globalWorkOffset", "integers in [0, 2^32)");

    var maxGlobalOffset = globalWorkSize.map(function(val, i) { return val + (globalWorkOffset && globalWorkOffset[i] || 0); });

    this._validateArrayOrNull (maxGlobalOffset, workDim, webclutils.validatePositiveInt32, 
                               ocl_errors.CL_INVALID_GLOBAL_OFFSET, "globalWorkOffset+globalWorkSize", "integers in [1, 2^32)");

    if (localWorkSize) {
      var globalModLocal = globalWorkSize.map(function(val, i) { return val % localWorkSize[i]; });

      this._validateArrayOrNull (globalModLocal, workDim, function(i) { return i===0; },
                                 ocl_errors.CL_INVALID_WORK_GROUP_SIZE, "globalWorkSize % localWorkSize", "zeros");

      var device = this.getInfo(ocl_info.CL_QUEUE_DEVICE);
      var maxWorkItems = device.getInfo(ocl_info.CL_DEVICE_MAX_WORK_GROUP_SIZE);
      var maxWorkItemSizes = device.getInfo(ocl_info.CL_DEVICE_MAX_WORK_ITEM_SIZES);
      var numWorkItems = localWorkSize.reduce(function(acc, item) { return acc*item; }, 1);

      localWorkSize.forEach(function(val, i) {
        if (val > maxWorkItemSizes[i])
          throw new CLError(ocl_errors.CL_INVALID_WORK_ITEM_SIZE, "localWorkSize["+i+"] must not exceed " +
                            maxWorkItemSizes[i] + " on this WebCLDevice; was " + val);
      });

      if (numWorkItems > maxWorkItems)
        throw new CLError(ocl_errors.CL_INVALID_WORK_GROUP_SIZE, "the product over localWorkSize[i] can be at most " +
                          maxWorkItems + " on this WebCLDevice; was " + numWorkItems);
    }

    var clKernel = this._unwrapInternalOrNull (kernel);
    var clEventWaitList = [];
    if (eventWaitList)
    {
      clEventWaitList = this._convertEventWaitList (eventWaitList);
    }

    var ev = this._internal.enqueueNDRangeKernel (clKernel, workDim,
                                                  globalWorkOffset, globalWorkSize, localWorkSize,
                                                  clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLCommandQueue.prototype.enqueueMarker = function (eventOut)
{
  TRACE (this, "enqueueMarker", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    this._validateNumArgs(arguments.length, 1);
    this._validateEventOut(eventOut);

    var ev = this._internal.enqueueMarker ();
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLCommandQueue.prototype.enqueueBarrier = function ()
{
  TRACE (this, "enqueueBarrier", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    this._validateNumArgs(arguments.length, 0);

    this._internal.enqueueBarrier ();
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLCommandQueue.prototype.enqueueWaitForEvents = function (eventWaitList)
{
  TRACE (this, "enqueueWaitForEvents", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    this._validateNumArgs(arguments.length, 1);

    if (!Array.isArray(eventWaitList))
    {
      throw new CLInvalidArgument ("eventWaitList.");
    }

    var clEvents = this._convertEventWaitList (eventWaitList);
    this._internal.enqueueWaitForEvents (clEvents);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLCommandQueue.prototype.finish = function ()
{
  TRACE (this, "finish", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    this._validateNumArgs(arguments.length, 0);

    this._internal.finish ();
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLCommandQueue.prototype.flush = function ()
{
  TRACE (this, "flush", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    this._validateNumArgs(arguments.length, 0);

    this._internal.flush ();
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLCommandQueue.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    this._validateNumArgs(arguments.length, 1);
    this._validatePositiveInt32(name, "name");

    switch (name)
    {
    case ocl_info.CL_QUEUE_CONTEXT:
    case ocl_info.CL_QUEUE_DEVICE:
    case ocl_info.CL_QUEUE_PROPERTIES:
      var clInfoItem = this._internal.getInfo (name);
      return this._wrapInternal (clInfoItem);
    default:
      throw new INVALID_VALUE("'name' must be one of the accepted CLenums; was ", name);
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};



//------------------------------------------------------------------------------
// Internal functions


WebCLCommandQueue.prototype._validateNumArgs = function (numArgs, minArgs, maxArgs)
{
  if (arguments.length === 2 && numArgs !== minArgs)
    throw new CLSyntaxError("Expected " + minArgs + " arguments, received " + numArgs);

  if (arguments.length === 3 && (numArgs < minArgs || numArgs > maxArgs))
    throw new CLSyntaxError("Expected between " + minArgs + " and " + maxArgs + " arguments, received " + numArgs);
};


WebCLCommandQueue.prototype._validateKernel = function (kernel, varName)
{
  if (!webclutils.validateKernel(kernel))
    throw new INVALID_KERNEL(varName + " must be a valid WebCLKernel object; was ", kernel);

  if (this.getInfo(ocl_info.CL_QUEUE_CONTEXT) !== kernel.getInfo(ocl_info.CL_KERNEL_CONTEXT))
    throw new INVALID_CONTEXT(varName + " and this WebCLCommandQueue must have the same WebCLContext");

  var device = this.getInfo(ocl_info.CL_QUEUE_DEVICE);
  var program = kernel.getInfo(ocl_info.CL_KERNEL_PROGRAM);
  var status = program.getBuildInfo(device, ocl_info.CL_PROGRAM_BUILD_STATUS);

  if (status !== ocl_const.CL_BUILD_SUCCESS)
    throw new INVALID_PROGRAM_EXECUTABLE(varName + " has not yet been successfully built for the target device");
};


WebCLCommandQueue.prototype._validateBuffer = function (buffer, varName)
{
  if (!webclutils.validateBuffer(buffer))
    throw new INVALID_MEM_OBJECT(varName + " must be a valid WebCLBuffer object; was ", buffer);

  if (this.getInfo(ocl_info.CL_QUEUE_CONTEXT) !== buffer.getInfo(ocl_info.CL_MEM_CONTEXT))
    throw new INVALID_CONTEXT(varName + " and this WebCLCommandQueue must have the same WebCLContext");
};


WebCLCommandQueue.prototype._validateImage = function (image, varName)
{
  if (!webclutils.validateImage(image))
    throw new INVALID_MEM_OBJECT(varName + " must be a valid WebCLImage object; was ", image);

  if (this.getInfo(ocl_info.CL_QUEUE_CONTEXT) !== image.getInfo(ocl_info.CL_MEM_CONTEXT))
    throw new INVALID_CONTEXT(varName + " and this WebCLCommandQueue must have the same WebCLContext");
};


WebCLCommandQueue.prototype._validateBoolean = function (value, varName)
{
  if (!webclutils.validateBoolean(value))
    throw new INVALID_VALUE(varName + " must be a boolean; was ", value);
};


WebCLCommandQueue.prototype._validateNonNegativeInt32 = function (value, varName)
{
  if (!webclutils.validateNonNegativeInt32(value))
    throw new INVALID_VALUE(varName + " must be non-negative and less than 2^32; was ", value);
};


WebCLCommandQueue.prototype._validatePositiveInt32 = function (value, varName)
{
  if (!webclutils.validatePositiveInt32(value))
    throw new INVALID_VALUE(varName + " must be greater than zero and less than 2^32; was ", value);
};


WebCLCommandQueue.prototype._validateArrayBufferView = function (value, varName)
{
  if (!webclutils.validateArrayBufferView(value))
    throw new INVALID_VALUE(varName + " must be an instance of ArrayBufferView, was ", value);
};


WebCLCommandQueue.prototype._validateArrayOrNull = function(arr, length, elementValidator, errCode, varName, elementRequirementMsg)
{
  if (arr !== null && arr !== undefined)
    this._validateArray(arr, length, elementValidator, errCode, varName, elementRequirementMsg);
};


WebCLCommandQueue.prototype._validateArray = function(arr, length, elementValidator, errCode, varName, elementRequirementMsg)
{
  if (!Array.isArray(arr))
    throw new CLError(errCode, varName + " must be an Array; was " + typeof(arr));

  if (!webclutils.validateArrayLength(arr, function() { return arr.length === length; }))
    throw new CLError(errCode, varName + " must have exactly " + length + " elements; had " + arr.length);

  if (!webclutils.validateArray(arr, elementValidator))
    throw new CLError(errCode, varName + " must only contain " + elementRequirementMsg);
};


WebCLCommandQueue.prototype._validateEventOut = function (eventOut)
{
  TRACE (this, "_validateEventOut", arguments);
  if (eventOut === undefined) eventOut = null;

  if (eventOut !== null && eventOut instanceof WEBCLCLASSES.WebCLUserEvent)
    throw new INVALID_EVENT("'event' must be a newly created empty WebCLEvent; was a WebCLUserEvent");

  if (eventOut !== null && !webclutils.validateEvent(eventOut))
    throw new INVALID_EVENT("'event' must be a newly created empty WebCLEvent; was " + eventOut);

  if (eventOut !== null && !webclutils.validateEventNotReleased(eventOut))
    throw new INVALID_EVENT("'event' must be a newly created empty WebCLEvent; was already released");

  if (eventOut !== null && !webclutils.validateEventEmpty(eventOut))
    throw new INVALID_EVENT("'event' must be a newly created empty WebCLEvent; was already populated");
};


WebCLCommandQueue.prototype._handleEventOut = function (clEvent, webclEvent)
{
  TRACE (this, "_handleEventOut", arguments);
  if (!clEvent) return;

  if (webclEvent)
  {
    var unwrappedEvent = webclEvent.wrappedJSObject;
    unwrappedEvent._internal = clEvent;
    unwrappedEvent._identity = clEvent.getIdentity();
    this._owner._registerObject (webclEvent);
  }
  else
  {
    // Internal event must be released if it's not going to being used.
    clEvent.release ();
  }
};


WebCLCommandQueue.prototype._convertEventWaitList = function (eventWaitList)
{
  TRACE (this, "_convertEventWaitList", arguments);
  var clEvents = [];
  for (var i = 0; i < eventWaitList.length; ++i)
  {
    var p = this._unwrapInternalOrNull (eventWaitList[i]);
    if (!webclutils.validateEventPopulated (p))
    {
      // TODO: handle errors better...
      throw new CLInvalidArgument ("eventWaitList[" + i + "].");
    }
    clEvents.push (p);
  }

  return clEvents;
};


} catch(e) { ERROR ("webclcommandqueue.jsm: "+e); }
