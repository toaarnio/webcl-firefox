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


var EXPORTED_SYMBOLS = [ "createFnWrapper" ];


try
{
  const Cc = Components.classes;
  const Ci = Components.interfaces;
  const Cu = Components.utils;

  Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");


  let uuidGenerator = Cc["@mozilla.org/uuid-generator;1"]
                        .getService(Components.interfaces.nsIUUIDGenerator);


  function mangleArgs (args, ctx, callbacksOut)
  {
    if (!args) return args;

    return Array.prototype.map.call (args, function (v, i)
    {

      // Detect typed arrays
      try {
        switch(Object.prototype.toString.call(v))
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
                     value: Cu.waiveXrays (v)
                   };
          }
        }
      } catch(e) { INFO("TypedArray check failed: "+e); }


      if (Array.isArray(v))
      {
        v = Cu.waiveXrays (v);

        return { type: "array",
                 value: mangleArgs (v, ctx, callbacksOut)
                        //Array.prototype.map.call(v, mangleArgs, ctx, callbacksOut)
               };
      }
      else if (v && typeof(v) == "object")
      {
        let window = Cu.waiveXrays(ctx.messageManager.content);

        if (v instanceof window.WebCLPlatform) {
          return { type: "webclobj", className: "WebCLPlatform", value: v._identity };
        }
        if (v instanceof window.WebCLDevice) {
          return { type: "webclobj", className: "WebCLDevice", value: v._identity };
        }
        if (v instanceof window.WebCLContext) {
          return { type: "webclobj", className: "WebCLContext", value: v._identity };
        }
        if (v instanceof window.WebCLProgram) {
          return { type: "webclobj", className: "WebCLProgram", value: v._identity };
        }
        if (v instanceof window.WebCLKernel) {
          return { type: "webclobj", className: "WebCLKernel", value: v._identity };
        }
        if (v instanceof window.WebCLCommandQueue) {
          return { type: "webclobj", className: "WebCLCommandQueue", value: v._identity };
        }
        if (v instanceof window.WebCLBuffer) {
          return { type: "webclobj", className: "WebCLBuffer", value: v._identity };
        }
        if (v instanceof window.WebCLImage) {
          return { type: "webclobj", className: "WebCLImage", value: v._identity };
        }
        if (v instanceof window.WebCLMemoryObject) {
          return { type: "webclobj", className: "WebCLMemoryObject", value: v._identity };
        }
        if (v instanceof window.WebCLSampler) {
          return { type: "webclobj", className: "WebCLSampler", value: v._identity };
        }
        if (v instanceof window.WebCLUserEvent) {
          return { type: "webclobj", className: "WebCLUserEvent", value: v._identity };
        }
        if (v instanceof window.WebCLEvent) {
          if (!v._identity) {
            if (v.wrappedJSObject) v = v.wrappedJSObject;
            v._identity =
                uuidGenerator.generateUUID().toString().slice(1,-1).replace("-", "", "g");
          }
          return { type: "webclobj", className: "WebCLEvent", value: v._identity };
        }
        if (v instanceof window.WebCLImageDescriptor) {
          /*
          if (!v._identity) {
            if (v.wrappedJSObject) v = v.wrappedJSObject;
            v._identity =
                uuidGenerator.generateUUID().toString().slice(1,-1).replace("-", "", "g");
          }
          return { type: "webclobj", className: "WebCLImageDescriptor", value: v };
          */
          let o = {};
          Object.keys(v).map(function(n){ o[n] = v[n]; });
          return { type: "plain", value: o };
        }
        if (v instanceof window.WebCLKernelArgInfo) {
          return { type: "webclobj", className: "WebCLKernelArgInfo", value: v };
        }
      }
      else if (typeof(v) == "function")
      {
        let id = uuidGenerator.generateUUID().toString().slice(1,-1).replace("-", "", "g");
        let cb = { id: id, fn: v };

        if (callbacksOut)
        {
          callbacksOut.push (cb);
        }
        else
        {
          ctx.callbacks[id] = cb;
        }

        return { type: "callback", value: cb.id };
      }

      return { type: "plain", value: v };
    });
  }


  function createFnWrapper (ctx, className, methodName, argsValidator, preMangler, postMangler)
  {
    TRACE ("framescript", "createFnWrapper", arguments);

    return function () {
      // NOTE: 'this' refers to the page script object (see clientwrapper).

      try {
        TRACE ("framescript/"+className, methodName, arguments);
//INFO("F "+className+"."+methodName+"("+Array.prototype.map.call(arguments, function(v){return ""+v;})+")");

        // NOTE: arguments here are Xray wrapped starting from FF34.


        // NOTE: Event created by the user in page context wouldn't have identity
        //       so we'll need to create one for it.
        if (this instanceof ctx.unsafeWindow.WebCLEvent)
        {
          if (!this._identity)
          {
            this.wrappedJSObject._identity =
              uuidGenerator.generateUUID().toString().slice(1,-1).replace("-", "", "g");
          }
        }

        // ArgsValidator functions take arguments array and return
        // { success: Boolean, error: Error, msg: String }
        let t;
        if (argsValidator && !(t=argsValidator(arguments)).success)
        {
          //throw new t.error (t.msg);
          return Cu.cloneInto({ error: t.error }, ctx.unsafeWindow); //messageManager.content);
        }

        // mangle arguments / do any pre ops
        let cbs = [];
        let args = Array.prototype.slice.call (Cu.waiveXrays(arguments));

        // mangler token implements a common context for pre and post manglers.
        let manglerToken = {
          ctx: ctx,
          originalArguments: arguments
        };

        // Run preMangler, if any
        args = (preMangler ? preMangler(args, manglerToken) : args);


        // Run internal mangling
        args = mangleArgs (args, ctx, cbs);

        let rv = ctx.messageManager.sendSyncMessage ("webcl@nokia.com:"+className,
                                                     {
                                                       instance: ctx.webclIdentity,
                                                       obj: this._identity,
                                                       method: methodName,
                                                       args: args
                                                     });
        // NOTE: sendSyncMessage returns array of all the values from every
        // listener. We expect only one return value.
        rv = rv[0];

        // NOTE: TypedArrays from WebCL have been transformed into plain objects here.

        // Don't register callbacks if an error was returned
        // NOTE: callback invokation is handled in framescript/main.js .
        if (!rv.error)
        {
          for (let i in cbs)
          {
            let cb = cbs[i];
            ctx.callbacks[cb.id] = cb;
          }
        }

        // mangle return value / do any post ops
        manglerToken.args = args;
        rv = (postMangler ? postMangler(rv, manglerToken) : rv);
//INFO("F "+className+"."+methodName+" ==> "+JSON.stringify(rv));

        return Cu.cloneInto(rv, ctx.unsafeWindow); //messageManager.content);

      } catch(e) {
        var s = (e&&e.stack ? "\n"+e.stack : "");
        ERROR ("framescript wrapper "+className+"."+methodName+":\n"+e+s);

        return { error: { name: "WEBCL_IMPLEMENTATION_FAILURE", message: "" } };
      }
    };
  }


  /*
  function exampleArgsValidator (args)
  {
    return { success: true };
    // return { success: false, error: { name: "", message: "", ctx: "" } };
  }

  // args: Array
  // token: { ctx: Object, originalArguments: Array }
  function examplePreMangler (args, token)
  {
    return args;
  }

  // rv: Object
  // token: { ctx: Object, originalArguments: Array, args: Array }
  function examplePostMangler (rv, token)
  {
    // NOTE: rv is { value: X } or
    //             { className: "WebCLDevice", value: "ID" } or
    //             { error: "ERROR_NAME", message: "MESSAGE", ctx: "CONTEXT" }
    return rv;
  }
  */

}
catch (e)
{
  dump(e+"\n"+e.stack+"\n");
}
