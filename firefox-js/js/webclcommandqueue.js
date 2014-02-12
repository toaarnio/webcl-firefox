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


var CLASSNAME =  "WebCLCommandQueue";
var CID =        "{751b06c0-cac3-4123-87ae-2b8c22832d52}";
var CONTRACTID = "@webcl.nokiaresearch.com/IWebCLCommandQueue;1";


function CommandQueue ()
{
  if (!(this instanceof CommandQueue)) return new CommandQueue ();

  Base.apply(this);

  this.wrappedJSObject = this;

  this._interfaces = [ Ci.IWebCLCommandQueue,
                       Ci.nsISecurityCheckedComponent,
                       Ci.nsISupportsWeakReference,
                       Ci.nsIClassInfo,
                       Ci.nsISupports
                     ];
}

CommandQueue.prototype = Object.create (Base.prototype);


CommandQueue.prototype.classDescription = CLASSNAME;
CommandQueue.prototype.classID =          Components.ID(CID);
CommandQueue.prototype.contractID =       CONTRACTID;
CommandQueue.prototype.QueryInterface =   XPCOMUtils.generateQI ([ Ci.IWebCLCommandQueue,
                                                                   Ci.nsISecurityCheckedComponent,
                                                                   Ci.nsISupportsWeakReference,
                                                                   Ci.nsIClassInfo
                                                                 ]);


//------------------------------------------------------------------------------
// IWebCLCommandQueue


// TODO: CommandQueue.prototype.enqueueCopyBuffer = function ()
// TODO: CommandQueue.prototype.enqueueCopyBufferRect = function ()


