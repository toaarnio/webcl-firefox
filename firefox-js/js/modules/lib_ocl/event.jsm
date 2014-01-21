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


var EXPORTED_SYMBOLS = [ "CLEvent" ];


try {

const Cu = Components.utils;

Cu.import ("resource://nrcwebcl/modules/logger.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_types.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_symbols.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_getinfo.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");

function loadLazyModules ()
{
  Cu.import ("resource://nrcwebcl/modules/lib_ocl/commandqueue.jsm");
  Cu.import ("resource://nrcwebcl/modules/lib_ocl/context.jsm");
  Cu.import ("resource://nrcwebcl/modules/lib_ocl/memoryobject.jsm");

  Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_common.jsm");
}


} catch(e) { ERROR ("event.jsm failed to load modules: " + EXCEPTIONSTR(e) + "."); throw e; }
try {


function CLEvent (internal, lib)
{
  if (!this instanceof CLEvent) return new CLEvent (internal);
  loadLazyModules ();

  this.classDescription = "Event";
  TRACE (this, "Event", arguments);

  this._internal = internal || null;
  this._lib = lib || null;
}


CLEvent.prototype.getIdentity = function ()
{
  TRACE (this, "getIdentity", arguments);
  return ocl_common.getObjectIdentity (this);
}


CLEvent.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);

  var rv;

  try
  {
    switch (name)
    {
      // cl_command_queue
      case ocl_info.CL_EVENT_COMMAND_QUEUE:
        var p = getInfo_plain (this._lib.clGetEventInfo, this._internal, name, T.cl_command_queue);
        rv = new CommandQueue (p, this._lib);
        break;

      // cl_context
      case ocl_info.CL_EVENT_CONTEXT:
        var p = getInfo_plain (this._lib.clGetEventInfo, this._internal, name, T.cl_context);
        rv = new Context (p, this._lib);
        break;

      // cl_int
      case ocl_info.CL_EVENT_COMMAND_EXECUTION_STATUS:
        rv = getInfo_plain (this._lib.clGetEventInfo, this._internal, name, T.cl_int).value;
        break;

      // cl_uint
      case ocl_info.CL_EVENT_REFERENCE_COUNT:
      case ocl_info.CL_EVENT_COMMAND_TYPE:  // cl_command_type
        rv = getInfo_plain (this._lib.clGetEventInfo, this._internal, name, T.cl_uint).value;
        break;

      default:
        throw new CLUnsupportedInfo (name, null, "Event.getInfo");
    }
  }
  catch (e)
  {
    if (e instanceof CLException)
    {
      e.context = "Event.getInfo";
    }
    throw e;
  }

  return rv;
};


CLEvent.prototype.getProfilingInfo = function (name)
{
  TRACE (this, "getProfilingInfo", arguments);

  var rv;

  try
  {
    switch (name)
    {
      // ulong
      case ocl_info.CL_PROFILING_COMMAND_QUEUED:
      case ocl_info.CL_PROFILING_COMMAND_SUBMIT:
      case ocl_info.CL_PROFILING_COMMAND_START:
      case ocl_info.CL_PROFILING_COMMAND_END:
        var val = getInfo_plain (this._lib.clGetDeviceInfo, this._internal, name, T.cl_ulong).value;
        rv = { lo: ctypes.UInt64.lo (val), hi: ctypes.UInt64.hi (val) };
        break;

      default:
        throw new CLUnsupportedInfo (name, null, "Event.getProfilingInfo");
    }
  }
  catch (e)
  {
    if (e instanceof CLException)
    {
      e.context = "Event.getProfilingInfo";
    }
    throw e;
  }

  return rv;
};


CLEvent.prototype.setStatus = function (executionStatus)
{
  TRACE (this, "setStatus", arguments);

  var err = this._lib.clSetUserEventStatus (this._internal, executionStatus);
  if (err) throw new CLError (err, "Event.setStatus");
};


CLEvent.prototype.setCallback = function (commandExecCallbackType, notify)
{
  // TODO: Event.setCallback NOT IMPLEMENTED!
  throw new CLNotImplemented ("Event.setCallback");
};


CLEvent.prototype.retain = function ()
{
  TRACE (this, "retain", arguments);

  var err = this._lib.clRetainEvent (this._internal);
  if (err) throw new CLError (err, "Event.retain");
};


CLEvent.prototype.release = function ()
{
  TRACE (this, "release", arguments);

  var err = this._lib.clReleaseEvent (this._internal);
  if (err) throw new CLError (err, "Event.release");
};


} catch (e) { ERROR ("event.jsm: " + EXCEPTIONSTR(e) + "."); throw e; }
