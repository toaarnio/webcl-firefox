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

  this._contextProperties = null;

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

Context.prototype.createBuffer = function (memFlags, sizeInBytes, hostPtr)
{
  TRACE (this, "createBuffer", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    var clBuffer = this._internal.createBuffer (memFlags, sizeInBytes, hostPtr);
    return this._wrapInternal (clBuffer, this);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


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


Context.prototype.createImage = function (memFlags, descriptor, hostPtr)
{
  TRACE (this, "createImage", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    var clImageFormat = this._unwrapInternalOrNull (descriptor);

    if (clImageFormat == null)
    {
      if (descriptor.width === undefined || isNaN(+descriptor.width)
          || descriptor.height === undefined || isNaN(+descriptor.height))
      {
        throw new CLInvalidArgument ("descriptor");
      }

      clImageFormat = {
        width:        descriptor.width,
        height:       descriptor.height,
        rowPitch:     descriptor.rowPitch     || 0,
        channelOrder: descriptor.channelOrder || 0x10B5,
        channelType:  descriptor.channelType  || 0x10D2
      };
    }

    var clImage = this._internal.createImage2D (memFlags,
                                                clImageFormat,
                                                +clImageFormat.width,
                                                +clImageFormat.height,
                                                (+clImageFormat.rowPitch) || 0,
                                                hostPtr);
    return this._wrapInternal (clImage, this);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


Context.prototype.createProgram = function (source)
{
  TRACE (this, "createProgram", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (!source || typeof (source) != "string")
    {
      //throw new Exception ("Context.createProgram: Invalid argument: source.");  // TODO
      throw new CLInvalidArgument ("source");
    }

    var clProgram = this._internal.createProgramWithSource (source);
    return this._wrapInternal (clProgram, this);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


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


Context.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    switch (name)
    {
      case ocl_info.CL_CONTEXT_NUM_DEVICES:               break;
      case ocl_info.CL_CONTEXT_DEVICES:                   break;
      default:
        throw new CLError (ocl_errors.CL_INVALID_VALUE, "", "WebCLContext.getInfo");
    }

    var clInfoItem = this._internal.getInfo (name);
    return this._wrapInternal (clInfoItem, this);
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
    var list = this._internal.getSupportedImageFormats (memFlags,
                                                        ocl_const.CL_MEM_OBJECT_IMAGE2D);

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
    this._forEachRegistered (function (o)
    {
      if (o.wrappedJSObject) o = o.wrappedJSObject;
      if ("releaseAll" in o)
      {
        o.releaseAll ();
      }
      else
      {
        while (o._getRefCount())
        {
          o._unregister ();
          o.release ();
        }
      }
    });

    this._clearRegistry ();

    while (this._getRefCount())
    {
      this._unregister ();
      this.release ();
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


Context.prototype._getRefCount = function ()
{
  try
  {
    if (this._internal && !this._invalid)
    {
      return this._internal.getInfo (ocl_info.CL_CONTEXT_REFERENCE_COUNT);
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



var NSGetFactory = XPCOMUtils.generateNSGetFactory ([Context]);


} catch(e) { ERROR ("webclcontext.js: "+EXCEPTIONSTR(e)); }
