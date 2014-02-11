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
  _registerObject: function (obj, key)
  {
    TRACE (this, "_registerObject", arguments);

    try
    {
      if (!obj) return false;

      let originalObject = obj;

      if (obj.wrappedJSObject) obj = obj.wrappedJSObject;

      if (!(obj instanceof Base))
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

      if (obj._owner)
      {
        obj._owner._unregisterObject (key);
      }

      DEBUG (this.classDescription+"._registerObject: Registering object "+
             obj.classDescription+", key=" + key);

      this._objectRegistry[key] = originalObject;

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

        if (!(obj instanceof Base))
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

      DEBUG (this.classDescription+"._unregisterObject: Unregistering object "+
             target.classDescription+", key=" + key);

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
      //DEBUG (this.classDescription + "._findObjectByKey: Invalid key \"" + key + "\"");
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
    let keys = Object.keys (this._objectRegistry);
    let values = [];
    for (let i = 0; i < keys.length; ++i)
    {
      if (this._objectRegistry.hasOwnProperty(keys[i]))
      {
        values.push (this._objectRegistry[keys[i]]);
      }
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



  dumpTree: function (prefix, filler, bullet, maxRecursion)
  {
    if (!prefix) prefix = "";
    if (!filler) filler = "  ";
    if (!bullet) bullet = " * ";
    if (maxRecursion === undefined) maxRecursion = 7;

    var identity = "";
    try {
      var identity = "  (" + this.wrappedJSObject._getIdentity() + ")";
    } catch(e){ identity = ""; }
    LOG (prefix + bullet + this.classDescription + identity);

    _dumpTreeInternal (this, prefix+filler, filler, bullet, maxRecursion);
  }

};


function _dumpTreeInternal (instance, prefix, filler, bullet, maxRecursion)
{
  try
  {
    if (!prefix) prefix = "";
    if (!filler) filler = "  ";
    if (!bullet) bullet = " * ";
    if (maxRecursion === undefined) maxRecursion = 10;

    if (maxRecursion == 0)
    {
      LOG (this.classDescription+".dumpTree: Maximum recursion level reached!");
      return;
    }

    instance._forEachRegistered (function (o)
    {
      if (o.wrappedJSObject) o = o.wrappedJSObject;
      LOG (prefix + bullet + o.classDescription +
           "  (" + o._getIdentity() + ")");

      if (o && o._forEachRegistered && typeof(o._forEachRegistered) == "function")
      {
        _dumpTreeInternal (o, prefix+filler, filler, bullet, maxRecursion-1);
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
