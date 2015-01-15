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
Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/webclutils.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/common.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/base.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/mixin.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/mixins/owner.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_exception.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/webclclasses.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/webclasyncworkerapi.jsm");


function WebCLCommandQueue ()
{
  TRACE (this, "WebCLCommandQueue", arguments);
  try {
    if (!(this instanceof WebCLCommandQueue)) return new WebCLCommandQueue ();

    Base.apply(this);

    this.wrappedJSObject = this;

    this.exceptionType = INVALID_COMMAND_QUEUE;

    this._objectRegistryInternal = {};
    this._objectRegistry = {};

    this.__exposedProps__ =
    {
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
    throw e;
  }
}

WEBCLCLASSES.WebCLCommandQueue = WebCLCommandQueue;
WebCLCommandQueue.prototype = Object.create (Base.prototype);
addMixin (WebCLCommandQueue.prototype, OwnerMixin);
WebCLCommandQueue.prototype.classDescription = "WebCLCommandQueue";




WebCLCommandQueue.prototype.enqueueCopyBuffer = function (srcBuffer, dstBuffer,
                                                          srcOffset, dstOffset, numBytes,
                                                          eventWaitList, eventOut)
{
  TRACE (this, "enqueueCopyBuffer", arguments);

  try
  {
    this._ensureValidObject();

    eventWaitList = webclutils.unray(eventWaitList);

    this._validateNumArgs(arguments.length, 5, 7);
    this._validateBuffer(srcBuffer, "srcBuffer");
    this._validateBuffer(dstBuffer, "dstBuffer");
    this._validateNonNegativeInt32(srcOffset, "srcOffset");
    this._validateNonNegativeInt32(dstOffset, "dstOffset");
    this._validateNonNegativeInt32(numBytes, "numBytes");
    this._validatePositiveInt32(numBytes, "numBytes");
    this._validateEventWaitList(eventWaitList);
    this._validateEventOut(eventOut);

    var srcBufferByteLength = srcBuffer.getInfo(ocl_info.CL_MEM_SIZE);
    var dstBufferByteLength = srcBuffer.getInfo(ocl_info.CL_MEM_SIZE);

    this._validateRegionBounds1D(srcOffset, numBytes, srcBufferByteLength, "srcBuffer");
    this._validateRegionBounds1D(dstOffset, numBytes, dstBufferByteLength, "dstBuffer");
    this._validateRegionsDisjoint1D(srcBuffer, dstBuffer, srcOffset, dstOffset, numBytes);

    var clSrcBuffer = this._unwrapInternalOrNull (srcBuffer);
    var clDstBuffer = this._unwrapInternalOrNull (dstBuffer);
    var clEventWaitList = this._unwrapArrayOrNull (eventWaitList);

    var ev = this._internal.enqueueCopyBuffer (clSrcBuffer, clDstBuffer,
                                               srcOffset, dstOffset, numBytes,
                                               clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
  }
};


WebCLCommandQueue.prototype.enqueueCopyBufferRect = function (srcBuffer, dstBuffer,
                                                              srcOrigin, dstOrigin, region,
                                                              srcRowPitch, srcSlicePitch,
                                                              dstRowPitch, dstSlicePitch,
                                                              eventWaitList, eventOut)
{
  TRACE (this, "enqueueCopyBufferRect", arguments);

  try
  {
    this._ensureValidObject();

    srcOrigin = webclutils.unray(srcOrigin);
    dstOrigin = webclutils.unray(dstOrigin);
    region = webclutils.unray(region);
    eventWaitList = webclutils.unray(eventWaitList);

    this._validateNumArgs(arguments.length, 9, 11);
    this._validateBuffer(srcBuffer, "srcBuffer");
    this._validateBuffer(dstBuffer, "dstBuffer");
    this._validateArray3D(srcOrigin, "srcOrigin");
    this._validateArray3D(dstOrigin, "dstOrigin");
    this._validatePositiveIntArray3D(region, "region");
    this._validateNonNegativeInt32(srcRowPitch, "srcRowPitch");
    this._validateNonNegativeInt32(srcSlicePitch, "srcSlicePitch");
    this._validateNonNegativeInt32(dstRowPitch, "dstRowPitch");
    this._validateNonNegativeInt32(dstSlicePitch, "dstSlicePitch");
    this._validateEventWaitList(eventWaitList);
    this._validateEventOut(eventOut);

    var srcRowPitch = srcRowPitch || region[0];
    var srcSlicePitch = srcSlicePitch || (region[1] * srcRowPitch);
    var srcByteLength = srcBuffer.getInfo(ocl_info.CL_MEM_SIZE);

    this._validatePitch(srcRowPitch, region[0], "srcRowPitch");
    this._validatePitch(srcSlicePitch, region[1] * srcRowPitch, "srcSlicePitch");
    this._validateRegionBounds3D(srcOrigin, region, srcRowPitch, srcSlicePitch, srcByteLength, "srcBuffer");

    var dstRowPitch = dstRowPitch || region[0];
    var dstSlicePitch = dstSlicePitch || (region[1] * dstRowPitch);
    var dstByteLength = dstBuffer.getInfo(ocl_info.CL_MEM_SIZE);

    this._validatePitch(dstRowPitch, region[0], "dstRowPitch");
    this._validatePitch(dstSlicePitch, region[1] * dstRowPitch, "dstSlicePitch");
    this._validateRegionBounds3D(dstOrigin, region, dstRowPitch, dstSlicePitch, dstByteLength, "dstBuffer");

    this._validateRegionsDisjoint3D(srcBuffer, dstBuffer, 
                                    srcOrigin, dstOrigin, region,
                                    srcRowPitch, dstRowPitch,
                                    srcSlicePitch, dstSlicePitch);

    var clSrcBuffer = this._unwrapInternalOrNull (srcBuffer);
    var clDstBuffer = this._unwrapInternalOrNull (dstBuffer);
    var clEventWaitList = this._unwrapArrayOrNull (eventWaitList);

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
    throw e;
  }
};


WebCLCommandQueue.prototype.enqueueCopyImage = function (srcImage, dstImage,
                                                         srcOrigin, dstOrigin, region,
                                                         eventWaitList, eventOut)
{
  TRACE (this, "enqueueCopyImage", arguments);

  try
  {
    this._ensureValidObject();

    srcOrigin = webclutils.unray(srcOrigin);
    dstOrigin = webclutils.unray(dstOrigin);
    region = webclutils.unray(region);
    eventWaitList = webclutils.unray(eventWaitList);

    this._validateNumArgs(arguments.length, 5, 7);
    this._validateImage(srcImage, "srcImage");
    this._validateImage(dstImage, "dstImage");
    this._validateArray2D(srcOrigin, "srcOrigin");
    this._validateArray2D(dstOrigin, "dstOrigin");
    this._validatePositiveIntArray2D(region, "region");
    this._validateEventWaitList(eventWaitList);
    this._validateEventOut(eventOut);

    var clSrcImage = this._unwrapInternalOrNull (srcImage);
    var clDstImage = this._unwrapInternalOrNull (dstImage);
    var clSrcOrigin = [ srcOrigin[0], srcOrigin[1], 0 ];
    var clDstOrigin = [ dstOrigin[0], dstOrigin[1], 0 ];
    var clRegion = [ region[0], region[1], 1 ];
    var clEventWaitList = this._unwrapArrayOrNull (eventWaitList);

    var ev = this._internal.enqueueCopyImage (clSrcImage, clDstImage,
                                              clSrcOrigin, clDstOrigin, clRegion,
                                              clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
  }
};


WebCLCommandQueue.prototype.enqueueCopyImageToBuffer = function (srcImage, dstBuffer,
                                                                 srcOrigin, srcRegion, dstOffset,
                                                                 eventWaitList, eventOut)
{
  TRACE (this, "enqueueCopyImageToBuffer", arguments);

  try
  {
    this._ensureValidObject();

    srcOrigin = webclutils.unray(srcOrigin);
    srcRegion = webclutils.unray(srcRegion);
    eventWaitList = webclutils.unray(eventWaitList);

    this._validateNumArgs(arguments.length, 5, 7);
    this._validateImage(srcImage, "srcImage");
    this._validateBuffer(dstBuffer, "dstBuffer");
    this._validateArray2D(srcOrigin, "srcOrigin");
    this._validatePositiveIntArray2D(srcRegion, "srcRegion");
    this._validateNonNegativeInt32(dstOffset, "dstOffset");
    this._validateEventWaitList(eventWaitList);
    this._validateEventOut(eventOut);

    var clSrcImage = this._unwrapInternalOrNull (srcImage);
    var clDstBuffer = this._unwrapInternalOrNull (dstBuffer);
    var clSrcOrigin = [ srcOrigin[0], srcOrigin[1], 0 ];
    var clSrcRegion = [ srcRegion[0], srcRegion[1], 1 ];
    var clEventWaitList = this._unwrapArrayOrNull (eventWaitList);

    var ev = this._internal.enqueueCopyImageToBuffer (clSrcImage, clDstBuffer,
                                                      clSrcOrigin, clSrcRegion, dstOffset,
                                                      clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
  }
}


WebCLCommandQueue.prototype.enqueueCopyBufferToImage = function (srcBuffer, dstImage,
                                                                 srcOffset, dstOrigin, dstRegion,
                                                                 eventWaitList, eventOut)
{
  TRACE (this, "enqueueCopyBufferToImage", arguments);

  try
  {
    this._ensureValidObject();

    dstOrigin = webclutils.unray(dstOrigin);
    dstRegion = webclutils.unray(dstRegion);
    eventWaitList = webclutils.unray(eventWaitList);

    this._validateNumArgs(arguments.length, 5, 7);
    this._validateBuffer(srcBuffer, "srcBuffer");
    this._validateImage(dstImage, "dstImage");
    this._validateNonNegativeInt32(srcOffset, "srcOffset");
    this._validateArray2D(dstOrigin, "dstOrigin");
    this._validatePositiveIntArray2D(dstRegion, "dstRegion");
    this._validateEventWaitList(eventWaitList);
    this._validateEventOut(eventOut);

    var clSrcBuffer = this._unwrapInternalOrNull (srcBuffer);
    var clDstImage = this._unwrapInternalOrNull (dstImage);
    var clDstOrigin = [ dstOrigin[0], dstOrigin[1], 0 ];
    var clDstRegion = [ dstRegion[0], dstRegion[1], 1 ];
    var clEventWaitList = this._unwrapArrayOrNull (eventWaitList);

    var ev = this._internal.enqueueCopyBufferToImage (clSrcBuffer, clDstImage,
                                                      srcOffset, clDstOrigin, clDstRegion,
                                                      clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
  }
};


// TODO investigate crashes on Intel CPU driver with certain (invalid?) arguments!
//
WebCLCommandQueue.prototype.enqueueReadBuffer = function (buffer, blockingRead,
                                                          bufferOffset, numBytes, hostPtr,
                                                          eventWaitList, eventOut)
{
  TRACE (this, "enqueueReadBuffer", arguments);

  try
  {
    /*
  x INVALID_OPERATION -- if the blocking form of this function is called from a WebCLCallback
  x INVALID_CONTEXT -- if this WebCLCommandQueue is not associated with the same WebCLContext as buffer
  x INVALID_MEM_OBJECT -- if buffer is not a valid buffer object
  x INVALID_VALUE -- if any part of the region being read, specified by bufferOffset and numBytes, is out of bounds of buffer
  x INVALID_VALUE -- if any part of the region being written, specified by hostPtr and numBytes is out of bounds of hostPtr
  x INVALID_VALUE -- if numBytes % hostPtr.BYTES_PER_ELEMENT !== 0
    */

    this._ensureValidObject();

    if (blockingRead && this._webclState.inCallback)
      throw new INVALID_OPERATION ("this function cannot be called from a WebCLCallback");

    hostPtr = webclutils.unray(hostPtr);
    eventWaitList = webclutils.unray(eventWaitList);

    this._validateNumArgs(arguments.length, 5, 7);
    this._validateBuffer(buffer, "buffer");
    this._validateBoolean(blockingRead, "blockingRead");
    this._validateNonNegativeInt32(bufferOffset, "bufferOffset");
    this._validatePositiveInt32(numBytes, "numBytes");
    this._validateArrayBufferView(hostPtr, "hostPtr");
    this._validateEventWaitList(eventWaitList, blockingRead);

    this._validateEventOut(eventOut);

    if (numBytes > hostPtr.byteLength)
      throw new INVALID_VALUE("numBytes = "+numBytes+" must not be greater than hostPtr.byteLength = ", hostPtr.byteLength);

    if (numBytes % hostPtr.BYTES_PER_ELEMENT !== 0)
      throw new INVALID_VALUE("'numBytes' = "+numBytes+" must be zero or a multiple of hostPtr.BYTES_PER_ELEMENT = ", hostPtr.BYTES_PER_ELEMENT);

    if ((range = bufferOffset + numBytes) > (bufferSize = buffer.getInfo(ocl_info.CL_MEM_SIZE)))
      throw new INVALID_VALUE("bufferOffset + numBytes = "+range+" must not be greater than buffer size = ", bufferSize);

    var clBuffer = this._unwrapInternalOrNull (buffer);
    var clEventWaitList = this._unwrapArrayOrNull (eventWaitList);

    var ev = this._internal.enqueueReadBuffer (clBuffer, blockingRead, bufferOffset, numBytes, hostPtr, clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
  }
};


// TODO investigate crashes on Intel CPU driver with certain (invalid?) arguments!
//
WebCLCommandQueue.prototype.enqueueReadBufferRect = function (buffer, blockingRead,
                                                              bufferOrigin, hostOrigin, region,
                                                              bufferRowPitch, bufferSlicePitch,
                                                              hostRowPitch, hostSlicePitch,
                                                              hostPtr,
                                                              eventWaitList, eventOut)
{
  TRACE (this, "enqueueReadBufferRect", arguments);

  try
  {
    this._ensureValidObject();

    if (blockingRead && this._webclState.inCallback)
      throw new INVALID_OPERATION ("this function cannot be called from a WebCLCallback");

    bufferOrigin = webclutils.unray(bufferOrigin);
    hostOrigin = webclutils.unray(hostOrigin);
    region = webclutils.unray(region);
    hostPtr = webclutils.unray(hostPtr);
    eventWaitList = webclutils.unray(eventWaitList);

    this._validateNumArgs(arguments.length, 10, 12);
    this._validateBuffer(buffer, "buffer");
    this._validateBoolean(blockingRead, "blockingRead");
    this._validateArray3D(bufferOrigin, "bufferOrigin");
    this._validateArray3D(hostOrigin, "hostOrigin");
    this._validatePositiveIntArray3D(region, "region");
    this._validateNonNegativeInt32(bufferRowPitch, "bufferRowPitch");
    this._validateNonNegativeInt32(bufferSlicePitch, "bufferSlicePitch");
    this._validateNonNegativeInt32(hostRowPitch, "hostRowPitch");
    this._validateNonNegativeInt32(hostSlicePitch, "hostSlicePitch");
    this._validateArrayBufferView(hostPtr, "hostPtr");
    this._validateEventWaitList(eventWaitList, blockingRead);
    this._validateEventOut(eventOut);

    var hostRowPitch = hostRowPitch || region[0];
    var hostSlicePitch = hostSlicePitch || (region[1] * hostRowPitch);
    var hostByteLength = hostPtr.byteLength;

    this._validateAlignment(hostRowPitch, hostPtr.BYTES_PER_ELEMENT, "hostRowPitch");
    this._validateAlignment(hostSlicePitch, hostPtr.BYTES_PER_ELEMENT, "hostSlicePitch");
    this._validateRegionBounds3D(hostOrigin, region, hostRowPitch, hostSlicePitch, hostByteLength, "hostPtr");

    var bufferRowPitch = bufferRowPitch || region[0];
    var bufferSlicePitch = bufferSlicePitch || (region[1] * bufferRowPitch);
    var bufferByteLength = buffer.getInfo(ocl_info.CL_MEM_SIZE);

    this._validateRegionBounds3D(bufferOrigin, region, bufferRowPitch, bufferSlicePitch, bufferByteLength, "buffer");

    var clBuffer = this._unwrapInternalOrNull (buffer);
    var clEventWaitList = this._unwrapArrayOrNull (eventWaitList);

    var ev = this._internal.enqueueReadBufferRect (clBuffer, blockingRead,
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
    throw e;
  }
};


WebCLCommandQueue.prototype.enqueueReadImage = function (image, blockingRead,
                                                         origin, region, hostRowPitch,
                                                         hostPtr, eventWaitList, eventOut)
{
  TRACE (this, "enqueueReadImage", arguments);

  try
  {
    /*
  x INVALID_OPERATION -- if the blocking form of this function is called from a WebCLCallback
  x INVALID_CONTEXT -- if this WebCLCommandQueue is not associated with the same WebCLContext as image
  x INVALID_MEM_OBJECT -- if image is not a valid WebCLImage object
    INVALID_IMAGE_SIZE -- if the image dimensions of image are not supported by this WebCLCommandQueue
  x INVALID_VALUE -- if origin or region does not have exactly two elements
  x INVALID_VALUE -- if any part of the region being read, specified by origin and region, is out of bounds of image
  x INVALID_VALUE -- if any part of the region being written, specified by region and hostRowPitch, is out of bounds of hostPtr
  x INVALID_VALUE -- if hostRowPitch % hostPtr.BYTES_PER_ELEMENT !== 0
    */

    this._ensureValidObject();

    if (blockingRead && this._webclState.inCallback)
      throw new INVALID_OPERATION ("this function cannot be called from a WebCLCallback");

    origin = webclutils.unray(origin);
    region = webclutils.unray(region);
    hostPtr = webclutils.unray(hostPtr);
    eventWaitList = webclutils.unray(eventWaitList);

    this._validateNumArgs(arguments.length, 6, 8);
    this._validateImage(image, "image");
    this._validateBoolean(blockingRead, "blockingRead");
    this._validateArray2D(origin, "origin");
    this._validatePositiveIntArray2D(region, "region");
    this._validateNonNegativeInt32(hostRowPitch, "hostRowPitch");
    this._validateArrayBufferView(hostPtr, "hostPtr");
    this._validateEventWaitList(eventWaitList, blockingRead);
    this._validateEventOut(eventOut);

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
    var clOrigin = [ origin[0], origin[1], 0 ];
    var clRegion = [ region[0], region[1], 1 ];
    var hostSlicePitch = 0;
    var clEventWaitList = this._unwrapArrayOrNull (eventWaitList);

    var ev = this._internal.enqueueReadImage (clImage, blockingRead, clOrigin, clRegion, hostRowPitch, hostSlicePitch, hostPtr, clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
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

  try
  {
    /*
  x INVALID_OPERATION -- if the blocking form of this function is called from a WebCLCallback
  x INVALID_CONTEXT -- if this WebCLCommandQueue is not associated with the same WebCLContext as buffer
  x INVALID_MEM_OBJECT -- if buffer is not a valid buffer object
  x INVALID_VALUE -- if any part of the region being written, specified by bufferOffset and numBytes, is out of bounds of buffer
  x INVALID_VALUE -- if any part of the region being read, specified by hostPtr and numBytes, is out of bounds of hostPtr
  x INVALID_VALUE -- if numBytes % hostPtr.BYTES_PER_ELEMENT !== 0
    */
    this._ensureValidObject();

    if (blockingWrite && this._webclState.inCallback)
      throw new INVALID_OPERATION ("this function cannot be called from a WebCLCallback");

    hostPtr = webclutils.unray(hostPtr);
    eventWaitList = webclutils.unray(eventWaitList);

    this._validateNumArgs(arguments.length, 5, 7);
    this._validateBuffer(buffer, "buffer");
    this._validateBoolean(blockingWrite, "blockingWrite");
    this._validateNonNegativeInt32(bufferOffset, "bufferOffset");
    this._validatePositiveInt32(numBytes, "numBytes");
    this._validateArrayBufferView(hostPtr, "hostPtr");
    this._validateEventWaitList(eventWaitList, blockingWrite);
    this._validateEventOut(eventOut);

    if (numBytes > hostPtr.byteLength)
      throw new INVALID_VALUE("numBytes = "+numBytes+" must not be greater than hostPtr.byteLength = ", hostPtr.byteLength);

    if (numBytes % hostPtr.BYTES_PER_ELEMENT !== 0)
      throw new INVALID_VALUE("'numBytes' = "+numBytes+" must be zero or a multiple of hostPtr.BYTES_PER_ELEMENT = ", hostPtr.BYTES_PER_ELEMENT);

    if ((range = bufferOffset + numBytes) > (bufferSize = buffer.getInfo(ocl_info.CL_MEM_SIZE)))
      throw new INVALID_VALUE("bufferOffset + numBytes = "+range+" must not be greater than buffer size = ", bufferSize);

    var clBuffer = this._unwrapInternalOrNull (buffer);
    var clEventWaitList = this._unwrapArrayOrNull (eventWaitList);

    var ev = this._internal.enqueueWriteBuffer (clBuffer, blockingWrite, bufferOffset, numBytes, hostPtr, clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
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

  try
  {
    this._ensureValidObject();

    if (blockingWrite && this._webclState.inCallback)
      throw new INVALID_OPERATION ("this function cannot be called from a WebCLCallback");

    bufferOrigin = webclutils.unray(bufferOrigin);
    hostOrigin = webclutils.unray(hostOrigin);
    region = webclutils.unray(region);
    hostPtr = webclutils.unray(hostPtr);
    eventWaitList = webclutils.unray(eventWaitList);

    this._validateNumArgs(arguments.length, 10, 12);
    this._validateBuffer(buffer, "buffer");
    this._validateBoolean(blockingWrite, "blockingWrite");
    this._validateArray3D(bufferOrigin, "bufferOrigin");
    this._validateArray3D(hostOrigin, "hostOrigin");
    this._validatePositiveIntArray3D(region, "region");
    this._validateNonNegativeInt32(bufferRowPitch, "bufferRowPitch");
    this._validateNonNegativeInt32(bufferSlicePitch, "bufferSlicePitch");
    this._validateNonNegativeInt32(hostRowPitch, "hostRowPitch");
    this._validateNonNegativeInt32(hostSlicePitch, "hostSlicePitch");
    this._validateArrayBufferView(hostPtr, "hostPtr");
    this._validateEventWaitList(eventWaitList, blockingWrite);
    this._validateEventOut(eventOut);

    var hostRowPitch = hostRowPitch || region[0];
    var hostSlicePitch = hostSlicePitch || (region[1] * hostRowPitch);
    var hostByteLength = hostPtr.byteLength;

    this._validateAlignment(hostRowPitch, hostPtr.BYTES_PER_ELEMENT, "hostRowPitch");
    this._validateAlignment(hostSlicePitch, hostPtr.BYTES_PER_ELEMENT, "hostSlicePitch");
    this._validateRegionBounds3D(hostOrigin, region, hostRowPitch, hostSlicePitch, hostByteLength, "hostPtr");

    var bufferRowPitch = bufferRowPitch || region[0];
    var bufferSlicePitch = bufferSlicePitch || (region[1] * bufferRowPitch);
    var bufferByteLength = buffer.getInfo(ocl_info.CL_MEM_SIZE);

    this._validateRegionBounds3D(bufferOrigin, region, bufferRowPitch, bufferSlicePitch, bufferByteLength, "buffer");

    var clBuffer = this._unwrapInternalOrNull (buffer);
    var clEventWaitList = this._unwrapArrayOrNull (eventWaitList);

    var ev = this._internal.enqueueWriteBufferRect (clBuffer, blockingWrite,
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
    throw e;
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

  try
  {
    this._ensureValidObject();

    if (blockingWrite && this._webclState.inCallback)
      throw new INVALID_OPERATION ("this function cannot be called from a WebCLCallback");

    origin = webclutils.unray(origin);
    region = webclutils.unray(region);
    hostPtr = webclutils.unray(hostPtr);
    eventWaitList = webclutils.unray(eventWaitList);

    this._validateNumArgs(arguments.length, 6, 8);
    this._validateImage(image, "image");
    this._validateBoolean(blockingWrite, "blockingWrite");
    this._validateArray2D(origin, "origin");
    this._validatePositiveIntArray2D(region, "region");
    this._validateNonNegativeInt32(hostRowPitch, "hostRowPitch");
    this._validateArrayBufferView(hostPtr, "hostPtr");
    this._validateEventWaitList(eventWaitList, blockingWrite);
    this._validateEventOut(eventOut);

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
    var clOrigin = [ origin[0], origin[1], 0 ];
    var clRegion = [ region[0], region[1], 1 ];
    var hostSlicePitch = 0;
    var clEventWaitList = this._unwrapArrayOrNull (eventWaitList);

    var ev = this._internal.enqueueWriteImage (clImage, blockingWrite,
                                               clOrigin, clRegion,
                                               hostRowPitch, hostSlicePitch,
                                               hostPtr,
                                               clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
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
    x INVALID_EVENT_WAIT_LIST -- if any event in eventWaitList is invalid
    x INVALID_EVENT -- if event is not a newly created empty WebCLEvent
    */

    this._ensureValidObject();

    globalWorkOffset = webclutils.unray(globalWorkOffset);
    globalWorkSize = webclutils.unray(globalWorkSize);
    localWorkSize = webclutils.unray(localWorkSize);
    eventWaitList = webclutils.unray(eventWaitList);

    this._validateNumArgs(arguments.length, 4, 7);
    this._validateKernel(kernel, "kernel");
    this._validateNonNegativeInt32(workDim, "workDim");
    this._validateEventWaitList(eventWaitList);
    this._validateEventOut(eventOut);

    if (!(workDim === 1 || workDim === 2 || workDim === 3))
      throw new INVALID_WORK_DIMENSION("'workDim' must be 1, 2, or 3; was ", workDim);

    this._validateArray (globalWorkSize, workDim, webclutils.validatePositiveInt32,
                         INVALID_GLOBAL_WORK_SIZE, "globalWorkSize", "integers in [1, 2^32)");

    this._validateArrayOrNull (localWorkSize, workDim, webclutils.validatePositiveInt32, 
                               INVALID_WORK_GROUP_SIZE, "localWorkSize", "integers in [1, 2^32)");

    this._validateArrayOrNull (globalWorkOffset, workDim, webclutils.validateNonNegativeInt32, 
                               INVALID_GLOBAL_OFFSET, "globalWorkOffset", "integers in [0, 2^32)");

    var maxGlobalOffset = globalWorkSize.map(function(val, i) { return val + (globalWorkOffset && globalWorkOffset[i] || 0); });

    this._validateArrayOrNull (maxGlobalOffset, workDim, webclutils.validatePositiveInt32, 
                               INVALID_GLOBAL_OFFSET, "globalWorkOffset+globalWorkSize", "integers in [1, 2^32)");

    if (localWorkSize) {
      var globalModLocal = globalWorkSize.map(function(val, i) { return val % localWorkSize[i]; });

      this._validateArrayOrNull (globalModLocal, workDim, function(i) { return i===0; },
                                 INVALID_WORK_GROUP_SIZE, "globalWorkSize % localWorkSize", "zeros");

      var device = this.getInfo(ocl_info.CL_QUEUE_DEVICE);
      var maxWorkItems = device.getInfo(ocl_info.CL_DEVICE_MAX_WORK_GROUP_SIZE);
      var maxWorkItemSizes = device.getInfo(ocl_info.CL_DEVICE_MAX_WORK_ITEM_SIZES);
      var numWorkItems = localWorkSize.reduce(function(acc, item) { return acc*item; }, 1);

      localWorkSize.forEach(function(val, i) {
        if (val > maxWorkItemSizes[i])
          throw new INVALID_WORK_ITEM_SIZE("localWorkSize["+i+"] must not exceed " +
                                           maxWorkItemSizes[i] + " on this WebCLDevice; was ", val);
      });

      if (numWorkItems > maxWorkItems)
        throw new INVALID_WORK_GROUP_SIZE("the product over localWorkSize[i] can be at most " +
                                          maxWorkItems + " on this WebCLDevice; was ", numWorkItems);
    }

    var clKernel = this._unwrapInternalOrNull (kernel);
    var clEventWaitList = this._unwrapArrayOrNull (eventWaitList);

    var ev = this._internal.enqueueNDRangeKernel (clKernel, workDim,
                                                  globalWorkOffset, globalWorkSize, localWorkSize,
                                                  clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
  }
};


WebCLCommandQueue.prototype.enqueueMarker = function (eventOut)
{
  TRACE (this, "enqueueMarker", arguments);

  try
  {
    this._ensureValidObject();
    this._validateNumArgs(arguments.length, 1);
    this._validateEventOut(eventOut);

    var ev = this._internal.enqueueMarker ();
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
  }
};


WebCLCommandQueue.prototype.enqueueBarrier = function ()
{
  TRACE (this, "enqueueBarrier", arguments);

  try
  {
    this._ensureValidObject();
    this._validateNumArgs(arguments.length, 0);

    this._internal.enqueueBarrier ();
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
  }
};


WebCLCommandQueue.prototype.enqueueWaitForEvents = function (eventWaitList)
{
  TRACE (this, "enqueueWaitForEvents", arguments);

  try
  {
    this._ensureValidObject();
    this._validateNumArgs(arguments.length, 1);
    eventWaitList = webclutils.unray(eventWaitList);
    this._validateEventWaitList(eventWaitList, false, false, false);

    var clEventWaitList = eventWaitList.map(function(event) { return webclutils.unwrapInternal(event); });

    this._internal.enqueueWaitForEvents (clEventWaitList);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
  }
};


WebCLCommandQueue.prototype.finish = function (whenFinished)
{
  TRACE (this, "finish", arguments);

  try
  {
    this._ensureValidObject();
    this._validateNumArgs(arguments.length, 0, 1);

    whenFinished = webclutils.defaultTo(whenFinished, null);

    if (whenFinished !== null && typeof(whenFinished) !== "function")
      throw new TypeError("'whenFinished' must be null or a WebCLCallback function; was " + whenFinished);

    if (whenFinished)
    {
      // NOTE: It would be better to use more persistent async workers, and maybe a pool.
      // TODO: get OpenCL lib name
      var instance = this;
      instance._webclState.releaseManager.numWorkersRunning++;
      let asyncWorker = new WebCLAsyncWorker (null, function (err) {

        if (err) {
          ERROR ("WebCLCommandQueue.finish: " + err);
          instance._webclState.inCallback = true;
          try {
            whenFinished ();
          }
          finally {
            instance._webclState.inCallback = false;
            instance._webclState.releaseManager.numWorkersRunning--;
            asyncWorker.close ();
          }
          return;
        }

        asyncWorker.finish (instance._internal, function (err) {
          if (err)
            ERROR ("WebCLCommandQueue.finish: " + err);

          instance._webclState.inCallback = true;
          try {
            whenFinished ();
          }
          finally {
            instance._webclState.inCallback = false;
            instance._webclState.releaseManager.numWorkersRunning--;
            asyncWorker.close ();
          }
        });
      });

    }
    else
    {
      if (this._webclState.inCallback)
        throw new INVALID_OPERATION ("the blocking form of this function cannot be called from a WebCLCallback");

      this._internal.finish ();
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
  }
};


WebCLCommandQueue.prototype.flush = function ()
{
  TRACE (this, "flush", arguments);

  try
  {
    this._ensureValidObject();
    this._validateNumArgs(arguments.length, 0);

    this._internal.flush ();
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
  }
};


WebCLCommandQueue.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);

  try
  {
    this._ensureValidObject();
    this._validateNumArgs(arguments.length, 1);
    this._validatePositiveInt32(name, "name");

    switch (name)
    {
    case ocl_info.CL_QUEUE_CONTEXT:
    case ocl_info.CL_QUEUE_DEVICE:
    case ocl_info.CL_QUEUE_PROPERTIES:
      var clInfoItem = this._internal.getInfo (name);
      return this._wrapInternal (clInfoItem, this);
    default:
      throw new INVALID_VALUE("'name' must be one of the accepted CLenums; was ", name);
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
  }
};



//------------------------------------------------------------------------------
// Internal functions


WebCLCommandQueue.prototype._validateNumArgs = webclutils.validateNumArgs;

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
    throw new TypeError(varName + " must be a boolean; was " + value + " [typeof " + typeof(value) + "]");
};


WebCLCommandQueue.prototype._validateNonNegativeInt32 = function (value, varName)
{
  if (!webclutils.validateNonNegativeInt32(value))
    throw new TypeError(varName + " must be an integer in [0, 2^32); was " + value + " [typeof " + typeof(value) + "]");
};


WebCLCommandQueue.prototype._validatePositiveInt32 = function (value, varName)
{
  this._validateNonNegativeInt32(value, varName);

  if (!webclutils.validatePositiveInt32(value))
    throw new INVALID_VALUE(varName + " must be an integer in [1, 2^32); was " + value);
};


WebCLCommandQueue.prototype._validateArrayBufferView = function (value, varName)
{
  if (!webclutils.validateArrayBufferView(value))
    throw new TypeError(varName + " must be an instance of ArrayBufferView, was " + value + " [typeof " + typeof(value) + "]");
};


WebCLCommandQueue.prototype._validateArray2D = function(arr, varName)
{
  this._validateArray (arr, 2, webclutils.validateNonNegativeInt32, INVALID_VALUE, varName, "integers in [0, 2^32)");
};


WebCLCommandQueue.prototype._validateArray3D = function(arr, varName)
{
  this._validateArray (arr, 3, webclutils.validateNonNegativeInt32, INVALID_VALUE, varName, "integers in [0, 2^32)");
};


WebCLCommandQueue.prototype._validatePositiveIntArray2D = function(arr, varName)
{
  this._validateArray (arr, 2, webclutils.validatePositiveInt32, INVALID_VALUE, varName, "integers in [1, 2^32)");
};


WebCLCommandQueue.prototype._validatePositiveIntArray3D = function(arr, varName)
{
  this._validateArray (arr, 3, webclutils.validatePositiveInt32, INVALID_VALUE, varName, "integers in [1, 2^32)");
};


WebCLCommandQueue.prototype._validateArrayOrNull = function(arr, length, elementValidator, clException, varName, elementRequirementMsg)
{
  if (arr !== null && arr !== undefined)
    this._validateArray(arr, length, elementValidator, clException, varName, elementRequirementMsg);
};


WebCLCommandQueue.prototype._validateArray = function(arr, length, elementValidator, clException, varName, elementRequirementMsg)
{
  if (!Array.isArray(arr))
    throw new TypeError(varName + " must be an Array; was " + typeof(arr));

  if (!webclutils.validateArrayLength(arr, function() { return arr.length === length; }))
    throw new clException(varName + " must have exactly " + length + " elements; had " + arr.length);

  arr.forEach(function(val, i) {
    if (!elementValidator(val))
      throw new clException(varName + " must only contain " + elementRequirementMsg + "; " + varName + "["+i+"] was ", val);
  });
};


WebCLCommandQueue.prototype._validatePitch = function (pitch, defaultPitch, name)
{
  if (pitch !== 0 && pitch < defaultPitch)
    throw new INVALID_VALUE(name + " must be zero or greater than or equal to " + defaultPitch + "; was " + pitch);

  if (pitch % defaultPitch !== 0)
    throw new INVALID_VALUE(name + " must be zero or a multiple of " + defaultPitch + "; was " + pitch);
};


WebCLCommandQueue.prototype._validateRegionBounds1D = function (offset, numBytes, bufferByteLength, bufferName)
{
  var requiredSize = offset + numBytes;

  if (numBytes > bufferByteLength)
    throw new INVALID_VALUE("the size of the given region is "+numBytes+" bytes, which is greater than the byteLength of the " +
                            "given "+bufferName+" ("+bufferByteLength+")");

  if (offset >= bufferByteLength)
    throw new INVALID_VALUE("the given offset is at "+offset+" bytes, which is out of bounds of the given " +
                            bufferName + " (size="+bufferByteLength+" bytes)");

  if (requiredSize > bufferByteLength)
    throw new INVALID_VALUE("the given "+bufferName+" has "+bufferByteLength+" bytes, but the given offset and numBytes " +
                            "would require a buffer of at least "+requiredSize+" bytes");
};


WebCLCommandQueue.prototype._validateRegionBounds3D = function (origin, region, rowPitch, slicePitch, bufferByteLength, bufferName)
{
  var rowPitch = rowPitch || region[0];
  var slicePitch = slicePitch || (rowPitch * region[1])
  var originOffset = origin[2] * slicePitch + origin[1] * rowPitch + origin[0];
  var bytesInRegion = (region[2] - 1) * slicePitch + (region[1] - 1) * rowPitch + region[0];
  var requiredSize = originOffset + bytesInRegion;

  if (bytesInRegion > bufferByteLength)
    throw new INVALID_VALUE("the size of the given region is "+bytesInRegion+" bytes, which is greater than the byteLength of the " +
                            "given "+bufferName+" ("+bufferByteLength+")");

  if (originOffset >= bufferByteLength)
    throw new INVALID_VALUE("the origin of the given region is at "+originOffset+" bytes, which is out of bounds of the given " +
                            bufferName + " (size="+bufferByteLength+" bytes)");

  if (requiredSize > bufferByteLength)
    throw new INVALID_VALUE("the given "+bufferName+" has "+bufferByteLength+" bytes, but the given origin, region, and pitch " +
                            "would require a buffer of at least "+requiredSize+" bytes");
};


WebCLCommandQueue.prototype._validateRegionsDisjoint1D = function (srcBuffer, dstBuffer, srcOffset, dstOffset, numBytes)
{
  var srcParentBuffer = srcBuffer.getInfo(ocl_info.CL_MEM_ASSOCIATED_MEMOBJECT);
  var dstParentBuffer = dstBuffer.getInfo(ocl_info.CL_MEM_ASSOCIATED_MEMOBJECT);
  var srcParentOffset = srcBuffer.getInfo(ocl_info.CL_MEM_OFFSET);
  var dstParentOffset = dstBuffer.getInfo(ocl_info.CL_MEM_OFFSET);
  
  if (srcBuffer === dstBuffer) {
    var srcRangeFirst = srcOffset;
    var srcRangeLast = srcOffset + numBytes - 1;
    var dstRangeFirst = dstOffset;
    var dstRangeLast = dstOffset + numBytes - 1;

    if (srcRangeFirst <= dstRangeFirst && dstRangeFirst <= srcRangeLast)
      throw new MEM_COPY_OVERLAP("dstOffset must not be in the range ["+srcRangeFirst+", "+srcRangeLast+"]; was "+dstOffset);

    if (srcRangeFirst <= dstRangeLast && dstRangeLast <= srcRangeLast)
      throw new MEM_COPY_OVERLAP("dstOffset+numBytes-1 must not be in the range ["+srcRangeFirst+", "+srcRangeLast+"]; was "+dstRangeLast);

    if (dstRangeFirst <= srcRangeFirst && srcRangeFirst <= dstRangeLast)
      throw new MEM_COPY_OVERLAP("srcOffset must not be in the range ["+dstRangeFirst+", "+dstRangeLast+"]; was "+srcOffset);

    if (dstRangeFirst <= srcRangeLast && srcRangeLast <= dstRangeLast)
      throw new MEM_COPY_OVERLAP("srcOffset+numBytes-1 must not be in the range ["+dstRangeFirst+", "+dstRangeLast+"]; was "+srcRangeLast);
  }

  if (srcBuffer === dstParentBuffer) {
    throw new INVALID_OPERATION("copying from a buffer to its own sub-buffer is not yet supported");
  }

  if (dstBuffer === srcParentBuffer) {
    throw new INVALID_OPERATION("copying from a sub-buffer to its own parent buffer is not yet supported");
  }

  if (srcParentBuffer !== null && srcParentBuffer === dstParentBuffer) {
    throw new INVALID_OPERATION("copying between two sub-buffers of the same parent buffer is not yet supported");
  }
};


WebCLCommandQueue.prototype._validateRegionsDisjoint3D = function (srcBuffer, dstBuffer, 
                                                                   srcOrigin, dstOrigin, region,
                                                                   srcRowPitch, dstRowPitch,
                                                                   srcSlicePitch, dstSlicePitch)
{
  var srcParentBuffer = srcBuffer.getInfo(ocl_info.CL_MEM_ASSOCIATED_MEMOBJECT);
  var dstParentBuffer = dstBuffer.getInfo(ocl_info.CL_MEM_ASSOCIATED_MEMOBJECT);
  var srcParentOffset = srcBuffer.getInfo(ocl_info.CL_MEM_OFFSET);
  var dstParentOffset = dstBuffer.getInfo(ocl_info.CL_MEM_OFFSET);
  
  if (srcBuffer === dstBuffer) {

    var srcMin = srcOrigin;
    var srcMax = [ srcOrigin[i] + region[i] for (i in region) ];
    var dstMin = dstOrigin;
    var dstMax = [ dstOrigin[i] + region[i] for (i in region) ];

    var overlap = true;
    for (let i=0; i < 3; ++i) {
      overlap = overlap && (srcMin[i] < dstMax[i]) && (srcMax[i] > dstMin[i]);
    }

    if (overlap)
      throw new MEM_COPY_OVERLAP("srcRegion and dstRegion must not overlap");
  }

  if (srcBuffer === dstParentBuffer) {
    throw new INVALID_OPERATION("copying from a buffer to its own sub-buffer is not yet supported");
  }

  if (dstBuffer === srcParentBuffer) {
    throw new INVALID_OPERATION("copying from a sub-buffer to its own parent buffer is not yet supported");
  }

  if (srcParentBuffer !== null && srcParentBuffer === dstParentBuffer) {
    throw new INVALID_OPERATION("copying between two sub-buffers of the same parent buffer is not yet supported");
  }
};


WebCLCommandQueue.prototype._validateAlignment = function (value, alignment, varName)
{
  if (value % alignment !== 0)
    throw new INVALID_VALUE(varName+" must be zero or a multiple of "+alignment+"; was "+value);
};


WebCLCommandQueue.prototype._validateEventWaitList = function (eventWaitList, isBlocking, allowNullArray, allowEmptyArray)
{
  var eventWaitList = webclutils.defaultTo(eventWaitList, null);
  var isBlocking = webclutils.defaultTo(isBlocking, false);
  var allowNullArray = webclutils.defaultTo(allowNullArray, true);
  var allowEmptyArray = webclutils.defaultTo(allowEmptyArray, true);
  var queueContext = this.getInfo(ocl_info.CL_QUEUE_CONTEXT);
  webclutils.validateEventWaitList(eventWaitList, isBlocking, allowNullArray, allowEmptyArray, queueContext);
};


WebCLCommandQueue.prototype._validateEventOut = function (eventOut)
{
  if (eventOut !== null && eventOut !== undefined) 
  {
    if (eventOut instanceof WEBCLCLASSES.WebCLUserEvent)
      throw new INVALID_EVENT("'event' must be a newly created empty WebCLEvent; was a WebCLUserEvent");

    if (!webclutils.validateEvent(eventOut))
      throw new INVALID_EVENT("'event' must be a newly created empty WebCLEvent; was " + eventOut);

    if (!webclutils.validateEventNotReleased(eventOut))
      throw new INVALID_EVENT("'event' must be a newly created empty WebCLEvent; was already released");

    if (!webclutils.validateEventEmpty(eventOut))
      throw new INVALID_EVENT("'event' must be a newly created empty WebCLEvent; was already populated");
  }
};


WebCLCommandQueue.prototype._handleEventOut = function (clEvent, webclEvent)
{
  TRACE (this, "_handleEventOut", arguments);
  if (!clEvent) return;

  if (webclEvent)
  {
    var unwrappedEvent = webclEvent.wrappedJSObject;
    unwrappedEvent._internal = clEvent;
    //unwrappedEvent._identity = clEvent.getIdentity();
    this._registerObject (webclEvent);

    unwrappedEvent._webclState = this._webclState;

    // Set pending event callbacks
    unwrappedEvent.setPendingCallbacks ();
  }
  else
  {
    // Internal event must be released if it's not going to being used.
    clEvent.release ();
  }
};


WebCLCommandQueue.prototype._unwrapArrayOrNull = function (wclObjectArray)
{
  TRACE (this, "_unwrapArrayOrNull", arguments);

  if (Array.isArray(wclObjectArray)) {
    return wclObjectArray.map(function(v) { return webclutils.unwrapInternalOrNull(v); });
  } else {
    return null;
  }
};


// NOTE: NOT EXPOSED, NOT VISIBLE TO JS!
WebCLCommandQueue.prototype.releaseAll = function ()
{
  TRACE (this, "releaseAll", arguments);
  if (this._invalid) return;

  try
  {
    this._releaseAllChildren ();

    this._clearRegistry ();

    //this._unregister ();
    this.release ();
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
  }
};


} catch(e) { ERROR ("webclcommandqueue.jsm: "+e); }
