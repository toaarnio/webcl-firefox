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

#ifndef _WEBCLKERNEL_H_
#define _WEBCLKERNEL_H_

#include "WebCLCommon.h"
#include "IWebCLKernel.h" // Generated from IWebCLKernel.idl
#include "instance_registry.h"

#include <CL/opencl.h>


#define WEBCL_KERNEL_CLASSNAME "WebCLKernel"
#define WEBCL_KERNEL_CID { 0x5d1be1d7, 0xaad2, 0x4eb3, { 0x91, 0x8b, 0xe9, 0x55, 0x10, 0x79, 0xd6, 0x34 } }
#define WEBCL_KERNEL_CONTRACTID "@webcl.nokiaresearch.com/WebCLKernel;1"

/** Implements IWebCLKernel interface. */
class WebCLKernel : public IWebCLKernel, public WebCLCommon
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_NSISECURITYCHECKEDCOMPONENT
  NS_DECL_IWEBCLKERNEL

  static nsresult getInstance (cl_kernel aInternal, WebCLKernel** aResultOut,
                               WebCL_LibCLWrapper* aLibWrapper = 0);

  WebCLKernel ();
  cl_kernel getInternal () { return mInternal; }

protected:
  int getTypeForInfoName (int aName);

private:
  static InstanceRegistry<cl_kernel, WebCLKernel*> instanceRegistry;

  ~WebCLKernel ();

  cl_kernel mInternal;
};

#endif //_WEBCLKERNEL_H_
