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


var EXPORTED_SYMBOLS = [ "createConnector_WebCLContext" ];

try
{

  const Cc = Components.classes;
  const Ci = Components.interfaces;
  const Cu = Components.utils;


  Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/framescript/misc.jsm");


  function createConnector_WebCLContext (ctx)
  {
    var className = "WebCLContext";

    return {
      createBuffer:
        createFnWrapper (ctx, className, "createBuffer"),

      createCommandQueue:
        createFnWrapper (ctx, className, "createCommandQueue"),

      createImage:
        createFnWrapper (ctx, className, "createImage"),

      createProgram:
        createFnWrapper (ctx, className, "createProgram"),

      createSampler:
        createFnWrapper (ctx, className, "createSampler"),

      createUserEvent:
        createFnWrapper (ctx, className, "createUserEvent"),

      getInfo:
        createFnWrapper (ctx, className, "getInfo"),

      getSupportedImageFormats:
        createFnWrapper (ctx, className, "getSupportedImageFormats"),

      release:
        createFnWrapper (ctx, className, "release"),

      releaseAll:
        createFnWrapper (ctx, className, "releaseAll")
    };
  }

}
catch (e)
{
  let s = (e&&e.stack ? "\n"+e.stack : "");
  ERROR("modules/framescript/webclcontext.jsm failed: "+e+s);
}
