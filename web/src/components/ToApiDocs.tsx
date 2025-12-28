import React from "react"
import { Button } from "@/components/ui/button.tsx"
import { FileCode2 } from "lucide-react"

function ToApiDocs() {
  return (
    <Button
      onClick={() => open("/api/docs/index.html")}
      variant="ghost"
      className="h-8 gap-1 px-2 sm:h-9 sm:px-3"
    >
      <FileCode2 size={16} className="sm:size-[18px]" />
      <span className="hidden text-xs sm:inline sm:text-sm">API</span>
    </Button>
  )
}

export default ToApiDocs
