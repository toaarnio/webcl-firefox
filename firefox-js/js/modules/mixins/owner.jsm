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


var EXPORTED_SYMBOLS = [ "OwnerMixin" ];


const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var Exception = Components.Exception;


Cu.import ("resource://nrcwebcl/modules/logger.jsm");
Cu.import ("resource://nrcwebcl/modules/base.jsm");


try {


var OwnerMixin =
{
  classDescription: "OwnerMixin",
  _objectRegistry: [],

  _registerObject: function (obj)
  {
    LOG (this.classDescription + "._registerObject("+obj.wrappedJSObject.classDescription+")");

    try
    {
      if (!obj) return false;
      obj = obj.wrappedJSObject;

      if (!obj instanceof Base)
      {
        throw new Error ("Object not instance of Base");
      }

      var idx = this._objectRegistry.indexOf (obj);
      if (idx != -1)
      {
        throw new Error ("Object already registered");
      }

      this._objectRegistry.push (obj);
      obj._owner = this;
    }
    catch (e)
    {
      LOG(this.classDescription + "._registerObject FAILED: " + e + ".");
      return false;
    }

    return true;
  },

  _unregisterObject: function (obj)
  {
    LOG (this.classDescription + "._unregisterObject("+obj.wrappedJSObject.classDescription+")");

    try
    {
      if (!obj) return false;
      obj = obj.wrappedJSObject;

      if (!obj instanceof Base)
      {
        throw new Error ("Object not instance of Base");
      }

      var idx = this._objectRegistry.indexOf (obj);
      if (idx == -1)
      {
        throw new Error ("Object not registered");
      }

      this._objectRegistry.splice (idx, 1);
      obj._owner = null;
    }
    catch (e)
    {
      LOG(this.classDescription + "._unregisterObject FAILED: " + e + ".");
      return false;
    }

    return true;
  },

  _forEachRegistered: function (callback)
  {
    if (!callback || typeof(callback) != "function") callback = function () {};

    for (var i = 0; i < this._objectRegistry.length; ++i)
    {
      var o = this._objectRegistry[i];
      callback (o);
    }
  },

  _clearRegistry: function ()
  {
    this._objectRegistry = [];
  }
};


} catch(e) { ERROR ("owner.jsm: " + EXCEPTIONSTR(e)); throw e; }
