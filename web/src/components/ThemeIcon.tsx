import React from "react"
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi"
import { Button } from "@/components/ui/button"

function ThemeIcon() {
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    const theme =
      localStorage.getItem("theme") ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light")
    setIsDark(theme === "dark")
  }, [])

  const handleToggle = () => {
    const newTheme = isDark ? "light" : "dark"
    document.documentElement.classList.toggle("dark")
    localStorage.setItem("theme", newTheme)
    setIsDark(!isDark)

    // Update theme-color meta tag for mobile
    const themeColorMeta = document.getElementById(
      "theme-color-meta"
    ) as HTMLMetaElement | null
    if (themeColorMeta) {
      themeColorMeta.content = newTheme === "dark" ? "#18181B" : "#FAFAFA"
    }
  }

  return (
    <Button
      id="themeToggle"
      variant="ghost"
      size="icon"
      className="h-8 w-8 sm:h-9 sm:w-9"
      onClick={handleToggle}
    >
      {isDark ? (
        <HiOutlineSun className="size-4 sm:size-[18px]" />
      ) : (
        <HiOutlineMoon className="size-4 sm:size-[18px]" />
      )}
    </Button>
  )
}

export default ThemeIcon
