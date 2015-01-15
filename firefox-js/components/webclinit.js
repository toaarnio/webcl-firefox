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


const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;


Cu.import("chrome://nrcwebcl/content/modules/common.jsm");
Cu.import("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import("chrome://nrcwebcl/content/modules/webclutils.jsm");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

Cu.import("chrome://nrcwebcl/content/modules/base.jsm");
Cu.import("chrome://nrcwebcl/content/modules/webclclasses.jsm");

Cu.import("chrome://nrcwebcl/content/modules/webcl/webcl.jsm");


INFO ("Initializing Nokia WebCL");
INFO ("Firefox version: " + Services.appinfo.version);


let uuidGenerator = Cc["@mozilla.org/uuid-generator;1"]
                      .getService(Components.interfaces.nsIUUIDGenerator);


function WebCLInit ()
{
  this.wrappedJSObject = this;

  INFO ("ABI: " + getRuntimeABI ());
  INFO ("OS_TARGET: " + getRuntimeOS ());

  /*
  this._allowed = (webclutils.getPref_allowed (true) !== webclutils.PREF_WEBCL_ALLOWED__FALSE);
  webclutils.setPrefObserver_allowed (this);
  */
}


WebCLInit.prototype = {
  classDescription: "WebCLInit",
  classID:          Components.ID("{b5336780-9367-4891-bdc9-255821383d9f}"),
  contractID:       "@webcl.nokiaresearch.com/WebCLInit;1",

  QueryInterface: XPCOMUtils.generateQI ([ Ci.nsIObserver,
                                           Ci.nsISupportsWeakReference
                                         ])
};


function handle_profileAfterChange (ctx)
{

  //=========================================
  // Global Message Manager

  // chrome script
  var globalMM = Cc["@mozilla.org/globalmessagemanager;1"]
                   .getService(Ci.nsIMessageListenerManager);


  globalMM.addMessageListener ("webcl@nokia.com:control", function(message)
  {
    let data = message.data;
    switch (data.action)
    {
      case "register":
      {
        var webcl = new WebCL ();
        webcl.init (message.target);

        webcl.__domWindow = message.target;

        webclInstances[webcl._identity] = { webcl: webcl,
                                            objects: {},
                                            callbacks: {},

                                            // Transient objects, such as
                                            // TypedArray data for async
                                            // enqueueReadX calls.
                                            transients: {}
                                          };

        return { id: webcl._identity };
      }
      break;

      case "unregister":
      {
        if (!(data.id in webclInstances)) {
          ERROR ("FrameScriptConnector control.unregister: unknown ID \""+data.id+"\".");
          return { error: { name: "WEBCL_IMPLEMENTATION_FAILURE", message: "Unknown ID" } };
        }

        var webcl = webclInstances[data.id].webcl;
        delete webclInstances[data.id];

        webcl.releaseAll ();

        return {};
      }
      break;

      default:
        ERROR ("FrameScriptConnector control: invalid action \""+data.action+"\".");
        return { error: { name: "WEBCL_IMPLEMENTATION_FAILURE", message: "Invalid action" } };
    }
  });


  globalMM.loadFrameScript("chrome://nrcwebcl/content/framescript/main.js", true);


  function getTransientObject (webclInstance, id)
  {
    if (id in webclInstance.transients)
    {
      let o = webclInstance.transients[id];
      delete webclInstance.transients[id];

      if (o.mangler && typeof(o.mangler) == "function") {
        return o.mangler (o.value);
      }
      else {
        return o.value;
      }
    }

    return null;
  }


  function setTransientObject (webclInstance, id, value, mangler)
  {
    webclInstance.transients[id] = { value: value, mangler: mangler };
  }


  globalMM.addMessageListener ("webcl@nokia.com:WebCL", function(message)
  {
    try
    {
      let data = message.data;
      let instance = webclInstances[data.instance];
      let obj = instance.webcl;

      if (!(obj && obj instanceof WEBCLCLASSES.WebCL)) {
        return { error: { name: "WEBCL_IMPLEMENTATION_FAILURE", message: "Invalid object." } };
      }

      let ctx = {
        webclInstance: instance,
        targetBrowser: message.target,
        preFn: null,   // function (ctx, args) => args
        postFn: null   // function (ctx, rv, args) => rv
      };

      switch (data.method)
      {
        case "getPlatforms": return invokeFn (ctx, obj, data.method, data.args);
        case "createContext": return invokeFn (ctx, obj, data.method, data.args);
        case "getSupportedExtensions": return invokeFn (ctx, obj, data.method, data.args);
        case "enableExtension": return invokeFn (ctx, obj, data.method, data.args);
        case "waitForEvents": return invokeFn (ctx, obj, data.method, data.args);
        case "releaseAll": return invokeFn (ctx, obj, data.method, data.args);

        case "_getTransient": return getTransientObject (instance, data.id);
      }
    }
    catch (e)
    {
      let s = (e&&e.stack ? "\n"+e.stack : "");
      ERROR ("FrameScriptConnector webcl@nokia.com:WebCL Failed:\n" + e + s);
    }
  });

  globalMM.addMessageListener ("webcl@nokia.com:WebCLPlatform", function(message)
  {
    try
    {
      let data = message.data;
      let instance = webclInstances[data.instance];
      let obj = instance.objects[data.obj];

      if (!(obj && obj instanceof WEBCLCLASSES.WebCLPlatform)) {
        return { error: { name: "WEBCL_IMPLEMENTATION_FAILURE", message: "Invalid object." } };
      }

      let ctx = {
        webclInstance: instance,
        targetBrowser: message.target,
        preFn: null,   // function (ctx, args) => args
        postFn: null   // function (ctx, rv, args) => rv
      };

      switch (data.method)
      {
        case "getInfo": return invokeFn (ctx, obj, data.method, data.args);
        case "getDevices": return invokeFn (ctx, obj, data.method, data.args);
        case "getSupportedExtensions": return invokeFn (ctx, obj, data.method, data.args);
        case "enableExtension": return invokeFn (ctx, obj, data.method, data.args);
      }
    }
    catch (e)
    {
      let s = (e&&e.stack ? "\n"+e.stack : "");
      ERROR ("FrameScriptConnector webcl@nokia.com:WebCLPlatform Failed:\n" + e + s);
    }
  });

  globalMM.addMessageListener ("webcl@nokia.com:WebCLDevice", function(message)
  {
    try
    {
      let data = message.data;
      let instance = webclInstances[data.instance];
      let obj = instance.objects[data.obj];

      if (!(obj && obj instanceof WEBCLCLASSES.WebCLDevice)) {
        return { error: { name: "WEBCL_IMPLEMENTATION_FAILURE", message: "Invalid object." } };
      }

      let ctx = {
        webclInstance: instance,
        targetBrowser: message.target,
        preFn: null,   // function (ctx, args) => args
        postFn: null   // function (ctx, rv, args) => rv
      };

      switch (data.method)
      {
        case "getInfo": return invokeFn (ctx, obj, data.method, data.args);
        case "getSupportedExtensions": return invokeFn (ctx, obj, data.method, data.args);
        case "enableExtension": return invokeFn (ctx, obj, data.method, data.args);
      }
    }
    catch (e)
    {
      let s = (e&&e.stack ? "\n"+e.stack : "");
      ERROR ("FrameScriptConnector webcl@nokia.com:WebCLDevice Failed:\n" + e + s);
    }
  });

  globalMM.addMessageListener ("webcl@nokia.com:WebCLContext", function(message)
  {
    try
    {
      let data = message.data;
      let instance = webclInstances[data.instance];
      let obj = instance.objects[data.obj];

      if (!(obj && obj instanceof WEBCLCLASSES.WebCLContext)) {
        return { error: { name: "WEBCL_IMPLEMENTATION_FAILURE", message: "Invalid object." } };
      }

      let ctx = {
        webclInstance: instance,
        targetBrowser: message.target,
        preFn: null,   // function (ctx, args) => args
        postFn: null   // function (ctx, rv, args) => rv
      };

      switch (data.method)
      {
        case "createBuffer": return invokeFn (ctx, obj, data.method, data.args);
        case "createCommandQueue": return invokeFn (ctx, obj, data.method, data.args);
        case "createImage": return invokeFn (ctx, obj, data.method, data.args);
        case "createProgram": return invokeFn (ctx, obj, data.method, data.args);
        case "createSampler": return invokeFn (ctx, obj, data.method, data.args);
        case "createUserEvent": return invokeFn (ctx, obj, data.method, data.args);
        case "getInfo": return invokeFn (ctx, obj, data.method, data.args);
        case "getSupportedImageFormats": return invokeFn (ctx, obj, data.method, data.args);
        case "release": return invokeFn (ctx, obj, data.method, data.args);
        case "releaseAll": return invokeFn (ctx, obj, data.method, data.args);
      }
    }
    catch (e)
    {
      let s = (e&&e.stack ? "\n"+e.stack : "");
      ERROR ("FrameScriptConnector webcl@nokia.com:WebCLContext Failed:\n" + e + s);
    }
  });

  globalMM.addMessageListener ("webcl@nokia.com:WebCLProgram", function(message)
  {
    try
    {
      let data = message.data;
      let instance = webclInstances[data.instance];
      let obj = instance.objects[data.obj];

      // NOTE: This also handles subclassed WebCLValidatedProgram
      if (!(obj && obj instanceof WEBCLCLASSES.WebCLProgram)) {
        return { error: { name: "WEBCL_IMPLEMENTATION_FAILURE", message: "Invalid object." } };
      }

      let ctx = {
        webclInstance: instance,
        targetBrowser: message.target,
        preFn: null,   // function (ctx, args) => args
        postFn: null   // function (ctx, rv, args) => rv
      };

      switch (data.method)
      {
        case "getInfo": return invokeFn (ctx, obj, data.method, data.args);
        case "getBuildInfo": return invokeFn (ctx, obj, data.method, data.args);
        case "build": return invokeFn (ctx, obj, data.method, data.args);
        case "createKernel": return invokeFn (ctx, obj, data.method, data.args);
        case "createKernelsInProgram": return invokeFn (ctx, obj, data.method, data.args);
        case "release": return invokeFn (ctx, obj, data.method, data.args);
      }
    }
    catch (e)
    {
      let s = (e&&e.stack ? "\n"+e.stack : "");
      ERROR ("FrameScriptConnector webcl@nokia.com:WebCLProgram Failed:\n" + e + s);
    }
  });

  globalMM.addMessageListener ("webcl@nokia.com:WebCLKernel", function(message)
  {
    try
    {
      let data = message.data;
      let instance = webclInstances[data.instance];
      let obj = instance.objects[data.obj];

      if (!(obj && obj instanceof WEBCLCLASSES.WebCLKernel)) {
        return { error: { name: "WEBCL_IMPLEMENTATION_FAILURE", message: "Invalid object." } };
      }

      let ctx = {
        webclInstance: instance,
        targetBrowser: message.target,
        preFn: null,   // function (ctx, args) => args
        postFn: null   // function (ctx, rv, args) => rv
      };

      switch (data.method)
      {
        case "getInfo": return invokeFn (ctx, obj, data.method, data.args);
        case "getWorkGroupInfo": return invokeFn (ctx, obj, data.method, data.args);
        case "getArgInfo": return invokeFn (ctx, obj, data.method, data.args);
        case "setArg": return invokeFn (ctx, obj, data.method, data.args);
        case "release": return invokeFn (ctx, obj, data.method, data.args);
      }
    }
    catch (e)
    {
      let s = (e&&e.stack ? "\n"+e.stack : "");
      ERROR ("FrameScriptConnector webcl@nokia.com:WebCLKernel Failed:\n" + e + s);
    }
  });

  globalMM.addMessageListener ("webcl@nokia.com:WebCLCommandQueue", function(message)
  {
    try
    {
      let data = message.data;
      let instance = webclInstances[data.instance];
      let obj = instance.objects[data.obj];

      if (!(obj && obj instanceof WEBCLCLASSES.WebCLCommandQueue)) {
        return { error: { name: "WEBCL_IMPLEMENTATION_FAILURE", message: "Invalid object." } };
      }

      let ctx = {
        webclInstance: instance,
        targetBrowser: message.target,
        preFn: null,   // function (ctx, args) => args
        postFn: null   // function (ctx, rv, args) => rv
      };

      // Typed arrays don't survive over message manager boundary to
      // frame script. Instead we'll send them over as Uint8Arrays and
      // restore in the clientscript.
      function readBufferPreFn (ctx, args) {
        let blockingRead = args[1];
        if (!!blockingRead) {
          ctx.sync = true;
        }
        else {
          ctx.sync = false;

          var tmp = args[ctx.hostBufferArgIdx];
          var tmpBuf = new Uint8Array(tmp.bufByteSize);

          args[ctx.hostBufferArgIdx] = tmpBuf;

          setTransientObject (instance, tmp.transiendId, tmpBuf, function () {
            return Array.prototype.slice.call(tmpBuf);
          });
        }
        return args;
      }
      function readBufferPostFn (ctx, rv, args) {
        if (ctx.sync) {
          // Make an 8-bit view that's sure to work
          let tmp = new Uint8Array(args[ctx.hostBufferArgIdx]);
          // Convert data to array
          let value = Array.prototype.slice.call(tmp);
          rv = { x: value };
        }
        return rv;
      };

      switch (data.method)
      {
        case "enqueueCopyBuffer": return invokeFn (ctx, obj, data.method, data.args);
        case "enqueueCopyBufferRect": return invokeFn (ctx, obj, data.method, data.args);
        case "enqueueCopyImage": return invokeFn (ctx, obj, data.method, data.args);
        case "enqueueCopyImageToBuffer": return invokeFn (ctx, obj, data.method, data.args);
        case "enqueueCopyBufferToImage": return invokeFn (ctx, obj, data.method, data.args);
        case "enqueueReadBuffer":
          ctx.preFn = readBufferPreFn;
          ctx.postFn = readBufferPostFn;
          ctx.hostBufferArgIdx = 4;
          return invokeFn (ctx, obj, data.method, data.args);
        case "enqueueReadBufferRect":
          ctx.preFn = readBufferPreFn;
          ctx.postFn = readBufferPostFn;
          ctx.hostBufferArgIdx = 9;
          return invokeFn (ctx, obj, data.method, data.args);
        case "enqueueReadImage":
          ctx.preFn = readBufferPreFn;
          ctx.postFn = readBufferPostFn;
          ctx.hostBufferArgIdx = 5;
          return invokeFn (ctx, obj, data.method, data.args);
        case "enqueueWriteBuffer": return invokeFn (ctx, obj, data.method, data.args);
        case "enqueueWriteBufferRect": return invokeFn (ctx, obj, data.method, data.args);
        case "enqueueWriteImage": return invokeFn (ctx, obj, data.method, data.args);
        case "enqueueNDRangeKernel": return invokeFn (ctx, obj, data.method, data.args);
        case "enqueueMarker": return invokeFn (ctx, obj, data.method, data.args);
        case "enqueueBarrier": return invokeFn (ctx, obj, data.method, data.args);
        case "enqueueWaitForEvents": return invokeFn (ctx, obj, data.method, data.args);
        case "finish": return invokeFn (ctx, obj, data.method, data.args);
        case "flush": return invokeFn (ctx, obj, data.method, data.args);
        case "getInfo": return invokeFn (ctx, obj, data.method, data.args);
        case "release": return invokeFn (ctx, obj, data.method, data.args);
      }
    }
    catch (e)
    {
      let s = (e&&e.stack ? "\n"+e.stack : "");
      ERROR ("FrameScriptConnector webcl@nokia.com:WebCLCommandQueue Failed:\n" + e + s);
    }
  });

  globalMM.addMessageListener ("webcl@nokia.com:WebCLMemoryObject", function(message)
  {
    try
    {
      let data = message.data;
      let instance = webclInstances[data.instance];
      let obj = instance.objects[data.obj];

      // NOTE: This also handles subclassed WebCLBuffer and WebCLImage
      if (!(obj && obj instanceof WEBCLCLASSES.WebCLMemoryObject)) {
        return { error: { name: "WEBCL_IMPLEMENTATION_FAILURE", message: "Invalid object." } };
      }

      let ctx = {
        webclInstance: instance,
        targetBrowser: message.target,
        preFn: null,   // function (ctx, args) => args
        postFn: null   // function (ctx, rv, args) => rv
      };

      switch (data.method)
      {
        case "getInfo": return invokeFn (ctx, obj, data.method, data.args);
        case "release": return invokeFn (ctx, obj, data.method, data.args);
        case "createSubBuffer": return invokeFn (ctx, obj, data.method, data.args);
      }
    }
    catch (e)
    {
      let s = (e&&e.stack ? "\n"+e.stack : "");
      ERROR ("FrameScriptConnector webcl@nokia.com:WebCLMemoryObject Failed:\n" + e + s);
    }
  });

  globalMM.addMessageListener ("webcl@nokia.com:WebCLSampler", function(message)
  {
    try
    {
      let data = message.data;
      let instance = webclInstances[data.instance];
      let obj = instance.objects[data.obj];

      if (!(obj && obj instanceof WEBCLCLASSES.WebCLSampler)) {
        return { error: { name: "WEBCL_IMPLEMENTATION_FAILURE", message: "Invalid object." } };
      }

      let ctx = {
        webclInstance: instance,
        targetBrowser: message.target,
        preFn: null,   // function (ctx, args) => args
        postFn: null   // function (ctx, rv, args) => rv
      };

      switch (data.method)
      {
        case "getInfo": return invokeFn (ctx, obj, data.method, data.args);
        case "release": return invokeFn (ctx, obj, data.method, data.args);
      }
    }
    catch (e)
    {
      let s = (e&&e.stack ? "\n"+e.stack : "");
      ERROR ("FrameScriptConnector webcl@nokia.com:WebCLSampler Failed:\n" + e + s);
    }
  });

  globalMM.addMessageListener ("webcl@nokia.com:WebCLEvent", function(message)
  {
    try
    {
      let data = message.data;
      let instance = webclInstances[data.instance];
      let obj = instance.objects[data.obj];

      if (!obj) {
        // NOTE: Event created by user in page context wouldn't have object here.
        //       We'll just handle those as a special case.
        obj = realizeWebCLObjectFromPageContext (data.obj, WEBCLCLASSES.WebCLEvent, instance);
      }
      else if (!(obj instanceof WEBCLCLASSES.WebCLEvent)) {
        // NOTE: This also handles subclassed WebCLUserEvent
        return { error: { name: "WEBCL_IMPLEMENTATION_FAILURE", message: "Invalid object." } };
      }

      let ctx = {
        webclInstance: instance,
        targetBrowser: message.target,
        preFn: null,   // function (ctx, args) => args
        postFn: null   // function (ctx, rv, args) => rv
      };

      switch (data.method)
      {
        case "getInfo": return invokeFn (ctx, obj, data.method, data.args);
        case "getProfilingInfo": return invokeFn (ctx, obj, data.method, data.args);
        case "setCallback": return invokeFn (ctx, obj, data.method, data.args);
        case "release": return invokeFn (ctx, obj, data.method, data.args);
        case "setStatus": return invokeFn (ctx, obj, data.method, data.args);
      }
    }
    catch (e)
    {
      let s = (e&&e.stack ? "\n"+e.stack : "");
      ERROR ("FrameScriptConnector webcl@nokia.com:WebCLEvent Failed:\n" + e + s);
    }
  });
}


var webclInstances = {};


function ensureRegistered (webclContext, obj)
{
  if (obj instanceof Base && obj._identity)
  {
    if (!(obj._identity in webclContext.objects))
    {
      webclContext.objects[obj._identity] = obj;
    }
    return obj._identity;
  }

  return obj;
}


function unmangleArgs (webclInstance, targetBrowser, args)
{
  var objects = webclInstance.objects;
  var callbacks = webclInstance.callbacks;

  return Array.prototype.map.call (args, function (v, i)
  {
    try {

      switch (v.type)
      {
        case "array": {
          return unmangleArgs(webclInstance, targetBrowser, v.value);
        }

        case "typedarray": {
          return v.value;
        }

        case "webclobj": {
          if (!(v.value && (v.value in objects))) {
            // Special handling for possibly user-generated objects: WebCLEvent
            if (v.className == "WebCLEvent")
            {
              return realizeWebCLObjectFromPageContext (v.value,
                                                        WEBCLCLASSES.WebCLEvent,
                                                        webclInstance);
            }
            else if (v.className == "WebCLImageDescriptor")
            {
              return realizeWebCLObjectFromPageContext (v.value,
                                                        WEBCLCLASSES.WebCLImageDescriptor,
                                                        webclInstance);
            }
            else
            {
              throw new Error ("Invalid WebCL object identity: className="+v.className+" value="+v.value+" .");
            }
          }

          return objects[v.value];
        }

        case "callback": {
          // Chromescript-side callback handler
          let cbCallbackId = String(v.value);
          let fn = function ()
          {
            let args = Array.prototype.slice.call (arguments, 0);

            targetBrowser.messageManager.sendAsyncMessage ("webcl@nokia.com:callback",
                                                           { callback: cbCallbackId,
                                                             args: args
                                                           });
          }
          return fn;
        }

        case "plain": {
          return v.value;
        }

        default:
          throw new Error ("Unknown argument type \"" + v.type + "\".");
      }
    }
    catch (e)
    {
      e._arg_idx = i;
      e._arg_data = JSON.stringify(v);
      throw e;
    }

    return v.value;
  });
}


function mangleRv (webclInstance, value)
{
  // Typed arrays
  try {
    switch(Object.prototype.toString.call(value))
    {
      case "[object Int8Array]":
      case "[object Uint8Array]":
      case "[object Uint8ClampedArray]":
      case "[object Int16Array]":
      case "[object Uint16Array]":
      case "[object Int32Array]":
      case "[object Uint32Array]":
      case "[object Float32Array]":
      case "[object Float64Array]":
      {
        return { type: "typedarray",
                 value: value
               };
      }
    }
  } catch(e) { }

  // Arrays
  if (Array.isArray(value))
  {
    return { type: "array",
             //value: Array.prototype.map.call(value, webclInstance, mangleRv)
             value: value.map (function(v) {
               return mangleRv (webclInstance, v);
             })
           };
  }
  else
  {
    // WebCL objects
    if (value instanceof Base)
    {
      let rv = { type: "webclobj",
                 className: value.classDescription,
                 value: ensureRegistered(webclInstance, value)
               };

      // Some types should be exposed to frame/page script:
      // WebCLValidatedProgram is presented as WebCLProgram.
      switch (rv.className) {
        case "WebCLValidatedProgram":
          rv.className = "WebCLProgram";
          break;

        case "WebCLImageDescriptor":
          rv.extra = {
            channelOrder: value.channelOrder,
            channelType: value.channelType,
            width: value.width,
            height: value.height,
            rowPitch: value.rowPitch
          };
          break;
      }

      return rv;
    }
    else if (value instanceof WEBCLCLASSES.WebCLKernelArgInfo)
    {
      return { type: "webclobj",
               className: "WebCLKernelArgInfo",
               value:
                 {
                   name:             value.name,
                   typeName:         value.typeName,
                   addressQualifier: value.addressQual,
                   accessQualifier:  value.accessQual
                 }
             };
    }
  }

  // Any other values
  return { type: "plain", value: value };
}


function invokeFn (ctx, obj, name, args)
{
//INFO("C invokeFn "+obj.classDescription+"."+name+"("+JSON.stringify(args)+")");
  try
  {
    // Store original args for pre/post processing use. Deep copy not required here
    ctx.originalArgs = args;


    // Unmangle arguments: framescript connector format -> webcl API format
    try {
      args = unmangleArgs(ctx.webclInstance, ctx.targetBrowser, args);
    }
    catch (e) {
      let s = (e&&e.stack ? "\n"+e.stack : "");
      let d = (e&&e._arg_data ? "\nOffending argument data: "+e._arg_data : "");
      ERROR ("[webclinit.js] invokeFn: Failed to unmangle args for "+
             obj.classDescription+"."+name+"("+JSON.stringify(args)+"):\n"+
             e+s+d);
      return { error: { name: "WEBCL_IMPLEMENTATION_FAILURE", message: "Argument processing failed." } };
    }


    // Run preprocessor: can modify arguments
    try {
      if (ctx.preFn) args = ctx.preFn (ctx, args);
    }
    catch (e) {
      let s = (e&&e.stack ? "\n"+e.stack : "");
      ERROR ("[webclinit.js] invokeFn: preprocessor failed: "+e+s);
    }


    try
    {
      var rv = obj[name].apply (obj, args);
    }
    catch(e)
    {
      // TODO: simplify exception handling: move relevant convertCLException
      //       functionality here.

      e = webclutils.convertCLException (e);

      // Handle WebCL errors
      if (typeof(e) == "object" && e.name !== undefined)
      {
        switch (e.type)
        {
          case "cl":
            break;

          case "syntaxerror":
            e.name = e.name || "WEBCL_SYNTAX_ERROR";
            e.message = e.message || "Invalid number of arguments.";
            break;

          case "typeerror":
            e.message = e.message || "Invalid argument type";
            //return new TypeError(e.message, e.fileName, e.lineNumber);

            // NOTE: Special case, TypeErrors are made back into TypeErrors
            //       in page script.
            return { error: e };
            break;

          case "notimplemented":
            e.name = e.name || "WEBCL_NOT_IMPLEMENTED";
            e.message = e.message || "Function or feature not implemented.";
            break;

          case "internal":
            e.name = e.name || "WEBCL_IMPLEMENTATION_FAILURE";
            e.message = e.message || "Internal error.";
            break;

          case "invalidobject":
            e.name = e.name || "WEBCL_INVALID_OBJECT";
            e.message = e.message || "Invalid/released WebCL object.";
            break;

          default:
            e.name = e.name || "WEBCL_UNKNOWN_EXCEPTION";
            e.message = e.message || "Unknown WebCL exception.";
            break;
        }

        if (!e.name) e.name = "WEBCL_IMPLEMENTATION_FAILURE";
        if (!e.ctx) {
          if (e.fileName || e.lineNumber)
            e.ctx = " [" + e.fileName + ":" + e.lineNumber + "]";
          else
            e.ctx = obj.classDescription+"."+name;
        }

        let s = (e&&e.stack ? "\n"+e.stack : e.ctx);
        ERROR("C [webclinit.js invokeFn] "+obj.classDescription+"."+name+" Failed.\n "+e.name+": "+
              e.message+s);

        return {
          error:
          {
            name: e.name,
            message: e.message
            ,lineNumber: e.lineNumber
            ,fileName: e.fileName
            ,columnNumber: e.columnNumber
          }
        };
      }
    }


    // Run postprocessor: can modify rv
    try {
      if (ctx.postFn) rv = ctx.postFn (ctx, rv, args);
    }
    catch (e) {
      let s = (e&&e.stack ? "\n"+e.stack : "");
      ERROR ("[webclinit.js] invokeFn: postprocessor failed: "+e+s);
    }


    rv = mangleRv (ctx.webclInstance, rv);

    // NOTE: TypedArrays from WebCL are still OK here but seem to become
    //       basic objects ({ "0": 42, "1": 43, ... }) when passing over
    //       the message manager back to frame script.

    // TODO: Handle exceptions?
//INFO("C invokeFn => " + JSON.stringify(rv));
    return rv;
  }
  catch (e)
  {
    let s = (e&&e.stack ? "\n"+e.stack : "");

    if (e instanceof Error)
    {
      ERROR("C [webclinit.js invokeFn] "+obj.classDescription+"."+name+" Failed: "+e.toString()+s);
    }

    return { error: { name: "WEBCL_IMPLEMENTATION_FAILURE" } };
  }
}


function realizeWebCLObjectFromPageContext (identity, clazz, webclInstance)
{
  //let obj = new WEBCLCLASSES.WebCLEvent ();
  let obj = new clazz();

  // Overwrite the new object's identity with the one generated in
  // frame script
  obj._identity = identity;

  // NOTE: The new event object is temporarily registered with WebCL
  // so that it's included in the resource management.
  // It will be moved to command queue when used.
  webclInstance.webcl._registerObject (obj);

  // Register the new event object in framescript connector registry
  ensureRegistered (webclInstance, obj)

  return obj;
}


function handle_prefChanged (ctx, name)
{
  switch (name)
  {
    case webclutils.PREF_WEBCL_ALLOWED:
      ctx._allowed = (webclutils.getPref_allowed (true) !== webclutils.PREF_WEBCL_ALLOWED__FALSE);
      break;
  }
}


WebCLInit.prototype.observe = function (subject, topic, data)
{
  TRACE (this, "observe", arguments);

  switch (topic) {
    case "profile-after-change":
      try {
        handle_profileAfterChange (this);
      } catch (e) {
        ERROR ("WebCLInit#observe \"profile-after-change\": " +e);
        throw e;
      }
      break;

    case "nsPref:changed":
      try {
        handle_prefChanged (this, data);
      } catch (e) {
        ERROR ("WebCLInit#observe \"nsPref:changed\": " +e);
        throw e;
      }
      break;
  }
};


var NSGetFactory = XPCOMUtils.generateNSGetFactory ([WebCLInit]);
