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

var EXPORTED_SYMBOLS = [ "ReleaseManager" ];


try {

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var Exception = Components.Exception;


Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");


function ReleaseManager ()
{
  TRACE (this, "ReleaseManager", arguments);


  this._pendingReleaseInternals = [];
  this._numWorkersRunning = 0;

  this.__defineSetter__("numWorkersRunning", function (v)
  {
    var oldV = this._numWorkersRunning;
    this._numWorkersRunning = v;

    if (this._numWorkersRunning < 0)
    {
      ERROR ("WARNING: ReleaseManager.numWorkersRunning value is less than zero: " + this._numWorkersRunning + ".");
      this._numWorkersRunning = 0;
    }

    if (this._numWorkersRunning == 0 && oldV > 0)
    {
      this._runReleaseCycle ();
    }
  });

  this.__defineGetter__("numWorkersRunning", function ()
  {
    return this._numWorkersRunning;
  });
}

ReleaseManager.prototype.classDescription = "ReleaseManager";



// Reset the object
// withoutReleaseCycle: (Boolean) Don't run pending release cycle (default=false).
ReleaseManager.prototype.reset = function (withoutReleaseCycle)
{
  TRACE (this, "reset", arguments);

  this._numWorkersRunning = 0;

  // Clear pending release internals
  if (withoutReleaseCycle)
  {
    // Skip release cycle, just drop all the pending internals.
    this._pendingReleaseInternals.splice (0);
  }
  else
  {
    // Run the release cycle, also clears the list.
    this._runReleaseCycle ();
  }
}


// Add an internal object to release list. The object must be non-null and
// must have a function property named 'release'.
ReleaseManager.prototype.appendPendingRelease = function (internal)
{
  TRACE (this, "appendPendingRelease", arguments);
  this._pendingReleaseInternals.push (internal);
};


// Internal function
ReleaseManager.prototype._runReleaseCycle = function ()
{
  TRACE (this, "_runReleaseCycle", arguments);

  // Changes to list during the release cycle are not expected but we'll
  // take a copy to be safe anyway.
  var list = this._pendingReleaseInternals.slice (0);

  // Clear the pending release internals list.
  this._pendingReleaseInternals.splice (0);

  //list.forEach(function (cur)
  for (let i = 0; i < list.length; ++i)
  {
    try
    {
      let cur = list[i];

      if (typeof(cur) == "object" && cur != null && typeof(cur.release) == "function")
      {
        cur.release ();
      }
      else
      {
        ERROR ("ReleaseManager._runReleaseCycle: Invalid internal object at index "+i+": "+typeof(cur)+".");
      }
    }
    catch (e)
    {
      ERROR("ReleaseManager._runReleaseCycle: "+e+"\n"+e.stack);
    }
  }
  //);
};


} catch(e) { ERROR ("releasemanager.jsm:\n" + String(e) + ":\n" + e.stack); throw e; }
