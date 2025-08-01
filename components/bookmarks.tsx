"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Trash2, ExternalLink, Globe, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Bookmark {
  id: string
  url: string
  title: string
  description: string
  image: string
  siteName: string
  timestamp: number
  category?: string
}

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newUrl, setNewUrl] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("All")

  // Load bookmarks from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("bookmarks")
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved))
      } catch (error) {
        console.error("Failed to load bookmarks:", error)
      }
    }
  }, [])

  // Save bookmarks to localStorage whenever bookmarks changes
  useEffect(() => {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks))
  }, [bookmarks])

  const allCategories = ["All", ...Array.from(new Set(bookmarks.map((b) => b.category).filter(Boolean)))] as string[]

  const filteredBookmarks = bookmarks
    .filter(
      (bookmark) =>
        selectedCategory === "All" || bookmark.category === selectedCategory,
    )
    .filter(
    (bookmark) =>
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const fetchOpenGraphData = async (url: string) => {
    try {
      const response = await fetch("/api/og", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch Open Graph data")
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error fetching Open Graph data:", error)
      throw error
    }
  }

  const addBookmark = async () => {
    if (!newUrl) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive",
      })
      return
    }

    // Validate URL format
    let validUrl = newUrl
    if (!validUrl.startsWith("http://") && !validUrl.startsWith("https://")) {
      validUrl = `https://${validUrl}`
    }

    try {
      new URL(validUrl)
    } catch {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const ogData = await fetchOpenGraphData(validUrl)

      const newBookmark: Bookmark = {
        id: Date.now().toString(),
        url: validUrl,
        title: ogData.title || "Untitled",
        description: ogData.description || "",
        image: ogData.image || "",
        siteName: ogData.siteName || new URL(validUrl).hostname,
        timestamp: Date.now(),
        category: newCategory.trim(),
      }

      setBookmarks((prev) => [newBookmark, ...prev])
      setNewUrl("")
      setNewCategory("")
      setIsDialogOpen(false)

      toast({
        title: "Bookmark added",
        description: `"${newBookmark.title}" has been added to your bookmarks`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch website information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id))
    toast({
      title: "Bookmark deleted",
      description: "Bookmark has been removed from your collection",
    })
  }

  const openUrl = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Navigation Bookmarks</h2>
            <p className="text-muted-foreground">Save and organize your favorite websites with link previews</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Bookmark
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Bookmark</DialogTitle>
                <DialogDescription>Enter a URL to create a bookmark with automatic link preview</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Input
                    placeholder="https://example.com"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Category (optional)"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !loading) {
                        addBookmark()
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={addBookmark} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Bookmark
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Categories */}
        {allCategories.length > 1 && <div className="flex flex-wrap gap-2 mb-4">
          {allCategories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "secondary"}
              onClick={() => setSelectedCategory(category)}
              className="cursor-pointer transition-all hover:scale-105"
            >
              {category}
            </Badge>
          ))}
        </div>}
      </div>

      {/* Bookmarks Grid */}
      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-12">
          <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">{searchQuery || selectedCategory !== 'All' ? "No bookmarks found" : "No bookmarks yet"}</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedCategory !== 'All'
              ? "Try adjusting your search or filter"
              : "Start by adding your first bookmark with the button above"}
          </p>
          {(searchQuery || selectedCategory !== 'All') && (
            <Button variant="outline" onClick={() => {
              setSearchQuery("")
              setSelectedCategory("All")
            }}>
              Clear Search & Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBookmarks.map((bookmark) => (
            <Card key={bookmark.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
              <div onClick={() => openUrl(bookmark.url)}>
                {/* Image */}
                {bookmark.image && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img
                      src={bookmark.image || "/placeholder.svg"}
                      alt={bookmark.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                      }}
                    />
                  </div>
                )}

                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                        {bookmark.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {bookmark.siteName && (
                          <Badge variant="secondary" className="text-xs">
                            {bookmark.siteName}
                          </Badge>
                        )}
                        {bookmark.category && (
                          <Badge variant="outline" className="text-xs">
                            {bookmark.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          openUrl(bookmark.url)
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteBookmark(bookmark.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {bookmark.description && (
                    <CardDescription className="line-clamp-3 text-sm">{bookmark.description}</CardDescription>
                  )}
                  <div className="mt-2 text-xs text-muted-foreground truncate">{bookmark.url}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Added {new Date(bookmark.timestamp).toLocaleDateString()}
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
