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
Cu.import ("resource://nrcwebcl/modules/base.jsm");
Cu.import ("resource://nrcwebcl/modules/webclconstructors.jsm");

Cu.import ("resource://nrcwebcl/modules/mixin.jsm");
Cu.import ("resource://nrcwebcl/modules/mixins/owner.jsm");

Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/wrapper.jsm");


var CLASSNAME =  "WebCLContext";
var CID =        "{0e5fba5c-091f-40db-a6a9-700ba50393d0}";
var CONTRACTID = "@webcl.nokiaresearch.com/IWebCLContext;1";


function Context ()
{
  if (!(this instanceof Context)) return new Context ();

  Base.apply(this);

  this.wrappedJSObject = this;

  this._interfaces = [ Ci.IWebCLContext,
                       Ci.nsISecurityCheckedComponent,
                       Ci.nsISupportsWeakReference,
                       Ci.nsIClassInfo,
                       Ci.nsISupports
                     ];

  this._objectRegistry = {};
}

Context.prototype = Object.create (Base.prototype);

addMixin (Context.prototype, OwnerMixin);


Context.prototype.classDescription = CLASSNAME;
Context.prototype.classID =          Components.ID(CID);
Context.prototype.contractID =       CONTRACTID;
Context.prototype.QueryInterface =   XPCOMUtils.generateQI ([ Ci.IWebCLContext,
                                                              Ci.nsISecurityCheckedComponent,
                                                              Ci.nsISupportsWeakReference,
                                                              Ci.nsIClassInfo
                                                            ]);


//------------------------------------------------------------------------------
// IWebCLContext

