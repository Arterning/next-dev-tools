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
import HttpClientComponent from "@/components/http-client"

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
