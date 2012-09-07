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
#include "WebCLPlatform.h"
#include "WebCLDevice.h"
#include "WebCLMemoryObject.h"
#include "WebCLKernel.h"
#include "WebCLProgram.h"
#include "WebCLEvent.h"
#include "WebCLCommandQueue.h"
#include "WebCLContext.h"
#include "WebCLSampler.h"


/* Define the XPCOM constructor functions for each WebCL class. */
NS_GENERIC_FACTORY_CONSTRUCTOR (WebCL)
NS_GENERIC_FACTORY_CONSTRUCTOR (WebCLPlatform)
NS_GENERIC_FACTORY_CONSTRUCTOR (WebCLDevice)
NS_GENERIC_FACTORY_CONSTRUCTOR (WebCLMemoryObject)
NS_GENERIC_FACTORY_CONSTRUCTOR (WebCLKernel)
NS_GENERIC_FACTORY_CONSTRUCTOR (WebCLProgram)
NS_GENERIC_FACTORY_CONSTRUCTOR (WebCLEvent)
NS_GENERIC_FACTORY_CONSTRUCTOR (WebCLCommandQueue)
NS_GENERIC_FACTORY_CONSTRUCTOR (WebCLContext)
NS_GENERIC_FACTORY_CONSTRUCTOR (WebCLSampler)

#define GECKO_200_CID_ENTRY(componentPrefix,compConstructorPrefix) \
  { &k##componentPrefix##_CID, false, NULL, compConstructorPrefix##Constructor }

#define GECKO_200_CONTRACTID_ENTRY(componentPrefix) \
  { componentPrefix##_CONTRACTID, &k##componentPrefix##_CID }


/* Define named constants out of CID defines: WEBCL_CID -> kWEBCL_CID.
 * This is necessary since CID defines evaluate to literal but a reference
 * to variable is needed in the following entries.
 */
NS_DEFINE_NAMED_CID (WEBCL_CID);
NS_DEFINE_NAMED_CID (WEBCL_PLATFORM_CID);
NS_DEFINE_NAMED_CID (WEBCL_DEVICE_CID);
NS_DEFINE_NAMED_CID (WEBCL_MEMORYOBJECT_CID);
NS_DEFINE_NAMED_CID (WEBCL_KERNEL_CID);
NS_DEFINE_NAMED_CID (WEBCL_PROGRAM_CID);
NS_DEFINE_NAMED_CID (WEBCL_EVENT_CID);
NS_DEFINE_NAMED_CID (WEBCL_COMMANDQUEUE_CID);
NS_DEFINE_NAMED_CID (WEBCL_CONTEXT_CID);
NS_DEFINE_NAMED_CID (WEBCL_SAMPLER_CID);

/* Class ID (CID) array for WebCL module. */
static const mozilla::Module::CIDEntry webclCIDs[] = {
  GECKO_200_CID_ENTRY (WEBCL, WebCL),
  GECKO_200_CID_ENTRY (WEBCL_PLATFORM, WebCLPlatform),
  GECKO_200_CID_ENTRY (WEBCL_DEVICE, WebCLDevice),
  GECKO_200_CID_ENTRY (WEBCL_MEMORYOBJECT, WebCLMemoryObject),
  GECKO_200_CID_ENTRY (WEBCL_KERNEL, WebCLKernel),
  GECKO_200_CID_ENTRY (WEBCL_PROGRAM, WebCLProgram),
  GECKO_200_CID_ENTRY (WEBCL_EVENT, WebCLEvent),
  GECKO_200_CID_ENTRY (WEBCL_COMMANDQUEUE, WebCLCommandQueue),
  GECKO_200_CID_ENTRY (WEBCL_CONTEXT, WebCLContext),
  GECKO_200_CID_ENTRY (WEBCL_SAMPLER, WebCLSampler),
  { NULL }
};

/* Contract ID array, this maps CONTRACTIDs to CIDs.*/
static const mozilla::Module::ContractIDEntry webclContracts[] = {
  GECKO_200_CONTRACTID_ENTRY (WEBCL),
  GECKO_200_CONTRACTID_ENTRY (WEBCL_PLATFORM),
  GECKO_200_CONTRACTID_ENTRY (WEBCL_DEVICE),
  GECKO_200_CONTRACTID_ENTRY (WEBCL_MEMORYOBJECT),
  GECKO_200_CONTRACTID_ENTRY (WEBCL_KERNEL),
  GECKO_200_CONTRACTID_ENTRY (WEBCL_PROGRAM),
  GECKO_200_CONTRACTID_ENTRY (WEBCL_EVENT),
  GECKO_200_CONTRACTID_ENTRY (WEBCL_COMMANDQUEUE),
  GECKO_200_CONTRACTID_ENTRY (WEBCL_CONTEXT),
  GECKO_200_CONTRACTID_ENTRY (WEBCL_SAMPLER),
  { NULL }
};

/* Category entry array. The global "WebCL" instance is made available
 * as a window global variable by setting it to "JavaScript global property"
 * category.
 */
static const mozilla::Module::CategoryEntry webclCategories[] = {
  { "JavaScript global property", "WebCL", WEBCL_CONTRACTID },
  { NULL }
};

static const mozilla::Module webclModule = {
  mozilla::Module::kVersion,
  webclCIDs,
  webclContracts,
  webclCategories
};

NSMODULE_DEFN (WebCLModule) = &webclModule;
