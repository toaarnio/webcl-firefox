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

Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_constants.jsm");


function MemoryObject ()
{
  if (!this instanceof MemoryObject) return new MemoryObject ();

  Base.apply(this);

  this.wrappedJSObject = this;

  this._interfaces = [ Ci.IWebCLMemoryObject,
                       Ci.nsISecurityCheckedComponent,
                       Ci.nsISupportsWeakReference,
                       Ci.nsIClassInfo,
                       Ci.nsISupports
                     ];
}


MemoryObject.prototype = Object.create (Base.prototype);


MemoryObject.prototype.classDescription = "WebCLMemoryObject";
MemoryObject.prototype.classID =          Components.ID("{cf7372e6-f2ec-467d-99dc-9eeb756bc3e3}");
MemoryObject.prototype.contractID =       "@webcl.nokiaresearch.com/IWebCLMemoryObject;1";
MemoryObject.prototype.QueryInterface =   XPCOMUtils.generateQI ([ Ci.IWebCLMemoryObject,
                                                                   Ci.nsISecurityCheckedComponent,
                                                                   Ci.nsISupportsWeakReference,
                                                                   Ci.nsIClassInfo
                                                                 ]);


//------------------------------------------------------------------------------
// IWebCLMemoryObject

MemoryObject.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);
  if(!this._ensureValidObject ()) throw CLInvalidated();

  try
  {
    return this._wrapInternal (this._internal.getInfo (name));
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};



//==============================================================================

function Buffer (owner)
{
  if (!this instanceof Buffer) return new Buffer ();

  MemoryObject.apply(this);

  this.wrappedJSObject = this;

  this._interfaces = [ Ci.IWebCLBuffer,
                       Ci.IWebCLMemoryObject,
                       Ci.nsISecurityCheckedComponent,
                       Ci.nsISupportsWeakReference,
                       Ci.nsIClassInfo,
                       Ci.nsISupports
                     ];
}

Buffer.prototype = Object.create (MemoryObject.prototype);

Buffer.prototype.classDescription = "WebCLBuffer";
Buffer.prototype.classID =          Components.ID("{a05ce65b-1962-42bb-81cf-08b2d5ced245}");
Buffer.prototype.contractID =       "@webcl.nokiaresearch.com/IWebCLBuffer;1";
Buffer.prototype.QueryInterface =   XPCOMUtils.generateQI ([ Ci.IWebCLBuffer,
                                                             Ci.IWebCLMemoryObject,
                                                             Ci.nsISecurityCheckedComponent,
                                                             Ci.nsISupportsWeakReference,
                                                             Ci.nsIClassInfo
                                                           ]);


Buffer.prototype.createSubBuffer = function (memFlags, origin, sizeInBytes)
{
  TRACE (this, "createSubBuffer", arguments);
  if(!this._ensureValidObject ()) throw CLInvalidated();

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

function Image (owner)
{
  if (!this instanceof Image) return new Image ();

  MemoryObject.apply(this);

  this.wrappedJSObject = this;

  this._interfaces = [ Ci.IWebCLImage,
                       Ci.nsISecurityCheckedComponent,
                       Ci.nsISupportsWeakReference,
                       Ci.nsIClassInfo,
                       Ci.nsISupports
                     ];
}

Image.prototype = Object.create (MemoryObject.prototype);

Image.prototype.classDescription = "WebCLImage";
Image.prototype.classID =          Components.ID("{af42d437-b62c-43de-985c-c65e28a82ead}");
Image.prototype.contractID =       "@webcl.nokiaresearch.com/IWebCLImage;1";
Image.prototype.QueryInterface =   XPCOMUtils.generateQI ([ Ci.IWebCLImage,
                                                            Ci.nsISecurityCheckedComponent,
                                                            Ci.nsISupportsWeakReference,
                                                            Ci.nsIClassInfo
                                                          ]);


Image.prototype.getInfo = function ()
{
  TRACE (this, "getInfo", arguments);
  if(!this._ensureValidObject ()) throw CLInvalidated();

  try
  {
    var imageFormat = this._internal.getImageInfo (ocl_const.CL_IMAGE_FORMAT);
    var width = this._internal.getImageInfo (this, ocl_const.CL_IMAGE_WIDTH);
    var height = this._internal.getImageInfo (this, ocl_const.CL_IMAGE_HEIGHT);
    var rowPitch = this._internal.getImageInfo (this, ocl_const.CL_IMAGE_ROW_PITCH);

    var rv = {
      channelOrder: +(imageFormat.image_channel_order) || ocl_const.CL_RGBA,
      channelType:  +(imageFormat.image_channel_data_type) || ocl_const.CL_UNORM_INT8,
      width:        +width || 0,
      height:       +height || 0,
      rowPitch:     +rowPitch || 0
    };

    return rv;
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};



//==============================================================================


//------------------------------------------------------------------------------
// Internal functions


MemoryObject.prototype._getRefCount = function ()
{
  try
  {
    if (this._internal)
    {
      return this._internal.getInfo (ocl_info.CL_MEM_REFERENCE_COUNT);
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



var NSGetFactory = XPCOMUtils.generateNSGetFactory ([MemoryObject, Buffer, Image]);


} catch(e) { ERROR ("webclmemoryobject.js: "+EXCEPTIONSTR(e)); }
