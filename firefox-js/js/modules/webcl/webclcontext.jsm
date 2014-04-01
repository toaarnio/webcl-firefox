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

var EXPORTED_SYMBOLS = [ "WebCLContext" ];


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

Cu.import ("resource://nrcwebcl/modules/webclclasses.jsm");


function WebCLContext ()
{
  TRACE (this, "WebCLContext", arguments);
  try {
    if (!(this instanceof WebCLContext)) return new WebCLContext ();

    Base.apply(this);

    this.wrappedJSObject = this;

    this._objectRegistry = {};

    this.__exposedProps__ =
    {
      getExternalIdentity: "r",
      getManagedExternalIdentityList: "r",
      createBuffer: "r",
      createCommandQueue: "r",
      createImage: "r",
      createProgram: "r",
      createSampler: "r",
      createUserEvent: "r",
      getInfo: "r",
      getSupportedImageFormats: "r",
      release: "r",
      releaseAll: "r",

      classDescription: "r"
    };
  }
  catch (e)
  {
    ERROR ("webclcontext.jsm:WebCLContext failed: " + e);
    throw webclutils.convertCLException (e);
  }
}

WEBCLCLASSES.WebCLContext = WebCLContext;
WebCLContext.prototype = Object.create (Base.prototype);
addMixin (WebCLContext.prototype, OwnerMixin);
WebCLContext.prototype.classDescription = "WebCLContext";



