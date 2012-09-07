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

#ifndef _WEBCLPLATFORM_H_
#define _WEBCLPLATFORM_H_

#include "WebCLCommon.h"
#include "IWebCLPlatform.h" // Generated from IWebCLPlatform.idl
#include "instance_registry.h"

#include <CL/opencl.h>


#define WEBCL_PLATFORM_CLASSNAME "WebCLPlatform"
#define WEBCL_PLATFORM_CID { 0x6ab8b8cf, 0x4d87, 0x40a0, { 0xaf, 0x8a, 0xcc, 0x0b, 0xf5, 0x25, 0x1f, 0xa3 } }
#define WEBCL_PLATFORM_CONTRACTID "@webcl.nokiaresearch.com/WebCLPlatform;1"

/** Implements IWebCLPlatform interface. */
class WebCLPlatform : public IWebCLPlatform, public WebCLCommon
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_NSISECURITYCHECKEDCOMPONENT
  NS_DECL_IWEBCLPLATFORM

  static nsresult getInstance (cl_platform_id aInternal, WebCLPlatform** aResultOut,
                               WebCL_LibCLWrapper* aLibWrapper = 0);

  WebCLPlatform ();
  cl_platform_id getInternal () { return mInternal; }

protected:
  int getTypeForInfoName (int aName);

private:
  static InstanceRegistry<cl_platform_id, WebCLPlatform*> instanceRegistry;

  ~WebCLPlatform ();

  cl_platform_id mInternal;
};

#endif //_WEBCLPLATFORM_H_
