import React, { useMemo } from "react"
import { Button } from "@/components/ui/button.tsx"
import { Dices, FilePenLine, GalleryVerticalEnd } from "lucide-react"
import { $address, $domainList, updateAddress } from "@/lib/store/store.ts"
import { randomAddress } from "@/lib/utils.ts"
import { toast } from "sonner"
import EditAddress from "@/components/EditAddress.tsx"
import History from "@/components/History.tsx"
import { type language, useTranslations } from "@/i18n/ui.ts"
import { clsx } from "clsx"
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
} from "@/components/ui/alert-dialog.tsx"

function Actions({ lang, className }: { lang: string; className?: string }) {
  const t = useMemo(() => useTranslations(lang as language), [])

  function onRandom() {
    const address = $address.get()
    const domain = address ? address.split("@")[1] : $domainList.get()[0]
    const newAddress = randomAddress(domain)
    updateAddress(newAddress)
    toast.success(t("randomNew") + " " + newAddress)
  }

  return (
    <div
      className={clsx(
        "bg-sidebar flex h-fit justify-center gap-2 border-x border-b py-2 duration-300 sm:flex-col sm:rounded-b-md sm:p-3",
        className
      )}
    >
      <EditAddress lang={lang}>
        <Button className="h-9 gap-1.5 px-3 text-sm">
          <FilePenLine className="size-4" />
          {t("edit")}
        </Button>
      </EditAddress>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="h-9 gap-1.5 px-3 text-sm">
            <Dices className="size-4" />
            {t("random")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("randomConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("randomConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={onRandom}>
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <History lang={lang}>
        <Button variant="outline" className="h-9 gap-1.5 px-3 text-sm">
          <GalleryVerticalEnd className="size-4" />
          {t("history")}
        </Button>
      </History>
    </div>
  )
}

export default Actions
