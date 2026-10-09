// The rooms a visitor can browse by, used by the home page section and by each room's own page.

/** Line drawings used where a room has no photograph yet. */
const DRAWINGS = {
  window: "M4 3h16v18H4z M12 3v18 M4 12h16",
  door: "M6 2h12v20H6z M15.5 12v1.5",
  sliding: "M2 4h20v16H2z M8.7 4v16 M15.3 4v16",
  partition: "M3 3h18v18H3z M9 3v18 M15 3v18 M3 8h18",
} as const;

export type SpaceProduct = {
  name: string;
  /** One line saying what the product is for. */
  line: string;
  /** Path of the product's photograph under /public; the entry is shown as words alone when there is none. */
  image?: string;
};

export type Space = {
  slug: string;
  name: string;
  /** One line shown with the room's name. */
  line: string;
  /** The room's photograph: behind its door on the home page, and across the top of its own page. */
  image?: string;
  /** Line drawing shown until the photograph is supplied. */
  drawing: string;
  /** The products listed on the room's page; the list is left out when a room has none yet. */
  products?: SpaceProduct[];
};

export const SPACES: Space[] = [
  {
    slug: "living-room",
    name: "Living Room",
    image: "/images/spaces/living-room.webp",
    line: "Wide openings that bring daylight and the outdoors into the heart of the home.",
    drawing: DRAWINGS.sliding,
    products: [
      { name: "150 Panoramic Sliding Door", line: "Wide glass panels on slim frames that slide aside to join the room and the terrace.", image: "/images/spaces/living-room/sliding-doors-to-terrace.webp" },
      { name: "150 Panoramic Sliding Window", line: "A wall-wide view through slim frames, with panels that glide open for fresh air.", image: "/images/spaces/living-room/panoramic-window.webp" },
      { name: "Slim Sliding Door Automation", line: "Opens and closes by remote control or at a touch, on frames slim enough to almost disappear.", image: "/images/spaces/living-room/slim-automatic-sliding-door.webp" },
    ],
  },
  {
    slug: "bedroom",
    name: "Bedroom",
    image: "/images/spaces/bedroom.webp",
    line: "Quiet, well-sealed frames for rest, privacy and soft morning light.",
    drawing: DRAWINGS.window,
    products: [
      { name: "50 Vertical Lift Window", line: "Built for structural strength, stability and long-lasting performance.", image: "/images/spaces/bedroom/50-vertical-lift-window.webp" },
      { name: "Casement Door Bottom Threshold Series", line: "Hinged doors that swing wide onto the balcony and seal at the foot with a low threshold against rain and dust.", image: "/images/spaces/bedroom/casement-door-bottom-threshold.webp" },
      { name: "DFZ110 Casement Window", line: "Sashes that open as far as you choose, so ventilation is easy to adjust, and close to a tight seal.", image: "/images/spaces/bedroom/dfz110-casement-window.webp" },
    ],
  },
  {
    slug: "kitchen",
    name: "Kitchen",
    image: "/images/spaces/kitchen.webp",
    line: "Easy-to-clean windows that clear steam and keep the room bright.",
    drawing: "M2 6h20v12H2z M2 10h20 M9 10v8 M15 10v8",
    products: [
      { name: "42 Free Folding Door", line: "Panels that fold neatly to one side, opening the kitchen fully onto the dining terrace.", image: "/images/spaces/kitchen/42-free-folding-door.webp" },
      { name: "42 Free Folding Window", line: "Folds away to both sides above the counter, for a clear view and fresh air while you cook.", image: "/images/spaces/kitchen/42-free-folding-window.webp" },
      { name: "130 Lift Sliding Window", line: "A rain sensor closes the window automatically at the first drops, so the kitchen stays dry even when no one is home.", image: "/images/spaces/kitchen/130-lift-sliding-window.webp" },
    ],
  },
  {
    slug: "bathroom",
    name: "Bathroom",
    image: "/images/spaces/bathroom.webp",
    line: "Ventilation and privacy in frames that stand up to moisture.",
    drawing: "M6 4h12v16H6z M6 8h12 M6 12h12 M6 16h12",
    products: [
      { name: "50 Slim Sliding Door", line: "Frosted glass in a slim sliding frame gives complete privacy and saves the floor space a hinged door would need.", image: "/images/spaces/bathroom/50-slim-sliding-door.webp" },
      { name: "128 Floating Sliding Window", line: "Sashes glide lightly on a concealed track, bringing in daylight and ventilation while keeping the room private.", image: "/images/spaces/bathroom/128-floating-sliding-window.webp" },
      { name: "Slim Profile Door", line: "A complete door in one slim, moisture-resistant frame that installs cleanly, with no extra fittings required.", image: "/images/spaces/bathroom/slim-profile-door.webp" },
    ],
  },
  {
    slug: "study-room",
    name: "Study Room",
    image: "/images/spaces/study-room.webp",
    line: "Steady daylight and less outside noise for focused work.",
    drawing: "M4 3h16v18H4z M10 3v18",
    products: [
      { name: "130 Duty Lift Sliding Door", line: "A hidden bottom rail with built-in floor drainage keeps the threshold flush and carries rainwater away.", image: "/images/spaces/study-room/130-duty-lift-sliding-door.webp" },
      { name: "Double Side Open Window", line: "Opens from either side and closes to an efficient airtight and watertight seal.", image: "/images/spaces/study-room/double-side-open-window.webp" },
      { name: "Floating Sliding Window", line: "Withstands winds up to force 12 and seals tightly when closed, for a calm and sheltered study.", image: "/images/spaces/study-room/floating-sliding-window.webp" },
    ],
  },
  {
    slug: "balcony",
    name: "Balcony",
    image: "/images/spaces/balcony.webp",
    line: "Sliding doors that open the room fully to the view.",
    drawing: "M5 2h14v20H5z M12 2v20 M2 16h20 M2 22h20",
    products: [
      { name: "75 Heavy Duty Folding Door", line: "Strong panels that fold fully to one side, joining the living room and the balcony as one space.", image: "/images/spaces/balcony/75-heavy-duty-folding-door.webp" },
      { name: "Automatic Panoramic Sliding Door", line: "Opens and closes automatically, on a self-draining track built for all weather.", image: "/images/spaces/balcony/automatic-panoramic-sliding-door.webp" },
      { name: "Heavy-Duty Lift Sliding Door", line: "Large glass panels lift to glide with ease, then lower to lock into a firm, weather-tight seal.", image: "/images/spaces/balcony/heavy-duty-lift-sliding-door.webp" },
    ],
  },
  {
    slug: "dining-room",
    name: "Dining Room",
    image: "/images/spaces/dining-room.webp",
    line: "Tall glass that turns every meal towards the garden and the daylight.",
    drawing: "M3 3h18v18H3z M9 3v18 M15 3v18",
    products: [
      { name: "75KS Medium Narrow Folding Door", line: "Narrow-framed panels fold back to one side, opening the dining room fully to the rest of the home.", image: "/images/spaces/dining-room/75ks-medium-narrow-folding-door.webp" },
      { name: "Motorised Vertical Sliding Window", line: "Rises and lowers at the touch of a switch, and can be equipped with anti-mosquito screens.", image: "/images/spaces/dining-room/motorised-vertical-sliding-window.webp" },
      { name: "PJ90 Casement Window", line: "Side-hung sashes open wide for fresh air at the table and close to a snug, quiet seal.", image: "/images/spaces/dining-room/pj90-casement-window.webp" },
    ],
  },
  {
    slug: "entrance",
    name: "Entrance",
    image: "/images/spaces/entrance.webp",
    line: "A front door that sets the tone before anyone steps inside.",
    drawing: DRAWINGS.door,
    products: [
      { name: "Thermal Break Pivot Entrance Door", line: "A grand door that turns smoothly on a pivot, with a thermal break that keeps outdoor heat from passing through the frame.", image: "/images/spaces/entrance/thermal-break-pivot-entrance-door.webp" },
      { name: "Glass Pivot Entrance Door", line: "A dust-proof sealing strip keeps the entrance clean, and stainless steel pivot hardware carries the weight of the glass with ease.", image: "/images/spaces/entrance/glass-pivot-entrance-door.webp" },
      { name: "Thermal Break Side Hinge Entrance Door", line: "A solid side-hung entrance door with a thermal break frame, for a cooler and quieter welcome home.", image: "/images/spaces/entrance/thermal-break-side-hinge-entrance-door.webp" },
    ],
  },
  {
    slug: "terrace",
    name: "Terrace",
    image: "/images/spaces/terrace.webp",
    line: "Openings made for sun, wind and rain, that slide away when the weather is kind.",
    drawing: "M2 5h20v15H2z M7 5v15 M12 5v15 M17 5v15",
    products: [
      { name: "Telescopic Sliding Door", line: "Panels stack neatly behind one another on a smooth roller system, opening the terrace wide with little effort.", image: "/images/spaces/terrace/telescopic-sliding-door.webp" },
      { name: "Multi Panel Pivot Door", line: "Several pivoting panels create wider openings, each turning with smooth rotation and stable movement.", image: "/images/spaces/terrace/multi-panel-pivot-door.webp" },
      { name: "45 Perfect Glass Linkage Door", line: "Creates a clean, transparent look that enhances modern interior aesthetics.", image: "/images/spaces/terrace/45-perfect-glass-linkage-door.webp" },
    ],
  },
  {
    slug: "office",
    name: "Office",
    image: "/images/spaces/office.webp",
    line: "Glass partitions that divide the floor and keep it bright and quiet.",
    drawing: DRAWINGS.partition,
    products: [
      { name: "40 mm Corner Linkage Door", line: "A linkage system lets the panels move smoothly together and allows flexible opening configurations around a corner.", image: "/images/spaces/office/40mm-corner-linkage-door.webp" },
      { name: "50 Folding Window", line: "Folds fully aside for an open view, in a frame that ensures structural strength.", image: "/images/spaces/office/50-folding-window.webp" },
      { name: "Automatic 40 mm Synchronised Door", line: "Both panels open together automatically, on high-performance rollers and an advanced track system.", image: "/images/spaces/office/automatic-40mm-synchronised-door.webp" },
    ],
  },
];

export const getSpace = (slug: string) => SPACES.find((space) => space.slug === slug);
