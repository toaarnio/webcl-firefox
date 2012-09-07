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

#ifndef _WEBCLCOMMANDQUEUE_H_
#define _WEBCLCOMMANDQUEUE_H_

#include "WebCLCommon.h"
#include "IWebCLCommandQueue.h" // Generated from IWebCLCommandQueue.idl
#include "instance_registry.h"

#include <CL/opencl.h>


#define WEBCL_COMMANDQUEUE_CLASSNAME "WebCLCommandQueue"
#define WEBCL_COMMANDQUEUE_CID { 0x751b06c0, 0xcac3, 0x4123, { 0x87, 0xae, 0x2b, 0x8c, 0x22, 0x83, 0x2d, 0x52 } }
#define WEBCL_COMMANDQUEUE_CONTRACTID "@webcl.nokiaresearch.com/WebCLCommandQueue;1"

/** Implements IWebCLCommandQueue interface. */
class WebCLCommandQueue : public IWebCLCommandQueue, public WebCLCommon
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_NSISECURITYCHECKEDCOMPONENT
  NS_DECL_IWEBCLCOMMANDQUEUE

  static nsresult getInstance (cl_command_queue aInternal, WebCLCommandQueue** aResultOut,
                               WebCL_LibCLWrapper* aLibWrapper = 0);

  WebCLCommandQueue ();
  cl_command_queue getInternal () { return mInternal; }

protected:
  int getTypeForInfoName (int aName);

private:
  static InstanceRegistry<cl_command_queue, WebCLCommandQueue*> instanceRegistry;

  ~WebCLCommandQueue ();

  cl_command_queue mInternal;
};

#endif //_WEBCLCOMMANDQUEUE_H_
