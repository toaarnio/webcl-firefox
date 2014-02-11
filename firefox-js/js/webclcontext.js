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
    return this._wrapInternal (this._internal.createBuffer (memFlags, sizeInBytes, hostPtr),
                               this);
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
    if (device && !(device instanceof Ci.IWebCLDevice))
    {
      //throw new Exception ("Context.createCommandQueue: Invalid argument: device.");  // TODO
      throw new CLInvalidArgument ("device");
    }
    if (!device) device = this.getInfo (ocl_info.CL_CONTEXT_DEVICES)[0];

    if (properties === undefined || properties === null)
    {
      properties = 0;
    }
    else
    {
      // NOTE: Should it be accepted that e.g. +[] and +"" eval to 0?
      //       The "object" test catches objects and arrays,
      //       strict equality to "" catches empty strings and what ever passes
      //       through must be possible to convert to Number.
      if (typeof(properties) == "object" || properties === "" ||
          isNaN(+properties))
      {
        throw new CLInvalidArgument ("properties");
      }
    }

    var clDevice = this._unwrapInternalOrNull (device);
    return this._wrapInternal (this._internal.createCommandQueue (clDevice, +properties),
                               this);
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

    return this._wrapInternal (this._internal.createImage2D (memFlags,
                                                             clImageFormat,
                                                             +clImageFormat.width,
                                                             +clImageFormat.height,
                                                             (+clImageFormat.rowPitch) || 0,
                                                             hostPtr));
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

    return this._wrapInternal (this._internal.createProgramWithSource (source), this);
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
    return this._wrapInternal (this._internal.createSampler (normalizedCoords, addressingMode, filterMode),
                               this);
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
    return this._wrapInternal (this._internal.createUserEvent ());
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
      case ocl_info.CL_CONTEXT_PROPERTIES:                return this._contextProperties;
      default:
        throw new CLError (ocl_errors.CL_INVALID_VALUE, "", "WebCLContext.getInfo");
    }

    return this._wrapInternal (this._internal.getInfo (name), this);
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
