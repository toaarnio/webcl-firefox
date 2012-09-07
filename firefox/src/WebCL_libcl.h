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

#ifndef _WEBCL_LIBCL_H_
#define _WEBCL_LIBCL_H_

#include "nsISupports.h"
#include "nsStringAPI.h"

struct WebCL_CLSymbols;
class PRLibrary;

class WebCL_LibCL : public nsISupports
{
public:
  NS_DECL_ISUPPORTS
  virtual ~WebCL_LibCL ();

  char const* const libName () const;

  static bool load (char const* aLibPath, WebCL_LibCL** aInstanceOut,
                    nsCString* aErrorMessageOut = 0);

  WebCL_CLSymbols* symbols;

private:
  static void unload (WebCL_LibCL* aLib);

  WebCL_LibCL ();

  char const* m_libName;
  PRLibrary* m_libHandle;
};


#endif //_WEBCL_LIBCL_H_
