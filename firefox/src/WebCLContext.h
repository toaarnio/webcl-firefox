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

#ifndef _WEBCLCONTEXT_H_
#define _WEBCLCONTEXT_H_

#include "WebCLCommon.h"
#include "IWebCLContext.h" // Generated from IWebCLContext.idl
#include "instance_registry.h"

#include <CL/opencl.h>


#define WEBCL_CONTEXT_CLASSNAME "WebCLContext"
#define WEBCL_CONTEXT_CID { 0x0e5fba5c, 0x091f, 0x40db, { 0xa6, 0xa9, 0x70, 0x0b, 0xa5, 0x03, 0x93, 0xd0 } }
#define WEBCL_CONTEXT_CONTRACTID "@webcl.nokiaresearch.com/WebCLContext;1"

/** Implements IWebCLContext interface. */
class WebCLContext : public IWebCLContext, public WebCLCommon
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_NSISECURITYCHECKEDCOMPONENT
  NS_DECL_IWEBCLCONTEXT

  static nsresult getInstance (cl_context aInternal, WebCLContext** aResultOut,
                               WebCL_LibCLWrapper* aLibWrapper = 0);

  WebCLContext ();
  cl_context getInternal () { return mInternal; }

protected:
  int getTypeForInfoName (int aName);

private:
  static InstanceRegistry<cl_context, WebCLContext*> instanceRegistry;

  ~WebCLContext ();

  cl_context mInternal;
};

#endif //_WEBCLCONTEXT_H_
