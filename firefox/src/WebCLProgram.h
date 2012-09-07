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

#ifndef _WEBCLPROGRAM_H_
#define _WEBCLPROGRAM_H_

#include "WebCLCommon.h"
#include "IWebCLProgram.h" // Generated from IWebCLProgram.idl
#include "instance_registry.h"

#include <CL/opencl.h>


#define WEBCL_PROGRAM_CLASSNAME "WebCLProgram"
#define WEBCL_PROGRAM_CID { 0x74d49a1e, 0x31e0, 0x41d5, { 0x8e, 0x98, 0x89, 0x80, 0xa0, 0x77, 0xfc, 0xb2 } }
#define WEBCL_PROGRAM_CONTRACTID "@webcl.nokiaresearch.com/WebCLProgram;1"

/** Implements IWebCLProgram interface. */
class WebCLProgram : public IWebCLProgram, public WebCLCommon
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_NSISECURITYCHECKEDCOMPONENT
  NS_DECL_IWEBCLPROGRAM

  static nsresult getInstance (cl_program aInternal, WebCLProgram** aResultOut,
                               WebCL_LibCLWrapper* aLibWrapper = 0);

  WebCLProgram ();
  cl_program getInternal () { return mInternal; }

protected:
  int getTypeForInfoName (int aName);

private:
  static InstanceRegistry<cl_program, WebCLProgram*> instanceRegistry;

  ~WebCLProgram ();

  cl_program mInternal;
};

#endif //_WEBCLPROGRAM_H_
