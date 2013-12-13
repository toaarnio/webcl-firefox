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


var EXPORTED_SYMBOLS = [ "SecurityCheckedComponentMixin" ];


const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var Exception = Components.Exception;


Cu.import ("resource://nrcwebcl/modules/logger.jsm");
Cu.import ("resource://nrcwebcl/modules/base.jsm");


try {


var SecurityCheckedComponentMixin =
{
  canCallMethod:    function () { return "allAccess"; },
  canCreateWrapper: function () { return "allAccess"; },
  canGetProperty:   function () { return "allAccess"; },
  canSetProperty:   function () { return "noAccess"; }
};


} catch(e) { ERROR ("securitycheckedcomponent.jsm: " + EXCEPTIONSTR(e)); throw e; }
