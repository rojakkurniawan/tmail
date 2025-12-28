import React, { useEffect, useMemo, useRef, useState } from "react"
import type { Attachment, Envelope } from "@/lib/types.ts"
import { Button } from "@/components/ui/button.tsx"
import { HiOutlineDownload, HiOutlineArrowLeft, HiOutlinePaperClip, HiOutlineUser, HiOutlineCalendar } from "react-icons/hi"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { fetchError, fmtDate } from "@/lib/utils.ts"
import { ABORT_SAFE } from "@/lib/constant.ts"
import { type language, useTranslations } from "@/i18n/ui"
import { EmailContent } from "@/components/EmailContent.tsx"

function Detail({
  envelope,
  lang,
  onClose,
}: {
  envelope: Envelope
  lang: string
  onClose: () => void
}) {
  const [loading, setLoading] = useState(true)
  const controller = useRef<AbortController>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [emailContent, setEmailContent] = useState<string>("")

  const t = useMemo(() => useTranslations(lang as language), [])

  useEffect(() => {
    setLoading(true)
    setAttachments([])
    setEmailContent("")
    controller.current = new AbortController()
    
    fetch("/api/fetch/" + envelope.id, { signal: controller.current.signal })
      .then((res) => res.json())
      .then((res) => {
        setAttachments(res.attachments)
        setEmailContent(res.content)
      })
      .catch(fetchError)
      .finally(() => setLoading(false))

    return () => {
      controller.current?.abort(ABORT_SAFE)
    }
  }, [envelope.id])

  function onDownload(id: string) {
    window.open(`/api/download/${id}`, "_blank")
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header with back button */}
      <div className="p-3 border-b shrink-0 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="gap-2"
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          <span className="md:hidden">{t("back")}</span>
          <span className="hidden md:inline">{t("close")}</span>
        </Button>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 md:p-6 max-w-full">
          <h1 className="text-xl font-semibold mb-4 break-words">{envelope.subject}</h1>
          
          <div className="space-y-2 text-sm mb-6">
            <div className="flex items-start gap-2">
              <HiOutlineUser className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-muted-foreground">{t("from")}: </span>
                <span className="break-all">{envelope.from}</span>
              </div>
            </div>
            {envelope.to && (
              <div className="flex items-start gap-2">
                <HiOutlineUser className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground">{t("to")}: </span>
                  <span className="break-all">{envelope.to}</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <HiOutlineCalendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{t("date")}:</span>
              <span className="break-words">{fmtDate(envelope.created_at)}</span>
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {attachments.map((a) => (
                <div
                  className="bg-secondary text-muted-foreground hover:text-foreground group flex items-center gap-1 rounded-sm border px-1.5 py-1 text-sm hover:cursor-pointer hover:shadow-xs max-w-full"
                  key={a.id}
                  onClick={() => onDownload(a.id)}
                >
                  <HiOutlineDownload
                    className="animate-in fade-in hidden duration-500 group-hover:block shrink-0"
                    size={16}
                  />
                  <HiOutlinePaperClip className="group-hover:hidden shrink-0" size={16} />
                  <span className="truncate">{a.filename}</span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-4 min-w-0">
            {loading ? (
              <div className="text-muted-foreground flex h-6.5 items-center justify-center gap-1">
                <AiOutlineLoading3Quarters className="animate-spin" size={18} />
                <span>{t("mailLoading")}</span>
              </div>
            ) : emailContent ? (
              <EmailContent body={emailContent} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Detail
