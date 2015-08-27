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


Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/webclutils.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/framescript/webcl.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/framescript/webclplatform.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/framescript/webcldevice.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/framescript/webclcontext.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/framescript/webclprogram.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/framescript/webclkernel.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/framescript/webclcommandqueue.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/framescript/webclmemoryobject.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/framescript/webclsampler.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/framescript/webclevent.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/framescript/enums.jsm");

try { Cu.import ("chrome://nrcwebcl/content/webclversion.jsm"); } catch(e) { }



function reportError (e, ctx, msg)
{
  ctx = (ctx ? ctx+": " : " " );
  msg = (msg ? msg : "" );
  let stack = (e && e.stack ? "\n" + e.stack : "");

  ERROR("[main.js] " + ctx + msg + e + stack);
// ERROR("     file:"+e.fileName);
// ERROR("     line:"+e.lineNumber);
// ERROR("     column:"+e.columnNumber);
}


var gCtx = {
  messageManager: this,
  allowed: false,

  window: content,
  unsafeWindow: content.wrappedJSObject,
  attached: false,
  document: null,

  webclIdentity: null,

  callbacks: {},
  objects: {}
};



// Detach WebCL functionality if attached.
addEventListener ("unload", function (ev) {
  if (!content) return;
  let document = ev.target;

  if (gCtx.attached) {
    framescript_detach (gCtx);
  }
});


/*
// NOTE: This didn't work well: page scripts get to run before the WebCL object
//       is introduced to the global object.

// Attach WebCL functionality on DOMContentLoaded event, if the page seems
// a good candidate.
addEventListener ("DOMContentLoaded", function (ev) {
  if (!(content && ev && ev.target)) return;

  // Note that WebCL is made available for not only regular web pages, but all content except the
  // browser internal "chrome:" URIs.  This allows developers to bring up the Web Console and start
  // experimenting at any time.  It's particularly important to have WebCL enabled on "about:home"
  // and "about:blank".

  if (ev.target.nodeName != "#document") return;
  if (ev.target.location.href.startsWith("chrome:")) return;

  if (gCtx.attached) {
    framescript_detach (gCtx);
  }

  gCtx.document = ev.target; // = content.document;

  framescript_attach (gCtx);
});
*/


var observer = {
  observe: function (subject, topic, data)
  {
    switch (topic) {
      case "content-document-global-created":
        var domWindow = subject;
        if (domWindow.document.baseURI.startsWith("chrome:")) return;

        gCtx.document = domWindow.document;

        if(gCtx.allowed)
        {
          INFO ("WebCL Loader: Permission granted. Loading WebCL client side component. baseURI: " + domWindow.document.baseURI);
          framescript_attach (gCtx);
        }
        else
        {
          INFO ("WebCL Loader: Permission denied.");
        }

        break;

      case "nsPref:changed":
        try {
          var name = data;
          switch (name)
          {
            case webclutils.PREF_WEBCL_ALLOWED:
              gCtx.allowed = (webclutils.getPref_allowed (true) !== webclutils.PREF_WEBCL_ALLOWED__FALSE);
              break;
          }

        } catch (e) {
          ERROR ("WebCLLoader#observe \"nsPref:changed\": " +e);
          throw e;
        }
        break;
    }
  }
};

var os = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
os.addObserver(observer, "content-document-global-created", false);

gCtx.allowed = (webclutils.getPref_allowed (true) !== webclutils.PREF_WEBCL_ALLOWED__FALSE);
//webclutils.setPrefObserver_allowed (observer);



