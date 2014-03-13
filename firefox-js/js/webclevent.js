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
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");

var CLASSNAME =  "WebCLEvent";
var CID =        "{cf7372e6-f2ec-467d-99dc-9eeb756bc3e3}";
var CONTRACTID = "@webcl.nokiaresearch.com/IWebCLEvent;1";


function Event ()
{
  TRACE (this, "Event", arguments);

  if (!(this instanceof Event)) return new Event ();

  Base.apply(this);

  this.wrappedJSObject = this;

  this._interfaces = [ Ci.IWebCLEvent,
                       Ci.nsISecurityCheckedComponent,
                       Ci.nsISupportsWeakReference,
                       Ci.nsIClassInfo,
                       Ci.nsISupports
                     ];
}


Event.prototype = Object.create (Base.prototype);


Event.prototype.classDescription = CLASSNAME;
Event.prototype.classID =          Components.ID(CID);
Event.prototype.contractID =       CONTRACTID;
Event.prototype.QueryInterface =   XPCOMUtils.generateQI ([ Ci.IWebCLEvent,
                                                            Ci.nsISecurityCheckedComponent,
                                                            Ci.nsISupportsWeakReference,
                                                            Ci.nsIClassInfo
                                                          ]);


//------------------------------------------------------------------------------
// IWebCLEvent

Event.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (!webclutils.validateNumber(name))
      throw new CLError(ocl_errors.CL_INVALID_VALUE, "'name' must be a valid CLenum; was " + name, "WebCLEvent.getInfo");

    switch (name)
    {
    case ocl_info.CL_EVENT_COMMAND_TYPE:
    case ocl_info.CL_EVENT_COMMAND_EXECUTION_STATUS:
    case ocl_info.CL_EVENT_CONTEXT:
    case ocl_info.CL_EVENT_COMMAND_QUEUE:
      break;
    default:
      throw new CLError (ocl_errors.CL_INVALID_VALUE, "Unrecognized enum " + name, "WebCLEvent.getInfo");
    }

    if (!this._internal)
      return -1;

    switch (name)
    {
    case ocl_info.CL_EVENT_COMMAND_TYPE:
    case ocl_info.CL_EVENT_COMMAND_EXECUTION_STATUS:
    case ocl_info.CL_EVENT_COMMAND_QUEUE:
    case ocl_info.CL_EVENT_CONTEXT:
      var clInfoItem = this._internal.getInfo (name);
      return this._wrapInternal (clInfoItem);
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


Event.prototype.getProfilingInfo = function (name)
{
  TRACE (this, "getProfilingInfo", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (!webclutils.validateNumber(name))
      throw new CLError(ocl_errors.CL_INVALID_VALUE, "'name' must be a valid CLenum; was " + name, "WebCLEvent.getProfilingInfo");

    switch (name)
    {
    case ocl_info.CL_PROFILING_COMMAND_QUEUED:
    case ocl_info.CL_PROFILING_COMMAND_SUBMIT:
    case ocl_info.CL_PROFILING_COMMAND_START:
    case ocl_info.CL_PROFILING_COMMAND_END:
      var clInfoItem = this._internal.getInfo (name);
      return this._wrapInternal (clInfoItem);

    default:
      throw new CLError (ocl_errors.CL_INVALID_VALUE, "Unrecognized enum " + name, "WebCLEvent.getProfilingInfo");
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


Event.prototype.setCallback = function ()
{
  TRACE (this, "setCallback", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    throw new Exception ("NOT IMPLEMENTED");
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};



//==============================================================================


function UserEvent ()
{
  if (!(this instanceof UserEvent)) return new UserEvent ();

  Event.apply(this);

  this.wrappedJSObject = this;

  this._interfaces = [ Ci.IWebCLUserEvent,
                       Ci.IWebCLEvent,
                       Ci.nsISecurityCheckedComponent,
                       Ci.nsISupportsWeakReference,
                       Ci.nsIClassInfo,
                       Ci.nsISupports
                     ];
}


UserEvent.prototype = Object.create (Event.prototype);


UserEvent.prototype.classDescription = "WebCLUserEvent";
UserEvent.prototype.classID =          Components.ID("{f353b7e7-03af-41f2-a260-5cbcdaec8ae9}");
UserEvent.prototype.contractID =       "@webcl.nokiaresearch.com/IWebCLUserEvent;1";
UserEvent.prototype.QueryInterface =   XPCOMUtils.generateQI ([ Ci.IWebCLUserEvent,
                                                                Ci.IWebCLEvent,
                                                                Ci.nsISecurityCheckedComponent,
                                                                Ci.nsISupportsWeakReference,
                                                                Ci.nsIClassInfo
                                                              ]);


//------------------------------------------------------------------------------
// IWebCLUserEvent

UserEvent.prototype.setStatus = function (executionStatus)
{
  TRACE (this, "setStatus", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  if (!this._internal) return; // TODO

  try
  {
    this._internal.setStatus (executionStatus);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};



//------------------------------------------------------------------------------
// Internal functions


Event.prototype._getRefCount = function ()
{
  try
  {
    if (this._internal && !this._invalid)
    {
      return this._internal.getInfo (ocl_info.CL_EVENT_REFERENCE_COUNT);
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



var NSGetFactory = XPCOMUtils.generateNSGetFactory ([Event, UserEvent]);


} catch(e) { ERROR ("webclevent.js: "+EXCEPTIONSTR(e)); }
