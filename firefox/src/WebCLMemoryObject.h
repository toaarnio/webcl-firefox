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

#ifndef _WEBCL_MEMORYOBJECT_H_
#define _WEBCL_MEMORYOBJECT_H_

#include "WebCLCommon.h"
#include "IWebCLMemoryObject.h" // Generated from IWebCLMemoryObject.idl
#include "instance_registry.h"

#include <CL/opencl.h>


#define WEBCL_MEMORYOBJECT_CLASSNAME "WebCLMemoryObject"
#define WEBCL_MEMORYOBJECT_CID { 0xe677e482, 0x49e5, 0x40de, { 0xba, 0x4f, 0x0e, 0x71, 0xf3, 0x01, 0x28, 0x6b } }
#define WEBCL_MEMORYOBJECT_CONTRACTID "@webcl.nokiaresearch.com/WebCLMemoryObject;1"

/** Implements IWebCLMemoryObject interface. */
class WebCLMemoryObject : public IWebCLMemoryObject, public WebCLCommon
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_NSISECURITYCHECKEDCOMPONENT
  NS_DECL_IWEBCLMEMORYOBJECT

  static nsresult getInstance (cl_mem aInternal, WebCLMemoryObject** aResultOut,
                               WebCL_LibCLWrapper* aLibWrapper = 0);

  WebCLMemoryObject ();
  cl_mem getInternal () { return mInternal; }

protected:
  int getTypeForInfoName (int aName);

private:
  static InstanceRegistry<cl_mem, WebCLMemoryObject*> instanceRegistry;

  ~WebCLMemoryObject ();

  cl_mem mInternal;
};

#endif // _WEBCL_MEMORYOBJECT_H_
