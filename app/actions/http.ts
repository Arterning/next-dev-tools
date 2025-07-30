"use server"

import type { HttpRequest, HttpResponse, Param } from "@/lib/http-types"

function buildUrlWithParams(url: string, params: Param[]): string {
  const enabledParams = params.filter((p) => p.enabled && p.key)
  if (enabledParams.length === 0) return url

  try {
    const urlObject = new URL(url.startsWith("http") ? url : `https://${url}`)
    enabledParams.forEach((param) => {
      urlObject.searchParams.set(param.key, param.value)
    })
    return urlObject.toString()
  } catch (error) {
    return url
  }
}

export async function sendRequestAction(
  currentRequest: HttpRequest
): Promise<HttpResponse> {
  const startTime = Date.now()

  try {
    const enabledHeaders = currentRequest.headers
      .filter((h) => h.enabled && h.key)
      .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {})

    const requestOptions: RequestInit = {
      method: currentRequest.method,
      headers: enabledHeaders,
      cache: "no-store",
    }

    if (
      currentRequest.method !== "GET" &&
      currentRequest.method !== "HEAD" &&
      currentRequest.bodyType !== "none"
    ) {
      switch (currentRequest.bodyType) {
        case "json":
          if (currentRequest.jsonBody) {
            requestOptions.body = currentRequest.jsonBody
            if (!("Content-Type" in enabledHeaders)) {
              ;(requestOptions.headers as Record<string, string>)["Content-Type"] =
                "application/json"
            }
          }
          break
        case "form-data":
          const formData = new FormData()
          currentRequest.formData
            .filter((item) => item.enabled && item.key)
            .forEach((item) => {
              formData.append(item.key, item.value)
            })
          requestOptions.body = formData
          break
        case "x-www-form-urlencoded":
          const urlencoded = new URLSearchParams()
          currentRequest.formData
            .filter((item) => item.enabled && item.key)
            .forEach((item) => {
              urlencoded.append(item.key, item.value)
            })
          requestOptions.body = urlencoded
          if (!("Content-Type" in enabledHeaders)) {
            ;(requestOptions.headers as Record<string, string>)[
              "Content-Type"
            ] = "application/x-www-form-urlencoded"
          }
          break
        case "raw":
          if (currentRequest.rawBody) {
            requestOptions.body = currentRequest.rawBody
          }
          break
      }
    }

    const finalUrl = buildUrlWithParams(currentRequest.url, currentRequest.params)
    const response = await fetch(finalUrl, requestOptions)
    const responseTime = Date.now() - startTime

    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    let responseBody = ""
    try {
      const text = await response.text()
      try {
        const json = JSON.parse(text)
        responseBody = JSON.stringify(json, null, 2)
      } catch {
        responseBody = text
      }
    } catch (error) {
      responseBody = "Failed to read response body"
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      responseTime,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred"
    return {
      status: 0,
      statusText: "Network Error",
      headers: {},
      body: errorMessage,
      responseTime: Date.now() - startTime,
    }
  }
}
