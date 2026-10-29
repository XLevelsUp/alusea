"use client";

import { useEffect, useRef, type RefObject } from "react";
import { Viewer, utils } from "@photo-sphere-viewer/core";
import { AutorotatePlugin } from "@photo-sphere-viewer/autorotate-plugin";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import { VirtualTourPlugin, type VirtualTourLink, type VirtualTourNode } from "@photo-sphere-viewer/virtual-tour-plugin";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import "@photo-sphere-viewer/virtual-tour-plugin/index.css";
import { TOUR_ARROW_PITCH, TOUR_SPOTS, liveHotspots, type TourLink, type TourSpot } from "@/lib/tour";

// What the page around the viewer can ask it to do.
export type TourControl = {
  // Walks straight to a spot, as the Menu does.
  goTo: (spotId: string) => void;
};

// Where the visitor lands at the Entrance: facing the doors at eye level, at the usual zoom.
const LANDING_ZOOM = 20;

// The opening "little planet": the Entrance seen from above as a small spinning globe, which then swoops down to eye level.
const INTRO = {
  // How long the whole opening takes, in milliseconds.
  duration: 3800,
  // The globe starts a turn and a quarter away from the landing direction, so it visibly spins as it settles.
  startYaw: -2.5 * Math.PI,
  // Share of the opening spent as a spinning globe before the swoop down begins.
  holdShare: 0.3,
  // A wider-than-usual view and a strong fisheye are what curl the room into a globe.
  startFov: 130,
  endFov: 90,
  fisheye: 2,
};

// The walk between spots: depth is how far the camera moves forward inside the photo sphere (whose radius is 10), walk is how long the walk and its crossfade take, and fade is for the Menu and for less motion; times are in milliseconds.
const WALK = { depth: 3.5, walk: 1500, fade: 900 };

const easeOutCubic =(t: number) => 1 - (1 - t) ** 3;
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

// Every device gets the lighter 4096-wide copy of each photo: it opens about twice as fast as the full one, which keeps the step between spots smooth.
function panoramaFor(spot: TourSpot): string {
  return `/tour/${spot.image}-m.webp`;
}

// Hotspot titles go inside the hotspot's HTML, so quotes and angle brackets are made safe first.
const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// What each arrow carries besides its place: the way its chevron points and the way to face on arrival.
type LinkData = Pick<TourLink, "yaw" | "points" | "face" | "zoom" | "panTo">;

// How far the chevron turns from pointing up.
const CHEVRON_TURN = { down: 180, left: -90, right: 90 } as const;

// A dark round arrow with a white chevron, tilted back so it reads as lying on the floor; it stays where it is placed in the room.
function arrowElement(link: VirtualTourLink): HTMLElement {
  const button = document.createElement("button");
  button.type = "button";
  const points = (link.data as LinkData | undefined)?.points;
  button.className = "tour-arrow";
  button.dataset.node = link.nodeId;
  button.setAttribute("aria-label", points === "down" ? "Walk back" : "Walk this way");
  button.innerHTML = `<span class="tour-arrow-disc" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(${points ? CHEVRON_TURN[points] : 0}deg)"><path d="M6 15l6-6 6 6"/></svg></span>`;
  return button;
}

// Text hotspots carry a plus, film hotspots a play sign, so visitors can tell what waits behind each one.
const ICON_PLUS = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 6v12M6 12h12"/></svg>';
const ICON_PLAY = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z"/></svg>';

// The floor arrows from a spot to its neighbours.
function toLinks(spot: TourSpot): VirtualTourLink[] {
  return spot.links.map((link) => ({ nodeId: link.to, position: { yaw: `${link.yaw}deg`, pitch: `${link.pitch ?? TOUR_ARROW_PITCH}deg` }, data: { yaw: link.yaw, points: link.points, face: link.face, zoom: link.zoom, panTo: link.panTo } satisfies LinkData }));
}

// The product hotspots in a spot.
function toMarkers(spot: TourSpot): NonNullable<VirtualTourNode["markers"]> {
  return liveHotspots(spot).map((hotspot) => ({
    id: hotspot.id,
    position: { yaw: `${hotspot.yaw}deg`, pitch: `${hotspot.pitch}deg` },
    html: `<span class="tour-hotspot" role="button" tabindex="0" data-hotspot="${escapeHtml(hotspot.id)}" aria-label="${escapeHtml(hotspot.title)}">${hotspot.video ? ICON_PLAY : ICON_PLUS}</span>`,
    size: { width: 46, height: 46 },
    anchor: "center center",
    tooltip: hotspot.title,
    data: { spotId: spot.id, hotspotId: hotspot.id },
  }));
}

