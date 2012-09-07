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

#ifndef WEBCLOBSERVER_H
#define WEBCLOBSERVER_H

#include <nsIObserver.h>

class WebCL;

class WebCLObserver : public nsIObserver
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_NSIOBSERVER

  WebCLObserver ();

  void setWebCL (WebCL* aWebCL);

private:
  virtual ~WebCLObserver ();
  WebCL* mWebCL;
};

#endif // WEBCLOBSERVER_H
