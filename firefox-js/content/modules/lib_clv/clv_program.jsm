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

var EXPORTED_SYMBOLS = [ "CLVProgram" ];

try {

const Cu = Components.utils;

Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_clv/clv_symbols.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_exception.jsm");


// Get OpenCL info like string value.
//
// fn:       (CData) OpenCL getInfo function
// internal: (CData ptr) OpenCL resource
// extra:    (Array) extra arguments, placed after internal.
function clv_getInfo_string (fn, internal, extra)
{
// DEBUG("clv_getInfo_string");
  try {
    var sze = new ctypes.size_t (0);
    var err = 0;

    var args = [internal];
    if (extra) {
      if (Array.isArray(extra)) args = args.concat(extra);
      else args.push (extra);
    }
    args = args.concat ([ 0, null, sze.address() ]);

    err = fn.apply (null, args);
    if (err) throw new CLError (err);

    var val = ctypes.char.array(sze.value)();

    // Replace sze and val address with proper values, and sze address with null.
    args.splice (-3, 3,
                 sze.value,
                 ctypes.cast(val.address(), ctypes.char.ptr),
                 null);

    err = fn.apply (null, args);
    if (err) throw new CLError (err);

    return val.readStringReplaceMalformed ();
  }
  catch (e)
  {
    if (!(e instanceof CLError))
    {
      ERROR("clv_getInfo_string failed: " + e + "\n" + e.stack);
      e = new CLInternalError (e);
    }
    throw e;
  }
}




function CLVProgram (internal, lib)
{
  if (!(this instanceof CLVProgram)) return new CLVProgram (internal, lib);

  this.classDescription = "CLVProgram";
  TRACE (this, "CLVProgram", arguments);

  this._internal = internal || null;
  this._lib = lib || null;

  this._refCnt = 1;
}


CLVProgram.prototype._addref = function ()
{
  if (this._refCnt > 0)
  {
    ++this._refCnt;

    return this;
  }

  return null;
};


CLVProgram.prototype._unref = function ()
{
  if (this._refCnt > 0)
  {
    if (this._refCnt > 1)
    {
      --this._refCnt;
    }
    else
    {
      this.releaseProgram ();
      this._refCnt = 0;
    }
  }
  return (this._refCnt > 0 ? this : null);
};


// RETURNS: Number
CLVProgram.prototype.getProgramStatus = function ()
{
  TRACE (this, "getProgramStatus", arguments);
  DEBUG ("  refcnt="+this._refCnt);

  if (this._refCnt <= 0) return;

  var rv = this._lib.clvGetProgramStatus (this._internal);
  // TODO: Do we need to handle rv as 64-bit value on 64-bit systems
  return rv;
};


// programStatus: Number, from getProgramStatus
// RETURNS: String
CLVProgram.prototype.programStatusToString = function (programStatus)
{
  switch (+programStatus)
  {
    case 0: return "CLV_PROGRAM_VALIDATING";
    case 1: return "CLV_PROGRAM_ILLEGAL";
    case 2: return "CLV_PROGRAM_ACCEPTED_WITH_WARNINGS";
    case 3: return "CLV_PROGRAM_ACCEPTED";
  }
  return null;
};


// RETURNS: Number
CLVProgram.prototype.getProgramLogMessageCount = function ()
{
  TRACE (this, "getProgramLogMessageCount", arguments);
  DEBUG ("  refcnt="+this._refCnt);

  if (this._refCnt <= 0) return;

  return this._lib.clvGetProgramLogMessageCount (this._internal);
};


// RETURNS: Number
CLVProgram.prototype.getProgramLogMessageLevel = function (n)
{
  TRACE (this, "getProgramLogMessageLevel", arguments);
  DEBUG ("  refcnt="+this._refCnt);

  if (this._refCnt <= 0) return;

  var rv = this._lib.clvGetProgramLogMessageLevel (this._internal, +n);
  // TODO: Do we need to handle rv as 64-bit value on 64-bit systems
  return rv;
};


// logMessageLevel: Number
// RETURNS: String
CLVProgram.prototype.logMessageLevelToString = function (logMessageLevel)
{
  switch (+logMessageLevel)
  {
    case 0: return "CLV_LOG_MESSAGE_NOTE";
    case 1: return "CLV_LOG_MESSAGE_WARNING";
    case 2: return "CLV_LOG_MESSAGE_ERROR";
  }
  return null;
};


// n: Number
// RETURNS: String
CLVProgram.prototype.getProgramLogMessageText = function (n)
{
  TRACE (this, "getProgramLogMessageText", arguments);
  DEBUG ("  refcnt="+this._refCnt);

  if (this._refCnt <= 0) return;

  try
  {
    var rv = clv_getInfo_string (this._lib.clvGetProgramLogMessageText,
                                 this._internal,
                                 [ +n ]);
  }
  catch (e)
  {
    if (e instanceof CLException)
    {
      e.context = "CLVProgram.getProgramLogMessageText";
    }
    throw e;
  }
  return rv;
};


// n: Number
// RETURNS: Boolean
CLVProgram.prototype.programLogMessageHasSource = function (n)
{
  TRACE (this, "programLogMessageHasSource", arguments);
  DEBUG ("  refcnt="+this._refCnt);

  if (this._refCnt <= 0) return;

  return !! this._lib.clvProgramLogMessageHasSource (this._internal, +n);
};


// n: Number
// RETURNS: Number
CLVProgram.prototype.getProgramLogMessageSourceOffset = function (n)
{
  TRACE (this, "getProgramLogMessageSourceOffset", arguments);
  DEBUG ("  refcnt="+this._refCnt);

  if (this._refCnt <= 0) return;

  var rv = this._lib.clvGetProgramLogMessageSourceOffset (this._internal, +n);
  // TODO: Should rv be treated as a 64-bit value?  return ctypes.UInt64.lo (rv);
  return rv;
};


// n: Number
// RETURNS: Number
CLVProgram.prototype.getProgramLogMessageSourceLen = function (n)
{
  TRACE (this, "getProgramLogMessageSourceLen", arguments);
  DEBUG ("  refcnt="+this._refCnt);

  if (this._refCnt <= 0) return;

  var rv = this._lib.clvGetProgramLogMessageSourceLen (this._internal, +n);
  // TODO: Clip 64-bit value
  return ctypes.UInt64.lo (rv);
};


// n: Number
// offset: Number [OPTIONAL]
// len: Number    [OPTIONAL]
// RETURNS: String
CLVProgram.prototype.getProgramLogMessageSourceText = function (n, offset, len)
{
  TRACE (this, "getProgramLogMessageSourceText", arguments);
  DEBUG ("  refcnt="+this._refCnt);

  if (this._refCnt <= 0) return;

  if (!this.programLogMessageHasSource (n)) return "";

  if (offset === undefined || offset === null)
  {
    offset = this.getProgramLogMessageSourceOffset (n);
  }

  if (len === undefined || len === null)
  {
    len = this.getProgramLogMessageSourceLen (n);
  }

  try
  {
    var rv = clv_getInfo_string (this._lib.clvGetProgramLogMessageSourceText,
                                 this._internal,
                                 [ +n, +offset, +len ]);
  }
  catch (e)
  {
    if (e instanceof CLException)
    {
      e.context = "CLVProgram.getProgramLogMessageSourceText";
    }
    throw e;
  }

  return rv;
};


// RETURNS: Number
CLVProgram.prototype.getProgramKernelCount = function ()
{
  TRACE (this, "getProgramKernelCount", arguments);
  DEBUG ("  refcnt="+this._refCnt);

  if (this._refCnt <= 0) return;

  return this._lib.clvGetProgramKernelCount (this._internal);
};


// n: Number
// RETURNS: String
CLVProgram.prototype.getProgramKernelName = function (n)
{
  TRACE (this, "getProgramKernelName", arguments);
  DEBUG ("  refcnt="+this._refCnt);

  if (this._refCnt <= 0) return;

  try
  {
    var rv = clv_getInfo_string (this._lib.clvGetProgramKernelName,
                                 this._internal,
                                 [ +n ]);
  }
  catch (e)
  {
    if (e instanceof CLException)
    {
      e.context = "CLVProgram.getProgramKernelName";
    }
    throw e;
  }
  return rv;
};


// n: Number
// RETURNS: Number
CLVProgram.prototype.getKernelArgCount = function (n)
{
  TRACE (this, "getKernelArgCount", arguments);
  DEBUG ("  refcnt="+this._refCnt);

  if (this._refCnt <= 0) return;

  return this._lib.clvGetKernelArgCount (this._internal, +n);
};


// kernelIdx: Number
// argIdx: Number
// RETURNS: String
CLVProgram.prototype.getKernelArgName = function (kernelIdx, argIdx)
{
  TRACE (this, "getKernelArgName", arguments);
  DEBUG ("  refcnt="+this._refCnt);

  if (this._refCnt <= 0) return;

  try
  {
    var rv = clv_getInfo_string (this._lib.clvGetKernelArgName,
                                 this._internal,
                                 [ +kernelIdx, +argIdx ]);
  }
  catch (e)
  {
    if (e instanceof CLException)
    {
      e.context = "CLVProgram.getKernelArgName";
    }
    throw e;
  }
  return rv;
};


// kernelIdx: Number
// argIdx: Number
// RETURNS: String
CLVProgram.prototype.getKernelArgType = function (kernelIdx, argIdx)
{
  TRACE (this, "getKernelArgType", arguments);
  DEBUG ("  refcnt="+this._refCnt);

  if (this._refCnt <= 0) return;

  try
  {
    var rv = clv_getInfo_string (this._lib.clvGetKernelArgType,
                                 this._internal,
                                 [ +kernelIdx, +argIdx ]);
  }
  catch (e)
  {
    if (e instanceof CLException)
    {
      e.context = "CLVProgram.getKernelArgType";
    }
    throw e;
  }
  return rv;
};


// kernelIdx: Number
// argIdx: Number
// RETURNS: Boolean
CLVProgram.prototype.kernelArgIsPointer = function (kernelIdx, argIdx)
{
  TRACE (this, "kernelArgIsPointer", arguments);
  DEBUG ("  refcnt="+this._refCnt);

  if (this._refCnt <= 0) return;

  return !! this._lib.clvKernelArgIsPointer (this._internal, +kernelIdx, +argIdx);
};


// kernelIdx: Number
// argIdx: Number
// RETURNS: Number
CLVProgram.prototype.getKernelArgAddressQual = function (kernelIdx, argIdx)
{
  TRACE (this, "getKernelArgAddressQual", arguments);
  DEBUG ("  refcnt="+this._refCnt);

  if (this._refCnt <= 0) return;

  return this._lib.clvGetKernelArgAddressQual (this._internal, +kernelIdx, +argIdx);
};


// kernelIdx: Number
// argIdx: Number
// RETURNS: Number
CLVProgram.prototype.kernelArgIsImage = function (kernelIdx, argIdx)
{
  TRACE (this, "kernelArgIsImage", arguments);
  DEBUG ("  refcnt="+this._refCnt);

  if (this._refCnt <= 0) return;

  return this._lib.clvKernelArgIsImage (this._internal, +kernelIdx, +argIdx);
};


// kernelIdx: Number
// argIdx: Number
// RETURNS: Number
CLVProgram.prototype.getKernelArgAccessQual = function (kernelIdx, argIdx)
{
  TRACE (this, "getKernelArgAccessQual", arguments);
  DEBUG ("  refcnt="+this._refCnt);

  if (this._refCnt <= 0) return;

  return this._lib.clvGetKernelArgAccessQual (this._internal, +kernelIdx, +argIdx);
};


// RETURNS: String
CLVProgram.prototype.getProgramValidatedSource = function ()
{
  TRACE (this, "getProgramValidatedSource", arguments);
  DEBUG ("  refcnt="+this._refCnt);

  if (this._refCnt <= 0) return;

  try
  {
    var rv = clv_getInfo_string (this._lib.clvGetProgramValidatedSource,
                                 this._internal,
                                 [ ]);
  }
  catch (e)
  {
    if (e instanceof CLException)
    {
      e.context = "CLVProgram.getProgramValidatedSource";
    }
    throw e;
  }
  return rv;
};


CLVProgram.prototype.releaseProgram = function ()
{
  TRACE (this, "releaseProgram", arguments);
  DEBUG ("  refcnt="+this._refCnt);

  if (this._refCnt <= 0) return;

  var rv = this._lib.clvReleaseProgram (this._internal);
  this._refCnt = 0;
  return rv;
};


} catch(e) { ERROR ("clv_program.jsm:\n" + String(e) + ":\n" + e.stack); throw e; }
