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


var EXPORTED_SYMBOLS = [ "INFO", "LOG", "ERROR", "DEBUG", "TRACE", "TRACE_RESOURCES", "EXCEPTIONSTR", "PUTS", "ABORT", "ASSERT" ];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;


Cu.import ("resource://gre/modules/Services.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/common.jsm");

var console = Cu.import("resource://gre/modules/devtools/Console.jsm", {}).console;


var gEnableLog =   false;
var gEnableDebug = false;
var gEnableTrace = false;
var gEnableOSConsole = false;
var gOSConsoleSupported = false;

try { gEnableLog =   Services.prefs.getBoolPref ("extensions.webcl.log"); } catch (e) {}
try { gEnableDebug = Services.prefs.getBoolPref ("extensions.webcl.debug"); } catch (e) {}
try { gEnableTrace = Services.prefs.getBoolPref ("extensions.webcl.trace"); } catch (e) {}
try { gEnableTraceResources = Services.prefs.getBoolPref ("extensions.webcl.trace-resources"); } catch (e) {}
try { gEnableOSConsole = Services.prefs.getBoolPref ("extensions.webcl.os-console-output"); } catch (e) {}

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
      case "extensions.webcl.trace-resources":
        try { gEnableTraceResources = Services.prefs.getBoolPref (data); } catch (e) {}
        break;
      case "extensions.webcl.os-console-output":
        try { gEnableOSConsole = Services.prefs.getBoolPref (data); } catch (e) {}
        break;
    }
  }
};

Services.prefs.addObserver ("extensions.webcl.", new LogObserver(), false);



function INFO (msg, prefix)
{
  prefix = prefix || "WEBCL INFO: ";
  console.info (prefix + msg);

  if (gOSConsoleSupported && gEnableOSConsole) 
    PUTS(prefix + msg);
}

function LOG (msg, prefix)
{
  if (!gEnableLog) return;

  prefix = prefix || "WEBCL: ";
  console.log (prefix + msg);

  if (gOSConsoleSupported && gEnableOSConsole) 
    PUTS(prefix + msg);
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
  console.debug (prefix + msg);

  if (gOSConsoleSupported && gEnableOSConsole) 
    PUTS(prefix + msg);
}

function TRACE (ctx, name, args, prefix) {
  if (!gEnableTrace) return;

  switch (typeof(ctx))
  {
    case "object":
      let o = ctx;
      if (o.wrappedJSObject) o = o.wrappedJSObject;
      if (o.classDescription)
      {
        ctx = "[object "+o.classDescription+"]";
        break;
      }
      // else fall through to default
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

  console.info (prefix + msg);

  if (gOSConsoleSupported && gEnableOSConsole) 
    PUTS(prefix + msg);
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

      case "function":
        a.push ("[function]");
        break;

      default:
        a.push (String(t));
        break;
    }
  }
  return a;
}


function TRACE_RESOURCES (ctx, name, msg, prefix)
{
  if (!gEnableTraceResources) return;

  if (ctx === null||ctx === undefined) ctx = "";
  if (msg === null||msg === undefined) msg = "";

  switch (typeof(ctx))
  {
    case "object":
      let o = ctx;
      if (o.wrappedJSObject) o = o.wrappedJSObject;
      if (o.classDescription)
      {
        let key = (o._getIdentity && typeof(o._getIdentity)=="function") ? o._getIdentity () : null;
        ctx = "[object "+o.classDescription+ (key?":"+key:"") +"]";
        break;
      }
      // else fall through to default
    default:
      ctx = String(ctx);
      break;
  }

  prefix = prefix || "WEBCLRESOURCE: ";
  msg = (ctx? ctx+"." :"") + name + (msg ? ": " + msg : "");

  console.info (prefix + msg);

  if (gOSConsoleSupported && gEnableOSConsole)
    PUTS(prefix + msg);
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

Cu.import ("resource://gre/modules/ctypes.jsm");
try {
  var libc = ctypes.open("libc.so.6");
  gOSConsoleSupported = true;
} catch (e) {
  try {
    var libc = ctypes.open("libc.dylib");
    gOSConsoleSupported = true;
  } catch (e2) {
    ERROR("OS Console Logging not available: Could not load 'libc.so.6' or 'libc.dylib'.");
    gOSConsoleSupported = false;
  }
}

if (gOSConsoleSupported) {
  var puts = libc.declare("puts", ctypes.default_abi, ctypes.int, ctypes.char.ptr);
  var abort = libc.declare("abort", ctypes.default_abi, ctypes.void_t);
}

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

function ABORT ()
{
  if (abort)
  {
    abort ();
  }
}

function ASSERT (cond, msg)
{
  if (!cond)
  {
    if (abort)
    {
      PUTS ("ASSERTATION FAILED" + (msg ? ": " + msg : ""));
      ABORT ();
    }
    else
    {
      var msg = "ASSERTATION FAILED" + (msg ? ": " + msg : "");
      ERROR (msg);
      throw (msg);
    }
  }
}
