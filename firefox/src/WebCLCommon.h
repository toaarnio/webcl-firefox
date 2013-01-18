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

#ifndef _WEBCLCOMMON_H_
#define _WEBCLCOMMON_H_

#include "WebCLLogger.h"

#include "xpcom-config.h"
#include "nsCRT.h"  //NS_strdup
#include "nsCOMPtr.h"


// Version number fallbacks. Actual values should come from Makefiles but if
// that is not the case we can set some "legal" values here.
#ifndef VERSION_MAJOR
#  define VERSION_MAJOR 0
#endif
#ifndef VERSION_MINOR
#  define VERSION_MINOR 0
#endif


/** \fn VALIDATE_ARG_WITH_ERROR
 * Argument validation macro.
 * This macro simplifies function argument validation. If \c test
 * fails the function will return with evaluated value of the
 * variadic argument ... as the return value.
 * \param argName Name of the argument being tested (without quotes!)
 * \param test The actual test, e.g. aNumber > 3 .
 * \param statusPtr A pointer to which the error code is stored on failure,
 *  or null value to disable, e.g. an out parameter.
 * \param errNum The error code that is written through statusPtr on failure.
 * \param ... The function return value.
 */
#ifdef WIN32
# define VALIDATE_ARG_WITH_ERROR(argName, test, statusPtr, errNum, ...) do{ \
  if ( !(test)) { \
    if (statusPtr) *statusPtr = errNum; \
    D_LOG (LOG_LEVEL_ERROR, "Invalid argument " #argName ": failed test \"" #test "\"."); \
    return (__VA_ARGS__); \
  } \
}while(0)
#else
# define VALIDATE_ARG_WITH_ERROR(argName, test, statusPtr, errNum, rv...) do{ \
  if ( !(test)) { \
    if (statusPtr) *statusPtr = errNum; \
    D_LOG (LOG_LEVEL_ERROR, "Invalid argument " #argName ": failed test \"" #test "\"."); \
    return (rv); \
  } \
}while(0)
#endif


/** \fn VALIDATE_ARG
 * Argument validation macro.
 * This macro simplifies function argument validation. If \c test
 * fails the function will return with evaluated value of the
 * variadic argument ... as the return value.
 * \param argName Name of the argument being tested (without quotes!)
 * \param test The actual test, e.g. aNumber > 3 .
 * \param statusPtr If non-null, error code CL_INVALID_ARG_VALUE is written
 *  through this pointer.
 * \param ... The function return value.
 */
#ifdef WIN32
# define VALIDATE_ARG(argName, test, statusPtr, ...) \
  VALIDATE_ARG_WITH_ERROR (argName, test, statusPtr, CL_INVALID_ARG_VALUE, __VA_ARGS__)
#else
# define VALIDATE_ARG(argName, test, statusPtr, rv...) \
  VALIDATE_ARG_WITH_ERROR (argName, test, statusPtr, CL_INVALID_ARG_VALUE, rv)
#endif


/** \fn VALIDATE_ARG_POINTER_WITH_ERROR
 * Pointer argument validation macro.
 * This macro simplifies function argument validation. If \c ptr
 * equals to null the function will return with evaluated value of the
 * variadic argument ... as the return value.
 * \param ptr The argument being tested.
 * \param statusPtr A pointer to which the error code is stored on failure,
 *  or null value to disable, e.g. an out parameter.
 * \param errNum The error code that is written through statusPtr on failure.
 * \param ... The function return value.
 */
#ifdef WIN32
# define VALIDATE_ARG_POINTER_WITH_ERROR(ptr, statusPtr, errNum, ...) do{ \
  if (ptr == 0) { \
    void* tmp = statusPtr; /* Avoid gcc warning.. */ \
    if (tmp) *statusPtr = errNum; \
    D_LOG (LOG_LEVEL_ERROR, "Invalid argument " #ptr ": null pointer."); \
    return (__VA_ARGS__); \
  } \
}while(0)
#else
# define VALIDATE_ARG_POINTER_WITH_ERROR(ptr, statusPtr, errNum, rv...) do{ \
  if (ptr == 0) { \
    void* tmp = statusPtr; /* Avoid gcc warning.. */ \
    if (tmp) *statusPtr = errNum; \
    D_LOG (LOG_LEVEL_ERROR, "Invalid argument " #ptr ": null pointer."); \
    return (rv); \
  } \
}while(0)
#endif


/** \fn VALIDATE_ARG_POINTER
 * Pointer argument validation macro.
 * This macro simplifies function argument validation. If \c ptr
 * equals to null the function will return with evaluated value of the
 * variadic argument ... as the return value.
 * \param ptr The argument being tested.
 * \param statusPtr If non-null, error code CL_INVALID_ARG_VALUE is written
 *  through this pointer.
 * \param ... The function return value.
 */
