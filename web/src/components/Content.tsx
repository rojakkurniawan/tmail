import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { HiOutlineClipboardCopy, HiOutlineMail } from "react-icons/hi"
import { MdOutlineSentimentDissatisfied } from "react-icons/md"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { FiRotateCw } from "react-icons/fi"
import Actions from "@/components/Actions.tsx"
import type { Envelope } from "@/lib/types.ts"
import { fetchError, fmtDate, fmtFrom, fmtString } from "@/lib/utils.ts"
import { toast } from "sonner"
import { useStore } from "@nanostores/react"
import { $address, initStore } from "@/lib/store/store.ts"
import { ABORT_SAFE } from "@/lib/constant.ts"
import Mounted from "@/components/Mounted.tsx"
import { Skeleton } from "@/components/ui/skeleton.tsx"
import Detail from "@/components/Detail.tsx"
import { type language, useTranslations } from "@/i18n/ui.ts"
import { clsx } from "clsx"

function Content({ lang }: { lang: string }) {
  const [latestId, setLatestId] = useState(-1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Envelope | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const controller = useRef<AbortController>(null)
  const retryCount = useRef(0)
  const isPollingActive = useRef(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const address = useStore($address)

  const t = useMemo(() => useTranslations(lang as language), [])

  useEffect(() => {
    fetch("/api/domain")
      .then((res) => res.json())
      .then((res) => initStore(res))
      .catch(fetchError)

    return () => {
      isPollingActive.current = false
      controller.current?.abort(ABORT_SAFE)
    }
  }, [])

  useEffect(() => {
    if (latestId < 0 || !address) {
      return
    }

    // Start polling when latestId is set
    if (isPollingActive.current) {
      fetchLatest().catch(() => {
        // Error handling is done inside fetchLatest
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestId])

  useEffect(() => {
    if (!address) {
      return
    }
    controller.current?.abort(ABORT_SAFE)
    controller.current = new AbortController()
    retryCount.current = 0
    isPollingActive.current = true

    setLoading(true)
    setEnvelopes([])
    setSelectedEmail(null) // Reset selected email when address changes
    setLatestId(-1)
    setOffset(0)
    setHasMore(true)
    fetchAll()
      .catch(fetchError)
      .finally(() => setLoading(false))

    return () => {
      isPollingActive.current = false
    }
  }, [address])

  async function fetchAll() {
    const res = await fetch("/api/fetch?to=" + address + "&limit=50&offset=0", {
      signal: controller.current!.signal,
    })
    if (!res.ok) {
      toast.error((await res.json()).message)
      return
    }
    const list = await res.json()
    setEnvelopes(list)
    setOffset(list.length)
    setHasMore(list.length === 50)
    setLatestId(list.length > 0 ? list[0].id : 0)
  }

  const fetchMore = useCallback(async () => {
    if (loadingMore || !hasMore || !address) {
      return
    }

    setLoadingMore(true)
    try {
      const currentOffset = offset
      const res = await fetch(
        `/api/fetch?to=${address}&limit=50&offset=${currentOffset}`,
        {
          signal: controller.current!.signal,
        }
      )
      if (!res.ok) {
        toast.error((await res.json()).message)
        return
      }
      const list = await res.json()
      if (list.length === 0) {
        setHasMore(false)
      } else {
        setEnvelopes((prev) => [...prev, ...list])
        setOffset((prev) => prev + list.length)
        setHasMore(list.length === 50)
      }
    } catch (error: any) {
      if (error === ABORT_SAFE || error.name === "AbortError") {
        return
      }
      fetchError(error)
    } finally {
      setLoadingMore(false)
    }
  }, [address, offset, hasMore, loadingMore])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || !address) return

    let isScrolling = false
    const handleScroll = () => {
      if (isScrolling || loadingMore || !hasMore) return

      const { scrollTop, scrollHeight, clientHeight } = container
      // Load more when user scrolls to 80% of the content
      if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        isScrolling = true
        fetchMore().finally(() => {
          isScrolling = false
        })
      }
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [address, hasMore, loadingMore, fetchMore])

  async function fetchLatest() {
    if (!isPollingActive.current || !address) {
      return
    }

    try {
      // Create new AbortController for this request
      controller.current = new AbortController()

      const res = await fetch(
        `/api/fetch/latest?to=${address}&id=${latestId}`,
        {
          signal: controller.current.signal,
        }
      )

      if (!res.ok) {
        // Reset retry count on successful connection (even if error response)
        retryCount.current = 0

        try {
          const errorData = await res.json()
          // Only show error toast for client errors (4xx), not server errors (5xx)
          if (res.status >= 400 && res.status < 500) {
            toast.error(errorData.message || "Request failed")
          }
        } catch {
          // If response is not JSON, ignore
        }

        // Retry after 1 second
        setTimeout(() => {
          if (isPollingActive.current && address) {
            fetchLatest().catch(() => {
              // Error already handled in recursive call
            })
          }
        }, 1000)
        return
      }

      // Reset retry count on success
      retryCount.current = 0

      if (res.status === 204) {
        // No new email, continue polling immediately
        setTimeout(() => {
          if (isPollingActive.current && address) {
            fetchLatest().catch(() => {
              // Error already handled in recursive call
            })
          }
        }, 100)
        return
      }

      const e = await res.json()
      e.animate = true
      setEnvelopes((prev) => [e, ...prev])
      setLatestId(e.id)
      toast.success(fmtString(t("receiveNew"), e.from))

      // Continue polling for next email
      setTimeout(() => {
        if (isPollingActive.current && address) {
          fetchLatest().catch(() => {
            // Error already handled in recursive call
          })
        }
      }, 100)
    } catch (error: any) {
      // Handle network errors, timeouts, and abort errors
      if (error === ABORT_SAFE || error.name === "AbortError") {
        return
      }

      // Increment retry count
      retryCount.current += 1

      // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
      const delay = Math.min(1000 * Math.pow(2, retryCount.current - 1), 30000)

      // Only show error toast after multiple retries
      if (retryCount.current === 3) {
        toast.error("Connection lost. Retrying...")
      }

      // Retry with exponential backoff
      setTimeout(() => {
        if (isPollingActive.current && address) {
          fetchLatest().catch(() => {
            // Error already handled in recursive call
          })
        }
      }, delay)
    }
  }

  function copyToClipboard() {
    navigator.clipboard
      .writeText(address)
      .then(() => toast.success(t("copy") + " " + address))
      .catch((e) => toast.error(e.message ?? e))
  }

  function handleSelectEmail(envelope: Envelope) {
    setSelectedEmail(envelope)
  }

  function handleCloseEmail() {
    setSelectedEmail(null)
  }

  return (
    <div className="animate-in fade-in zoom-in-95 flex h-full w-full overflow-hidden duration-300">
      {/* Left Sidebar - Email List */}
      <div
        className={clsx(
          "flex shrink-0 flex-col border-r",
          "w-full md:w-80 lg:w-96",
          selectedEmail ? "hidden md:flex" : "flex"
        )}
      >
        {/* Actions */}
        <Actions lang={lang} />

        <div className="relative border-b">
          <div className="animate-fill absolute h-1 bg-green-400" />
          <div className="flex min-w-0 items-center">
            <div className="bg-sidebar flex h-12 min-w-0 flex-1 items-center gap-2 px-3 sm:px-4">
              <AiOutlineLoading3Quarters
                size={16}
                className="text-muted-foreground shrink-0 animate-spin"
              />
              <Mounted fallback={<Skeleton className="h-5 w-52 sm:w-64" />}>
                <span className="min-w-0 truncate font-mono text-sm font-semibold sm:text-base">
                  {address}
                </span>
              </Mounted>
            </div>
            <div
              onClick={copyToClipboard}
              className="hover:bg-sidebar flex h-12 shrink-0 items-center border-l px-3 transition-colors hover:cursor-pointer"
            >
              <HiOutlineClipboardCopy size={18} />
            </div>
          </div>
        </div>
        <div
          ref={scrollContainerRef}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          {envelopes.length === 0 && (
            <div className="text-muted-foreground flex items-center justify-center gap-1 py-5.5">
              {loading ? (
                <>
                  <FiRotateCw className="animate-spin" size={20} />
                  <span>{t("listLoading")}</span>
                </>
              ) : (
                <>
                  <MdOutlineSentimentDissatisfied size={16} />
                  <span className="text-sm">{t("listEmpty")}</span>
                </>
              )}
            </div>
          )}
          {envelopes.map((envelope) => (
            <div
              key={envelope.id}
              onClick={() => handleSelectEmail(envelope)}
              className={clsx(
                "hover:bg-secondary group text-muted-foreground space-y-1 border-b px-3 py-2 transition-colors duration-300 hover:cursor-pointer sm:px-4",
                envelope.animate && "animate-in fade-in slide-in-from-top-2",
                selectedEmail?.id === envelope.id && "bg-accent"
              )}
            >
              <div className="flex min-w-0 items-center gap-1">
                <span className="text-foreground line-clamp-1 min-w-0 flex-1 text-sm font-medium break-words sm:text-base">
                  {envelope.subject}
                </span>
                {envelope.to != address && (
                  <span className="text-muted-foreground ml-auto shrink-0 text-xs sm:text-sm">
                    {envelope.to}
                  </span>
                )}
              </div>
              <div className="text-muted-foreground flex min-w-0 justify-between gap-2 text-xs sm:text-sm">
                <div className="min-w-0 flex-1 truncate">
                  {fmtFrom(envelope.from)}
                </div>
                <div className="shrink-0">{fmtDate(envelope.created_at)}</div>
              </div>
            </div>
          ))}
          {loadingMore && (
            <div className="text-muted-foreground flex items-center justify-center gap-1 py-4">
              <FiRotateCw className="animate-spin" size={16} />
              <span className="text-sm">{t("listLoading")}</span>
            </div>
          )}
          {!hasMore && envelopes.length > 0 && (
            <div className="text-muted-foreground flex items-center justify-center py-4 text-sm">
              No more emails
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Email Detail */}
      <div
        className={clsx(
          "flex min-w-0 flex-1 flex-col overflow-hidden",
          selectedEmail ? "flex" : "hidden md:flex"
        )}
      >
        {!selectedEmail ? (
          <div className="text-muted-foreground flex flex-1 items-center justify-center">
            <div className="text-center">
              <HiOutlineMail className="mx-auto mb-4 h-12 w-12 opacity-20" />
              <p>{t("selectEmail")}</p>
            </div>
          </div>
        ) : (
          <Detail
            lang={lang}
            envelope={selectedEmail}
            onClose={handleCloseEmail}
          />
        )}
      </div>
    </div>
  )
}

export default Content
