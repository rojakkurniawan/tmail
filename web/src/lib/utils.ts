import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ABORT_SAFE } from "@/lib/constant.ts"
import { toast } from "sonner"
import { faker } from "@faker-js/faker"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmtDate(str: string) {
  return new Date(str).toLocaleString()
}

export function fmtFrom(str: string) {
  const match = str.match(/^(.+?)\s*<(.+?)>$/)
  return match ? match[1].replace(/^"|"$/g, "") : str
}

function randomDigits(): string {
  const length = Math.floor(Math.random() * 4) + 1
  let result = ""
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString()
  }
  return result
}

export function randomAddress(domain: string) {
  const firstName = faker.person.firstName().toLowerCase()
  const lastName = faker.person.lastName().toLowerCase()
  const digits = randomDigits()
  const cleanFirst = firstName.replace(/[^a-z]/g, "")
  const cleanLast = lastName.replace(/[^a-z]/g, "")
  return `${cleanFirst}${cleanLast}${digits}@${domain}`
}

export function fetchError(e: any) {
  if (e === ABORT_SAFE || e.name === "AbortError") {
    return
  }
  toast.error(e.message ?? e)
}

export function fmtString(template: string, ...values: any[]) {
  return template.replace(/{(\d+)}/g, (match, index) => values[index] ?? match)
}