// createBuffer()._owner == this == [WebCLContext]
//
WebCLContext.prototype.createBuffer = function (memFlags, sizeInBytes, hostPtr)
{
  TRACE (this, "createBuffer", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (hostPtr === undefined) hostPtr = null;

    // Validate 'memFlags'
    //

    if (!webclutils.validateInteger(memFlags) || !webclutils.validateMemFlags(memFlags))
      throw new INVALID_VALUE("'memFlags' must be a valid CLenum; was ", memFlags);

    // Validate 'sizeInBytes'
    //

    if (!webclutils.validatePositiveInt32(sizeInBytes))
      throw new INVALID_BUFFER_SIZE("'sizeInBytes' must be a positive integer; was ", sizeInBytes);

    // TODO: validate sizeInBytes <= DEVICE_MAX_MEM_ALLOC_SIZE

    // Validate 'hostPtr'
    //

    if (hostPtr !== null) {

      if (!webclutils.validateArrayBufferView(hostPtr))
        throw new INVALID_HOST_PTR("'hostPtr' must be a valid ArrayBufferView; was ", hostPtr);

      if (hostPtr.byteLength < sizeInBytes)
        throw new INVALID_HOST_PTR("'hostPtr.byteLength' must be >= sizeInBytes; was ", hostPtr.byteLength);

      memFlags |= ocl_const.CL_MEM_COPY_HOST_PTR;
    }

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
WebCLContext.prototype.createCommandQueue = function (device, properties)
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
        throw new INVALID_DEVICE("'device' must be a valid WebCLDevice or null, was ", device);

      if (supportedDevices.indexOf(device) === -1)
        throw new INVALID_DEVICE("'device' must be associated with this WebCLContext; was ", device);
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
        throw new INVALID_VALUE("'properties' must be a valid bitfield of command queue properties; was ", properties);

      if (!webclutils.validateBitfield(properties, supportedProperties))
        throw new INVALID_QUEUE_PROPERTIES("the given WebCLDevice does not support the given queue properties: ", properties);
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
WebCLContext.prototype.createImage = function (memFlags, descriptor, hostPtr)
{
  TRACE (this, "createImage", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    // Validate the presence and type of mandatory arguments

    if (arguments.length < 2 || arguments.length > 3)
      throw new CLInvalidArgument("Expected 2 or 3 arguments, received " + arguments.length);

    if (!webclutils.validateInteger(memFlags) || !webclutils.validateMemFlags(memFlags))
      throw new INVALID_VALUE("'memFlags' must be a valid CLenum; was ", memFlags);

    if (!webclutils.validateObject(descriptor))
      throw new INVALID_IMAGE_DESCRIPTOR("'descriptor' must be a valid WebCLImageDescriptor; was ", descriptor);

    // Fill in defaults for optional arguments (only if they're left undefined)

    descriptor.channelOrder = webclutils.defaultTo(descriptor.channelOrder, ocl_const.CL_RGBA);
    descriptor.channelType = webclutils.defaultTo(descriptor.channelType, ocl_const.CL_UNORM_INT8);
    descriptor.rowPitch = webclutils.defaultTo(descriptor.rowPitch, 0);
    hostPtr = webclutils.defaultTo(hostPtr, null);

    // Validate channelOrder and channelType (TODO: validate against what's actually supported)

    if (!webclutils.validateImageChannelOrder(descriptor))
      throw new INVALID_IMAGE_FORMAT_DESCRIPTOR("'descriptor.channelOrder' must be a valid CLenum; was ", descriptor.channelOrder);

    if (!webclutils.validateImageChannelType(descriptor))
      throw new INVALID_IMAGE_FORMAT_DESCRIPTOR("'descriptor.channelType' must be a valid CLenum; was ", descriptor.channelType);

    // Validate width, height, and rowPitch

    if (!webclutils.validatePositiveInt32(descriptor.width))
      throw new INVALID_IMAGE_DESCRIPTOR("'descriptor.width' must be a positive integer; was ", descriptor.width);

    if (!webclutils.validatePositiveInt32(descriptor.height))
      throw new INVALID_IMAGE_DESCRIPTOR("'descriptor.height' must be a positive integer; was ", descriptor.height);

    if (descriptor.width > 8192) // TODO get real DEVICE_IMAGE2D_MAX_WIDTH
      throw new INVALID_IMAGE_SIZE("'descriptor.width' must be <= 8192; was ", descriptor.width);

    if (descriptor.height > 8192)  // TODO get real DEVICE_IMAGE2D_MAX_HEIGHT
      throw new INVALID_IMAGE_SIZE("'descriptor.height' must be <= 8192; was ", descriptor.height);

    if (!webclutils.validateNonNegativeInt32(descriptor.rowPitch))
      throw new INVALID_IMAGE_DESCRIPTOR("'descriptor.rowPitch' must be a non-negative integer; was ", descriptor.rowPitch);

    if (hostPtr === null && descriptor.rowPitch !== 0)
      throw new INVALID_IMAGE_SIZE("'descriptor.rowPitch' must be zero if 'hostPtr' is null; was ", descriptor.rowPitch);

    if (hostPtr !== null && (descriptor.rowPitch > 0) && (descriptor.rowPitch < descriptor.width * webclutils.getBytesPerPixel(descriptor)))
      throw new INVALID_IMAGE_SIZE("'descriptor.rowPitch' must be zero or >= width*bytesPerPixel if hostPtr is not null; was ", descriptor.rowPitch);

    // Validate hostPtr

    if (hostPtr !== null) {

      var bytesPerPixel = webclutils.getBytesPerPixel(descriptor);
      var rowPitch = descriptor.rowPitch || (descriptor.width * bytesPerPixel);

      if (!webclutils.validateArrayBufferView(hostPtr))
        throw new INVALID_HOST_PTR("'hostPtr' must be a valid ArrayBufferView; was ", hostPtr);

      if (hostPtr.byteLength < descriptor.height * rowPitch)
        throw new INVALID_HOST_PTR("'hostPtr.byteLength' must be >= height*rowPitch; was ", hostPtr.byteLength);

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
WebCLContext.prototype.createProgram = function (source)
{
  TRACE (this, "createProgram", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (!webclutils.validateString(source))
      throw new INVALID_VALUE("'source' must be a non-empty string; was ", source);

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
WebCLContext.prototype.createSampler = function (normalizedCoords, addressingMode, filterMode)
{
  TRACE (this, "createSampler", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (!webclutils.validateBoolean(normalizedCoords))
      throw new INVALID_VALUE("normalizedCoords must be a boolean; was ", normalizedCoords);

    if (addressingMode !== ocl_const.CL_ADDRESS_CLAMP &&
        addressingMode !== ocl_const.CL_ADDRESS_CLAMP_TO_EDGE &&
        addressingMode !== ocl_const.CL_ADDRESS_REPEAT &&
        addressingMode !== ocl_const.CL_ADDRESS_MIRRORED_REPEAT)
      throw new INVALID_VALUE("addressingMode must be a valid CLenum; was ", addressingMode);

    if (filterMode !== ocl_const.CL_FILTER_NEAREST &&
        filterMode !== ocl_const.CL_FILTER_LINEAR)
      throw new INVALID_VALUE("filterMode must be a valid CLenum; was ", filterMode);

    if (normalizedCoords === false && 
        (addressingMode === ocl_const.CL_ADDRESS_REPEAT ||
         addressingMode === ocl_const.CL_ADDRESS_MIRRORED_REPEAT))
      throw new INVALID_VALUE("addressingMode must not be {MIRRORED_}REPEAT if normalizedCoords is false; was ", addressingMode);

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
WebCLContext.prototype.createUserEvent = function ()
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
WebCLContext.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (!webclutils.validateInteger(name))
      throw new INVALID_VALUE("'name' must be a valid CLenum; was ", name);

    switch (name)
    {
    case ocl_info.CL_CONTEXT_NUM_DEVICES:
    case ocl_info.CL_CONTEXT_DEVICES:
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


WebCLContext.prototype.getSupportedImageFormats = function (memFlags)
{
  TRACE (this, "getSupportedImageFormats", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (memFlags === undefined)
      memFlags = ocl_const.CL_MEM_READ_WRITE;

    if (!webclutils.validateInteger(memFlags) || !webclutils.validateMemFlags(memFlags))
      throw new INVALID_VALUE("'memFlags' must be a valid CLenum; was ", memFlags);

    var list = this._internal.getSupportedImageFormats (memFlags, ocl_const.CL_MEM_OBJECT_IMAGE2D);

    var rv = [];
    for (var i = 0; i < list.length; ++i)
    {
      if (webclutils.validateImageFormat(list[i]))
      {
        rv.push (createWebCLImageDescriptor ({ channelOrder: list[i].channelOrder,
                                               channelType: list[i].channelType,
                                               width: 0,
                                               height: 0,
                                               rowPitch: 0 }));
      }
    }
    return rv;
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLContext.prototype.releaseAll = function ()
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


} catch(e) { ERROR ("webclcontext.jsm: "+e); }