// createBuffer()._owner == this == [WebCLContext]
//
Context.prototype.createBuffer = function (memFlags, sizeInBytes, hostPtr)
{
  TRACE (this, "createBuffer", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (!webclutils.validateNumber(memFlags) || !webclutils.validateMemFlags(memFlags))
      throw new CLError(ocl_errors.CL_INVALID_VALUE, "'memFlags' must be a valid CLenum; was " + memFlags, "WebCLContext.createBuffer");

    var clBuffer = this._internal.createBuffer (memFlags, sizeInBytes, hostPtr);
    return this._wrapInternal (clBuffer, this);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


// createCommandQueue()._owner == this == [WebCLContext]
//
Context.prototype.createCommandQueue = function (device, properties)
{
  TRACE (this, "createCommandQueue", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    // Validate the given device, or use default device

    var supportedDevices = this.getInfo(ocl_info.CL_CONTEXT_DEVICES);

    if (device === undefined || device === null) {
      device = supportedDevices[0];
    }
    else 
    {
      if (!webclutils.validateDevice(device))
        throw new CLError(ocl_errors.CL_INVALID_DEVICE,
                          "1st argument must be a valid WebCLDevice or null, was " + device, 
                          "Context.createCommandQueue [webclcontext.js]");

      if (supportedDevices.indexOf(device) === -1)
        throw new CLError(ocl_errors.CL_INVALID_DEVICE,
                          "the given WebCLDevice is not associated with this WebCLContext",
                          "Context.createCommandQueue [webclcontext.js]");
    }

    // Validate the given properties, or use default properties

    var validProperties = ocl_const.CL_QUEUE_PROFILING_ENABLE | ocl_const.CL_QUEUE_OUT_OF_ORDER_EXEC_MODE_ENABLE;
    var supportedProperties = device.getInfo (ocl_info.CL_DEVICE_QUEUE_PROPERTIES);

    if (properties === undefined || properties === null) {
      properties = 0;
    }
    else
    {
      if (!webclutils.validateBitfield(properties, validProperties))
        throw new CLError(ocl_errors.CL_INVALID_VALUE, 
                          "2nd argument must be a valid bitfield of command queue properties, was " + properties, 
                          "Context.createCommandQueue [webclcontext.js]");

      if (!webclutils.validateBitfield(properties, supportedProperties))
        throw new CLError(ocl_errors.CL_INVALID_QUEUE_PROPERTIES,
                          "the given properties (" + properties + ") are not supported by the selected device",
                          "Context.createCommandQueue [webclcontext.js]");
    }

    var clDevice = this._unwrapInternalOrNull (device);
    var clQueue = this._internal.createCommandQueue (clDevice, properties);
    return this._wrapInternal (clQueue, this);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


// createImage()._owner == this == [WebCLContext]
//
Context.prototype.createImage = function (memFlags, descriptor, hostPtr)
{
  TRACE (this, "createImage", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    // Validate 'memFlags'
    //

    if (!webclutils.validateNumber(memFlags) || !webclutils.validateMemFlags(memFlags))
      throw new CLError(ocl_errors.CL_INVALID_VALUE, "'memFlags' must be a valid CLenum; was " + memFlags);

    // Validate the presence and type of required fields in 'descriptor'
    //

    if (!webclutils.validateObject(descriptor))
      throw new CLError(ocl_errors.CL_INVALID_IMAGE_DESCRIPTOR, "'descriptor' must be a valid WebCLImageDescriptor; was " + descriptor);

    if (!webclutils.validateNumber(descriptor.width))
      throw new CLError(ocl_errors.CL_INVALID_IMAGE_DESCRIPTOR, "'descriptor.width' must be a number; was " + descriptor.width);

    if (!webclutils.validateNumber(descriptor.height))
      throw new CLError(ocl_errors.CL_INVALID_IMAGE_DESCRIPTOR, "'descriptor.height' must be a number; was " + descriptor.height);

    if (descriptor.channelOrder !== undefined && !webclutils.validateNumber(descriptor.channelOrder))
      throw new CLError(ocl_errors.CL_INVALID_IMAGE_DESCRIPTOR, "'descriptor.channelOrder' must be a number; was " + descriptor.channelOrder);

    if (descriptor.channelType !== undefined && !webclutils.validateNumber(descriptor.channelType))
      throw new CLError(ocl_errors.CL_INVALID_IMAGE_DESCRIPTOR, "'descriptor.channelType' must be a number; was " + descriptor.channelType);

    // Validate 'channelOrder' and 'channelType' (but NOT their combination with each other and memFlags)
    //

    if (descriptor.channelOrder !== undefined && !webclutils.validateImageChannelOrder(descriptor))
      throw new CLError(ocl_errors.CL_INVALID_IMAGE_FORMAT_DESCRIPTOR, "'descriptor.channelOrder' must be a valid CLenum; was "+descriptor.channelOrder);

    if (descriptor.channelType !== undefined && !webclutils.validateImageChannelType(descriptor))
      throw new CLError(ocl_errors.CL_INVALID_IMAGE_FORMAT_DESCRIPTOR, "'descriptor.channelType' must be a valid CLenum; was "+descriptor.channelType);

    descriptor.channelOrder = descriptor.channelOrder || ocl_const.CL_RGBA;
    descriptor.channelType = descriptor.channelType || ocl_const.CL_UNORM_INT8;

    // Validate 'width' and 'height' (but NOT their combination with each other and the image format)
    //

    if (descriptor.width <= 0)
      throw new CLError(ocl_errors.CL_INVALID_IMAGE_SIZE, "'descriptor.width' must be greater than 0; was " + descriptor.width);

    if (descriptor.height <= 0)
      throw new CLError(ocl_errors.CL_INVALID_IMAGE_SIZE, "'descriptor.height' must be greater than 0; was " + descriptor.height);

    if (descriptor.width > 8192) // TODO get real DEVICE_IMAGE2D_MAX_WIDTH
      throw new CLError(ocl_errors.CL_INVALID_IMAGE_SIZE, "'descriptor.width' must be <= 8192; was " + descriptor.width);

    if (descriptor.height > 8192)  // TODO get real DEVICE_IMAGE2D_MAX_HEIGHT
      throw new CLError(ocl_errors.CL_INVALID_IMAGE_SIZE, "'descriptor.height' must be <= 8192; was " + descriptor.height);

    // Validate 'rowPitch'
    //

    if (descriptor.rowPitch !== undefined) {

      if (!webclutils.validateNumber(descriptor.rowPitch))
        throw new CLError(ocl_errors.CL_INVALID_IMAGE_DESCRIPTOR, "'descriptor.rowPitch' must be a number; was " + descriptor.rowPitch);

      if (descriptor.rowPitch < 0)
        throw new CLError(ocl_errors.CL_INVALID_IMAGE_SIZE, "'descriptor.rowPitch' must be >= 0; was " + descriptor.rowPitch);

      if (hostPtr === null && descriptor.rowPitch !== 0)
        throw new CLError(ocl_errors.CL_INVALID_IMAGE_SIZE, "'descriptor.rowPitch' must be zero if 'hostPtr' is null; was " + descriptor.rowPitch);

      DEBUG( "descriptor.rowPitch = " + descriptor.rowPitch);
      DEBUG( "descriptor.width = " + descriptor.width);
      DEBUG( "descriptor.channelOrder = " + descriptor.channelOrder);
      DEBUG( "descriptor.channelType = " + descriptor.channelType);
      DEBUG( "bytesPerPixel = " + webclutils.getBytesPerPixel(descriptor));

      if (hostPtr !== null && (descriptor.rowPitch > 0) && (descriptor.rowPitch < descriptor.width * webclutils.getBytesPerPixel(descriptor)))
        throw new CLError(ocl_errors.CL_INVALID_IMAGE_SIZE, "'descriptor.rowPitch' must be zero or >= width*bytesPerPixel; was " + descriptor.rowPitch);
    }

    descriptor.rowPitch = descriptor.rowPitch || 0;

    // Validate 'hostPtr'
    //

    if (hostPtr !== null) {

      var bytesPerPixel = webclutils.getBytesPerPixel(descriptor);
      var rowPitch = descriptor.rowPitch || (descriptor.width * bytesPerPixel);

      if (!webclutils.validateArrayBufferView(hostPtr))
        throw new CLError(ocl_errors.CL_INVALID_HOST_PTR, "'hostPtr' must be a valid ArrayBufferView; was " + hostPtr);

      if (hostPtr.byteLength < descriptor.height * rowPitch)
        throw new CLError(ocl_errors.CL_INVALID_HOST_PTR, "'hostPtr.byteLength' must be >= height*rowPitch; was " + hostPtr.byteLength);

      memFlags |= ocl_const.CL_MEM_COPY_HOST_PTR;
    }

    var clImage = this._internal.createImage2D (memFlags,
                                                descriptor,
                                                descriptor.width,
                                                descriptor.height,
                                                descriptor.rowPitch,
                                                hostPtr);
    return this._wrapInternal (clImage, this);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


// createProgram()._owner == this == [WebCLContext]
//
Context.prototype.createProgram = function (source)
{
  TRACE (this, "createProgram", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (!webclutils.validateString(source))
      throw new CLError(ocl_errors.CL_INVALID_VALUE, "'source' must be a non-empty string; was " + source, "WebCLContext.createProgram");

    var clProgram = this._internal.createProgramWithSource (source);
    return this._wrapInternal (clProgram, this);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


// createSampler()._owner == this == [WebCLContext]
//
Context.prototype.createSampler = function (normalizedCoords, addressingMode, filterMode)
{
  TRACE (this, "createSampler", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    var clSampler = this._internal.createSampler (normalizedCoords, addressingMode, filterMode);
    return this._wrapInternal (clSampler, this);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


// createUserEvent()._owner == this == [WebCLContext]
//
Context.prototype.createUserEvent = function ()
{
  TRACE (this, "createUserEvent", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    var clUserEvent = this._internal.createUserEvent ();
    return this._wrapInternal (clUserEvent, this);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


// getInfo(CONTEXT_DEVICES)[i]._owner == this._owner == [WebCL]
//
Context.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (!webclutils.validateNumber(name))
      throw new CLError(ocl_errors.CL_INVALID_VALUE, "'name' must be a valid CLenum; was " + name, "WebCLContext.getInfo");

    switch (name)
    {
    case ocl_info.CL_CONTEXT_NUM_DEVICES:
    case ocl_info.CL_CONTEXT_DEVICES:
      var clInfoItem = this._internal.getInfo (name);
      return this._wrapInternal (clInfoItem);
    default:
      throw new CLError (ocl_errors.CL_INVALID_VALUE, "Unrecognized enum " + name, "WebCLContext.getInfo");
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


Context.prototype.getSupportedImageFormats = function (memFlags)
{
  TRACE (this, "getSupportedImageFormats", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (memFlags === undefined || memFlags === null)
      memFlags = ocl_const.CL_MEM_READ_WRITE;

    if (!webclutils.validateNumber(memFlags) || !webclutils.validateMemFlags(memFlags))
      throw new CLError(ocl_errors.CL_INVALID_VALUE, "'memFlags' must be a valid CLenum; was " + memFlags, "WebCLContext.getSupportedImageFormats");

    var list = this._internal.getSupportedImageFormats (memFlags, ocl_const.CL_MEM_OBJECT_IMAGE2D);

    var rv = [];
    for (var i = 0; i < list.length; ++i)
    {
      rv.push (createWebCLImageDescriptor ({ channelOrder: list[i].channelOrder,
                                             channelType: list[i].channelType,
                                             width: 0,
                                             height: 0,
                                             rowPitch: 0 }));
    }

    return rv;
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


Context.prototype.releaseAll = function ()
{
  TRACE (this, "releaseAll", arguments);
  if(!this._ensureValidObject ()) return;

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
    throw webclutils.convertCLException (e);
  }
};


//------------------------------------------------------------------------------
// Internal functions


var NSGetFactory = XPCOMUtils.generateNSGetFactory ([Context]);


} catch(e) { ERROR ("webclcontext.js: "+EXCEPTIONSTR(e)); }
