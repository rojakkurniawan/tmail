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
import { Checkbox } from "@/components/ui/checkbox.tsx"
import { useStore } from "@nanostores/react"
import { $address, $domainList, updateAddress } from "@/lib/store/store.ts"
import { randomAddress, randomUsername } from "@/lib/utils.ts"
import { toast } from "sonner"
import {
  HiOutlineExclamationCircle,
  HiOutlinePencil,
  HiOutlineViewList,
} from "react-icons/hi"
import { FiRefreshCw } from "react-icons/fi"
import { type language, useTranslations } from "@/i18n/ui"

const EMAIL_REGEX = /^[a-zA-Z0-9-_.]+@[^@]+$/

function EditAddress({
  children,
  lang,
}: {
  children: React.ReactNode
  lang: string
}) {
  const [address, setAddress] = useState("")
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteValue, setPasteValue] = useState("")
  const [includeDigits, setIncludeDigits] = useState(true)
  const domainList = useStore($domainList)

  const t = useMemo(() => useTranslations(lang as language), [])

  const pasteError = useMemo(() => {
    if (!pasteMode || !pasteValue) {
      return ""
    }
    if (!EMAIL_REGEX.test(pasteValue)) {
      return t("invalidEmailFormat")
    }
    const domain = pasteValue.split("@")[1]
    if (!domainList.includes(domain)) {
      return t("unsupportedDomain")
    }
    return ""
  }, [pasteMode, pasteValue, domainList])

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
      setPasteMode(false)
      setPasteValue("")
    }
  }

  function onTogglePasteMode() {
    if (!pasteMode) {
      setPasteValue(address)
    } else if (!pasteError && pasteValue) {
      setAddress(pasteValue)
    }
    setPasteMode(!pasteMode)
  }

  function onConfirm() {
    const finalAddress = pasteMode ? pasteValue : address
    if (pasteMode && (pasteError || !finalAddress)) {
      return
    }
    if (finalAddress === $address.get()) {
      return
    }
    updateAddress(finalAddress)
    toast.success(t("changeNew") + " " + finalAddress)
  }

  function onRandomUsername() {
    if (!address || !address.includes("@")) {
      toast.error("Please select a domain first")
      return
    }
    const currentDomain = address.split("@")[1]
    const newUsername = randomUsername(includeDigits)
    setAddress(`${newUsername}@${currentDomain}`)
  }

  function onRandomAll() {
    if (domainList.length === 0) {
      toast.error("No domain available")
      return
    }
    const randomDomain =
      domainList[Math.floor(Math.random() * domainList.length)]
    const newAddress = randomAddress(randomDomain, includeDigits)
    setAddress(newAddress)
  }

  return (
    <AlertDialog onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="w-[95vw] max-w-md rounded-lg p-4 sm:w-full sm:p-6">
        <AlertDialogHeader>
          <div className="flex items-center justify-between gap-2">
            <AlertDialogTitle className="text-base sm:text-lg">
              {t("edit")}
            </AlertDialogTitle>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onTogglePasteMode}
              title={pasteMode ? t("selectDomain") : t("pasteEmail")}
            >
              {pasteMode ? (
                <HiOutlineViewList className="size-4" />
              ) : (
                <HiOutlinePencil className="size-4" />
              )}
            </Button>
          </div>
          <AlertDialogDescription className="flex items-center justify-center gap-1 text-xs sm:justify-start sm:text-sm">
            <HiOutlineExclamationCircle size={18} className="shrink-0" />
            <span>{t("editWarn")}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {!pasteMode && address && (
          <div className="bg-secondary rounded-sm border p-3">
            <div className="line-clamp-1 font-mono text-sm leading-relaxed break-all">
              {address}
            </div>
          </div>
        )}
        {pasteMode ? (
          <div className="flex flex-col gap-1.5">
            <Input
              className="h-9 font-mono text-sm"
              value={pasteValue}
              onChange={(e) => setPasteValue(e.currentTarget.value.trim())}
              placeholder={t("pasteEmailPlaceholder")}
              aria-invalid={!!pasteError}
              autoFocus
            />
            {pasteError && (
              <span className="text-destructive text-xs">{pasteError}</span>
            )}
          </div>
        ) : (
          <>
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
            <label className="flex items-center gap-2 text-sm select-none">
              <Checkbox
                checked={includeDigits}
                onCheckedChange={(v) => setIncludeDigits(v === true)}
              />
              {t("includeDigits")}
            </label>
          </>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel className="h-9 text-sm">
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={pasteMode && (!!pasteError || !pasteValue)}
            className="h-9 text-sm"
          >
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default EditAddress
