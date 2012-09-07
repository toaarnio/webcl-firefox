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

/** \file instance_registry.h
 * InstanceRegistry class definition.
 */

#ifndef _INSTANCE_REGISTRY_H_
#define _INSTANCE_REGISTRY_H_

#include <map>
#include "WebCLLogger.h"


/** This template class provides an instance registry for WebCL classes.
 * Many WebCL classes contain some internal information that provides the actual
 * identity of the instance in the form of a reference to some external entity.
 * In certain occasions it is necessary to find a WebCL instance by the bare
 * external identity reference that may come from e.g. an external library.
 */
template <class Tid, class Tinstance>
class InstanceRegistry {
  public:
    InstanceRegistry () : mInstances () { }
    ~InstanceRegistry () { }

    bool add (Tid aId, Tinstance aInstance)
    {
      D_LOG (LOG_LEVEL_DEBUG, "Added instance mapping %p:%p", aId, aInstance);
      return mInstances.insert (std::make_pair (aId, aInstance)).second;
    }

    bool remove (Tid aId)
    {
      D_LOG (LOG_LEVEL_DEBUG, "Removed instance mapping %p", aId);
      return mInstances.erase (aId) != 0;
    }

    bool findById (Tid aId, Tinstance* aInstance)
    {
      if (!aInstance)
        return false;
      typename std::map<Tid, Tinstance>::iterator i = mInstances.find (aId);
      if (i != mInstances.end ())
      {
        *aInstance = i->second;
        return true;
      }
      return false;
    }

  private:
    /// Copying is not allowed.
    InstanceRegistry (InstanceRegistry const&);
    /// Assignment is not allowed.
    InstanceRegistry& operator= (InstanceRegistry const&);

    std::map <Tid, Tinstance> mInstances;
};

#endif // _INSTANCE_REGISTRY_H_
