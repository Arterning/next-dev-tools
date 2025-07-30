"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Plus, Globe, Trash2, History, Save, FileText, Send } from "lucide-react"
import Bookmarks from "@/components/bookmarks"
import HttpClientComponent from "@/components/http-client"
import { ModeToggle } from "@/components/theme-toggle"

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
            <ModeToggle />
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
