import { type NextRequest, NextResponse } from "next/server"

interface OpenGraphData {
  title?: string
  description?: string
  image?: string
  siteName?: string
  url?: string
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL
    let validUrl: URL
    try {
      validUrl = new URL(url.startsWith("http") ? url : `https://${url}`)
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    // Fetch the webpage
    const response = await fetch(validUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    // Parse Open Graph and meta tags
    const ogData: OpenGraphData = {}

    // Extract title
    const titleMatch =
      html.match(/<meta\s+property="og:title"\s+content="([^"]*)"[^>]*>/i) ||
      html.match(/<title[^>]*>([^<]*)<\/title>/i)
    if (titleMatch) {
      ogData.title = titleMatch[1].trim()
    }

    // Extract description
    const descMatch =
      html.match(/<meta\s+property="og:description"\s+content="([^"]*)"[^>]*>/i) ||
      html.match(/<meta\s+name="description"\s+content="([^"]*)"[^>]*>/i)
    if (descMatch) {
      ogData.description = descMatch[1].trim()
    }

    // Extract image
    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"[^>]*>/i)
    if (imageMatch) {
      let imageUrl = imageMatch[1].trim()

      // Convert relative URLs to absolute
      if (imageUrl.startsWith("//")) {
        imageUrl = validUrl.protocol + imageUrl
      } else if (imageUrl.startsWith("/")) {
        imageUrl = validUrl.origin + imageUrl
      } else if (!imageUrl.startsWith("http")) {
        imageUrl = validUrl.origin + "/" + imageUrl
      }

      // Fetch image and convert to base64
      try {
        const imageResponse = await fetch(imageUrl)
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer()
          const contentType = imageResponse.headers.get("content-type") || "image/jpeg"
          const base64 = Buffer.from(imageBuffer).toString("base64")
          ogData.image = `data:${contentType};base64,${base64}`
        }
      } catch (error) {
        console.error("Failed to fetch image:", error)
        // Fallback to original URL if base64 conversion fails
        ogData.image = imageUrl
      }
    }

    // Extract site name
    const siteNameMatch = html.match(/<meta\s+property="og:site_name"\s+content="([^"]*)"[^>]*>/i)
    if (siteNameMatch) {
      ogData.siteName = siteNameMatch[1].trim()
    } else {
      ogData.siteName = validUrl.hostname
    }

    // Extract canonical URL
    const urlMatch =
      html.match(/<meta\s+property="og:url"\s+content="([^"]*)"[^>]*>/i) ||
      html.match(/<link\s+rel="canonical"\s+href="([^"]*)"[^>]*>/i)
    if (urlMatch) {
      ogData.url = urlMatch[1].trim()
    } else {
      ogData.url = validUrl.toString()
    }

    return NextResponse.json(ogData)
  } catch (error) {
    console.error("Error fetching Open Graph data:", error)
    return NextResponse.json({ error: "Failed to fetch website data" }, { status: 500 })
  }
}
