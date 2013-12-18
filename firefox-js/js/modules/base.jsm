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


var EXPORTED_SYMBOLS = [ "Base" ];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var Exception = Components.Exception;

Cu.import("resource://nrcwebcl/modules/logger.jsm");

Cu.import ("resource://nrcwebcl/modules/webclutils.jsm");
Cu.import ("resource://nrcwebcl/modules/mixin.jsm");
Cu.import ("resource://nrcwebcl/modules/mixins/securitycheckedcomponent.jsm");


function Base ()
{
  // Note: Set by owner in _registerObject.
  this._owner = null;
}

addMixin (Base.prototype, SecurityCheckedComponentMixin);


Base.prototype._register = function (owner)
{
  TRACE (this, "_register", arguments);

  if (!owner) return;

  if (owner.wrappedJSObject) owner = owner.wrappedJSObject;

  if (this._owner)
  {
    this._owner._unregisterObject (this);
  }

  owner._registerObject (this);
}


Base.prototype._unregister = function ()
{
  TRACE (this, "_unregister", arguments);

  if (this._owner)
  {
    this._owner._unregisterObject (this);
    this._owner = null; // just in case...
  }
};


Base.prototype._wrapInternal = function (value, ownerOverride)
{
  TRACE (this, "_wrapInternal", arguments);
  return webclutils.wrapInternal (value, ownerOverride || this._owner);
};


Base.prototype._unwrapInternalOrNull = function (value)
{
  TRACE (this, "_unwrapInternalOrNull", arguments);
  return webclutils.unwrapInternalOrNull (value);
};


Base.prototype._unwrapInternal = function (value)
{
  TRACE (this, "_unwrapInternal", arguments);
  return webclutils.unwrapInternal (value);
};



//------------------------------------------------------------------------------
// Class Info

Base.prototype.getInterfaces = function (count)
{
  var interfaces = this._interfaces;
  if (!interfaces || !Array.isArray(interfaces))
  {
    interfaces = [];
  }

  count.value = interfaces.length;
  return interfaces;
};
