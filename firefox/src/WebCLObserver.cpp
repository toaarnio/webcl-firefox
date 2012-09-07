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

#include "WebCLObserver.h"

#include "WebCL.h"
#include "WebCLLogger.h"

#include <nsIVariant.h>
#include <nsIObserver.h>

NS_IMPL_ISUPPORTS1(WebCLObserver, nsIObserver)


WebCLObserver::WebCLObserver ()
  : nsIObserver(), mWebCL(0)
{
  D_METHOD_START;
}

WebCLObserver::~WebCLObserver ()
{
  D_METHOD_START;
}

void WebCLObserver::setWebCL (WebCL* aWebCL)
{
  mWebCL = aWebCL;
}

NS_IMETHODIMP WebCLObserver::Observe(nsISupports* aSubject, const char* aTopic, const PRUnichar* aData)
{
  D_LOG (LOG_LEVEL_DEBUG, "topic=%s%s", aTopic, mWebCL?"":"  WEBCL NOT SET!");

  return (mWebCL ? (mWebCL->preferenceChanged (aSubject, aTopic, aData)) : NS_ERROR_FAILURE);
}

