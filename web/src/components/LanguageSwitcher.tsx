import React from "react"
import { Globe } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Props {
  currentLang: string
}

const languageLabels: Record<string, string> = {
  en: "English",
  zh: "中文",
  id: "Indonesia",
}

function LanguageSwitcher({ currentLang }: Props) {
  const handleChange = (value: string) => {
    if (value !== currentLang) {
      window.location.href = `/${value}/`
    }
  }

  return (
    <Select value={currentLang} onValueChange={handleChange}>
      <SelectTrigger className="hover:bg-accent h-9 w-auto gap-1.5 border-none bg-transparent px-2 shadow-none">
        <Globe size={18} className="shrink-0" />
        <SelectValue>
          <span className="hidden sm:inline">
            {languageLabels[currentLang]}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {Object.entries(languageLabels).map(([code, label]) => (
          <SelectItem key={code} value={code}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default LanguageSwitcher
