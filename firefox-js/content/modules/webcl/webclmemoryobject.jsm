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

var EXPORTED_SYMBOLS = [ "WebCLMemoryObject", "WebCLBuffer", "WebCLImage" ];


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

Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_exception.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/webclclasses.jsm");


function WebCLMemoryObject ()
{
  TRACE (this, "WebCLMemoryObject", arguments);
  try {
    if (!(this instanceof WebCLMemoryObject)) return new WebCLMemoryObject ();

    Base.apply(this);

    this.wrappedJSObject = this;

    this.__exposedProps__ =
    {
      getInfo: "r",
      release: "r",

      classDescription: "r"
    };
  }
  catch (e)
  {
    ERROR ("webclmemoryobject.jsm:WebCLMemoryObject failed: " + e);
    throw e;
  }
}

WEBCLCLASSES.WebCLMemoryObject = WebCLMemoryObject;
WebCLMemoryObject.prototype = Object.create (Base.prototype);
WebCLMemoryObject.prototype.classDescription = "WebCLMemoryObject";



WebCLMemoryObject.prototype.getInfo = function (name)
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
    case ocl_info.CL_MEM_FLAGS:
      var clInfoItem = this._internal.getInfo (name);
      clInfoItem = clInfoItem & ~(ocl_const.CL_MEM_COPY_HOST_PTR);
      return this._wrapInternal (clInfoItem);

    case ocl_info.CL_MEM_TYPE:
    case ocl_info.CL_MEM_SIZE:
    case ocl_info.CL_MEM_OFFSET:
    case ocl_info.CL_MEM_CONTEXT:
    case ocl_info.CL_MEM_ASSOCIATED_MEMOBJECT:
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



//==============================================================================

function WebCLBuffer ()
{
  TRACE (this, "WebCLBuffer", arguments);
  try {
    if (!(this instanceof WebCLBuffer)) return new WebCLBuffer ();

    WebCLMemoryObject.apply(this);

    this.wrappedJSObject = this;

    this.exceptionType = INVALID_MEM_OBJECT;

    this.isSubBuffer = false;

    this.__exposedProps__.createSubBuffer = "r";
  }
  catch (e)
  {
    ERROR ("webclmemoryobject.jsm:WebCLBuffer failed: " + e);
    throw e;
  }
}

WEBCLCLASSES.WebCLBuffer = WebCLBuffer;
WebCLBuffer.prototype = Object.create (WebCLMemoryObject.prototype);
WebCLBuffer.prototype.classDescription = "WebCLBuffer";



// createSubBuffer()._owner == this._owner == [WebCLContext]
//
WebCLBuffer.prototype.createSubBuffer = function (memFlags, origin, sizeInBytes)
{
  TRACE (this, "createSubBuffer", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 3);

    if (!webclutils.validateInteger(memFlags) || !webclutils.validateMemFlags(memFlags))
      throw new INVALID_VALUE("memFlags must be a valid CLenum; was ", memFlags);

    if (!webclutils.validateNonNegativeInt32(origin))
      throw new INVALID_VALUE("origin must be an integer in [0, 2^32); was ", origin);

    if (!webclutils.validatePositiveInt32(sizeInBytes))
      throw new INVALID_VALUE("sizeInBytes must be an integer in [1, 2^32); was ", sizeInBytes);

    if (this.isSubBuffer === true)
      throw new INVALID_MEM_OBJECT("this WebCLBuffer must not be a sub-buffer");

    var bufferFlags = this.getInfo(ocl_info.CL_MEM_FLAGS);
    var bufferSize = this.getInfo(ocl_info.CL_MEM_SIZE);
    var context = this.getInfo(ocl_info.CL_MEM_CONTEXT);
    var devices = context.getInfo(ocl_info.CL_CONTEXT_DEVICES);
    var requestedSize = origin + sizeInBytes;

    var maxAlignBytes = devices.reduce(function(maxBytes, device) {
      var alignBytes = device.getInfo(ocl_info.CL_DEVICE_MEM_BASE_ADDR_ALIGN) / 8;
      return Math.max(maxBytes, alignBytes);
    }, 64);

    if (origin >= bufferSize)
      throw new INVALID_VALUE("origin must be < "+bufferSize+" (the size this WebCLBuffer); was " + origin);

    if (sizeInBytes > bufferSize)
      throw new INVALID_VALUE("sizeInBytes must be <= "+bufferSize+" (the size this WebCLBuffer); was " + sizeInBytes);

    if (requestedSize > bufferSize)
      throw new INVALID_VALUE("origin+sizeInBytes must be <= "+bufferSize+" (the size this WebCLBuffer); was " + requestedSize);

    if (origin % maxAlignBytes !== 0)
      throw new MISALIGNED_SUB_BUFFER_OFFSET("origin must be a multiple of "+maxAlignBytes+" bytes; was " + origin);

    if (bufferFlags !== ocl_const.CL_MEM_READ_WRITE && memFlags !== bufferFlags)
      throw new INVALID_VALUE("cannot create a sub-buffer with read/write permissions ("+memFlags+") incompatible with its parent ("+bufferFlags+")");

    region = {};
    region.origin = origin;
    region.size = sizeInBytes;
    var clBuffer = this._internal.createSubBuffer (memFlags, ocl_const.CL_BUFFER_CREATE_TYPE_REGION, region);
    var newBuffer = this._wrapInternal (clBuffer);
    newBuffer.isSubBuffer = true;
    return newBuffer;
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
  }
};



