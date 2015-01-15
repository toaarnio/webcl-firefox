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


var EXPORTED_SYMBOLS = [ "CLException", "CLSyntaxError", "CLInvalidated", "CLInternalError", "CLInvalidArgument", "CLNotImplemented",
                         "CLError", "CLUnsupportedInfo" ];
                         

const Cu = Components.utils;
const Cr = Components.results;

Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_constants.jsm");


try {


// Base class for all exceptions and errors thrown by WebCL. 
//
function CLException (msg, context)
{
  this.msg = msg ? String(msg) : "";
  this.context = context ? String(context) : "";
  var stack = Error().stack;
  var sourceLocation = /.*modules\/webcl.*/.exec(stack)[0].split('/').slice(-1)[0].split(':');
  this.fileName = sourceLocation[0];
  this.lineNumber = sourceLocation[1];
}
CLException.prototype = Object.create(Error.prototype);
CLException.prototype.toString = function ()
{
  return (this.context ? (this.context + ": ") : "CLException: ") + this.msg;
};


// Thrown if the application passes a wrong number of arguments.
//
function CLSyntaxError(msg)
{
  CLException.apply (this);
  this.msg = msg ? String(msg) : "";
};
CLSyntaxError.prototype = Object.create (CLException.prototype);
CLSyntaxError.prototype.toString = function ()
{
  return "Syntax error: " + this.msg;
}


// Thrown if attempting to use an invalidated object.
//
function CLInvalidated (msg)
{
  CLException.apply (this);
  this.msg = msg ? String(msg) : "";
}
CLInvalidated.prototype = Object.create (CLException.prototype);
CLInvalidated.prototype.toString = function ()
{
  return "Invalid object" + (this.msg ? ": " + this.msg : "") + ".";
};


// Thrown if attempting to use a function or feature that is not yet implemented.
//
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


// Thrown if there is an uncategorized internal error.
//
function CLInternalError (msg, context)
{
  CLException.call (this, msg, context);
}
CLInternalError.prototype = Object.create (CLException.prototype);
CLInternalError.prototype.toString = function ()
{
  return "[Internal error] " + CLException.prototype.toString.apply (this);
};


// TODO: Remove this. Replace with CLSyntaxError and WebCL error codes.
//
function CLInvalidArgument (argName, msg, context)
{
  CLException.call (this, msg, context);

  this.argName = String(argName);
}
CLInvalidArgument.prototype = Object.create (CLException.prototype);
CLInvalidArgument.prototype.toString = function ()
{
  var s = (this.context ? this.context + ": " : "");
  s += (this.msg ? this.msg : "Invalid argument");
  return s + ": " + this.argName;
};


// Base class for all exceptions derived from OpenCL error codes.
//
// errCode: Number, OpenCL error code or undefined if none.
// msg:     String, Textual description.
// context: String, Exception context description.
//
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
  if (this.fileName) s+= " [" + this.fileName + ":" + this.lineNumber + "]";
  return s;
};


// TODO: Remove this. Replace with INVALID_VALUE.
//
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


// Shorthand constructors for all OpenCL errors.
//
// Usage examples:
//   throw new INVALID_VALUE("'value' was invalid");
//   throw new INVALID_VALUE("'value' must be less than 10; was ", value);
//

var namespace = this;

(function generateCLExceptions() {
  for (var name in ocl_errors) {
    var code = ocl_errors[name];
    name = name.slice(3);
    namespace[name] = (function(clError) {
      return function(msg, value) {
        if (arguments.length === 2)
          msg += "'" + value + "'" + " (typeof " + typeof(value) + ")";
        CLError.call(this, clError, msg);
      }
    })(code);
    namespace[name].prototype = Object.create (CLError.prototype);
    EXPORTED_SYMBOLS.push(name);
  }
})();


} catch (e) { ERROR ("ocl_exception.jsm: " + e + "."); throw e; }
