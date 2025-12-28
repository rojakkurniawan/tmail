import React, { useMemo, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Input } from "@/components/ui/input.tsx"
import { useStore } from "@nanostores/react"
import { $address, $domainList, updateAddress } from "@/lib/store/store.ts"
import { toast } from "sonner"
import { MessageCircleWarning } from "lucide-react"
import { type language, useTranslations } from "@/i18n/ui"

function EditAddress({
  children,
  lang,
}: {
  children: React.ReactNode
  lang: string
}) {
  const [address, setAddress] = useState("")
  const domainList = useStore($domainList)

  const t = useMemo(() => useTranslations(lang as language), [])

  function onDomainChange(value: string) {
    setAddress(`${address!.split("@")[0]}@${value}`)
  }

  function onInputChange(value: string) {
    value = value.replace(/[^a-zA-Z0-9-_.]/g, "")
    if (value.length > 12) {
      value = value.slice(0, 12)
    }
    setAddress(`${value}@${address!.split("@")[1]}`)
  }

  function onOpenChange(open: boolean) {
    if (open) {
      setAddress($address.get())
    }
  }

  function onConfirm() {
    if (address === $address.get()) {
      return
    }
    updateAddress(address)
    toast.success(t("changeNew") + " " + address)
  }

  return (
    <AlertDialog onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="w-[95vw] max-w-md rounded-lg p-4 sm:w-full sm:p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base sm:text-lg">{t("edit")}</AlertDialogTitle>
          <AlertDialogDescription className="flex items-center justify-center gap-1 text-xs sm:justify-start sm:text-sm">
            <MessageCircleWarning size={18} strokeWidth={1.8} className="shrink-0" />
            <span>{t("editWarn")}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-start">
          <Input
            className="h-9 w-24 text-right text-sm sm:w-32"
            value={address?.split("@")[0]}
            onChange={(e) => onInputChange(e.currentTarget.value)}
          />
          <span className="bg-secondary rounded-sm p-1 text-sm">@</span>
          <Select value={address?.split("@")[1]} onValueChange={onDomainChange}>
            <SelectTrigger className="h-9 w-auto text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {domainList.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className="h-9 text-sm">{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="h-9 text-sm">
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default EditAddress
