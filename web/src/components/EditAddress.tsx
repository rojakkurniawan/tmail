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
import { Button } from "@/components/ui/button.tsx"
import { useStore } from "@nanostores/react"
import { $address, $domainList, updateAddress } from "@/lib/store/store.ts"
import { randomAddress, randomUsername } from "@/lib/utils.ts"
import { toast } from "sonner"
import { HiOutlineExclamationCircle } from "react-icons/hi"
import { FiRefreshCw } from "react-icons/fi"
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
    if (value.length > 64) {
      value = value.slice(0, 64)
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

  function onRandomUsername() {
    if (!address || !address.includes("@")) {
      toast.error("Please select a domain first")
      return
    }
    const currentDomain = address.split("@")[1]
    const newUsername = randomUsername()
    setAddress(`${newUsername}@${currentDomain}`)
  }

  function onRandomAll() {
    if (domainList.length === 0) {
      toast.error("No domain available")
      return
    }
    const randomDomain =
      domainList[Math.floor(Math.random() * domainList.length)]
    const newAddress = randomAddress(randomDomain)
    setAddress(newAddress)
  }

  return (
    <AlertDialog onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="w-[95vw] max-w-md rounded-lg p-4 sm:w-full sm:p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base sm:text-lg">
            {t("edit")}
          </AlertDialogTitle>
          <AlertDialogDescription className="flex items-center justify-center gap-1 text-xs sm:justify-start sm:text-sm">
            <HiOutlineExclamationCircle size={18} className="shrink-0" />
            <span>{t("editWarn")}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {address && (
          <div className="bg-secondary rounded-sm border p-3">
            <div className="line-clamp-1 font-mono text-sm leading-relaxed break-all">
              {address}
            </div>
          </div>
        )}
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Input
              className="h-9 min-w-0 flex-1 text-right font-mono text-sm"
              value={address?.split("@")[0]}
              onChange={(e) => onInputChange(e.currentTarget.value)}
              maxLength={64}
              placeholder="username"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={onRandomUsername}
              title="Random username only"
            >
              <FiRefreshCw className="size-4" />
            </Button>
          </div>
          <span className="bg-secondary flex h-9 shrink-0 items-center justify-center rounded-sm px-2 text-sm font-semibold">
            @
          </span>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Select
              value={address?.split("@")[1]}
              onValueChange={onDomainChange}
            >
              <SelectTrigger className="h-9 min-w-0 flex-1 text-sm">
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
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={onRandomAll}
              title={t("random")}
            >
              <FiRefreshCw className="size-4" />
            </Button>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-9 text-sm">
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="h-9 text-sm">
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default EditAddress
