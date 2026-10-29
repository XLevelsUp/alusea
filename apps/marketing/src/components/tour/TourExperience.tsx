"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Globe, Hand, LogOut, Maximize, Menu, Minimize, Share2, X } from "lucide-react";
import { TOUR_SPOTS, TOUR_START_ID, liveHotspots, type TourHotspot } from "@/lib/tour";
import TourFallback from "./TourFallback";
import TourHotspotPanel from "./TourHotspotPanel";
import type { TourControl } from "./TourViewer";

// Three.js and the viewer only run in the browser.
const TourViewer = dynamic(() => import("./TourViewer"), { ssr: false, loading: () => <TourLoading /> });

// The tour's own address, shared by the Share button.
export const TOUR_PATH = "/vr-room";

function TourLoading() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-plate-white">
      <span aria-hidden="true" className="size-10 animate-spin rounded-full border-2 border-white/25 border-t-white" />
      <p className="text-sm tracking-wide">Opening the showroom…</p>
    </div>
  );
}

// The 360° view needs WebGL; without it the page shows still pictures instead of a blank screen.
function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

// Round dark buttons in the corners, as in the reference tour; the label shows beside the icon on wider screens.
const cornerButton =
  "pointer-events-auto flex h-11 items-center gap-2 rounded-full bg-black/60 px-3.5 text-sm font-medium text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
const cornerLabel = "sr-only sm:not-sr-only";

