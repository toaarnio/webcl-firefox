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
  _objectRegistry: {},

  _registerObject: function (obj, key)
  {
    TRACE (this, "_registerObject", arguments);

    try
    {
      if (!obj) return false;

      let originalObject = obj;

      if (obj.wrappedJSObject) obj = obj.wrappedJSObject;

      if (!obj instanceof Base)
      {
        throw new Error ("Object not instance of Base");
      }

      if (key === undefined && obj._getIdentity)
      {
        key = obj._getIdentity ();
      }

      if (!key)
      {
        throw new Error ("Invalid or missing key.");
      }

      if (this._objectRegistry.hasOwnProperty (key))
      {
        throw new Error ("Object already registered");
      }

      this._objectRegistry[key] = originalObject;

      if (obj._owner)
      {
        obj._owner._unregisterObject (obj);
      }

      obj._owner = this;
    }
    catch (e)
    {
      LOG(this.classDescription + "._registerObject FAILED: " + e + ".");
      return false;
    }

    return true;
  },

  _unregisterObject: function (objOrKey)
  {
    TRACE (this, "_unregisterObject", arguments);
    try
    {
      if (!objOrKey) return false;

      var key = null;

      if (typeof(objOrKey) == "object")
      {
        let obj = objOrKey;
        if (obj.wrappedJSObject) obj = obj.wrappedJSObject;

        if (!obj instanceof Base)
        {
          throw new Error ("Object not instance of Base");
        }

        if (obj._getIdentity)
        {
          key = obj._getIdentity ();
        }
      }
      else
      {
        key = String(objOrKey);
      }

      if (!key)
      {
        throw new Error ("Invalid or missing key.");
      }

      if (!this._objectRegistry.hasOwnProperty (key))
      {
        throw new Error ("Object not registered");
      }

      var target = this._objectRegistry[key];
      if (target.wrappedJSObject) target = target.wrappedJSObject;

      delete this._objectRegistry[key];

      target._owner = null;

    }
    catch (e)
    {
      LOG(this.classDescription + "._unregisterObject FAILED: " + e + ".");
      return false;
    }

    return true;
  },

  _findObjectByKey: function (key)
  {
    TRACE (this, "_findObjectByKey", arguments);
    try
    {
      if (typeof(key) == "string" && this._objectRegistry.hasOwnProperty(key))
      {
        return this._objectRegistry[key];
      }
      DEBUG (this.classDescription + "._findObjectByKey: Invalid key \"" + key + "\"");
    }
    catch (e)
    {
      ERROR (this.classDescription + "._findObjectByKey: " + e);
    }
    return null;
  },

  _forEachRegistered: function (callback)
  {
    TRACE (this, "_forEachRegistered", arguments);
    if (!callback || typeof(callback) != "function") callback = function () {};

    // Modifications to _objectRegistry must not affect iteration here.
    var keys = Object.keys (this._objectRegistry);
    var values = [];
    for (let i = 0; i < keys.length; ++i)
    {
      values.push (this._objectRegistry[keys[i]]);
    }
    keys.length = 0;

    for (let i = 0; i < values.length; ++i)
    {
      let o = values[i];
      callback (o);
    }
  },

  _clearRegistry: function ()
  {
    TRACE (this, "_clearRegistry", arguments);
    this._objectRegistry = {};
  },



  dumpTree: function (prefix, mark, bullet)
  {
    if (!prefix) prefix = "";
    if (!mark) mark = "  ";
    if (!bullet) bullet = "*";

    var identity;
    try {
      identity = this;
      while (identity._internal) identity = identity._internal;
      identity = "  (" + identity + ")";
    } catch(e){ identity = ""; }
    LOG (prefix + " * " + this.classDescription + identity);

    _dumpTreeInternal (this, prefix+mark, mark, " * ");
  }

};


function _dumpTreeInternal (instance, prefix, mark, bullet)
{
  try
  {
    if (!prefix) prefix = "";
    if (!mark) mark = "  ";
    if (!bullet) bullet = "*";

    instance._forEachRegistered (function (o)
    {
      if (o.wrappedJSObject) o = o.wrappedJSObject;
      LOG (prefix + " * " + o.classDescription + o._getIdentity());

      if (o && o._forEachRegistered && typeof(o._forEachRegistered) == "function")
      {
        _dumpTreeInternal (o, prefix+mark, mark);
      }
    });
  }
  catch (e)
  {
    var spec = (instance && instance.classDescription)
               ? (" in " + instance.classDescription)
               : ("");
    LOG ("dumpTree FAILURE: " +e + spec);
  }
}


} catch(e) { ERROR ("owner.jsm: " + EXCEPTIONSTR(e)); throw e; }
