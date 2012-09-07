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

#ifndef _WEBCLEVENT_H_
#define _WEBCLEVENT_H_

#include "WebCLCommon.h"
#include "IWebCLEvent.h" // Generated from IWebCLEvent.idl
#include "instance_registry.h"

#include <CL/opencl.h>


#define WEBCL_EVENT_CLASSNAME "WebCLEvent"
#define WEBCL_EVENT_CID { 0xcf7372e6, 0xf2ec, 0x467d, { 0x99, 0xdc, 0x9e, 0xeb, 0x75, 0x6b, 0xc3, 0xe3 } }
#define WEBCL_EVENT_CONTRACTID "@webcl.nokiaresearch.com/WebCLEvent;1"

/** Implements IWebCLEvent interface. */
class WebCLEvent : public IWebCLEvent, public WebCLCommon
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_NSISECURITYCHECKEDCOMPONENT
  NS_DECL_IWEBCLEVENT

  static nsresult getInstance (cl_event aInternal, WebCLEvent** aResultOut,
                               WebCL_LibCLWrapper* aLibWrapper = 0);

  WebCLEvent ();
  cl_event getInternal () { return mInternal; }

protected:
  int getTypeForInfoName (int aName);

private:
  static InstanceRegistry<cl_event, WebCLEvent*> instanceRegistry;

  ~WebCLEvent ();

  cl_event mInternal;
};

#endif //_WEBCLEVENT_H_
