// The virtual showroom: one entry per 360° photo spot, in walking order, with the arrows that lead from each spot to its neighbours.

export type TourLink = {
  // The spot the arrow leads to.
  to: string;
  // Direction of the arrow in this spot's photo, in degrees: 0 is the middle of the photo, positive turns right, 180 is straight behind.
  yaw: number;
  // How far below eye level the arrow lies on the floor, in degrees; leave it out for the usual spot a few steps ahead.
  pitch?: number;
  // Which way the arrow's chevron points; up unless set. Down is for the way back, just below the arrow ahead.
  points?: "down" | "left" | "right";
  // The direction to face on arrival, in degrees in the next spot's photo; leave it out to keep facing the way of walking.
  face?: number;
  // How far zoomed in to arrive, from 0 (widest) to 100; leave it out to keep the visitor's own zoom.
  zoom?: number;
  // A direction to slowly turn to just after arriving, in degrees, so the view sweeps across what is worth seeing.
  panTo?: number;
};

// A product or feature a visitor can tap to read about or watch; written just for the tour.
export type TourHotspot = {
  id: string;
  title: string;
  // Where the hotspot sits in this spot's photo, in degrees: yaw as for arrows, pitch is up (positive) or down (negative) from eye level.
  yaw: number;
  pitch: number;
  // A short description, a film, or both. Films live in public/tour/videos, wide or upright (phone reels).
  text?: string;
  video?: string;
  // Shown only while developing, to try the panel before the real content is written; never on the live site.
  sample?: boolean;
};

export type TourSpot = {
  id: string;
  // Shown in the tour's Menu only; the floor arrows carry no names.
  name: string;
  // File name in public/tour, without extension: name.webp for computers, name-m.webp for phones and the still pictures.
  image: string;
  links: TourLink[];
  hotspots?: TourHotspot[];
};

