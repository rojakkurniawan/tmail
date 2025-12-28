import React from "react"
import { GITHUB_URL, VERSION } from "@/lib/constant.ts"
import { Button } from "@/components/ui/button.tsx"
import { FaGithub } from "react-icons/fa"

function ToGithub() {
  return (
    <Button
      onClick={() => open(GITHUB_URL)}
      variant="ghost"
      className="gap-1 underline underline-offset-4 has-[>svg]:px-2"
    >
      <FaGithub size={18} />
      <span className="hidden sm:inline">{VERSION}</span>
    </Button>
  )
}

export default ToGithub
