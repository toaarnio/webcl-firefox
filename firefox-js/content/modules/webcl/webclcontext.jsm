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
Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/webclutils.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/base.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/webclconstructors.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/mixin.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/mixins/owner.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_exception.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/wrapper.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/webclclasses.jsm");


function WebCLContext ()
{
  TRACE (this, "WebCLContext", arguments);
  try {
    if (!(this instanceof WebCLContext)) return new WebCLContext ();

    Base.apply(this);

    this.wrappedJSObject = this;

    this.exceptionType = INVALID_CONTEXT;

    this._objectRegistryInternal = {};
    this._objectRegistry = {};

    this.__exposedProps__ =
    {
      getManagedIdentityList: "r",
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
    throw e;
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

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 2, 3);

    hostPtr = webclutils.unray(webclutils.defaultTo(hostPtr, null));

    if (!webclutils.validateInteger(memFlags) || !webclutils.validateMemFlags(memFlags))
      throw new INVALID_VALUE("memFlags must be a valid CLenum; was ", memFlags);

    if (!webclutils.validateNonNegativeInt32(sizeInBytes))
      throw new INVALID_VALUE("sizeInBytes must be an integer in [1, 2^32); was ", sizeInBytes);

    if (sizeInBytes === 0) 
      throw new INVALID_BUFFER_SIZE("sizeInBytes must be an integer in [1, 2^32); was zero");

    for (var i=0; i < this.getInfo(ocl_info.CL_CONTEXT_NUM_DEVICES); i++) {
      var device = this.getInfo(ocl_info.CL_CONTEXT_DEVICES)[i];
      var maxBufferSize = device.getInfo(ocl_info.CL_DEVICE_MAX_MEM_ALLOC_SIZE);
      if (sizeInBytes > maxBufferSize)
        throw new INVALID_BUFFER_SIZE("sizeInBytes must not be larger than DEVICE_MAX_MEM_ALLOC_SIZE ("+maxBufferSize+"); was " + sizeInBytes);
    }

    if (hostPtr !== null) {

      if (!webclutils.validateArrayBufferView(hostPtr))
        throw new INVALID_HOST_PTR("hostPtr must be a valid ArrayBufferView; was ", hostPtr);

      if (hostPtr.byteLength < sizeInBytes)
        throw new INVALID_HOST_PTR("hostPtr.byteLength must be >= sizeInBytes; was ", hostPtr.byteLength);

      memFlags |= ocl_const.CL_MEM_COPY_HOST_PTR;
    }

    var clBuffer = this._internal.createBuffer (memFlags, sizeInBytes, hostPtr);
    return this._wrapInternal (clBuffer, this);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
  }
};


// createCommandQueue()._owner == this == [WebCLContext]
//
WebCLContext.prototype.createCommandQueue = function (device, properties)
{
  TRACE (this, "createCommandQueue", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 0, 2);

    if (this._webclState.inCallback) throw new INVALID_OPERATION ("this function cannot be called from a WebCLCallback");

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
    throw e;
  }
};


