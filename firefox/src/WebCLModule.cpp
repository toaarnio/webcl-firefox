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

/** \file WebCLModule.cpp
 * WebCL module definition and component registrations.
 * All components belonging to the WebCL module are registered in this file.
 * The registration makes these components available to XPCOM.
 */
#include "mozilla/ModuleUtils.h"

#include "nsICategoryManager.h"
#include "nsIServiceManager.h"

#include "nsIModule.h"
#include "nsIFactory.h"
#include "nsIComponentManager.h"
#include "nsIComponentRegistrar.h"

#include "WebCL.h"


/* Define the XPCOM constructor function for WebCL */
NS_GENERIC_FACTORY_CONSTRUCTOR (WebCL)


/* Define named constant for CID: WEBCL_CID -> kWEBCL_CID.
 * This is necessary since CID defines evaluate to literal but a reference
 * to variable is needed in the following entries.
 */
NS_DEFINE_NAMED_CID (WEBCL_CID);

/* Class ID (CID) array for WebCL module. */
static const mozilla::Module::CIDEntry webclCIDs[] = {
  { &kWEBCL_CID, false, NULL, WebCLConstructor },
  { NULL }
};

/* Contract ID array, this maps CONTRACTIDs to CIDs.*/
static const mozilla::Module::ContractIDEntry webclContracts[] = {
  { WEBCL_CONTRACTID, &kWEBCL_CID },
  { NULL }
};

/* Category entry array. The global "WebCL" instance is made available
 * as a window global variable by setting it to "JavaScript global property"
 * category.
 */
static const mozilla::Module::CategoryEntry webclCategories[] = {
  { "JavaScript global property", "NokiaWebCLInternal", WEBCL_CONTRACTID },
  { NULL }
};

static const mozilla::Module webclModule = {
  mozilla::Module::kVersion,
  webclCIDs,
  webclContracts,
  webclCategories
};

NSMODULE_DEFN (WebCLModule) = &webclModule;
