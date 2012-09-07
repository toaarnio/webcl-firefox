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

#ifndef _WEBCLDEVICE_H_
#define _WEBCLDEVICE_H_

#include "WebCLCommon.h"
#include "IWebCLDevice.h" // Generated from IWebCLDevice.idl
#include "instance_registry.h"

#include <CL/opencl.h>


#define WEBCL_DEVICE_CLASSNAME "WebCLDevice"
#define WEBCL_DEVICE_CID { 0xf5352722, 0x9a35, 0x405b, { 0x95, 0xae, 0x54, 0xd5, 0xb4, 0x99, 0x55, 0x76 } }
#define WEBCL_DEVICE_CONTRACTID "@webcl.nokiaresearch.com/WebCLDevice;1"

/** Implements IWebCLDevice interface. */
class WebCLDevice : public IWebCLDevice, public WebCLCommon
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_NSISECURITYCHECKEDCOMPONENT
  NS_DECL_IWEBCLDEVICE

  static nsresult getInstance (cl_device_id aInternal, WebCLDevice** aResultOut,
                               WebCL_LibCLWrapper* aLibWrapper = 0);

  WebCLDevice ();
  cl_device_id getInternal () { return mInternal; }

protected:
  int getTypeForInfoName (int aName);

private:
  static InstanceRegistry<cl_device_id, WebCLDevice*> instanceRegistry;

  ~WebCLDevice ();

  cl_device_id mInternal;
};

#endif //_WEBCLDEVICE_H_
