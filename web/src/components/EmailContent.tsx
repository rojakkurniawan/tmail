import React, { useEffect, useRef } from "react"

interface EmailContentProps {
  body: string
}

function isHtmlEmail(body: string): boolean {
  const htmlIndicators = [
    "<html",
    "<HTML",
    "<body",
    "<BODY",
    "<div",
    "<DIV",
    "<p>",
    "<P>",
    "<span",
    "<SPAN",
    "<table",
    "<TABLE",
    "<a ",
    "<A ",
    "<img",
    "<IMG",
    "<br>",
    "<BR>",
    "&nbsp;",
    "&amp;",
    "&lt;",
    "&gt;",
  ]
  return htmlIndicators.some((indicator) => body.includes(indicator))
}

function hasFullHtmlStructure(body: string): boolean {
  const trimmed = body.trim()
  return (
    (trimmed.includes("<html") || trimmed.includes("<HTML")) &&
    (trimmed.includes("</html>") || trimmed.includes("</HTML>"))
  )
}

function extractBodyContent(html: string): string {
  // Extract content from <body> tag if exists
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch) {
    return bodyMatch[1]
  }
  // If no body tag, try to extract from html tag
  const htmlMatch = html.match(/<html[^>]*>([\s\S]*?)<\/html>/i)
  if (htmlMatch) {
    return htmlMatch[1]
  }
  return html
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function formatPlainText(text: string): string {
  const escaped = escapeHtml(text)
  // Convert URLs to clickable links (safely)
  const urlRegex = /(https?:\/\/[^\s<]+)/g
  const withLinks = escaped.replace(
    urlRegex,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>'
  )
  return withLinks.replace(/\n/g, "<br>").replace(/\r/g, "")
}

export function EmailContent({ body }: EmailContentProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!isHtmlEmail(body) || !iframeRef.current) return

    const iframe = iframeRef.current
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) return

    // Determine if we need to wrap the content or use it as-is
    const hasFullStructure = hasFullHtmlStructure(body)
    let emailContent = body

    if (hasFullStructure) {
      // Extract body content if full HTML structure exists
      emailContent = extractBodyContent(body)
    }

    // Prepare the HTML document
    let htmlContent = ""

    if (hasFullStructure) {
      // If original has full structure, preserve its head styles but wrap body content
      const headMatch = body.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
      const originalStyles = headMatch ? headMatch[1] : ""

      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${originalStyles}
          <style>
            * {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              font-size: 14px;
              line-height: 1.6;
              color: #333;
              padding: 16px;
              margin: 0;
              background: transparent;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            img { 
              max-width: 100% !important; 
              height: auto !important;
              display: block;
            }
            table { 
              max-width: 100% !important; 
              border-collapse: collapse;
              table-layout: fixed;
              width: 100% !important;
            }
            td, th {
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            a { 
              color: #4f46e5; 
              text-decoration: none;
            }
            a:hover { 
              text-decoration: underline; 
            }
            pre, code {
              white-space: pre-wrap;
              word-wrap: break-word;
              overflow-wrap: break-word;
              max-width: 100%;
            }
            /* Override any fixed widths that might break layout */
            div, p, span {
              max-width: 100% !important;
            }
            /* Fix for common email client styles */
            .ExternalClass, .ReadMsgBody {
              width: 100%;
            }
          </style>
        </head>
        <body>
          ${emailContent}
        </body>
        </html>
      `
    } else {
      // Simple HTML email without full structure
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              font-size: 14px;
              line-height: 1.6;
              color: #333;
              padding: 16px;
              margin: 0;
              background: transparent;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            img { 
              max-width: 100% !important; 
              height: auto !important;
              display: block;
            }
            table { 
              max-width: 100% !important; 
              border-collapse: collapse;
              table-layout: fixed;
              width: 100% !important;
            }
            td, th {
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            a { 
              color: #4f46e5; 
              text-decoration: none;
            }
            a:hover { 
              text-decoration: underline; 
            }
            pre, code {
              white-space: pre-wrap;
              word-wrap: break-word;
              overflow-wrap: break-word;
              max-width: 100%;
            }
            div, p, span {
              max-width: 100% !important;
            }
          </style>
        </head>
        <body>
          ${emailContent}
        </body>
        </html>
      `
    }

    try {
      iframeDoc.open()
      iframeDoc.write(htmlContent)
      iframeDoc.close()
    } catch (e) {
      console.error("Error writing to iframe:", e)
      return
    }

    // Update links to open in new tab
    const links = iframeDoc.querySelectorAll("a")
    links.forEach((link) => {
      link.target = "_blank"
      link.rel = "noopener noreferrer"
    })

    // Auto-resize iframe to fit content
    const resizeIframe = () => {
      try {
        if (!iframeDoc.body) return
        const contentHeight = iframeDoc.body.scrollHeight
        const maxHeight = window.innerHeight * 0.8 // Max 80% of viewport height
        iframe.style.height = `${Math.min(maxHeight, Math.max(400, contentHeight + 40))}px`
        iframe.style.maxWidth = "100%"
      } catch (e) {
        // Silently handle errors
      }
    }

    // Initial resize with multiple attempts for dynamic content
    setTimeout(resizeIframe, 100)
    setTimeout(resizeIframe, 500)
    setTimeout(resizeIframe, 1000)

    // Resize on content changes (for dynamic content) if ResizeObserver is available
    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined" && iframeDoc.body) {
      resizeObserver = new ResizeObserver(resizeIframe)
      resizeObserver.observe(iframeDoc.body)
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [body])

  if (isHtmlEmail(body)) {
    return (
      <div className="w-full min-w-0 overflow-x-auto">
        <iframe
          ref={iframeRef}
          sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          className="border-border min-h-[300px] w-full max-w-full rounded-lg border bg-white md:min-h-[400px] dark:bg-zinc-100"
          style={{
            minWidth: "100%",
            maxWidth: "100%",
            display: "block",
          }}
          title="Email Content"
          loading="lazy"
        />
      </div>
    )
  }

  return (
    <div
      className="text-foreground overflow-wrap-anywhere max-w-full leading-relaxed break-words whitespace-pre-wrap"
      style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
      dangerouslySetInnerHTML={{ __html: formatPlainText(body) }}
    />
  )
}
