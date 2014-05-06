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

var EXPORTED_SYMBOLS = [ "WebCLEvent", "WebCLUserEvent" ];


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

Cu.import ("resource://nrcwebcl/modules/webclclasses.jsm");


function WebCLEvent ()
{
  TRACE (this, "WebCLEvent", arguments);

  try {
    if (!(this instanceof WebCLEvent)) return new WebCLEvent ();

    Base.apply(this);

    this.wrappedJSObject = this;

    this.exceptionType = INVALID_EVENT;

    this.__exposedProps__ =
    {
      getExternalIdentity: "r",
      getInfo: "r",
      getProfilingInfo: "r",
      setCallback: "r",
      release: "r",

      classDescription: "r"
    };
  }
  catch (e)
  {
    ERROR ("webclevent.jsm:WebCLEvent failed: " + e);
    throw webclutils.convertCLException (e);
  }
}

WEBCLCLASSES.WebCLEvent = WebCLEvent;
WebCLEvent.prototype = Object.create (Base.prototype);
WebCLEvent.prototype.classDescription = "WebCLEvent";



WebCLEvent.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 1);

    if (!this._internal)
      throw new INVALID_EVENT("event must be populated before calling getInfo");

    if (!webclutils.validateInteger(name))
      throw new INVALID_VALUE("'name' must be a valid CLenum; was ", name);

    switch (name)
    {
    case ocl_info.CL_EVENT_COMMAND_TYPE:
    case ocl_info.CL_EVENT_COMMAND_EXECUTION_STATUS:
    case ocl_info.CL_EVENT_COMMAND_QUEUE:
    case ocl_info.CL_EVENT_CONTEXT:
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


WebCLEvent.prototype.getProfilingInfo = function (name)
{
  TRACE (this, "getProfilingInfo", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 1);

    if (!this._internal)
      throw new INVALID_EVENT("event must be populated before calling getProfilingInfo");

    if (this instanceof WEBCLCLASSES.WebCLUserEvent)
      throw new PROFILING_INFO_NOT_AVAILABLE("profiling info is not available for user events");

    if (this.getInfo(ocl_info.CL_EVENT_COMMAND_EXECUTION_STATUS) !== ocl_const.CL_COMPLETE)
      throw new PROFILING_INFO_NOT_AVAILABLE("event must be COMPLETE before calling getProfilingInfo");

    if (!webclutils.validateInteger(name))
      throw new INVALID_VALUE("'name' must be a valid CLenum; was ", name);

    switch (name)
    {
    case ocl_info.CL_PROFILING_COMMAND_QUEUED:
    case ocl_info.CL_PROFILING_COMMAND_SUBMIT:
    case ocl_info.CL_PROFILING_COMMAND_START:
    case ocl_info.CL_PROFILING_COMMAND_END:
      var clInfoItem64bit = this._internal.getProfilingInfo (name);
      var clInfoItem52bit = 0x100000000 * (clInfoItem64bit.hi & 0xfffff) + clInfoItem64bit.lo;
      return this._wrapInternal (clInfoItem52bit);

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


WebCLEvent.prototype.setCallback = function (commandExecCallbackType, notify)
{
  TRACE (this, "setCallback", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 2);

    if (!this._internal)
      throw new INVALID_EVENT("event must be populated before calling setCallback");

    throw new Exception ("NOT IMPLEMENTED");
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};



//==============================================================================

function WebCLUserEvent ()
{
  TRACE (this, "WebCLUserEvent", arguments);
  try {
    if (!(this instanceof WebCLUserEvent)) return new WebCLUserEvent ();

    WebCLEvent.apply(this);

    this.wrappedJSObject = this;

    this.exceptionType = INVALID_EVENT;

    this.alreadySet = false;

    this.__exposedProps__.setStatus = "r";
  }
  catch (e)
  {
    ERROR ("webclevent.jsm:WebCLUserEvent failed: " + e);
    throw webclutils.convertCLException (e);
  }
}

WEBCLCLASSES.WebCLUserEvent = WebCLUserEvent;

WebCLUserEvent.prototype = Object.create (WebCLEvent.prototype);

WebCLUserEvent.prototype.classDescription = "WebCLUserEvent";



WebCLUserEvent.prototype.setStatus = function (executionStatus)
{
  TRACE (this, "setStatus", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 1);

    if (!webclutils.validateInteger(executionStatus))
      throw new INVALID_VALUE("'executionStatus' must be COMPLETE or a negative integer value; was ", executionStatus);

    if (executionStatus >= 0 && executionStatus !== ocl_const.CL_COMPLETE)
      throw new INVALID_VALUE("'executionStatus' must be COMPLETE or a negative integer value; was ", executionStatus);

    if (this.alreadySet === true)
      throw new INVALID_OPERATION("the execution status of this WebCLUserEvent has already been changed by a previous call to setStatus");

    this._internal.setStatus (executionStatus);

    this.alreadySet = true;
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};



} catch(e) { ERROR ("webclevent.jsm: "+e); }
