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


var EXPORTED_SYMBOLS = [ "INFO", "LOG", "ERROR", "DEBUG", "TRACE", "EXCEPTIONSTR", "PUTS" ];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;


Cu.import ("resource://gre/modules/Services.jsm");


var gEnableLog =   true;
var gEnableDebug = false;
var gEnableTrace = false;

try { gEnableLog =   Services.prefs.getBoolPref ("extensions.webcl.log"); } catch (e) {}
try { gEnableDebug = Services.prefs.getBoolPref ("extensions.webcl.debug"); } catch (e) {}
try { gEnableTrace = Services.prefs.getBoolPref ("extensions.webcl.trace"); } catch (e) {}


function LogObserver ()
{
}

LogObserver.prototype.observe = function (subject, topic, data)
{
  if (topic == "nsPref:changed")
  {
    switch (data)
    {
      case "extensions.webcl.log":
        try { gEnableLog = Services.prefs.getBoolPref (data); } catch (e) {}
        break;
      case "extensions.webcl.debug":
        try { gEnableDebug = Services.prefs.getBoolPref (data); } catch (e) {}
        break;
      case "extensions.webcl.trace":
        try { gEnableTrace = Services.prefs.getBoolPref (data); } catch (e) {}
        break;
    }
  }
};

Services.prefs.addObserver ("extensions.webcl.", new LogObserver(), false);



function INFO (msg, prefix)
{
  prefix = prefix || "WEBCL INFO: ";
  Services.console.logStringMessage (prefix + msg);
}

function LOG (msg, prefix)
{
  if (!gEnableLog) return;

  prefix = prefix || "WEBCL: ";
  Services.console.logStringMessage (prefix + msg);
}

function ERROR (msg, prefix)
{
  prefix = prefix || "WEBCL ERROR: ";
  Cu.reportError (prefix + msg);
}

function DEBUG (msg, prefix)
{
  if (!gEnableDebug) return;

  prefix = prefix || "WEBCL DBG: ";
  Services.console.logStringMessage (prefix + msg);
}


function TRACE_processArgs (args)
{
  var a = [];
  for (var i = 0; i < args.length; ++i)
  {
    var t = args[i];
    switch(typeof(t))
    {
      case "object":
        if (t && t.wrappedJSObject) t = t.wrappedJSObject;

        if (t == null)
        {
          a.push ("<null>");
        }
        else if (Array.isArray(t))
        {
          a.push ("[ " + TRACE_processArgs(t).join(",") + " ]");
        }
        else if (t.wrappedJSObject && t.wrappedJSObject.classDescription)
        {
          a.push(t.wrappedJSObject.classDescription);
        }
        else if ("toString" in t && typeof(t.toString) == "function")
        {
          a.push (t.toString());
        }
        else
        {
          a.push (String(t));
        }
        break;

      default:
        a.push (String(t));
        break;
    }
  }
  return a;
}

function TRACE (ctx, name, args, prefix) {
  if (!gEnableTrace) return;

  switch (typeof(ctx))
  {
    case "object":
      if (ctx.wrappedJSObject) ctx = ctx.wrappedJSObject;

      if (ctx.classDescription)
      {
        ctx = "[object "+ctx.classDescription+"]";
      }
      else
      {
        ctx = String(ctx);
      }
      break;

    default:
      ctx = String(ctx);
      break;
  }

  try {
    args = Array.prototype.slice.apply (args);
  } catch(e) {}

  if (Array.isArray(args))
  {
    args = TRACE_processArgs (args);
  }
  else
  {
    args = [];
  }

  prefix = prefix || "WEBCLTRACE: ";
  var msg = ctx + "." + name + "(" + args.join(",") + ")";

  Services.console.logStringMessage (prefix + msg);
}


function EXCEPTIONSTR (e)
{
  var s = "";
  if (e.fileName)
  {
    s += "["+e.fileName;
    if (e.lineNumber)
    {
      s += ":" + e.lineNumber;
    }
    s += "] ";
  }
  s += String(e);
  return s;
}


/*
Cu.import ("resource://gre/modules/ctypes.jsm");
var libc = ctypes.open("libc.so.6");
var puts = libc.declare("puts", ctypes.default_abi, ctypes.int, ctypes.char.ptr);
*/

function PUTS (msg)
{
  if (puts)
  {
    if (msg instanceof ctypes.CType)
    {
      puts (msg);
    }
    else
    {
      var str = ctypes.char.array() (String(msg));
      puts (ctypes.cast (str.address(), ctypes.char.ptr));
    }
  }
}

