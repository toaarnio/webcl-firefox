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

/** \file WebCL.h
 * WebCL class and component definition.
 * \see IWebCL
 */
#ifndef _WEBCL_H_
#define _WEBCL_H_

#define WEBCL_CLASSNAME "WebCL"
#define WEBCL_CID { 0x8d1a0db2, 0x94af, 0x4333, { 0x9b, 0x55, 0x9c, 0x51, 0x6a, 0x1d, 0xbb, 0xea } }
#define WEBCL_CONTRACTID "@webcl.nokiaresearch.com/WebCL;1"

#include "IWebCL.h" // Generated from IWebCL.idl

#include "WebCLCommon.h"
#include "WebCLObserver.h"

#include "nsIVariant.h"
#include "nsCOMPtr.h"


/** Implements IWebCL interface. */
class WebCL : public IWebCL, public WebCLCommon
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_NSISECURITYCHECKEDCOMPONENT
  NS_DECL_IWEBCL

  WebCL();
  nsresult preferenceChanged (nsISupports* aSubject, const char* aTopic, const PRUnichar* aData);

private:
  virtual ~WebCL();

  nsresult loadLibrary (JSContext *cx);
  nsresult showSecurityPrompt ();

  nsCOMPtr<nsIVariant> mTypes;
  nsCOMPtr<nsIVariant> mVersion;

  // True if the user has explicitly permitted WebCL to be used.
  // The value should only be changed as result of showSecurityPrompt() call or
  // based on preferences
  bool mWebCLUsePermitted;

  // True if the security dialog has not been shown but it should.
  bool mWebCLSecurityDialogNeeded;

  bool mLibLoadFailed;

  nsCOMPtr<WebCLObserver> mObserver;
};

#endif // _WEBCL_H_
