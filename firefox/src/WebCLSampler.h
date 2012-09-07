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

#ifndef _WEBCLSAMPLER_H_
#define _WEBCLSAMPLER_H_

#include "WebCLCommon.h"
#include "IWebCLSampler.h" // Generated from IWebCLSampler.idl
#include "instance_registry.h"

#include <CL/opencl.h>


#define WEBCL_SAMPLER_CLASSNAME "WebCLSampler"
#define WEBCL_SAMPLER_CID { 0xdc9b25aa, 0x2bdc, 0x4efd, { 0xb2, 0x95, 0xb4, 0x50, 0xc7, 0x5d, 0x25, 0x2c } }
#define WEBCL_SAMPLER_CONTRACTID "@webcl.nokiaresearch.com/WebCLSampler;1"

/** Implements IWebCLSampler interface. */
class WebCLSampler : public IWebCLSampler, public WebCLCommon
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_NSISECURITYCHECKEDCOMPONENT
  NS_DECL_IWEBCLSAMPLER

  static nsresult getInstance (cl_sampler aInternal, WebCLSampler** aResultOut,
                               WebCL_LibCLWrapper* aLibWrapper = 0);

  WebCLSampler ();
  cl_sampler getInternal () { return mInternal; }

protected:
  int getTypeForInfoName (int aName);

private:
  static InstanceRegistry<cl_sampler, WebCLSampler*> instanceRegistry;

  ~WebCLSampler ();

  cl_sampler mInternal;
};

#endif //_WEBCLSAMPLER_H_
