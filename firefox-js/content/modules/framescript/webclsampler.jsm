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


var EXPORTED_SYMBOLS = [ "createConnector_WebCLSampler" ];

try
{

  const Cc = Components.classes;
  const Ci = Components.interfaces;
  const Cu = Components.utils;


  Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/framescript/misc.jsm");


  function createConnector_WebCLSampler (ctx)
  {
    var className = "WebCLSampler";

    return {
      getInfo:
        createFnWrapper (ctx, className, "getInfo"),

      release:
        createFnWrapper (ctx, className, "release")
    };
  }

}
catch (e)
{
  let s = (e&&e.stack ? "\n"+e.stack : "");
  ERROR("modules/framescript/webclsampler.jsm failed: "+e+s);
}