// createImage()._owner == this == [WebCLContext]
//
WebCLContext.prototype.createImage = function (memFlags, descriptor, hostPtr)
{
  TRACE (this, "createImage", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 2, 3);

    // Validate the presence and type of mandatory arguments

    if (!webclutils.validateInteger(memFlags) || !webclutils.validateMemFlags(memFlags))
      throw new INVALID_VALUE("'memFlags' must be a valid CLenum; was ", memFlags);

    if (!webclutils.validateImageDescriptor(descriptor))
      throw new INVALID_IMAGE_DESCRIPTOR("'descriptor' must be a valid WebCLImageDescriptor (or equivalent); was ", descriptor);

    // Fill in defaults for optional arguments (only if they're left undefined)

    descriptor.channelOrder = webclutils.defaultTo(descriptor.channelOrder, ocl_const.CL_RGBA);
    descriptor.channelType = webclutils.defaultTo(descriptor.channelType, ocl_const.CL_UNORM_INT8);
    descriptor.rowPitch = webclutils.defaultTo(descriptor.rowPitch, 0);
    hostPtr = webclutils.unray(webclutils.defaultTo(hostPtr, null));

    // Validate channelOrder and channelType (TODO: validate against what's actually supported)

    if (!webclutils.validateImageChannelOrder(descriptor))
      throw new INVALID_IMAGE_FORMAT_DESCRIPTOR("'descriptor.channelOrder' must be a valid CLenum; was ", descriptor.channelOrder);

    if (!webclutils.validateImageChannelType(descriptor))
      throw new INVALID_IMAGE_FORMAT_DESCRIPTOR("'descriptor.channelType' must be a valid CLenum; was ", descriptor.channelType);

    if (!webclutils.validateImageFormat(descriptor))
      throw new INVALID_IMAGE_FORMAT_DESCRIPTOR("'descriptor.channelType' ("+descriptor.channelType+") is not compatible with " +
                                                "'descriptor.channelOrder' ("+descriptor.channelOrder+")");

    // Fetch maximum supported image dimensions

    var maxSupportedWidth = 32768;
    var maxSupportedHeight = 32768;
    for (var i=0; i < this.getInfo(ocl_info.CL_CONTEXT_NUM_DEVICES); i++) {
      var device = this.getInfo(ocl_info.CL_CONTEXT_DEVICES)[i];
      maxSupportedWidth = Math.min(maxSupportedWidth, device.getInfo(ocl_info.CL_DEVICE_IMAGE2D_MAX_WIDTH));
      maxSupportedHeight = Math.min(maxSupportedHeight, device.getInfo(ocl_info.CL_DEVICE_IMAGE2D_MAX_HEIGHT));
    }

    // Validate width, height, and rowPitch

    if (!webclutils.validateNonNegativeInt32(descriptor.width))
      throw new INVALID_IMAGE_DESCRIPTOR("'descriptor.width' must be a positive integer; was ", descriptor.width);

    if (!webclutils.validateNonNegativeInt32(descriptor.height))
      throw new INVALID_IMAGE_DESCRIPTOR("'descriptor.height' must be a positive integer; was ", descriptor.height);

    if (descriptor.width === 0 || descriptor.width > maxSupportedWidth)
      throw new INVALID_IMAGE_SIZE("'descriptor.width' must be greater than zero and <= "+maxSupportedWidth+"; was ", descriptor.width);

    if (descriptor.height === 0 || descriptor.height > maxSupportedHeight)
      throw new INVALID_IMAGE_SIZE("'descriptor.height' must be greater than zero and <= "+maxSupportedHeight+"; was ", descriptor.height);

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
    if (e instanceof CLError)
    {
      switch (e.err)
      {
        case ocl_errors.CL_IMAGE_FORMAT_NOT_SUPPORTED:
          e.msg = "The given combination channelOrder, channelType and memFlags is not supported by this WebCLContext."
          break;
      }
    }

    try { ERROR(String(e)); }catch(e){}
    throw e;
  }
};


// createProgram()._owner == this == [WebCLContext]
//
WebCLContext.prototype.createProgram = function (source)
{
  TRACE (this, "createProgram", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 1);

    if (typeof(source) !== 'string')
      throw new TypeError("'source' must be a non-empty string; was " + source);

    if (source.length === 0)
      throw new INVALID_VALUE("'source' must not be empty");

    if (this._webclState.validator)
    {
      var program = createWebCLValidatedProgram (this);
      program.setOriginalSource (source);
      return program;
    }
    else
    {
      var clProgram = this._internal.createProgramWithSource (source);
      return this._wrapInternal (clProgram, this);
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
  }
};


// createSampler()._owner == this == [WebCLContext]
//
WebCLContext.prototype.createSampler = function (normalizedCoords, addressingMode, filterMode)
{
  TRACE (this, "createSampler", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 3);

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
    throw e;
  }
};


// createUserEvent()._owner == this == [WebCLContext]
//
WebCLContext.prototype.createUserEvent = function ()
{
  TRACE (this, "createUserEvent", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 0);

    var clUserEvent = this._internal.createUserEvent ();
    return this._wrapInternal (clUserEvent, this);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
  }
};


// getInfo(CONTEXT_DEVICES)[i]._owner == this._owner == [WebCL]
//
WebCLContext.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 1);

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
    throw e;
  }
};


WebCLContext.prototype.getSupportedImageFormats = function (memFlags)
{
  TRACE (this, "getSupportedImageFormats", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 0, 1);

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
    throw e;
  }
};


WebCLContext.prototype.releaseAll = function ()
{
  TRACE (this, "releaseAll", arguments);
  if (this._invalid) return;

  try
  {
    webclutils.validateNumArgs(arguments.length, 0);

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


} catch(e) { ERROR ("webclcontext.jsm: "+e); }
