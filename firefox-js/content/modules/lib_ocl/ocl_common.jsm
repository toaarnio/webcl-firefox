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


var EXPORTED_SYMBOLS = [ "ocl_common" ];

try {

const Cu = Components.utils;

Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");


var ocl_common =
{
  getObjectIdentity: function (obj)
  {
    try
    {
      if (obj.internal === null)
      {
        return;
      }

      switch (obj._internal.constructor.size)
      {
        case 8:
          let t = ctypes.cast(obj._internal, ctypes.uint64_t);
          return String(ctypes.UInt64.hi(t.value)) + ctypes.UInt64.lo(t.value);

        case 4:
          return String (ctypes.cast(obj._internal, ctypes.uint32_t).value);

        default:
          ERROR ("ocl_common.getObjectIdentity: Unexpected internal size: "
                 + obj._internal.constructor.size + " bytes.");
      }
    }
    catch (e)
    {
      DEBUG("ocl_common.getIdentity failed: " + EXCEPTIONSTR(e));
      return null;
    }
  }
};

} catch (e) { ERROR ("ocl_common.jsm: " + EXCEPTIONSTR(e) + "."); throw e; }
