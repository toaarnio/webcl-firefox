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


var EXPORTED_SYMBOLS = [ "createConnector_WebCL" ];

try
{

  const Cc = Components.classes;
  const Ci = Components.interfaces;
  const Cu = Components.utils;


  Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/framescript/misc.jsm")


  let uuidGenerator = Cc["@mozilla.org/uuid-generator;1"]
                        .getService(Components.interfaces.nsIUUIDGenerator);


  function createConnector_WebCL (ctx)
  {
    let className = "WebCL";

    let obj = {};

    // NOTE: Components.utils.cloneInto drops property options, so all props
    // will end up being defaulted to read-write.

    Object.defineProperty (obj, "getPlatforms",
                           {
                             configurable: false,
                             writable: false,
                             enumerable: true,
                             value: createFnWrapper (ctx, className, "getPlatforms")
                           });

    Object.defineProperty (obj, "createContext",
                           {
                             configurable: false,
                             writable: false,
                             enumerable: true,
                             value: createFnWrapper (ctx, className, "createContext")
                           });

    Object.defineProperty (obj, "getSupportedExtensions",
                           {
                             configurable: false,
                             writable: false,
                             enumerable: true,
                             value: createFnWrapper (ctx, className, "getSupportedExtensions")
                           });

    Object.defineProperty (obj, "enableExtension",
                           {
                             configurable: false,
                             writable: false,
                             enumerable: true,
                             value: createFnWrapper (ctx, className, "enableExtension")
                           });

    Object.defineProperty (obj, "waitForEvents",
                           {
                             configurable: false,
                             writable: false,
                             enumerable: true,
                             value: createFnWrapper (ctx, className, "waitForEvents")
                           });

    Object.defineProperty (obj, "releaseAll",
                           {
                             configurable: false,
                             writable: false,
                             enumerable: true,
                             value: createFnWrapper (ctx, className, "releaseAll")
                           });

    obj._getTransient = createFnWrapper (ctx, className, "_getTransient");

    obj._getUUID = function () {
      return uuidGenerator.generateUUID().toString().slice(1,-1).replace("-", "", "g");
    }

//     Object.defineProperty (obj, "dumpTree",
//                            {
//                              configurable: false,
//                              writable: false,
//                              enumerable: true,
//                              value: createFnWrapper (ctx, className, "dumpTree")
//                            });

    return obj;
  }

}
catch (e)
{
  let s = (e&&e.stack ? "\n"+e.stack : "");
  ERROR("modules/framescript/webcl.jsm failed: "+e+s);
}