function framescript_attach (ctx)
{
  try
  {
    if (!Object.isExtensible(ctx.unsafeWindow)) {
      // The content window isn't extensible so we can't attach WebCL.
      return;
    }

    try
    {
      // WebCL framescript connector root object
      var nrcWebCL = Cu.createObjectIn (ctx.unsafeWindow);

      // FIXME: For some reason, the window proxy does not accept
      // non-configurable properties. I don't know how to fix this properly, so
      // for now, we just make it configurable (and hope the user does not break
      // it)
      Object.defineProperty (ctx.unsafeWindow, "NRCWebCL",
                             {
                               configurable: true,
                               writable: false,
                               enumerable: false,
                               value: nrcWebCL
                             });
    }
    catch (e)
    {
      // Object.defineProperty might fail with TypeError as if ctx.unsafeWindow
      // was frozen or sealed, even though Object.isFrozen and .isSealed report
      // that not to be the case. This is OK, the window probably wasn't very
      // interesting anyway.

      reportError(e);
      dump ("Failed to attach WebCL on page '" + ctx.document.location + "', " +
            "extensible: "+Object.isExtensible(ctx.window) + ", frozen: " +
            Object.isFrozen(ctx.window) + ", sealed: " +
            Object.isSealed(ctx.window) + "\n");

      return;
    }


    function registerWebCLFrameScript ()
    {
      try{
        // Register frame script to WebCL backend
        var rv = sendSyncMessage ("webcl@nokia.com:control",
                                  { action: "register" })[0];
        if (!rv || rv.error)
        {
          let m = "";
          if (rv && rv.error && rv.error.message) m = rv.error.message;
          reportError (m, "Failed to register to WebCL backend.");
          return;
        }
        ctx.webclIdentity = rv.id;
      } catch(e) { INFO("registerWebCLFrameScript"); reportError(e); }
    }

    // TODO: Sometimes sendSyncMessage fails with NS_ERROR_ILLEGAL_VALUE.
    //       What's the cause? Should we delay the registration?
    registerWebCLFrameScript ();


    // Version property
    let version;
    try { version = webclVersion } catch(e) {
       reportError(e);
    };
    Object.defineProperty (nrcWebCL, "version",
                           {
                             configurable: false,
                             writable: false,
                             enumerable: true,
                             value: version
                           });

    // Identity
    Object.defineProperty (nrcWebCL, "identity",
                           {
                             configurable: false,
                             writable: false,
                             enumerable: false,
                             value: ctx.webclIdentity
                           });

    /*
    let uuidGenerator = Cc["@mozilla.org/uuid-generator;1"]
                          .getService(Components.interfaces.nsIUUIDGenerator);

    Object.defineProperty (nrcWebCL, "createIdentity",
                           {
                             configurable: false,
                             writable: false,
                             enumerable: false,
                             value: Cu.exportFunction (function ()
                             {
                               return uuidGenerator.generateUUID().toString().slice(1,-1).replace("-", "", "g");
                             }, ctx.unsafeWindow)
                           });
    */

    // WebCL enums
    Object.defineProperty (nrcWebCL, "enums",
                           {
                             configurable: false,
                             writable: false,
                             enumerable: true,
                             value: Cu.cloneInto (webclEnums, ctx.unsafeWindow)
                           });

    Object.defineProperty (nrcWebCL, "WebCL",
                           {
                             configurable: false,
                             writable: false,
                             enumerable: true,
                             value: Cu.cloneInto (createConnector_WebCL (ctx),
                                                  ctx.unsafeWindow,
                                                  { cloneFunctions: true })
                           });

    Object.defineProperty (nrcWebCL, "WebCLPlatform",
                           {
                             configurable: false,
                             writable: false,
                             enumerable: true,
                             value: Cu.cloneInto (createConnector_WebCLPlatform (ctx),
                                                  ctx.unsafeWindow,
                                                  { cloneFunctions: true })
                           });

    Object.defineProperty (nrcWebCL, "WebCLDevice",
                           {
                             configurable: false,
                             writable: false,
                             enumerable: true,
                             value: Cu.cloneInto (createConnector_WebCLDevice (ctx),
                                                  ctx.unsafeWindow,
                                                  { cloneFunctions: true })
                           });

    Object.defineProperty (nrcWebCL, "WebCLContext",
                           {
                             configurable: false,
                             writable: false,
                             enumerable: true,
                             value: Cu.cloneInto (createConnector_WebCLContext (ctx),
                                                  ctx.unsafeWindow,
                                                  { cloneFunctions: true })
                           });

    Object.defineProperty (nrcWebCL, "WebCLProgram",
                           {
                             configurable: false,
                             writable: false,
                             enumerable: true,
                             value: Cu.cloneInto (createConnector_WebCLProgram (ctx),
                                                  ctx.unsafeWindow,
                                                  { cloneFunctions: true })
                           });

    Object.defineProperty (nrcWebCL, "WebCLKernel",
                           {
                             configurable: false,
                             writable: false,
                             enumerable: true,
                             value: Cu.cloneInto (createConnector_WebCLKernel (ctx),
                                                  ctx.unsafeWindow,
                                                  { cloneFunctions: true })
                           });

    Object.defineProperty (nrcWebCL, "WebCLCommandQueue",
                           {
                             configurable: false,
                             writable: false,
                             enumerable: true,
                             value: Cu.cloneInto (createConnector_WebCLCommandQueue (ctx),
                                                  ctx.unsafeWindow,
                                                  { cloneFunctions: true })
                           });

    Object.defineProperty (nrcWebCL, "WebCLMemoryObject",
                           {
                             configurable: false,
                             writable: false,
                             enumerable: true,
                             value: Cu.cloneInto (createConnector_WebCLMemoryObject (ctx),
                                                  ctx.unsafeWindow,
                                                  { cloneFunctions: true })
                           });

    Object.defineProperty (nrcWebCL, "WebCLSampler",
                           {
                             configurable: false,
                             writable: false,
                             enumerable: true,
                             value: Cu.cloneInto (createConnector_WebCLSampler (ctx),
                                                  ctx.unsafeWindow,
                                                  { cloneFunctions: true })
                           });

    Object.defineProperty (nrcWebCL, "WebCLEvent",
                           {
                             configurable: false,
                             writable: false,
                             enumerable: true,
                             value: Cu.cloneInto (createConnector_WebCLEvent (ctx),
                                                  ctx.unsafeWindow,
                                                  { cloneFunctions: true })
                           });


    // Load WebCL page script into unprivileged context.
    // NOTE: Exceptions thrown from the next line are likely to actually
    // originate from the clientwrapper.js .
    Cc["@mozilla.org/moz/jssubscript-loader;1"]
      .getService (Ci.mozIJSSubScriptLoader)
      .loadSubScript ("chrome://nrcwebcl/content/page/clientwrapper.js", ctx.unsafeWindow);


    ctx.attached = true;

  }
  catch (e) { reportError(e); }
}


