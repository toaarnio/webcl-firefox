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

#include "WebCL_libcl.h"

#include "WebCLCommon.h"

#include <cstdlib>
#include <cstring>
#include <cctype>
#include <new>

#include <prlink.h>
#include <prmem.h>
#include <prerror.h>

#include <nsCOMPtr.h>

#include "WebCL_clsymbols.h"


static bool loadCLLibrary (WebCL_LibCL* instance, PRLibrary* libHndl);


NS_IMPL_THREADSAFE_ISUPPORTS0(WebCL_LibCL)


WebCL_LibCL::WebCL_LibCL ()
  : nsISupports(),
    symbols(new WebCL_CLSymbols),
    m_libName(0),
    m_libHandle(0)
{
  D_METHOD_START;

  memset ((void*)symbols, 0, sizeof(WebCL_CLSymbols));
}


WebCL_LibCL::~WebCL_LibCL ()
{
  D_METHOD_START;

  if (m_libHandle)
    unload (this);

  if (m_libName)
    delete (m_libName);

  if (symbols)
    delete (symbols);
}

char const* const WebCL_LibCL::libName () const
{
  return m_libName;
}

// Release the retun value with PR_FREEIF
static char* getPRErrorText ()
{
  PRInt32 errTextLen = PR_GetErrorTextLength ();
  char *s = (char*)PR_MALLOC (errTextLen + 1);
  if (s)
  {
    s[0] = '\0';
    (void)PR_GetErrorText (s);
  }

  return s;
}

/* static */
bool WebCL_LibCL::load (char const* aLibName, WebCL_LibCL** aInstanceOut,
                        nsCString* aErrorMessageOut)
{
  D_METHOD_START;

  if (!aLibName)
  {
    D_LOG (LOG_LEVEL_ERROR, "Invalid arguments: aLibName = NULL.");
    if (aErrorMessageOut)
      *aErrorMessageOut = "Invalid library name: NULL";
    return false;
  }

  // Front strip lib name
  size_t libPathLen = strlen (aLibName);
  char const* cleanedLibName = aLibName;
  while (cleanedLibName < aLibName + libPathLen && isspace(*cleanedLibName))
    ++cleanedLibName;

  if (cleanedLibName[0] == '\0')
  {
    // Empty name now allowed here, handle default library on a higher level
    D_LOG (LOG_LEVEL_ERROR, "Invalid arguments: no library name given.");
    if (aErrorMessageOut)
      *aErrorMessageOut = "Invalid library name: \"\"";
    return false;
  }
    
  char* systemName = 0;
  #ifdef __APPLE__
    systemName = "/System/Library/Frameworks/OpenCL.framework/OpenCL";
  #else
    systemName = PR_GetLibraryName (NULL, cleanedLibName);
  #endif
  D_LOG (LOG_LEVEL_DEBUG, "system name for library %s: %s", cleanedLibName, systemName);

  nsCOMPtr<WebCL_LibCL> instance (new (std::nothrow) WebCL_LibCL);
  instance->m_libName = strdup (systemName);

  PRLibrary* libHndl = PR_LoadLibrary (systemName);

  #ifndef __APPLE__
    PR_FreeLibraryName (systemName);
  #endif
    
  char* errText = 0;
    
  if (!libHndl)
  {
    // Perhaps PR_GetLibraryName failed?
    errText = getPRErrorText ();
    D_LOG (LOG_LEVEL_ERROR, "Failed to load library by system name %s: %s",
           instance->m_libName, errText);
    D_LOG (LOG_LEVEL_DEBUG, " (prerr: %d oserr: %d)", PR_GetError(), PR_GetOSError());
    PR_FREEIF (errText);
    errText = 0;

    // TODO: check if this is even sane?
    libHndl = PR_LoadLibrary (cleanedLibName);
    if (!libHndl)
    {
      // Failed to load the library.
      errText = getPRErrorText ();
      D_LOG (LOG_LEVEL_ERROR, "Failed to load library %s: %s", cleanedLibName, errText);
      D_LOG (LOG_LEVEL_DEBUG, "  (prerr: %d oserr: %d)", PR_GetError(), PR_GetOSError());
      if (aErrorMessageOut)
        *aErrorMessageOut = errText;

      PR_FREEIF (errText);

      return false;
    }

    instance->m_libName = strdup (cleanedLibName);
  }

  instance->m_libHandle = libHndl;
  if (!loadCLLibrary (instance, libHndl))
  {
    D_LOG (LOG_LEVEL_ERROR, "Failed to load library %s: required symbols missing.", instance->m_libName);
    if (aErrorMessageOut)
      *aErrorMessageOut = "Required symbols not found.";

    return false;
  }

  if (aInstanceOut)
  {
    NS_ADDREF (*aInstanceOut = instance);
  }

  return true;
}