/** The virtual showroom, filling the whole screen on its own page. */
export default function TourExperience() {
  const router = useRouter();
  const controlRef = useRef<TourControl | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [spotId, setSpotId] = useState(TOUR_START_ID);
  const onSpotChange = useCallback((id: string) => setSpotId(id), []);
  const [showHint, setShowHint] = useState(true);
  const hideHint = useCallback(() => setShowHint(false), []);

  // Decided once, when the page opens.
  const [canDraw3d] = useState(supportsWebGL);
  const [failed, setFailed] = useState(false);
  const onError = useCallback(() => setFailed(true), []);
  const showFallback = !canDraw3d || failed;

  // The buttons and the hint wait until the opening globe has landed at the Entrance; the still-picture page needs no wait.
  const [landed, setLanded] = useState(false);
  const onIntroEnd = useCallback(() => setLanded(true), []);
  const controlsShown = landed || showFallback;

  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // The hotspot whose panel is open, if any.
  const [hotspot, setHotspot] = useState<{ spotName: string; item: TourHotspot } | null>(null);
  function onHotspot(id: string, hotspotId: string) {
    const spot = TOUR_SPOTS.find((entry) => entry.id === id);
    const item = spot?.hotspots?.find((entry) => entry.id === hotspotId);
    if (spot && item) {
      setMenuOpen(false);
      setHotspot({ spotName: spot.name, item });
    }
  }

  // Escape closes the product panel or the Menu, whichever is open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setHotspot(null);
      setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The "drag to look around" hint shows after the landing and fades away on its own after a few seconds.
  useEffect(() => {
    if (!landed) return;
    const timer = window.setTimeout(() => setShowHint(false), 4500);
    return () => window.clearTimeout(timer);
  }, [landed]);

  // The full-screen button shows the right icon even when the visitor leaves full screen with the Escape key.
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // A short message near the bottom that clears itself, used after sharing.
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Exit goes back to the page the visitor came from on this site, or to the home page when the tour was opened directly.
  function exit() {
    const cameFromSite = document.referrer && new URL(document.referrer).origin === window.location.origin;
    if (cameFromSite && window.history.length > 1) router.back();
    else router.push("/");
  }

  async function share() {
    const url = `${window.location.origin}${TOUR_PATH}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Alusea Virtual Showroom", text: "Walk through the Alusea showroom in 360°", url });
        return;
      } catch (error) {
        // Closing the share sheet without sharing is not an error worth showing; any other failure falls back to copying.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Link copied");
    } catch {
      setNotice(url);
    }
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen?.();
  }

  function goTo(id: string) {
    setMenuOpen(false);
    if (id !== spotId) controlRef.current?.goTo(id);
  }

  // The corner buttons fade in together once the tour has landed.
  const fadeIn = `transition-[opacity,visibility] duration-500 ${controlsShown ? "visible opacity-100" : "invisible opacity-0"}`;

  const here = TOUR_SPOTS.find((spot) => spot.id === spotId);
  const hereHotspots = here ? liveHotspots(here) : [];

  return (
    <div ref={rootRef} className="absolute inset-0 bg-blueberry">
      <h1 className="sr-only">Alusea Virtual Showroom</h1>

      {showFallback ? (
        <TourFallback />
      ) : (
        <TourViewer
          startId={TOUR_START_ID}
          controlRef={controlRef}
          onSpotChange={onSpotChange}
          onInteract={hideHint}
          onIntroEnd={onIntroEnd}
          onHotspot={onHotspot}
          onError={onError}
        />
      )}

      {/* The logo in the top corner, as on the site; it leads home too. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent" />
      <Link href="/" aria-label="Alusea home" className="absolute left-4 top-3 sm:left-6 sm:top-4">
        <Image src={showFallback ? "/images/alusea-logo-dark.svg" : "/images/alusea-logo-white.svg"} alt="Alusea" width={350} height={192} priority className="h-14 w-auto sm:h-16" />
      </Link>
      <p aria-live="polite" className="sr-only">
        {showFallback || !here ? "" : `Now at ${here.name}`}
      </p>

      {/* Bottom left: leave the tour, or go to the website. */}
      <div className={`pointer-events-none absolute bottom-4 left-4 flex flex-col gap-2.5 sm:bottom-6 sm:left-6 ${fadeIn}`}>
        <button type="button" onClick={exit} className={cornerButton}>
          <LogOut aria-hidden="true" className="size-4" />
          <span className={cornerLabel}>Exit</span>
        </button>
        <Link href="/" className={cornerButton}>
          <Globe aria-hidden="true" className="size-4" />
          <span className={cornerLabel}>Website</span>
        </Link>
      </div>

      {/* Bottom right: the Menu, Share and Full screen. */}
      {!showFallback && (
        <div className={`pointer-events-none absolute bottom-4 right-4 flex flex-col items-end gap-2.5 sm:bottom-6 sm:right-6 ${fadeIn}`}>
          <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="tour-menu" className={cornerButton}>
            <Menu aria-hidden="true" className="size-4" />
            <span className={cornerLabel}>Menu</span>
          </button>
          <button type="button" onClick={share} className={cornerButton}>
            <Share2 aria-hidden="true" className="size-4" />
            <span className={cornerLabel}>Share</span>
          </button>
          <button type="button" onClick={toggleFullscreen} className={cornerButton}>
            {isFullscreen ? <Minimize aria-hidden="true" className="size-4" /> : <Maximize aria-hidden="true" className="size-4" />}
            <span className={cornerLabel}>{isFullscreen ? "Exit full screen" : "Full screen"}</span>
          </button>
        </div>
      )}

      {/* The Menu: every part of the showroom, and the products in the part the visitor is standing in. */}
      {menuOpen && !showFallback && (
        <nav id="tour-menu" aria-label="Showroom menu" className="tour-panel-in absolute bottom-[184px] right-4 z-30 max-h-[calc(100svh-264px)] w-[min(320px,calc(100vw-2rem))] overflow-y-auto rounded-3xl bg-plate-white p-5 text-blueberry shadow-2xl sm:bottom-[192px] sm:right-6">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-berry-bloom">Showroom</p>
            <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close the menu" className="flex size-8 items-center justify-center rounded-full hover:bg-stem-grey/25">
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
          <ul className="mt-2">
            {TOUR_SPOTS.map((spot) => (
              <li key={spot.id}>
                <button
                  type="button"
                  onClick={() => goTo(spot.id)}
                  aria-current={spot.id === spotId ? "location" : undefined}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[15px] transition-colors hover:bg-stem-grey/20 ${spot.id === spotId ? "font-semibold" : ""}`}
                >
                  {spot.name}
                  {spot.id === spotId && <span className="size-2 rounded-full bg-blueberry" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
          {hereHotspots.length > 0 && (
            <>
              <p className="mt-4 border-t border-stem-grey/40 pt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-berry-bloom">Products here</p>
              <ul className="mt-2">
                {hereHotspots.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => onHotspot(spotId, item.id)} className="w-full rounded-xl px-3 py-2.5 text-left text-[15px] transition-colors hover:bg-stem-grey/20">
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>
      )}

      {hotspot && <TourHotspotPanel spotName={hotspot.spotName} hotspot={hotspot.item} onClose={() => setHotspot(null)} />}

      {notice && (
        <p role="status" className="absolute bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-black/75 px-4 py-2 text-sm text-white">
          {notice}
        </p>
      )}

      {/* A one-time hint for first-time visitors. */}
      {!showFallback && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-full bg-black/55 px-5 py-3 text-sm text-white backdrop-blur-sm transition-opacity duration-500 ${showHint && landed ? "opacity-100" : "opacity-0"}`}
        >
          <Hand aria-hidden="true" className="size-5" />
          Drag to look around, tap the arrows to walk
        </div>
      )}
    </div>
  );
}