CommandQueue.prototype.enqueueCopyImage = function (srcImage, dstImage,
                                                    srcOrigin, dstOrigin,
                                                    region,
                                                    eventWaitList, eventOut)
{
  TRACE (this, "enqueueCopyImage", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    var clSrcImage = this._unwrapInternalOrNull (srcImage);
    if (!webclutils.validateImage(clSrcImage)) throw new Exception ("Invalid argument: srcImage");

    var clDstImage = this._unwrapInternalOrNull (dstImage);
    if (!webclutils.validateImage(clDstImage)) throw new Exception ("Invalid argument: dstImage");

    // TODO: validate srcOrigin, dstOrigin, region

    var clEventWaitList = [];
    if (eventWaitList)
    {
      clEventWaitList = this._convertEventWaitList (eventWaitList);
    }

    // Validate outgoing event
    var clEventOut = this._unwrapInternalOrNull (eventOut);
    if (eventOut && (!eventOut instanceof Ci.IWebCLEvent))
    {
      throw new Exception ("Invalid argument: event");
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


CommandQueue.prototype.enqueueCopyImageToBuffer = function (srcImage, dstBuffer,
                                                            srcOrigin, srcRegion, dstOffset,
                                                            eventWaitList, eventOut)
{
  TRACE (this, "enqueueCopyImageToBuffer", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    var clSrcImage = this._unwrapInternalOrNull (srcImage);
    if (!webclutils.validateImage(clSrcImage)) throw new Exception ("Invalid argument: srcImage");

    var clDstBuffer = this._unwrapInternalOrNull (dstBuffer);
    if (!webclutils.validateBuffer(clDstBuffer)) throw new Exception ("Invalid argument: dstBuffer");

    // TODO: validate srcOrigin, srcRegion, dstOffset

    var clEventWaitList = [];
    if (eventWaitList)
    {
      clEventWaitList = this._convertEventWaitList (eventWaitList);
    }

    // Validate outgoing event
    var clEventOut = this._unwrapInternalOrNull (eventOut);
    if (eventOut && (!eventOut instanceof Ci.IWebCLEvent))
    {
      throw new Exception ("Invalid argument: event");
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


CommandQueue.prototype.enqueueCopyBufferToImage = function (srcBuffer, dstImage,
                                                            srcOffset, dstOrigin, dstRegion,
                                                            eventWaitList, eventOut)
{
  TRACE (this, "enqueueCopyBufferToImage", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    var clSrcBuffer = this._unwrapInternalOrNull (srcBuffer);
    if (!webclutils.validateBuffer(clSrcBuffer)) throw new Exception ("Invalid argument: srcBuffer");

    var clDstImage = this._unwrapInternalOrNull (dstImage);
    if (!webclutils.validateImage(clDstImage)) throw new Exception ("Invalid argument: dstImage");

    // TODO: validate srcOffset, dstOrigin, region

    var clEventWaitList = [];
    if (eventWaitList)
    {
      clEventWaitList = this._convertEventWaitList (eventWaitList);
    }

    // Validate outgoing event
    var clEventOut = this._unwrapInternalOrNull (eventOut);
    if (eventOut && (!eventOut instanceof Ci.IWebCLEvent))
    {
      throw new Exception ("Invalid argument: event");
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


CommandQueue.prototype.enqueueReadBuffer = function (buffer, blockingRead,
                                                     bufferOffset, numBytes, hostPtr,
                                                     eventWaitList, eventOut)
{
  TRACE (this, "enqueueReadBuffer", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    var clBuffer = this._unwrapInternalOrNull (buffer);
    if (!webclutils.validateBuffer(clBuffer))
      throw new Exception ("Invalid argument: buffer");
    if (!webclutils.validateNumber(bufferOffset))
      throw new Exception ("Invalid argument: bufferOffset");
    if (!webclutils.validateNumber(numBytes))
      throw new Exception ("Invalid argument: numBytes");

    // TODO: validate hostPtr

    var clEventWaitList = [];
    if (eventWaitList) clEventWaitList = this._convertEventWaitList (eventWaitList);

    // Validate outgoing event
    var clEventOut = this._unwrapInternalOrNull (eventOut);
    if (eventOut && (!eventOut instanceof Ci.IWebCLEvent))
    {
      throw new Exception ("Invalid argument: event");
    }

    var ev = this._internal.enqueueReadBuffer (clBuffer, !!blockingRead,
                                              bufferOffset,
                                              numBytes, hostPtr,
                                              clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


CommandQueue.prototype.enqueueReadBufferRect = function (buffer, blockingRead,
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
    var clBuffer = this._unwrapInternalOrNull (buffer);
    if (!webclutils.validateBuffer(clBuffer)) throw new Exception ("Invalid argument: buffer");

    // TODO: validate bufferOrigin, hostOrigin, region, bufferRowPitch, bufferSlicePitch,
    //       hostRowPitch, hostSlicePitch, hostPtr

    var clEventWaitList = [];
    if (eventWaitList) clEventWaitList = this._convertEventWaitList (eventWaitList);

    // Validate outgoing event
    var clEventOut = this._unwrapInternalOrNull (eventOut);
    if (eventOut && (!eventOut instanceof Ci.IWebCLEvent))
    {
      throw new Exception ("Invalid argument: event");
    }

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


CommandQueue.prototype.enqueueReadImage = function (image, blockingRead,
                                                    origin, region, hostRowPitch,
                                                    hostPtr, eventWaitList, eventOut)
{
  TRACE (this, "enqueueReadImage", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    /*
    INVALID_OPERATION -- if the blocking form of this function is called from a WebCLCallback
    INVALID_CONTEXT -- if this WebCLCommandQueue is not associated with the same WebCLContext as image
    INVALID_CONTEXT -- if this WebCLCommandQueue is not associated with the same WebCLContext as all events in eventWaitList
    INVALID_MEM_OBJECT -- if image is not a valid WebCLImage object
    INVALID_IMAGE_SIZE -- if the image dimensions of image are not supported by this WebCLCommandQueue
  x INVALID_VALUE -- if origin or region does not have exactly two elements
    INVALID_VALUE -- if any part of the region being read, specified by origin and region, is out of bounds of image
  x INVALID_VALUE -- if any part of the region being written, specified by region and hostRowPitch, is out of bounds of hostPtr
  x INVALID_VALUE -- if hostRowPitch % hostPtr.BYTES_PER_ELEMENT !== 0
    INVALID_EVENT_WAIT_LIST -- if any event in eventWaitList is invalid
    INVALID_EVENT_WAIT_LIST -- if blockingRead is true, and any event in eventWaitList is a WebCLUserEvent or a newly created (non-activated) WebCLEvent
    EXEC_STATUS_ERROR_FOR_EVENTS_IN_WAIT_LIST -- if blockingRead is true and the execution status of any event in eventWaitList 
      is a negative integer value
    INVALID_EVENT -- if event is not a newly created empty WebCLEvent
    */
    var clImage = this._unwrapInternalOrNull (image);
    if (!webclutils.validateImage(clImage))
      throw new Exception ("Invalid argument: image");  // TODO: throw INVALID_MEM_OBJECT

    var descriptor = image.getInfo ();
    var numChannels = 4;                   // TODO support formats other than RGBA
    var bytesPerPixel = numChannels * 1;   // TODO support other than one-byte-per-color formats
    var width = 64;                        // TODO get the real width from descriptor
    var height = 64;                       // TODO get the real height from descriptor

    if (!webclutils.validateArrayLength(origin, function(arr) { return arr.length === 2; }))
      throw new CLInvalidArgument("origin", "origin must be an Array with exactly two elements'");

    if (!webclutils.validateArrayLength(region, function(arr) { return arr.length === 2; }))
      throw new CLInvalidArgument("region", "region must be an Array with exactly two elements");

    if (!webclutils.validateArray(origin, webclutils.validateNumber))
      throw new CLInvalidArgument("origin", "origin must be an Array with elements of type 'number'");

    if (!webclutils.validateArray(region, webclutils.validateNumber))
      throw new CLInvalidArgument("region", "region must be an Array with elements of type 'number'");

    if (!webclutils.validateArray(origin, function(v) { return v >= 0; }))
      throw new CLInvalidArgument("origin", "all elements of origin must be non-negative");

    if (!webclutils.validateArray(region, function(v) { return v >= 0; }))
      throw new CLInvalidArgument("origin", "all elements of region must be non-negative");

    if (!(webclutils.validateNumber(hostRowPitch) && ((hostRowPitch & 0x80000000) === 0)))
      throw new CLInvalidArgument("hostRowPitch", "hostRowPitch must be non-negative and less than 2^31");

    if (!webclutils.validateArrayBufferView(hostPtr)) 
      throw new CLInvalidArgument("hostPtr", "hostPtr must be an instance of ArrayBufferView");

    if (origin[0] + region[0] > width || origin[1] + region[1] > height)
      throw new CLInvalidArgument("region", "area specified by origin and region must fit inside image");

    if (hostRowPitch !== 0 && hostRowPitch % hostPtr.BYTES_PER_ELEMENT !== 0)
      throw new CLInvalidArgument("hostRowPitch", "hostRowPitch must be zero or a multiple of hostPtr.BYTES_PER_ELEMENT");

    if (hostRowPitch !== 0 && hostRowPitch < bytesPerPixel*width)
      throw new CLInvalidArgument("hostRowPitch", "hostRowPitch must not be less than bytesPerPixel * width");

    if (hostRowPitch === 0 && region[0]*region[1] > hostPtr.length)
      throw new CLInvalidArgument("region", "area specified by region must fit inside hostPtr");

    if (hostRowPitch !== 0 && hostRowPitch*region[1] > hostPtr.byteLength)
      throw new CLInvalidArgument("region", "area specified by region and hostRowPitch must fit inside hostPtr");

    var clEventWaitList = [];
    if (eventWaitList) clEventWaitList = this._convertEventWaitList (eventWaitList);

    // Validate outgoing event
    var clEventOut = this._unwrapInternalOrNull (eventOut);
    if (eventOut && (!eventOut instanceof Ci.IWebCLEvent))
    {
      throw new Exception ("Invalid argument: event");
    }

    var clOrigin = [ origin[0], origin[1], 0 ];
    var clRegion = [ region[0], region[1], 1 ];
    var ev = this._internal.enqueueReadImage (clImage, !!blockingRead,
                                              clOrigin, clRegion,
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


CommandQueue.prototype.enqueueWriteBuffer = function (buffer, blockingWrite,
                                                      bufferOffset, numBytes, hostPtr,
                                                      eventWaitList, eventOut)
{
  TRACE (this, "enqueueWriteBuffer", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    var clBuffer = this._unwrapInternalOrNull (buffer);
    if (!webclutils.validateBuffer(clBuffer))
      throw new Exception ("Invalid argument: buffer");
    if (!webclutils.validateNumber(bufferOffset))
      throw new Exception ("Invalid argument: bufferOffset");
    if (!webclutils.validateNumber(numBytes))
      throw new Exception ("Invalid argument: numBytes");

    // TODO: validate hostPtr

    var clEventWaitList = [];
    if (eventWaitList)
    {
      clEventWaitList = this._convertEventWaitList (eventWaitList);
    }

    // Validate outgoing event
    var clEventOut = this._unwrapInternalOrNull (eventOut);
    if (eventOut && (!eventOut instanceof Ci.IWebCLEvent))
    {
      throw new Exception ("Invalid argument: event");
    }

    var ev = this._internal.enqueueWriteBuffer (clBuffer, !!blockingWrite,
                                                bufferOffset,
                                                numBytes, hostPtr,
                                                clEventWaitList);
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


CommandQueue.prototype.enqueueWriteBufferRect = function (buffer, blockingWrite,
                                                          bufferOrigin, hostOrigin, region,
                                                          bufferRowPitch, bufferSlicePitch,
                                                          hostRowPitch, hostSlicePitch,
                                                          hostPtr,
                                                          eventWaitList, eventOut)
{
  TRACE (this, "enqueueWriteBufferRect", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    var clBuffer = this._unwrapInternalOrNull (buffer);
    if (!webclutils.validateBuffer(clBuffer)) throw new Exception ("Invalid argument: buffer");

    // TODO: validate bufferOrigin, hostOrigin, region, bufferRowPitch, bufferSlicePitch,
    //       hostRowPitch, hostSlicePitch, hostPtr

    var clEventWaitList = [];
    if (eventWaitList) clEventWaitList = this._convertEventWaitList (eventWaitList);

    // Validate outgoing event
    var clEventOut = this._unwrapInternalOrNull (eventOut);
    if (eventOut && (!eventOut instanceof Ci.IWebCLEvent))
    {
      throw new Exception ("Invalid argument: event");
    }

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


CommandQueue.prototype.enqueueWriteImage = function (image, blockingWrite,
                                                    origin, region, hostRowPitch,
                                                    hostPtr, eventWaitList, eventOut)
{
  TRACE (this, "enqueueWriteImage", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    var clImage = this._unwrapInternalOrNull (image);
    if (!webclutils.validateImage(clImage)) throw new Exception ("Invalid argument: image");

    // TODO: validate origin, region, hostRowPitch, hostPtr

    var clEventWaitList = [];
    if (eventWaitList) clEventWaitList = this._convertEventWaitList (eventWaitList);

    // Validate outgoing event
    var clEventOut = this._unwrapInternalOrNull (eventOut);
    if (eventOut && (!eventOut instanceof Ci.IWebCLEvent))
    {
      throw new Exception ("Invalid argument: event");
    }

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


CommandQueue.prototype.enqueueNDRangeKernel = function (kernel, workDim, globalWorkOffset,
                                                        globalWorkSize, localWorkSize,
                                                        eventWaitList, eventOut)
{
  TRACE (this, "enqueueNDRangeKernel", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    var clKernel = this._unwrapInternalOrNull (kernel);
    if (!webclutils.validateKernel(clKernel))
      throw new Exception ("Invalid argument: kernel");
    if (!webclutils.validateNumber(workDim) || workDim  < 1 || workDim > 3)
      throw new Exception ("Invalid argument: workDim");
    if (globalWorkOffset && !webclutils.validateArray(globalWorkOffset, webclutils.validateNumber))
      throw new Exception ("Invalid argument: globalWorkOffset");
    if (!webclutils.validateArray(globalWorkSize, webclutils.validateNumber))
      throw new Exception ("Invalid argument: globalWorkSize");
    if (localWorkSize && !webclutils.validateArray(localWorkSize, webclutils.validateNumber))
      throw new Exception ("Invalid argument: localWorkSize");

    var clEventWaitList = [];
    if (eventWaitList)
    {
      clEventWaitList = this._convertEventWaitList (eventWaitList);
    }

    // Validate outgoing event
    var clEventOut = this._unwrapInternalOrNull (eventOut);
    if (eventOut && (!eventOut instanceof Ci.IWebCLEvent))
    {
      throw new Exception ("Invalid argument: event");
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


CommandQueue.prototype.enqueueMarker = function (eventOut)
{
  TRACE (this, "enqueueMarker", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    // Validate outgoing event
    var clEventOut = this._unwrapInternalOrNull (eventOut);
    if (eventOut && (!eventOut instanceof Ci.IWebCLEvent))
    {
      throw new Exception ("Invalid argument: event");
    }

    var ev = this._internal.enqueueMarker ();
    this._handleEventOut (ev, eventOut);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


CommandQueue.prototype.enqueueBarrier = function ()
{
  TRACE (this, "enqueueBarrier", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    this._internal.enqueueBarrier ();
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


CommandQueue.prototype.enqueueWaitForEvents = function (eventWaitList)
{
  TRACE (this, "enqueueWaitForEvents", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (!Array.isArray(eventWaitList))
    {
      throw new Exception ("Invalid argument: eventWaitList.");
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


CommandQueue.prototype.finish = function ()
{
  TRACE (this, "finish", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    this._internal.finish ();
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


CommandQueue.prototype.flush = function ()
{
  TRACE (this, "flush", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    this._internal.flush ();
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


CommandQueue.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    return this._wrapInternal (this._internal.getInfo (name), this._owner);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};



//------------------------------------------------------------------------------
// Internal functions


CommandQueue.prototype._getRefCount = function ()
{
  try
  {
    if (this._internal && !this._invalid)
    {
      return this._internal.getInfo (ocl_info.CL_QUEUE_REFERENCE_COUNT);
    }
    else
    {
      return 0;
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


CommandQueue.prototype._handleEventOut = function (clEvent, webclEvent)
{
  if (!clEvent) return;

  if (webclEvent)
  {
    // Ensure webcl event is unwrapped
    let originalEvent = webclEvent
    if (webclEvent.wrappedJSObject) webclEvent = webclEvent.wrappedJSObject;

    if (!webclEvent instanceof Ci.IWebCLEvent)
    {
      throw new Exception ("Invalid argument: event"); // TODO!
    }

    // If the event object was already in use, release the internals. This will
    // also cause it to be unregistered!
    if (webclEvent._internal && !webclEvent._invalid)
    {
      webclEvent.release ();
    }

    // Setup internals and re-register event to our owner.
    webclEvent._internal = clEvent;
    webclEvent._identity = clEvent.getIdentity();
    //webclEvent._register (this._owner);
    this._owner._registerObject (originalEvent);
  }
  else
  {
    // Internal event should be released if not being used.
    clEvent.release ();
  }
};


CommandQueue.prototype._convertEventWaitList = function (eventWaitList)
{
  var clEvents = [];
  for (var i = 0; i < eventWaitList.length; ++i)
  {
    var p = this._unwrapInternalOrNull (eventWaitList[i]);
    if (!webclutils.validateEvent (p))
    {
      // TODO: handle errors better...
      throw new Exception ("Invalid argument: eventWaitList[" + i + "].");
    }
    clEvents.push (p);
  }

  return clEvents;
}





var NSGetFactory = XPCOMUtils.generateNSGetFactory ([CommandQueue]);


} catch(e) { ERROR ("webclcommandqueue.js: "+EXCEPTIONSTR(e)); }