/* static */
void WebCL_LibCL::unload (WebCL_LibCL* aInstance)
{
  D_METHOD_START;

  if (!(aInstance && aInstance->m_libHandle))
    return;

  if (PR_UnloadLibrary (aInstance->m_libHandle) == PR_FAILURE)
  {
    char *errText = getPRErrorText ();
    D_LOG (LOG_LEVEL_WARNING, "Failed to unload library %s: %s", aInstance->m_libName, errText);
    D_LOG (LOG_LEVEL_DEBUG, "  (prerr: %d oserr: %d)", PR_GetError(), PR_GetOSError());
    PR_FREEIF (errText);
  }
  else
  {
    D_LOG (LOG_LEVEL_DEBUG, "Unloaded library %s", aInstance->m_libName);
  }
}


#define LOAD_CL_SYM(name,required) \
  instance->symbols->name = (WebCL_CLSymbols::_##name##_t) PR_FindSymbol (libHndl, #name); \
  if (!instance->symbols->name) { \
    if (required) { \
      D_LOG (LOG_LEVEL_ERROR, "Failed to load symbol %s.", #name); \
      rv = false; \
    } else { \
      D_LOG (LOG_LEVEL_WARNING, "Failed to load symbol %s.", #name); \
    } \
  } else D_LOG (LOG_LEVEL_DEBUG, "Loaded symbol %s.", #name); \


static bool loadCLLibrary (WebCL_LibCL* instance, PRLibrary* libHndl)
{
  D_METHOD_START;
  if (!(instance && instance->symbols && libHndl))
    return false;

  bool rv = true;

  LOAD_CL_SYM (clGetPlatformIDs, true)
  LOAD_CL_SYM (clGetPlatformInfo, true)
  LOAD_CL_SYM (clGetDeviceIDs, true)
  LOAD_CL_SYM (clGetDeviceInfo, true)
  LOAD_CL_SYM (clCreateContext, true)
  LOAD_CL_SYM (clCreateContextFromType, true)
  LOAD_CL_SYM (clRetainContext, true)
  LOAD_CL_SYM (clReleaseContext, true)
  LOAD_CL_SYM (clGetContextInfo, true)
  LOAD_CL_SYM (clCreateCommandQueue, true)
  LOAD_CL_SYM (clRetainCommandQueue, true)
  LOAD_CL_SYM (clReleaseCommandQueue, true)
  LOAD_CL_SYM (clGetCommandQueueInfo, true)
  LOAD_CL_SYM (clCreateBuffer, true)
  LOAD_CL_SYM (clCreateSubBuffer, true)
  LOAD_CL_SYM (clCreateImage2D, true)
  LOAD_CL_SYM (clCreateImage3D, true)
  LOAD_CL_SYM (clRetainMemObject, true)
  LOAD_CL_SYM (clReleaseMemObject, true)
  LOAD_CL_SYM (clGetSupportedImageFormats, true)
  LOAD_CL_SYM (clGetMemObjectInfo, true)
  LOAD_CL_SYM (clGetImageInfo, true)
  LOAD_CL_SYM (clSetMemObjectDestructorCallback, true)
  LOAD_CL_SYM (clCreateSampler, true)
  LOAD_CL_SYM (clRetainSampler, true)
  LOAD_CL_SYM (clReleaseSampler, true)
  LOAD_CL_SYM (clGetSamplerInfo, true)
  LOAD_CL_SYM (clCreateProgramWithSource, true)
  LOAD_CL_SYM (clCreateProgramWithBinary, true)
  LOAD_CL_SYM (clRetainProgram, true)
  LOAD_CL_SYM (clReleaseProgram, true)
  LOAD_CL_SYM (clBuildProgram, true)
  LOAD_CL_SYM (clUnloadCompiler, true)
  LOAD_CL_SYM (clGetProgramInfo, true)
  LOAD_CL_SYM (clGetProgramBuildInfo, true)
  LOAD_CL_SYM (clCreateKernel, true)
  LOAD_CL_SYM (clCreateKernelsInProgram, true)
  LOAD_CL_SYM (clRetainKernel, true)
  LOAD_CL_SYM (clReleaseKernel, true)
  LOAD_CL_SYM (clSetKernelArg, true)
  LOAD_CL_SYM (clGetKernelInfo, true)
  LOAD_CL_SYM (clGetKernelWorkGroupInfo, true)
  LOAD_CL_SYM (clWaitForEvents, true)
  LOAD_CL_SYM (clGetEventInfo, true)
  LOAD_CL_SYM (clCreateUserEvent, true)
  LOAD_CL_SYM (clRetainEvent, true)
  LOAD_CL_SYM (clReleaseEvent, true)
  LOAD_CL_SYM (clSetUserEventStatus, true)
  LOAD_CL_SYM (clSetEventCallback, true)
  LOAD_CL_SYM (clGetEventProfilingInfo, true)
  LOAD_CL_SYM (clFlush, true)
  LOAD_CL_SYM (clFinish, true)
  LOAD_CL_SYM (clEnqueueReadBuffer, true)
  LOAD_CL_SYM (clEnqueueReadBufferRect, true)
  LOAD_CL_SYM (clEnqueueWriteBuffer, true)
  LOAD_CL_SYM (clEnqueueWriteBufferRect, true)
  LOAD_CL_SYM (clEnqueueCopyBuffer, true)
  LOAD_CL_SYM (clEnqueueCopyBufferRect, true)
  LOAD_CL_SYM (clEnqueueReadImage, true)
  LOAD_CL_SYM (clEnqueueWriteImage, true)
  LOAD_CL_SYM (clEnqueueCopyImage, true)
  LOAD_CL_SYM (clEnqueueCopyImageToBuffer, true)
  LOAD_CL_SYM (clEnqueueCopyBufferToImage, true)
  LOAD_CL_SYM (clEnqueueMapBuffer, true)
  LOAD_CL_SYM (clEnqueueMapImage, true)
  LOAD_CL_SYM (clEnqueueUnmapMemObject, true)
  LOAD_CL_SYM (clEnqueueNDRangeKernel, true)
  LOAD_CL_SYM (clEnqueueTask, true)
  LOAD_CL_SYM (clEnqueueNativeKernel, true)
  LOAD_CL_SYM (clEnqueueMarker, true)
  LOAD_CL_SYM (clEnqueueWaitForEvents, true)
  LOAD_CL_SYM (clEnqueueBarrier, true)
  LOAD_CL_SYM (clGetExtensionFunctionAddress, true)

  LOAD_CL_SYM (clCreateFromGLBuffer, false)
  LOAD_CL_SYM (clCreateFromGLTexture2D, false)
  LOAD_CL_SYM (clCreateFromGLTexture3D, false)
  LOAD_CL_SYM (clCreateFromGLRenderbuffer, false)
  LOAD_CL_SYM (clGetGLObjectInfo, false)
  LOAD_CL_SYM (clGetGLTextureInfo, false)
  LOAD_CL_SYM (clEnqueueAcquireGLObjects, false)
  LOAD_CL_SYM (clEnqueueReleaseGLObjects, false)
  
  #ifndef __APPLE__
    LOAD_CL_SYM (clGetGLContextInfoKHR, false)
  #endif
  return rv;
}