#ifdef WIN32
# define VALIDATE_ARG_POINTER(ptr, statusPtr, ...) \
  VALIDATE_ARG_POINTER_WITH_ERROR (ptr, statusPtr, CL_INVALID_ARG_VALUE, __VA_ARGS__)
#else
# define VALIDATE_ARG_POINTER(ptr, statusPtr, rv...) \
  VALIDATE_ARG_POINTER_WITH_ERROR (ptr, statusPtr, CL_INVALID_ARG_VALUE, rv)
#endif


#define ENSURE_LIB_WRAPPER_SUCCESS(lib) do{ \
  if (lib->status() != WebCL_LibCLWrapper::SUCCESS) { \
    /* TODO: report detailed error to user */ \
    return NS_ERROR_NOT_IMPLEMENTED; \
  } }while(0)


#define ENSURE_CL_OP_SUCCESS(err) do{ \
  if (CL_FAILED (err)) { \
    WebCL_reportJSError (cx, "%s Failed with error %d.", __FUNCTION__, err); \
    return WEBCL_XPCOM_ERROR; /* NS_ERROR_FAILURE; */ \
  } }while(0)


//==============================================================================

class WebCL_LibCLWrapper;

class WebCLCommon {
public:
  WebCLCommon ();
  virtual ~WebCLCommon ();

  void setInternal (void* aObject);
  void setWrapper (WebCL_LibCLWrapper* aWrapper);
  WebCL_LibCLWrapper* getWrapper ();

protected:
  nsCOMPtr<WebCL_LibCLWrapper> mWrapper;

private:
  // Prevent copying and assignment
  WebCLCommon (WebCLCommon const&);
  WebCLCommon& operator= (WebCLCommon const&);
};



//==============================================================================



#define C_COM_SECURITY_ALL_ACCESS  "allAccess"
#define C_COM_SECURITY_NO_ACCESS   "noAccess"


// These macros are used for implementing the nsSecurityCheckedComponent interface
// that is shared by all WebCL classes
#define WEBCL_SECURITY_CHECKED_CANCREATEWRAPPER_IMPL(cname) \
NS_IMETHODIMP \
cname::CanCreateWrapper (const nsIID* aIID, \
char** _retval) { \
D_METHOD_START; \
*_retval = NS_strdup (C_COM_SECURITY_ALL_ACCESS); \
return *_retval ? NS_OK : NS_ERROR_OUT_OF_MEMORY; \
}

#define WEBCL_SECURITY_CHECKED_CANCALLMETHOD_IMPL(cname) \
NS_IMETHODIMP \
cname::CanCallMethod (const nsIID* aIID, const PRUnichar* aMethodName, \
char** _retval) { \
D_METHOD_START; \
NS_ENSURE_TRUE (_retval, NS_ERROR_NULL_POINTER); \
*_retval = NS_strdup (C_COM_SECURITY_ALL_ACCESS); \
return *_retval ? NS_OK : NS_ERROR_OUT_OF_MEMORY; \
}

#define WEBCL_SECURITY_CHECKED_CANGETPROPERTY_IMPL(cname) \
NS_IMETHODIMP \
cname::CanGetProperty (const nsIID* aIID, const PRUnichar* aPropertyName, \
char** _retval) { \
D_METHOD_START; \
NS_ENSURE_TRUE (_retval, NS_ERROR_NULL_POINTER); \
*_retval = NS_strdup (C_COM_SECURITY_ALL_ACCESS); \
return *_retval ? NS_OK : NS_ERROR_OUT_OF_MEMORY; \
}

#define WEBCL_SECURITY_CHECKED_CANSETPROPERTY_IMPL(cname) \
NS_IMETHODIMP \
cname::CanSetProperty (const nsIID* aIID, const PRUnichar* aPropertyName, \
char** _retval) { \
D_METHOD_START; \
NS_ENSURE_TRUE (_retval, NS_ERROR_NULL_POINTER); \
*_retval = NS_strdup (C_COM_SECURITY_NO_ACCESS); \
return *_retval ? NS_OK : NS_ERROR_OUT_OF_MEMORY; \
}


#define WEBCL_SECURITY_CHECKED_IMPL(cname) \
WEBCL_SECURITY_CHECKED_CANCREATEWRAPPER_IMPL (cname) \
WEBCL_SECURITY_CHECKED_CANCALLMETHOD_IMPL (cname) \
WEBCL_SECURITY_CHECKED_CANGETPROPERTY_IMPL (cname) \
WEBCL_SECURITY_CHECKED_CANSETPROPERTY_IMPL (cname)


#endif /* _WEBCLCOMMON_H_ */
