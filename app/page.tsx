"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Copy, Plus, Globe, Trash2, History, Save, FileText, Send } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Bookmarks from "@/components/bookmarks"

interface Header {
  key: string
  value: string
  enabled: boolean
}

interface Param {
  key: string
  value: string
  enabled: boolean
}

interface FormDataItem {
  key: string
  value: string
  type: "text" | "file"
  enabled: boolean
}

interface HttpRequest {
  id: string
  name: string
  method: string
  url: string
  params: Param[]
  headers: Header[]
  bodyType: "none" | "json" | "form-data" | "x-www-form-urlencoded" | "raw"
  jsonBody: string
  formData: FormDataItem[]
  rawBody: string
  timestamp: number
}

interface HttpResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  responseTime: number
}

interface SavedRequest extends HttpRequest {
  response?: HttpResponse
}

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]

function HttpClientComponent() {
  const [currentRequest, setCurrentRequest] = useState<HttpRequest>({
    id: "",
    name: "Untitled Request",
    method: "GET",
    url: "",
    params: [{ key: "", value: "", enabled: true }],
    headers: [{ key: "", value: "", enabled: true }],
    bodyType: "none",
    jsonBody: "",
    formData: [{ key: "", value: "", type: "text", enabled: true }],
    rawBody: "",
    timestamp: Date.now(),
  })

  const [response, setResponse] = useState<HttpResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([])

  // Load saved requests from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("http-client-requests")
    if (saved) {
      try {
        setSavedRequests(JSON.parse(saved))
      } catch (error) {
        console.error("Failed to load saved requests:", error)
      }
    }
  }, [])

  // Save requests to localStorage whenever savedRequests changes
  useEffect(() => {
    localStorage.setItem("http-client-requests", JSON.stringify(savedRequests))
  }, [savedRequests])

  const updateRequest = (updates: Partial<HttpRequest>) => {
    setCurrentRequest((prev) => ({ ...prev, ...updates }))
  }

  const updateParam = (index: number, field: keyof Param, value: string | boolean) => {
    const newParams = [...currentRequest.params]
    newParams[index] = { ...newParams[index], [field]: value }
    updateRequest({ params: newParams })
  }

  const addParam = () => {
    updateRequest({
      params: [...currentRequest.params, { key: "", value: "", enabled: true }],
    })
  }

  const removeParam = (index: number) => {
    const newParams = currentRequest.params.filter((_, i) => i !== index)
    updateRequest({ params: newParams })
  }

  const updateHeader = (index: number, field: keyof Header, value: string | boolean) => {
    const newHeaders = [...currentRequest.headers]
    newHeaders[index] = { ...newHeaders[index], [field]: value }
    updateRequest({ headers: newHeaders })
  }

  const addHeader = () => {
    updateRequest({
      headers: [...currentRequest.headers, { key: "", value: "", enabled: true }],
    })
  }

  const removeHeader = (index: number) => {
    const newHeaders = currentRequest.headers.filter((_, i) => i !== index)
    updateRequest({ headers: newHeaders })
  }

  const updateFormData = (index: number, field: keyof FormDataItem, value: string | boolean) => {
    const newFormData = [...currentRequest.formData]
    newFormData[index] = { ...newFormData[index], [field]: value }
    updateRequest({ formData: newFormData })
  }

  const addFormData = () => {
    updateRequest({
      formData: [...currentRequest.formData, { key: "", value: "", type: "text", enabled: true }],
    })
  }

  const removeFormData = (index: number) => {
    const newFormData = currentRequest.formData.filter((_, i) => i !== index)
    updateRequest({ formData: newFormData })
  }

  const buildUrlWithParams = () => {
    const enabledParams = currentRequest.params.filter((p) => p.enabled && p.key && p.value)
    if (enabledParams.length === 0) return currentRequest.url

    const url = new URL(currentRequest.url.startsWith("http") ? currentRequest.url : `https://${currentRequest.url}`)
    enabledParams.forEach((param) => {
      url.searchParams.set(param.key, param.value)
    })
    return url.toString()
  }

  const sendRequest = async () => {
    if (!currentRequest.url) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    const startTime = Date.now()

    try {
      const enabledHeaders = currentRequest.headers
        .filter((h) => h.enabled && h.key && h.value)
        .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {})

      const requestOptions: RequestInit = {
        method: currentRequest.method,
        headers: enabledHeaders,
      }

      // Handle request body based on bodyType
      if (currentRequest.method !== "GET" && currentRequest.method !== "HEAD" && currentRequest.bodyType !== "none") {
        switch (currentRequest.bodyType) {
          case "json":
            if (currentRequest.jsonBody) {
              requestOptions.body = currentRequest.jsonBody
              if (!enabledHeaders["Content-Type"]) {
                requestOptions.headers = { ...requestOptions.headers, "Content-Type": "application/json" }
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
            if (!enabledHeaders["Content-Type"]) {
              requestOptions.headers = {
                ...requestOptions.headers,
                "Content-Type": "application/x-www-form-urlencoded",
              }
            }
            break
          case "raw":
            if (currentRequest.rawBody) {
              requestOptions.body = currentRequest.rawBody
            }
            break
        }
      }

      const finalUrl = buildUrlWithParams()
      const response = await fetch(finalUrl, requestOptions)
      const responseTime = Date.now() - startTime

      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      let responseBody = ""
      try {
        const text = await response.text()
        // Try to parse as JSON for pretty formatting
        try {
          const json = JSON.parse(text)
          responseBody = JSON.stringify(json, null, 2)
        } catch {
          responseBody = text
        }
      } catch (error) {
        responseBody = "Failed to read response body"
      }

      const httpResponse: HttpResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        responseTime,
      }

      setResponse(httpResponse)

      toast({
        title: "Request sent successfully",
        description: `${response.status} ${response.statusText} (${responseTime}ms)`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setResponse({
        status: 0,
        statusText: "Network Error",
        headers: {},
        body: errorMessage,
        responseTime: Date.now() - startTime,
      })

      toast({
        title: "Request failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveRequest = () => {
    const requestToSave: SavedRequest = {
      ...currentRequest,
      id: currentRequest.id || Date.now().toString(),
      timestamp: Date.now(),
      response,
    }

    setSavedRequests((prev) => {
      const existingIndex = prev.findIndex((r) => r.id === requestToSave.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = requestToSave
        return updated
      }
      return [requestToSave, ...prev]
    })

    updateRequest({ id: requestToSave.id })

    toast({
      title: "Request saved",
      description: `"${requestToSave.name}" has been saved`,
    })
  }

  const createNewRequest = () => {
    const newRequest: HttpRequest = {
      id: "",
      name: "Untitled Request",
      method: "GET",
      url: "",
      params: [{ key: "", value: "", enabled: true }],
      headers: [{ key: "", value: "", enabled: true }],
      bodyType: "none",
      jsonBody: "",
      formData: [{ key: "", value: "", type: "text", enabled: true }],
      rawBody: "",
      timestamp: Date.now(),
    }
    setCurrentRequest(newRequest)
    setResponse(null)

    toast({
      title: "New request created",
      description: "Started with a blank request",
    })
  }

  const loadRequest = (savedRequest: SavedRequest) => {
    setCurrentRequest(savedRequest)
    setResponse(savedRequest.response || null)
  }

  const duplicateRequest = (savedRequest: SavedRequest) => {
    const duplicated: HttpRequest = {
      ...savedRequest,
      id: "",
      name: `${savedRequest.name} (Copy)`,
      timestamp: Date.now(),
    }
    setCurrentRequest(duplicated)
    setResponse(null)

    toast({
      title: "Request duplicated",
      description: `Created a copy of "${savedRequest.name}"`,
    })
  }

  const deleteRequest = (id: string) => {
    setSavedRequests((prev) => prev.filter((r) => r.id !== id))
    toast({
      title: "Request deleted",
      description: "Request has been removed from your collection",
    })
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-500"
    if (status >= 300 && status < 400) return "bg-yellow-500"
    if (status >= 400 && status < 500) return "bg-orange-500"
    if (status >= 500) return "bg-red-500"
    return "bg-gray-500"
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">HTTP Client</h1>
          <p className="text-muted-foreground">A web-based tool for testing HTTP APIs</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Saved Requests */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    <CardTitle>Saved Requests</CardTitle>
                  </div>
                  <Button onClick={createNewRequest} size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>Your request collection</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {savedRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No saved requests yet</p>
                  ) : (
                    <div className="space-y-2">
                      {savedRequests.map((req) => (
                        <div
                          key={req.id}
                          className="p-3 border rounded-lg hover:bg-accent cursor-pointer group"
                          onClick={() => loadRequest(req)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-xs">
                              {req.method}
                            </Badge>
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  duplicateRequest(req)
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteRequest(req.id)
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm font-medium truncate">{req.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{req.url}</p>
                          {req.response && (
                            <div className="flex items-center gap-1 mt-1">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(req.response.status)}`} />
                              <span className="text-xs">{req.response.status}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Request Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Input
                      value={currentRequest.name}
                      onChange={(e) => updateRequest({ name: e.target.value })}
                      className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0"
                      placeholder="Request name"
                    />
                  </div>
                  <Button onClick={saveRequest} variant="outline" size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Request URL and Method */}
                <div className="flex gap-2">
                  <Select value={currentRequest.method} onValueChange={(value) => updateRequest({ method: value })}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HTTP_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Enter request URL"
                    value={currentRequest.url}
                    onChange={(e) => updateRequest({ url: e.target.value })}
                    className="flex-1"
                  />
                  <Button onClick={sendRequest} disabled={loading}>
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {loading ? "Sending..." : "Send"}
                  </Button>
                </div>

                {/* Request Configuration Tabs */}
                <Tabs defaultValue="params" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="params">Params</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="auth">Auth</TabsTrigger>
                  </TabsList>

                  <TabsContent value="params" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Query Parameters</Label>
                      <Button onClick={addParam} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Param
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {currentRequest.params.map((param, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="checkbox"
                            checked={param.enabled}
                            onChange={(e) => updateParam(index, "enabled", e.target.checked)}
                            className="rounded"
                          />
                          <Input
                            placeholder="Key"
                            value={param.key}
                            onChange={(e) => updateParam(index, "key", e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Value"
                            value={param.value}
                            onChange={(e) => updateParam(index, "value", e.target.value)}
                            className="flex-1"
                          />
                          <Button onClick={() => removeParam(index)} variant="outline" size="sm" className="px-2">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="headers" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Headers</Label>
                      <Button onClick={addHeader} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Header
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {currentRequest.headers.map((header, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="checkbox"
                            checked={header.enabled}
                            onChange={(e) => updateHeader(index, "enabled", e.target.checked)}
                            className="rounded"
                          />
                          <Input
                            placeholder="Key"
                            value={header.key}
                            onChange={(e) => updateHeader(index, "key", e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Value"
                            value={header.value}
                            onChange={(e) => updateHeader(index, "value", e.target.value)}
                            className="flex-1"
                          />
                          <Button onClick={() => removeHeader(index)} variant="outline" size="sm" className="px-2">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="body" className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Label>Body Type:</Label>
                      <Select
                        value={currentRequest.bodyType}
                        onValueChange={(value: any) => updateRequest({ bodyType: value })}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="form-data">Form Data</SelectItem>
                          <SelectItem value="x-www-form-urlencoded">x-www-form-urlencoded</SelectItem>
                          <SelectItem value="raw">Raw</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {currentRequest.bodyType === "json" && (
                      <div>
                        <Label htmlFor="json-body">JSON</Label>
                        <Textarea
                          id="json-body"
                          placeholder='{"key": "value"}'
                          value={currentRequest.jsonBody}
                          onChange={(e) => updateRequest({ jsonBody: e.target.value })}
                          className="min-h-[200px] font-mono"
                        />
                      </div>
                    )}

                    {(currentRequest.bodyType === "form-data" ||
                      currentRequest.bodyType === "x-www-form-urlencoded") && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Form Data</Label>
                          <Button onClick={addFormData} variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Field
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {currentRequest.formData.map((item, index) => (
                            <div key={index} className="flex gap-2 items-center">
                              <input
                                type="checkbox"
                                checked={item.enabled}
                                onChange={(e) => updateFormData(index, "enabled", e.target.checked)}
                                className="rounded"
                              />
                              <Input
                                placeholder="Key"
                                value={item.key}
                                onChange={(e) => updateFormData(index, "key", e.target.value)}
                                className="flex-1"
                              />
                              <Input
                                placeholder="Value"
                                value={item.value}
                                onChange={(e) => updateFormData(index, "value", e.target.value)}
                                className="flex-1"
                              />
                              {currentRequest.bodyType === "form-data" && (
                                <Select
                                  value={item.type}
                                  onValueChange={(value: any) => updateFormData(index, "type", value)}
                                >
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="file">File</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                              <Button
                                onClick={() => removeFormData(index)}
                                variant="outline"
                                size="sm"
                                className="px-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentRequest.bodyType === "raw" && (
                      <div>
                        <Label htmlFor="raw-body">Raw</Label>
                        <Textarea
                          id="raw-body"
                          placeholder="Enter raw body content"
                          value={currentRequest.rawBody}
                          onChange={(e) => updateRequest({ rawBody: e.target.value })}
                          className="min-h-[200px] font-mono"
                        />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="auth" className="space-y-4">
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Authentication features coming soon</p>
                      <p className="text-sm">Bearer Token, API Key, OAuth support</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Response Section */}
            {response && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-4">
                    Response
                    <Badge className={getStatusColor(response.status)}>
                      {response.status} {response.statusText}
                    </Badge>
                    <span className="text-sm font-normal text-muted-foreground">Time: {response.responseTime}ms</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Response Headers */}
                  <div>
                    <Label className="text-base font-semibold">Response Headers</Label>
                    <Card className="mt-2">
                      <CardContent className="p-4">
                        {Object.keys(response.headers).length === 0 ? (
                          <p className="text-sm text-muted-foreground">No headers</p>
                        ) : (
                          <div className="space-y-1">
                            {Object.entries(response.headers).map(([key, value]) => (
                              <div key={key} className="flex gap-2 text-sm">
                                <span className="font-medium min-w-0 flex-shrink-0">{key}:</span>
                                <span className="text-muted-foreground break-all">{value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Response Body */}
                  <div>
                    <Label className="text-base font-semibold">Response Body</Label>
                    <Card className="mt-2">
                      <CardContent className="p-0">
                        <ScrollArea className="h-[400px]">
                          <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words">
                            {response.body || "No response body"}
                          </pre>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<"http-client" | "bookmarks">("http-client")

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Dev Tools</h1>
              <div className="flex space-x-2">
                <Button
                  variant={currentPage === "http-client" ? "default" : "ghost"}
                  onClick={() => setCurrentPage("http-client")}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  HTTP Client
                </Button>
                <Button
                  variant={currentPage === "bookmarks" ? "default" : "ghost"}
                  onClick={() => setCurrentPage("bookmarks")}
                  className="flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Bookmarks
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="container mx-auto">
        {currentPage === "http-client" && <HttpClientComponent />}
        {currentPage === "bookmarks" && <Bookmarks />}
      </div>
    </div>
  )
}