// Each product is written once here and placed in every spot whose photo shows it, so it blinks wherever a visitor can see it.
const PRODUCTS = {
  pivotDoor: {
    id: "glass-pivot-entrance-door",
    title: "Glass Pivot Entrance Door",
    text: "Instead of side hinges, this large glass door turns on pivots set into the top and bottom of the frame. The heavy leaf swings smoothly, opens wide and gives the entrance a clean, balanced look.",
    video: "/tour/videos/entrance-pivot-door.webm",
  },
  tiltTurnWindow: {
    id: "tilt-turn-casement-window",
    title: "Tilt and Turn Casement Window with Inbuilt Mesh",
    text: "One handle, two ways to open: tilt the sash in at the top for gentle, secure airflow, or turn it to swing fully open for fresh air and easy cleaning. The built-in mesh keeps insects out while the view stays clear.",
  },
  brakeWindow: {
    id: "casement-window-brake",
    title: "Casement Window with Brake System",
    text: "A side-hinged casement window with a built-in brake: open the sash to any angle and lock it there, so the wind can never swing it open or slam it shut.",
  },
  mainDoor: {
    id: "aluminium-main-door",
    title: "Aluminium Main Door",
    text: "A strong aluminium main door with slim frames and glass panels: it locks securely, lets daylight into the entrance, and will not rust, warp or swell in the rain the way wood can.",
  },
  automaticDoor: {
    id: "automatic-synchronised-door",
    title: "Automatic Synchronised Sliding Door",
    text: "A motion sensor opens both glass leaves together as someone approaches and closes them gently behind. Access control decides who can enter, smart automation sets the opening modes and times, and an advanced track system keeps every movement smooth and quiet.",
  },
  slimSlidingWindow: {
    id: "88-slim-sliding-window",
    title: "88 mm Slim Sliding Window",
    text: "A sliding window built on an 88 mm slim aluminium frame: the narrow profile leaves more room for glass and light, and the sashes glide smoothly along the track, opening without taking up any space inside.",
  },
  foldingWindow: {
    id: "50mm-folding-window",
    title: "50 mm Folding Window",
    text: "A multi-panel folding window whose sashes fold neatly to one side, opening the whole frame wide. The 50 mm system is built for structural strength, with high-quality hinges and rollers that keep every fold smooth and steady.",
  },
  ptDoor: {
    id: "pt-door",
    title: "PT Door, Openable and Sliding",
    text: "One door that opens two ways: slide the glass leaf aside to save space, or swing it open on its hinges for a full, wide opening. Slim frames and smooth hardware make both easy.",
  },
  telescopicDoor: {
    id: "telescopic-sliding-door",
    title: "Telescopic Sliding Door",
    text: "Several glass panels slide one behind another and stack neatly to the side, opening a wide passage. Slim aluminium frames keep the glass as large as possible, so the view stays open even when the door is closed.",
  },
  threeTrackDoor: {
    id: "3-track-sliding-door-mesh",
    title: "3-Track Sliding Door with Mesh",
    text: "Three tracks let the glass shutters and a mesh shutter slide on their own, so you can open up for fresh air while the mesh keeps insects out. Sizes, finishes and shutter layouts can all be customised to suit your space.",
  },
  framedPivotDoor: {
    id: "pivot-door",
    title: "Pivot Door",
    text: "Instead of hanging on side hinges, this door turns on a pivot set into the frame, so the leaf swings smoothly and evenly with very little effort. A slim black frame around a large glass panel keeps the look clean and modern.",
  },
  linkageDoor: {
    id: "45mm-linkage-door",
    title: "45 mm Linkage Door",
    text: "Linked glass panels with a frameless look slide together as one, opening wide in a single move. The clear, open structure gives interiors a light, modern feel and lets abundant natural light flow between connected spaces.",
  },
  georgianDoor: {
    id: "georgian-door-grid",
    title: "Georgian Door with Grid",
    text: "Slim black grid bars divide the glass into neat panes, giving this door a classic Georgian character with a crisp, modern finish. It lets light through while adding structure and style to the space.",
  },
  slimProfileDoor: {
    id: "slim-profile-door",
    title: "Slim Profile Door",
    text: "A very slim aluminium frame around frosted glass gives this door an elegant, minimal look. It keeps the room private while still letting natural light pass through.",
  },
  magicDoor: {
    id: "magic-door",
    title: "Magic Door",
    text: "With no visible track, this door blends into the wall for a clean, minimalist look. It glides open effortlessly and silently, and closes flush to give the room complete privacy.",
  },
  linkageDoor40: {
    id: "40mm-linkage-door",
    title: "40 mm Linkage Door",
    text: "Slim 40 mm linked glass panels slide together in one smooth movement, opening the room wide or closing it off in seconds. The light frames and large glass keep the space bright and open while still dividing it cleanly.",
  },
  meshVentWindow: {
    id: "casement-window-mesh-ventilation",
    title: "Casement Window with Mesh and Ventilation",
    text: "A side-hinged casement window with a built-in insect mesh and a ventilation option, so fresh air keeps flowing even while the window stays secure. Insects stay out, the room stays airy, and the view stays clear.",
  },
  blindsMeshWindow: {
    id: "casement-window-blinds-mesh",
    title: "Casement Window with Blinds and Mesh",
    text: "A side-hinged casement window with blinds built in between the glass and an insect mesh, so you can control light and privacy without curtains while fresh air comes in and insects stay out. The built-in blinds stay dust-free and need no cleaning.",
  },
  fixedBlindWindow: {
    id: "fixed-window-remote-blinds",
    title: "Fixed Window with Remote-Controlled Blinds",
    text: "A fixed glass window with blinds built in between the panes, raised and lowered by remote control for easy light and privacy. Sizes, finishes and blind options can all be customised to suit your space.",
  },
  openableMeshWindow: {
    id: "openable-window-mesh-lock",
    title: "Openable Window with Mesh and Inside Lock",
    text: "An openable window with an insect mesh and a lock on the inside, so it opens for fresh air and locks securely from within. Sizes, finishes and mesh options can be customised to suit your space.",
  },
  verticalFoldingWindow: {
    id: "60-vertical-folding-window",
    title: "60 Vertical Folding Window",
    text: "The sashes fold upwards instead of swinging out, opening wide without taking up space in the room. The 60 system is built for enhanced structural strength and stability, with long-lasting durability for everyday use.",
  },
  doubleTrackSlidingWindow: {
    id: "double-track-sliding-window",
    title: "Sliding Window with Double Side Tracking",
    text: "Two sashes glide on their own tracks, so either side can slide open for fresh air without the window ever swinging into the room. Slim frames keep the glass large and the view clear.",
  },
  stripWindow: {
    id: "strip-window-mesh",
    title: "Strip Window with Mesh",
    text: "A slim, narrow window that brings in light and fresh air where a full-size window will not fit, with an insect mesh to keep bugs out. Ideal for corridors, bathrooms and tight walls.",
  },
  slimBifold: {
    id: "slim-bifolding-door",
    title: "Slim Bifolding Profile Door",
    text: "Tall glass panels in a slim black profile fold neatly to one side, opening the room fully to the space outside. The narrow frames keep the glass large, so the room stays bright and open even when the door is closed.",
  },
  motorisedVerticalWindow: {
    id: "motorised-vertical-sliding-window",
    title: "Motorised Vertical Sliding Window",
    text: "The sash glides up and down at the touch of a button. A rain sensor closes it automatically when it starts to rain, an infrared anti-pinch sensor stops it safely if anything is in the way, and it can be fitted with anti-mosquito screens.",
  },
  doubleGlassBifold: {
    id: "bifolding-door-double-glass",
    title: "Bifolding Door with Double Glass",
    text: "Panels fold neatly to one side to open the space wide, and each is fitted with double glazing for better insulation against heat and noise. Slim frames keep the look light and modern.",
  },
  liftSlideDoor: {
    id: "heavy-duty-lift-sliding-door",
    title: "Heavy-Duty Lift Sliding Door",
    text: "Turning the handle lifts the heavy glass leaf so it slides with ease, then lowers it to press firmly shut for a tighter seal against wind, rain and dust. The bottom rail is hidden in the floor with a built-in drain, and a brake system holds the door wherever you stop it.",
  },
  miniBifold: {
    id: "mini-bifold-door",
    title: "Mini Bifold Door",
    text: "Compact panels fold neatly against each other to open a small doorway fully, without a door leaf swinging into the room. Ideal for utility spaces, store rooms and tight corners.",
  },
} satisfies Record<string, Omit<TourHotspot, "yaw" | "pitch">>;