//==============================================================================

function WebCLImage ()
{
  TRACE (this, "WebCLImage", arguments);
  try {
    if (!(this instanceof WebCLImage)) return new WebCLImage ();

    WebCLMemoryObject.apply(this);

    this.wrappedJSObject = this;

    this.exceptionType = INVALID_MEM_OBJECT;

    this.__exposedProps__.getInfo = "r";
    this.__exposedProps__.release = "r";
  }
  catch (e)
  {
    ERROR ("webclmemoryobject.jsm:WebCLImage failed: " + e);
    throw e;
  }
}

WEBCLCLASSES.WebCLImage = WebCLImage;
WebCLImage.prototype = Object.create (WebCLMemoryObject.prototype);
WebCLImage.prototype.classDescription = "WebCLImage";



WebCLImage.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 0, 1);

    if (arguments.length === 0) {
      var imageFormat = this._internal.getImageInfo (ocl_info.CL_IMAGE_FORMAT);
      var width = this._internal.getImageInfo (ocl_info.CL_IMAGE_WIDTH);
      var height = this._internal.getImageInfo (ocl_info.CL_IMAGE_HEIGHT);
      var rowPitch = this._internal.getImageInfo (ocl_info.CL_IMAGE_ROW_PITCH);

      var values = {
        channelOrder: +(imageFormat.image_channel_order) || ocl_const.CL_RGBA,
        channelType:  +(imageFormat.image_channel_data_type) || ocl_const.CL_UNORM_INT8,
        width:        +width || 0,
        height:       +height || 0,
        rowPitch:     +rowPitch || 0
      };

      return createWebCLImageDescriptor (values);    // NOTE: No need to wrapInternal
    }

    if (!webclutils.validateInteger(name))
      throw new INVALID_VALUE("'name' must be a valid CLenum; was ", name);

    switch (name)
    {
    case ocl_info.CL_MEM_FLAGS:
      var clInfoItem = this._internal.getInfo (name);
      clInfoItem = clInfoItem & ~(ocl_const.CL_MEM_COPY_HOST_PTR);
      return this._wrapInternal (clInfoItem);

    case ocl_info.CL_MEM_TYPE:
    case ocl_info.CL_MEM_SIZE:
    case ocl_info.CL_MEM_CONTEXT:
      var clInfoItem = this._internal.getInfo (name);
      return this._wrapInternal (clInfoItem);

    case ocl_info.CL_MEM_OFFSET:
      return 0;

    case ocl_info.CL_MEM_ASSOCIATED_MEMOBJECT:
      return null;

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



} catch(e) { ERROR ("webclmemoryobject.jsm: "+e); }
