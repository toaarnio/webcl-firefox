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
Cu.import ("resource://nrcwebcl/modules/logger.jsm");
Cu.import ("resource://nrcwebcl/modules/webclutils.jsm");
Cu.import ("resource://nrcwebcl/modules/base.jsm");
Cu.import ("resource://nrcwebcl/modules/webclconstructors.jsm");

Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");

Cu.import ("resource://nrcwebcl/modules/webclclasses.jsm");


function WebCLMemoryObject ()
{
  TRACE (this, "WebCLMemoryObject", arguments);
  try {
    if (!(this instanceof WebCLMemoryObject)) return new WebCLMemoryObject ();

    Base.apply(this);

    this.wrappedJSObject = this;

    this.__exposedProps__ =
    {
      getExternalIdentity: "r",
      getInfo: "r",
      release: "r",

      classDescription: "r"
    };
  }
  catch (e)
  {
    ERROR ("webclmemoryobject.jsm:WebCLMemoryObject failed: " + e);
    throw webclutils.convertCLException (e);
  }
}

WEBCLCLASSES.WebCLMemoryObject = WebCLMemoryObject;
WebCLMemoryObject.prototype = Object.create (Base.prototype);
WebCLMemoryObject.prototype.classDescription = "WebCLMemoryObject";



WebCLMemoryObject.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (!webclutils.validateNumber(name))
      throw new CLError(ocl_errors.CL_INVALID_VALUE, "'name' must be a valid CLenum; was " + name, "WebCLBuffer.getInfo");

    switch (name)
    {
    case ocl_info.CL_MEM_TYPE:
    case ocl_info.CL_MEM_FLAGS:
    case ocl_info.CL_MEM_SIZE:
    case ocl_info.CL_MEM_OFFSET:
    case ocl_info.CL_MEM_CONTEXT:
    case ocl_info.CL_MEM_ASSOCIATED_MEMOBJECT:
      var clInfoItem = this._internal.getInfo (name);
      return this._wrapInternal (clInfoItem);

    default:
      throw new CLError (ocl_errors.CL_INVALID_VALUE, "Unrecognized enum " + name, "WebCLBuffer.getInfo");
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
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

    this.__exposedProps__.getExternalIdentity = "r";
    this.__exposedProps__.createSubBuffer = "r";
  }
  catch (e)
  {
    ERROR ("webclmemoryobject.jsm:WebCLBuffer failed: " + e);
    throw webclutils.convertCLException (e);
  }
}

WEBCLCLASSES.WebCLBuffer = WebCLBuffer;
WebCLBuffer.prototype = Object.create (WebCLMemoryObject.prototype);
WebCLBuffer.prototype.classDescription = "WebCLBuffer";



// TODO: Who's the owner of buffer.createSubBuffer().createSubBuffer()?
// createSubBuffer()._owner == this._owner == [WebCLContext]
//
WebCLBuffer.prototype.createSubBuffer = function (memFlags, origin, sizeInBytes)
{
  TRACE (this, "createSubBuffer", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    return this._wrapInternal (this._internal.createSubBuffer (memFlags, origin, sizeInBytes));
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
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

    this.__exposedProps__.getExternalIdentity = "r";
    this.__exposedProps__.getInfo = "r";
    this.__exposedProps__.release = "r";
  }
  catch (e)
  {
    ERROR ("webclmemoryobject.jsm:WebCLImage failed: " + e);
    throw webclutils.convertCLException (e);
  }
}

WEBCLCLASSES.WebCLImage = WebCLImage;
WebCLImage.prototype = Object.create (WebCLMemoryObject.prototype);
WebCLImage.prototype.classDescription = "WebCLImage";



WebCLImage.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (name === undefined) {
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
    case ocl_info.CL_MEM_TYPE:
    case ocl_info.CL_MEM_FLAGS:
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
    throw webclutils.convertCLException (e);
  }
};



} catch(e) { ERROR ("webclmemoryobject.jsm: "+e); }
