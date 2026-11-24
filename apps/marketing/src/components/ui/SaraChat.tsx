"use client";

import { Maximize2, Minimize2, MoreHorizontal, PhoneCall, Plus, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Sara, the AI sales agent, runs on her own subdomain (services/ai). Her page is shown here in a panel,
// so chat, voice calls and the mic all work without copying her code into this site.
const SARA_URL = (process.env.NEXT_PUBLIC_AI_URL || "https://ai.alusea.in").replace(/\/$/, "");
const SARA_ORIGIN = new URL(SARA_URL).origin;

// On the phone button, a soft halo breathes around Sara's picture. Change GLOW to recolour it. Kept with the button.
const GLOW = { ring: "245, 246, 243", halo: "92, 107, 138" }; // Plate White ring, Berry Bloom halo
const GLOW_STYLES = `
.sara-glow { display: none; }
@media (max-width: 767px) and (prefers-reduced-motion: no-preference) {
  .sara-glow {
    display: block;
    box-shadow: 0 0 0 2px rgba(${GLOW.ring}, 0.55), 0 0 12px 2px rgba(${GLOW.halo}, 0.35);
    animation: sara-glow 2.4s ease-in-out infinite;
  }
}
@keyframes sara-glow {
  0%, 100% { box-shadow: 0 0 0 2px rgba(${GLOW.ring}, 0.55), 0 0 12px 2px rgba(${GLOW.halo}, 0.35); }
  50% { box-shadow: 0 0 0 5px rgba(${GLOW.ring}, 0.35), 0 0 24px 8px rgba(${GLOW.halo}, 0.6); }
}
`;

// While Sara's page loads, a navy ring turns around her picture and the dots after "Sara is loading" count up.
const LOADER_STYLES = `
@keyframes sara-loading-dots { 0% { content: ""; } 25% { content: "."; } 50% { content: ".."; } 75% { content: "..."; } }
.sara-loading-dots::after { content: ""; animation: sara-loading-dots 1.4s steps(1) infinite; }
@media (prefers-reduced-motion: reduce) { .sara-loading-dots::after { content: "..."; animation: none; } }
`;

const LANGUAGES = [
  { code: "en-IN", label: "EN", name: "English" },
  { code: "ta-IN", label: "தமிழ்", name: "Tamil" },
  { code: "ml-IN", label: "മലയാളം", name: "Malayalam" },
  { code: "te-IN", label: "తెలుగు", name: "Telugu" },
  { code: "kn-IN", label: "ಕನ್ನಡ", name: "Kannada" },
];

function SaraPicture({ size, className = "" }: { size: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/sara.webp"
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-full shadow-[0_4px_12px_-4px_rgba(0,0,0,0.35)] ${className}`}
    />
  );
}

export default function SaraChat() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  // Full screen on larger screens. Phones always get full screen.
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Sara reports her language and whether she's on a call; the chips and menu follow her.
  const [language, setLanguage] = useState("en-IN");
  const [onCall, setOnCall] = useState(false);
  // Sara's page can take a few seconds to start, so a loader covers the panel until it has loaded.
  const [loaded, setLoaded] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== SARA_ORIGIN || event.source !== frame.current?.contentWindow) return;
      const data = event.data;
      if (data?.source !== "sara" || data.type !== "state") return;
      if (LANGUAGES.some((item) => item.code === data.language)) setLanguage(data.language);
      setOnCall(Boolean(data.busy));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const tellSara = useCallback((type: string, value?: string) => {
    frame.current?.contentWindow?.postMessage({ source: "alusea-site", type, value }, SARA_ORIGIN);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setExpanded(false);
    setMenuOpen(false);
    setOnCall(false);
    setLoaded(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    // Escape closes the menu, then leaves full screen, then closes the chat.
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (menuOpen) setMenuOpen(false);
      else if (expanded) setExpanded(false);
      else close();
    };
    // When the panel fills the screen, the page behind it shouldn't scroll.
    const previousOverflow = document.body.style.overflow;
    if (expanded || window.matchMedia("(max-width: 767px)").matches) document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("keydown", onEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, expanded, menuOpen, close]);

  // Client-only to avoid hydration mismatch, and hidden on the admin panel
  if (!mounted || pathname?.startsWith("/admin")) return null;

  const menuItem = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-blueberry hover:bg-plate-white disabled:opacity-50 disabled:hover:bg-transparent";

  return (
    <>
      {!open && (
        // Phones show just Sara's picture with a soft breathing glow, the size of the WhatsApp button below it.
        // Larger screens show "Chat with Sara" beside her picture.
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Chat with Sara"
          className="fixed bottom-24 right-6 md:bottom-28 md:right-8 z-50 flex size-14 items-center justify-center gap-2.5 rounded-full border border-white/15 bg-gradient-to-br from-[#34405e] to-[#283149] text-white shadow-[0_14px_30px_-12px_rgba(15,20,35,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] transition-transform duration-300 hover:-translate-y-0.5 animate-in fade-in zoom-in duration-500 md:h-[50px] md:w-auto md:justify-start md:pl-1.5 md:pr-[18px]"
        >
          <style>{GLOW_STYLES}</style>
          <span aria-hidden="true" className="sara-glow pointer-events-none absolute inset-0 rounded-full" />
          <SaraPicture size={38} className="relative size-12 md:size-[38px]" />
          <span aria-hidden="true" className="hidden font-[family-name:var(--font-outfit)] text-[15.5px] font-medium tracking-[0.01em] md:inline">
            Chat with Sara
          </span>
        </button>
      )}

      {/* Closing removes Sara's page, which ends any call in progress. Her chat history loads again on reopening. */}
      {/* In full screen on larger screens, the site behind is dimmed. Clicking it returns the chat to its corner. */}
      {open && expanded && (
        <div
          aria-hidden="true"
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-[59] hidden bg-[#141a2b]/55 backdrop-blur-[6px] animate-in fade-in duration-300 md:block"
        />
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Chat with Sara"
          aria-modal={expanded || undefined}
          // Only the classes change between sizes, so Sara's page (and any call) carries on uninterrupted.
          className={`fixed inset-0 z-[60] flex flex-col overflow-hidden bg-plate-white animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            expanded
              ? "md:inset-6 md:mx-auto md:max-w-[1180px] md:rounded-[28px] md:shadow-[0_50px_120px_-30px_rgba(5,8,18,0.8),0_0_0_1px_rgba(255,255,255,0.5),0_0_0_8px_rgba(255,255,255,0.12)] lg:inset-y-8"
              : "md:inset-auto md:bottom-8 md:right-8 md:w-[400px] md:h-[min(660px,calc(100dvh-4rem))] md:rounded-[26px] md:shadow-[0_40px_90px_-24px_rgba(10,14,28,0.7),0_0_0_1px_rgba(255,255,255,0.55),0_0_0_7px_rgba(255,255,255,0.14)]"
          }`}
        >
          {/* Header: Sara, her languages and the panel's controls, on brushed Blueberry with a gold trim. */}
          <div
            className="relative shrink-0 px-4 pb-3.5 pt-[max(1rem,env(safe-area-inset-top))] text-white"
            style={{
              background:
                "repeating-linear-gradient(90deg, rgba(255,255,255,.035) 0 1px, transparent 1px 3px), radial-gradient(120% 140% at 0% 0%, #46557a 0%, #2F3A55 55%, #262f47 100%)",
            }}
          >
            <div className="flex items-center gap-3">
              <SaraPicture size={42} />
              <div className="min-w-0">
                <p className="font-[family-name:var(--font-outfit)] text-[19px] font-medium leading-tight">Sara</p>
                <p className="truncate text-xs text-white/70">Alusea&apos;s AI showroom advisor</p>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-1.5">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((value) => !value)}
                    aria-label="More options"
                    aria-expanded={menuOpen}
                    title="More options"
                    className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] transition-colors hover:bg-white/15"
                  >
                    <MoreHorizontal className="size-[18px]" aria-hidden="true" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-[calc(100%+8px)] z-10 w-52 rounded-2xl bg-white p-1.5 shadow-[0_16px_40px_-12px_rgba(47,58,85,0.45)] animate-in fade-in slide-in-from-top-1 duration-150">
                      <button
                        type="button"
                        disabled={onCall}
                        onClick={() => {
                          tellSara("call-back");
                          setMenuOpen(false);
                        }}
                        className={menuItem}
                      >
                        <PhoneCall className="size-4" aria-hidden="true" />
                        Call me back
                      </button>
                      <button
                        type="button"
                        disabled={onCall}
                        onClick={() => {
                          tellSara("new-chat");
                          setMenuOpen(false);
                        }}
                        className={menuItem}
                      >
                        <Plus className="size-4" aria-hidden="true" />
                        New chat
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded((value) => !value)}
                  aria-label={expanded ? "Exit full screen" : "Full screen"}
                  title={expanded ? "Exit full screen" : "Full screen"}
                  className="hidden size-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] transition-colors hover:bg-white/15 md:flex"
                >
                  {expanded ? <Minimize2 className="size-4" aria-hidden="true" /> : <Maximize2 className="size-4" aria-hidden="true" />}
                </button>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close chat"
                  title="Close"
                  autoFocus
                  className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] transition-colors hover:bg-white/15"
                >
                  <X className="size-[18px]" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex gap-1.5 overflow-x-auto [scrollbar-width:none]" role="group" aria-label="Sara's language">
              {LANGUAGES.map((item) => {
                const active = item.code === language;
                return (
                  <button
                    key={item.code}
                    type="button"
                    lang={item.code.slice(0, 2)}
                    aria-pressed={active}
                    aria-label={item.name}
                    disabled={onCall}
                    title={onCall ? "Sara follows the language you speak during a call" : item.name}
                    onClick={() => tellSara("language", item.code)}
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed ${
                      active
                        ? "border-transparent bg-champagne font-semibold text-blueberry"
                        : "border-white/10 bg-white/[0.08] text-white/85 hover:bg-white/15 disabled:opacity-50 disabled:hover:bg-white/[0.08]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-0.5 opacity-90"
              style={{ background: "linear-gradient(90deg, transparent, #F2C14E 30%, #f7dc9a 50%, #F2C14E 70%, transparent)" }}
            />
          </div>

          <div className="relative flex flex-1 flex-col">
            <iframe
              ref={frame}
              src={`${SARA_URL}/?embed=1`}
              title="Sara, Alusea's AI assistant"
              allow="microphone; autoplay; clipboard-write"
              onLoad={() => {
                setLoaded(true);
                tellSara("hello");
              }}
              onFocus={() => setMenuOpen(false)}
              className="w-full flex-1 border-0 bg-plate-white"
            />
            {/* Covers Sara's page until it has loaded, then fades out. It stays in place while fading, so nothing flickers. */}
            <div
              role="status"
              aria-hidden={loaded || undefined}
              className={`absolute inset-0 flex flex-col items-center justify-center gap-4 bg-plate-white transition-opacity duration-300 ${
                loaded ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
            >
              <style>{LOADER_STYLES}</style>
              {/* Bigger in full screen on larger screens, where the small panel's size looks lost. */}
              <div className={`relative grid size-[84px] place-items-center ${expanded ? "md:size-[132px]" : ""}`}>
                <span
                  aria-hidden="true"
                  className={`absolute inset-0 animate-spin rounded-full border-[3px] border-blueberry/[0.12] border-t-blueberry [animation-duration:0.9s] motion-reduce:animate-none ${
                    expanded ? "md:border-4" : ""
                  }`}
                />
                <SaraPicture size={64} className={expanded ? "md:size-[104px]" : ""} />
              </div>
              <p className={`font-[family-name:var(--font-outfit)] text-sm font-medium text-blueberry ${expanded ? "md:text-lg" : ""}`}>
                Sara is loading<span aria-hidden="true" className="sara-loading-dots inline-block w-[1.2em] text-left" />
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
