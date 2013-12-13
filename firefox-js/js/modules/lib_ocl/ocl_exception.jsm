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


var EXPORTED_SYMBOLS = [ "CLException", "CLError", "CLUnsupportedInfo", "CLInternalError", "CLInvalidArgument", "CLNotImplemented" ];


const Cu = Components.utils;
const Cr = Components.results;

Cu.import ("resource://nrcwebcl/modules/logger.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_constants.jsm");


try {


function CLException (msg, context)
{
  this.msg = msg ? String(msg) : "";
  this.context = context ? String(context) : "";
}

CLException.prototype.toString = function ()
{
  return (this.context ? this.context + ": " : "CLException: ") + this.msg;
};



// errCode: Number, OpenCL error code or undefined if none.
// msg:     String, Textual description.
// context: String, Exception context description.
function CLError (errCode, msg, context)
{
  CLException.apply (this);

  try
  {
    if (errCode)
    {
      if (!isNaN(+errCode))
      {
        this.err = +errCode;
        this.name = oclErrorToString (errCode);

        // Drop "CL_" prefix if any
        if (this.name.substr(0,3) == "CL_")
        {
          this.name = this.name.substr(3);
        }

        this.msg = this.name;
      }
    }
  }
  catch(e)
  {
    this.msg = "Failed to generate exception.";
    DEBUG ("CLError: " + this.msg + " (errCode="+errCode+" msg="+msg+" context="+context+") E:"+e);
  }

  if (msg)
  {
    this.msg = String(msg);
  }

  if (context)
  {
    this.context = String(context);
  }
}
CLError.prototype = Object.create (CLException.prototype);

CLError.prototype.toString = function ()
{
  var s = "";
  if (this.context) s = this.context + ":";
  if (this.name) s += (s ? " " : "") + this.name;
  if (this.msg) s += (s ? " " : "") + this.msg;
  return s;
};



function CLUnsupportedInfo (name, msg, context)
{
  CLException.apply (this);
  this.name = name;
  this.msg = msg;
  this.context = context;
}
CLUnsupportedInfo.prototype = Object.create (CLException.prototype);

CLUnsupportedInfo.prototype.toString = function ()
{
  var msg = this.msg || "Unsupported info name";
  if (!isNaN(+this.name))
  {
    var name = oclInfoToString (this.name);
    // Drop "CL_" prefix if any
    if (name.substr(0,3) == "CL_")
    {
      name = name.substr(3);
    }
  }
  else
  {
    var name = String(this.name);
  }

  return msg + ": " + name;
};



function CLInternalError (msg, context)
{
  CLException.call (this, msg, context);
}
CLInternalError.prototype = Object.create (CLException.prototype);

CLInternalError.prototype.toString = function ()
{
  return "[Internal error] " + CLException.prototype.toString.apply (this);
};



function CLInvalidArgument (argName, msg, context)
{
  CLException.call (this, msg, context);

  this.argName = String(argName);
}
CLInvalidArgument.prototype = Object.create (CLException.prototype);

CLInvalidArgument.prototype.toString = function ()
{
  var s = (this.context ? this.context + ": " : "");
  s += (this.msg ? this.msg : "Invalid argument ");
  return s + this.argName;
};



function CLNotImplemented (name)
{
  CLException.apply (this);
  this.name = name;
}
CLNotImplemented.prototype = Object.create (CLException.prototype);

CLNotImplemented.prototype.toString = function ()
{
  return "Not implemented" + (this.name ? ": "+this.name : "");
};


} catch (e) { ERROR ("exception.jsm: " + e + "."); throw e; }
