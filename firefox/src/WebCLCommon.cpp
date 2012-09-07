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

#include "WebCLCommon.h"
#include "WebCL_clwrapper.h"

// Prevent error C2371 on MS Visual C++ 10 compiler.
#if _MSC_VER >= 1000
// Let jsapi know that it doesn't need to provide C99 exact types itself.
# define JS_HAVE_STDINT_H 1
#endif


// WebCLCommon

WebCLCommon::WebCLCommon ()
  : mWrapper(0)
{
  D_METHOD_START;
}


WebCLCommon::~WebCLCommon ()
{
  D_METHOD_START;
}


void WebCLCommon::setWrapper (WebCL_LibCLWrapper* aWrapper)
{
  mWrapper = aWrapper;
}


WebCL_LibCLWrapper* WebCLCommon::getWrapper ()
{
  return mWrapper;
}