// Arrow directions are read from the photos; each one is checked by walking the tour and nudged here if it points slightly off.
export const TOUR_SPOTS: TourSpot[] = [
  {
    id: "entrance",
    name: "Entrance",
    image: "01-entrance",
    // In the middle of the floor ahead, in line with the passage to reception.
    links: [{ to: "reception", yaw: 0, pitch: -22 }],
    hotspots: [
      // The diamond-grid door straight behind the starting view.
      { ...PRODUCTS.pivotDoor, yaw: -172, pitch: -8 },
      // The grey two-pane window beside the grille main door, looking into the cabin.
      { ...PRODUCTS.tiltTurnWindow, yaw: -111, pitch: -10 },
      // The second grey window, next to the frameless glass door.
      { ...PRODUCTS.brakeWindow, yaw: -59, pitch: -12 },
      // The grey glazed door on the right, beside the plant.
      { ...PRODUCTS.mainDoor, yaw: 133, pitch: -12 },
      // The black sliding door straight ahead, on its left glass leaf, clear of the floor arrow.
      { ...PRODUCTS.automaticDoor, yaw: -15, pitch: -2 },
    ],
  },
  {
    id: "reception",
    name: "Reception",
    image: "02-reception",
    // A pair in the middle of the floor, facing the sliding door: up leads on to the central hall, down leads back to the entrance; left walks to the central hall facing the grey window unit.
    links: [
      { to: "central-hall", yaw: 2, pitch: -38 },
      { to: "entrance", yaw: 2, pitch: -47, points: "down" },
      { to: "central-hall", yaw: -7, pitch: -43, points: "left", face: -87 },
    ],
    // The entrance products seen from here, so they blink from this side too.
    hotspots: [
      // The grille main door behind.
      { ...PRODUCTS.pivotDoor, yaw: -168, pitch: -8 },
      // The narrow window beside the grille door.
      { ...PRODUCTS.tiltTurnWindow, yaw: -149, pitch: -8 },
      // The wider window looking into the cabin desk.
      { ...PRODUCTS.brakeWindow, yaw: -123, pitch: -10 },
      // The grey glazed door behind on the right.
      { ...PRODUCTS.mainDoor, yaw: 168, pitch: -10 },
      // The black sliding door ahead, on its left glass leaf.
      { ...PRODUCTS.automaticDoor, yaw: -40, pitch: -5 },
    ],
  },
  {
    id: "central-hall",
    name: "Central Hall",
    image: "03-central-hall",
    // Straight on in the middle of the corridor floor by the tree; left on the hall floor just outside the telescopic door, straight into the glass corridor facing down it; and back to reception.
    links: [
      { to: "gallery-corridor", yaw: 15, pitch: -28 },
      { to: "glass-corridor", yaw: -13, pitch: -44, points: "left", face: 0 },
      // In the middle of the open sliding door behind, in line with the grille main door beyond it.
      { to: "reception", yaw: 175, pitch: -35 },
    ],
    hotspots: [
      // The long window into the cabin, left of the grey window unit.
      { ...PRODUCTS.slimSlidingWindow, yaw: -123, pitch: -9 },
      // The grey window unit standing in the hall, on its middle frame.
      { ...PRODUCTS.foldingWindow, yaw: -87, pitch: -16 },
      // The silver glass door on the right, beside the fish tank, on its glass leaf.
      { ...PRODUCTS.ptDoor, yaw: 68, pitch: -18 },
      // The big meeting-room door straight ahead, on its stacked glass panels.
      { ...PRODUCTS.telescopicDoor, yaw: -40, pitch: -8 },
    ],
  },
  {
    id: "gallery-corridor",
    name: "Gallery Corridor",
    image: "04-gallery-corridor",
    // Into the side passage between the grey window unit and the meeting-room glass, where the glass corridor photo is taken; and back to the central hall.
    links: [
      { to: "glass-corridor", yaw: -72, pitch: -25, face: 0 },
      // Straight down the right-hand corridor to the window display, arriving faced towards the casement window with mesh and ventilation.
      { to: "window-display", yaw: 27, pitch: -28, face: 150 },
      { to: "central-hall", yaw: -135 },
    ],
    hotspots: [
      // The meeting-room glass doors right of the white pillar, the same telescopic door seen from this side.
      { ...PRODUCTS.telescopicDoor, yaw: -20, pitch: -5 },
      // The dark sliding door on the left wall of the side passage.
      { ...PRODUCTS.threeTrackDoor, yaw: -83, pitch: -8 },
      // The black-framed glass door at the far end of the side passage.
      { ...PRODUCTS.framedPivotDoor, yaw: -68, pitch: -6 },
      // The glass folding doors with handles on the left of the right-hand corridor.
      { ...PRODUCTS.doubleGlassBifold, yaw: 12, pitch: -5 },
      // The tinted glass door on the right of the right-hand corridor, beside the plant.
      { ...PRODUCTS.ptDoor, yaw: 48, pitch: -5 },
    ],
  },
  {
    id: "glass-corridor",
    name: "Glass Corridor",
    image: "05-glass-corridor",
    links: [
      // Arrives zoomed out facing the magic door, then turns slowly right to the mini bifold, as if looking round on walking in.
      { to: "meeting-room-corridor", yaw: 0, face: -165, zoom: 0, panTo: -118 },
      { to: "gallery-corridor", yaw: 99 },
    ],
    hotspots: [
      // The black-framed glass door on the left, with the grille window behind it, on its glass leaf.
      { ...PRODUCTS.framedPivotDoor, yaw: -104, pitch: -12 },
      // Behind on the left, the dark sliding door with a mesh panel into the small cabin with the flamingo painting.
      { ...PRODUCTS.threeTrackDoor, yaw: -156, pitch: -8 },
      // The tall glass panels with thin black frames along the right side, into the meeting room.
      { ...PRODUCTS.linkageDoor, yaw: 36, pitch: -8 },
      // The glass door with black grid bars on the left wall.
      { ...PRODUCTS.georgianDoor, yaw: -28, pitch: -8 },
      // The next door along the left wall, frosted glass in a slim frame.
      { ...PRODUCTS.slimProfileDoor, yaw: -12, pitch: -6 },
    ],
  },
  {
    id: "meeting-room-corridor",
    name: "Meeting Room Corridor",
    image: "06-meeting-room-corridor",
    // A pair centred between the two floor light strips, the meeting-room edge and the lift door: straight on to the window display, left into the meeting room; and back along the corridor to the glass corridor, arriving faced towards the gallery corridor.
    links: [
      { to: "window-display", yaw: 88, pitch: -28 },
      { to: "meeting-room", yaw: 84, pitch: -34, points: "left" },
      { to: "glass-corridor", yaw: 180, face: 99 },
    ],
    hotspots: [
      // The small doorway on the left with its panels folded back, the grille window and switch behind.
      { ...PRODUCTS.miniBifold, yaw: -74, pitch: -10 },
      // The frosted glass door in the corridor wall, left of the mini bifold.
      { ...PRODUCTS.magicDoor, yaw: -165, pitch: -8 },
      // The large glass sliding door with a handle on the right, the painting beyond it.
      { ...PRODUCTS.liftSlideDoor, yaw: 113, pitch: -10 },
      // Across the corridor, on the window with the black grille, next to the plant and the painting.
      { ...PRODUCTS.meshVentWindow, yaw: 77, pitch: -2 },
      // Across the corridor, on the dark sash just left of the grille window, in the same unit.
      { ...PRODUCTS.blindsMeshWindow, yaw: 68, pitch: -2 },
      // Across the corridor, on the plain right-hand sash of the first window unit.
      { ...PRODUCTS.tiltTurnWindow, yaw: 58, pitch: -2 },
      // Across the corridor, on the frosted middle panel with blinds in the first window unit.
      { ...PRODUCTS.fixedBlindWindow, yaw: 52, pitch: -7 },
      // Across the corridor, on the left-hand sash of the first window unit.
      { ...PRODUCTS.openableMeshWindow, yaw: 46, pitch: -2 },
    ],
  },
  {
    id: "meeting-room",
    name: "Meeting Room",
    image: "07-meeting-room",
    // Each out on the floor beyond its doorway, clear of the glass frames, seen through the glass: the folding doors to the window display and the sliding glass to the meeting room corridor.
    links: [
      { to: "window-display", yaw: 55, pitch: -25 },
      { to: "meeting-room-corridor", yaw: -105, pitch: -25 },
    ],
    hotspots: [
      // The long glass wall of linked panels, right of the windows, with the corridor beyond.
      { ...PRODUCTS.linkageDoor40, yaw: -150, pitch: -5 },
      // Through the glass, on the window with the black grille, next to the painting.
      { ...PRODUCTS.meshVentWindow, yaw: 160, pitch: -3 },
      // Through the glass, on the dark sash just left of the grille window, in the same unit.
      { ...PRODUCTS.blindsMeshWindow, yaw: 148, pitch: -3 },
      // Through the glass, on the plain right-hand sash of the first window unit.
      { ...PRODUCTS.tiltTurnWindow, yaw: 132, pitch: -3 },
      // Through the glass, on the frosted middle panel with blinds in the first window unit.
      { ...PRODUCTS.fixedBlindWindow, yaw: 120, pitch: -7 },
      // Through the glass, on the left-hand sash of the first window unit.
      { ...PRODUCTS.openableMeshWindow, yaw: 110, pitch: -3 },
      // The small dark window in the wall left of the folding glass doors.
      { ...PRODUCTS.stripWindow, yaw: 18, pitch: -12 },
      // The black folding glass doors out to the window display.
      { ...PRODUCTS.slimBifold, yaw: 55, pitch: -4 },
      // The large grey window whose sash slides up and down, between the linkage wall and the folding doors.
      { ...PRODUCTS.motorisedVerticalWindow, yaw: -35, pitch: -4 },
    ],
  },
  {
    id: "window-display",
    name: "Window Display",
    image: "08-window-display",
    // A pair in the corridor, centred between its two floor light strips, the grey windows on one side and the meeting room glass on the other: straight on down the corridor to the gallery corridor, right into the meeting room.
    links: [
      // Arrives faced back down the corridor towards the windows wall.
      { to: "gallery-corridor", yaw: 164, pitch: -31, face: 27 },
      { to: "meeting-room", yaw: 169, pitch: -37, points: "right" },
    ],
    hotspots: [
      // The grey two-pane sliding window straight ahead, above the shelves.
      { ...PRODUCTS.doubleTrackSlidingWindow, yaw: 9, pitch: -8 },
      // The black window above the shelves to the right, with its sashes folding upwards.
      { ...PRODUCTS.verticalFoldingWindow, yaw: 88, pitch: -12 },
      // The small dark window in the wall beside the meeting room's folding glass.
      { ...PRODUCTS.stripWindow, yaw: -113, pitch: -10 },
      // The meeting room's black folding glass doors.
      { ...PRODUCTS.slimBifold, yaw: -140, pitch: -4 },
      // The windows wall along the corridor, nearest first, the same five windows seen from the meeting room corridor.
      { ...PRODUCTS.openableMeshWindow, yaw: 121, pitch: -4 },
      { ...PRODUCTS.fixedBlindWindow, yaw: 133, pitch: -10 },
      { ...PRODUCTS.tiltTurnWindow, yaw: 141, pitch: -2 },
      { ...PRODUCTS.blindsMeshWindow, yaw: 148, pitch: -3 },
      { ...PRODUCTS.meshVentWindow, yaw: 153, pitch: -3 },
    ],
  },
];

export const TOUR_START_ID = "entrance";

// How far below eye level a floor arrow sits when a link gives no pitch, in degrees: low enough to read as lying on the floor.
export const TOUR_ARROW_PITCH = -28;

// Samples are left out of the live site, so only real hotspots are ever shown to visitors.
export function liveHotspots(spot: TourSpot): TourHotspot[] {
  return (spot.hotspots ?? []).filter((hotspot) => !hotspot.sample || process.env.NODE_ENV !== "production");
}