function framescript_detach (ctx)
{
  try
  {
//INFO ("DETACH: " + ctx.webclIdentity);

    if (ctx.webclIdentity) {
      let rv = sendSyncMessage ("webcl@nokia.com:control",
                                {
                                  action: "unregister",
                                  id: ctx.webclIdentity
                                })[0];
      ctx.webclIdentity = null;
      if (rv && rv.error)
      {
        reportError (rv.error.message, "Failed to unregister from WebCL backend.");
        return;
      }
    }


    ctx.unsafeWindow.WebCL = null;

    ctx.document = null;
    ctx.attached = false;
  }
  catch (e) { reportError(e); }
}


// TODO: object identity registry and pruning on method invokation


// Callback invokation
addMessageListener ("webcl@nokia.com:callback", function (message)
{
  let data = message.data;

  if (!data || !data.callback) {
    ERROR ("webcl@nokia.com:callback handler: Invalid message data.");
    return;
  }

  let id = data.callback;
  if (!(id in gCtx.callbacks)) {
    ERROR ("webcl@nokia.com:callback handler: Invalid callback ID \""+id+"\".");
    return;
  }

  let args = Cu.cloneInto(data.args, gCtx.unsafeWindow);
  let cb = gCtx.callbacks[id];

  if (!cb.persistent) {
    delete gCtx.callbacks[id];
  }

  cb.fn.apply (null, args);
});
