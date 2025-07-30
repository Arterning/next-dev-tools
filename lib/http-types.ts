export interface Header {
  key: string
  value: string
  enabled: boolean
}

export interface Param {
  key: string
  value: string
  enabled: boolean
}

export interface FormDataItem {
  key: string
  value: string
  type: "text" | "file"
  enabled: boolean
}

export interface HttpRequest {
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

export interface HttpResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  responseTime: number
}

export interface SavedRequest extends HttpRequest {
  response?: HttpResponse
}