// Turns the tour list into the viewer's spots: floor arrows to the neighbouring spots, and the product hotspots.
function toNodes(spots: TourSpot[]): VirtualTourNode[] {
  return spots.map((spot) => ({ id: spot.id, panorama: panoramaFor(spot), links: toLinks(spot), markers: toMarkers(spot) }));
}

type ViewerCallbacks = {
  // The spot the visitor has just arrived at.
  onSpotChange: (id: string) => void;
  // The first time the visitor turns the view.
  onFirstMove: () => void;
  // The opening globe has landed (or was skipped), so the page can show its buttons.
  onIntroEnd: () => void;
  // A hotspot was tapped or chosen with the keyboard.
  onHotspot: (spotId: string, hotspotId: string) => void;
};

// Builds the walkable 360° tour with its arrows, hotspots and slow turning when left alone.
function createViewer(container: HTMLDivElement, startId: string, callbacks: ViewerCallbacks): { viewer: Viewer; control: TourControl; currentSpot: () => string } {
  const stillMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // The opening globe plays once, when the tour first opens, and never for visitors who ask for less motion.
  const withIntro = !stillMotion;
  // Arrows and hotspots stay hidden while the globe turns, and fade in once it lands.
  if (withIntro) container.classList.add("tour-intro");

  const viewer = new Viewer({
    container,
    loadingTxt: "Loading the room…",
    ...(withIntro
      ? { defaultZoomLvl: 0, defaultYaw: INTRO.startYaw, defaultPitch: -Math.PI / 2, maxFov: INTRO.startFov, fisheye: INTRO.fisheye }
      : { defaultZoomLvl: LANDING_ZOOM }),
    // Zooming with the wheel works without holding Ctrl, since the tour fills the whole screen.
    mousewheelCtrlKey: false,
    touchmoveTwoFingers: false,
    // The arrow keys turn the view and + and - zoom.
    keyboard: "always",
    // The page draws its own buttons around the room.
    navbar: false,
    plugins: [
      MarkersPlugin,
      // When nobody touches the view for a few seconds it slowly turns, to show the whole room; never for visitors who ask for less motion.
      AutorotatePlugin.withConfig({
        autostartDelay: stillMotion ? undefined : 4000,
        autostartOnIdle: !stillMotion,
        autorotateSpeed: "1rpm",
        autorotatePitch: "0deg",
      }),
      VirtualTourPlugin.withConfig({
        positionMode: "manual",
        // The arrows are placed in the room itself, so they stay put on the floor as the view turns.
        renderMode: "2d",
        showLinkTooltip: false,
        arrowStyle: { element: arrowElement, size: { width: 72, height: 72 } },
        nodes: toNodes(TOUR_SPOTS),
        startNodeId: startId,
        // The photos one step away are fetched in advance, so walking on is quick.
        preload: true,
        // Every move crossfades into the next spot at eye level, facing the way the arrow led or the direction it names; an arrow's walk also moves the camera through the room while it fades.
        transitionOptions: (_node, _fromNode, fromLink) => {
          const data = fromLink?.data as LinkData | undefined;
          if (!data) return { showLoader: false, speed: WALK.fade, effect: "fade", rotation: false };
          return { showLoader: false, speed: stillMotion ? WALK.fade : WALK.walk, effect: "fade", rotation: false, rotateTo: { yaw: ((data.face ?? data.yaw) * Math.PI) / 180, pitch: 0 }, zoomTo: data.zoom ?? LANDING_ZOOM };
        },
      }),
    ],
  });

  const tour = viewer.getPlugin<VirtualTourPlugin>(VirtualTourPlugin);
  const markers = viewer.getPlugin<MarkersPlugin>(MarkersPlugin);

  // The 3D scene the photos are drawn in; only the camera and the newly added photo are moved, so plain shapes are enough here.
  type Movable = { position: { set: (x: number, y: number, z: number) => void } };
  const scene3d = viewer.renderer as unknown as { scene: { add: (...objects: Movable[]) => unknown }; camera: Movable };

  // Walking as in street-view maps: each photo sits on a sphere, the next spot's sphere is placed a step ahead towards the arrow, and the camera walks from this sphere's centre into that one's while the two crossfade.
  const walkThrough = (data: LinkData) => {
    const step = viewer.dataHelper.sphericalCoordsToVector3({ yaw: (data.yaw * Math.PI) / 180, pitch: 0 }, undefined, WALK.depth);
    const add = scene3d.scene.add;
    // The viewer adds the next photo to the scene once it is ready; that is when it is moved ahead and the walk begins.
    scene3d.scene.add = (...objects) => {
      scene3d.scene.add = add;
      objects[0]?.position.set(step.x, step.y, step.z);
      const start = performance.now();
      const frame = (now: number) => {
        const progress = Math.min(1, (now - start) / WALK.walk);
        const along = easeInOutSine(progress);
        scene3d.camera.position.set(step.x * along, step.y * along, step.z * along);
        viewer.needsUpdate();
        if (progress < 1 && walking) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
      return add.apply(scene3d.scene, objects);
    };
  };

  // Taking an arrow walks through to the next spot, with no loader; the Menu fades straight there.
  const walkTo = tour.setCurrentNode.bind(tour);
  let walking = false;
  tour.setCurrentNode = (nodeId, options, fromLink) => {
    const data = fromLink?.data as LinkData | undefined;
    if (!data || stillMotion) return walkTo(nodeId, options, fromLink);
    // A second tap while already walking is ignored, so steps never stack up.
    if (walking) return Promise.resolve(false);
    walking = true;
    walkThrough(data);
    return walkTo(nodeId, options, fromLink).finally(() => {
      walking = false;
      // The viewer re-centres the camera on arrival; this makes sure of it if the walk was interrupted.
      scene3d.camera.position.set(0, 0, 0);
      viewer.needsUpdate();
    });
  };
  let currentSpot = startId;

  // The viewer's idle clock decides when the slow spin starts; it has these methods, though its types leave them out.
  const idleClock = viewer as unknown as { disableIdleTimer: () => void; resetIdleTimer: () => void };

  // Lands at eye level: used when the opening ends, and when the visitor skips it with a tap, drag, scroll or key.
  let introDone = !withIntro;
  let introAnimation: utils.Animation | null = null;
  const skipEvents = ["pointerdown", "wheel", "keydown"] as const;
  const finishIntro = () => {
    if (introDone) return;
    introDone = true;
    introAnimation?.cancel();
    skipEvents.forEach((name) => container.removeEventListener(name, finishIntro, true));
    viewer.setOptions({ fisheye: false, maxFov: INTRO.endFov });
    viewer.rotate({ yaw: 0, pitch: 0 });
    viewer.zoom(LANDING_ZOOM);
    container.classList.remove("tour-intro");
    // The slow spin waits its usual few seconds from the landing, not from when the page opened.
    idleClock.resetIdleTimer();
    viewer.addEventListener("position-updated", callbacks.onFirstMove, { once: true });
    callbacks.onIntroEnd();
  };

  const playIntro = () => {
    idleClock.disableIdleTimer();
    skipEvents.forEach((name) => container.addEventListener(name, finishIntro, true));
    introAnimation = new utils.Animation({
      properties: { progress: { start: 0, end: 1 } },
      duration: INTRO.duration,
      easing: "linear",
      onTick: ({ progress }) => {
        // The globe keeps turning throughout, slowing as it settles; the swoop down starts after a short hold.
        const descent = easeInOutSine(Math.max(0, (progress - INTRO.holdShare) / (1 - INTRO.holdShare)));
        viewer.setOptions({ fisheye: INTRO.fisheye * (1 - descent), maxFov: INTRO.startFov - (INTRO.startFov - INTRO.endFov) * descent });
        viewer.rotate({ yaw: INTRO.startYaw * (1 - easeOutCubic(progress)), pitch: (-Math.PI / 2) * (1 - descent) });
        viewer.zoom(LANDING_ZOOM * descent);
      },
    });
    void introAnimation.then(finishIntro);
  };

  // Once the first room shows, every other room's photo is fetched quietly in the background, so no move ever waits on a download or shows a loader.
  let fetchedAll = false;
  const fetchAllRooms = () => {
    if (fetchedAll) return;
    fetchedAll = true;
    TOUR_SPOTS.forEach((spot) => void fetch(panoramaFor(spot)).catch(() => undefined));
  };

  tour.addEventListener("node-changed", ({ node, data }) => {
    fetchAllRooms();
    // The opening starts once the Entrance photo has loaded, so the globe is never blank.
    if (!introDone && !introAnimation) playIntro();
    currentSpot = node.id;
    callbacks.onSpotChange(node.id);
    // An arrow can ask for a slow look round after arriving; visitors who ask for less motion are turned there at once.
    const panTo = (data.fromLink?.data as LinkData | undefined)?.panTo;
    if (panTo === undefined) return;
    const position = { yaw: `${panTo}deg`, pitch: 0 };
    if (stillMotion) viewer.rotate(position);
    else void viewer.animate({ ...position, speed: "3rpm" });
  });
  markers.addEventListener("select-marker", ({ marker }) => {
    const data = marker.data as { spotId?: string; hotspotId?: string } | undefined;
    if (data?.spotId && data.hotspotId) callbacks.onHotspot(data.spotId, data.hotspotId);
  });
  if (!withIntro) {
    viewer.addEventListener("position-updated", callbacks.onFirstMove, { once: true });
    callbacks.onIntroEnd();
  }

  // Keys pressed in the Menu, on an arrow, on a hotspot or inside the product panel belong to them, not to turning the view.
  viewer.addEventListener("key-press", (event) => {
    const target = (event as unknown as { originalEvent?: KeyboardEvent }).originalEvent?.target;
    if (target instanceof HTMLElement && target.closest("input, select, textarea, aside, nav, .tour-hotspot, .tour-arrow")) event.preventDefault();
  });

  const control: TourControl = { goTo: (spotId) => void tour.setCurrentNode(spotId) };
  return { viewer, control, currentSpot: () => currentSpot };
}

/** The walkable 360° showroom: drag or swipe to look around, tap the floor arrows to walk, tap the hotspots to read or watch. */
export default function TourViewer({
  startId,
  controlRef,
  onSpotChange,
  onInteract,
  onIntroEnd,
  onHotspot,
  onError,
}: {
  startId: string;
  controlRef?: RefObject<TourControl | null>;
  onSpotChange?: (id: string) => void;
  onInteract?: () => void;
  onIntroEnd?: () => void;
  onHotspot?: (spotId: string, hotspotId: string) => void;
  // The 3D view could not be started on this device.
  onError?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Kept in refs so new callbacks from the parent do not rebuild the whole viewer.
  const onSpotChangeRef = useRef(onSpotChange);
  const onInteractRef = useRef(onInteract);
  const onIntroEndRef = useRef(onIntroEnd);
  const onHotspotRef = useRef(onHotspot);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSpotChangeRef.current = onSpotChange;
    onInteractRef.current = onInteract;
    onIntroEndRef.current = onIntroEnd;
    onHotspotRef.current = onHotspot;
    onErrorRef.current = onError;
  }, [onSpotChange, onInteract, onIntroEnd, onHotspot, onError]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let viewer: Viewer | null = null;
    let control: TourControl | null = null;
    let currentSpot = () => startId;

    // Enter or Space on a focused arrow walks on, and on a focused hotspot opens it, as a tap would.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      const arrow = target?.closest<HTMLElement>(".tour-arrow");
      const hotspot = target?.closest<HTMLElement>(".tour-hotspot");
      if (arrow?.dataset.node) {
        event.preventDefault();
        control?.goTo(arrow.dataset.node);
      } else if (hotspot?.dataset.hotspot) {
        event.preventDefault();
        onHotspotRef.current?.(currentSpot(), hotspot.dataset.hotspot);
      }
    };
    container.addEventListener("keydown", onKeyDown);

    // Started a moment later: React may mount, unmount and remount at once in development, and an immediate start would cancel the photo download.
    const timer = window.setTimeout(() => {
      try {
        const built = createViewer(container, startId, {
          onSpotChange: (id) => onSpotChangeRef.current?.(id),
          onFirstMove: () => onInteractRef.current?.(),
          onIntroEnd: () => onIntroEndRef.current?.(),
          onHotspot: (spotId, hotspotId) => onHotspotRef.current?.(spotId, hotspotId),
        });
        viewer = built.viewer;
        control = built.control;
        currentSpot = built.currentSpot;
        if (controlRef) controlRef.current = built.control;
      } catch {
        onErrorRef.current?.();
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
      container.removeEventListener("keydown", onKeyDown);
      if (controlRef) controlRef.current = null;
      viewer?.destroy();
    };
  }, [startId, controlRef]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
