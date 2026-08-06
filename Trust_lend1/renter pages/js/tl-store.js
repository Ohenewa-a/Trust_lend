/*
  Seed data for the TrustLend prototype.

  Plain script assigning a global rather than a JSON file on purpose: fetch()
  is blocked by CORS when a page is opened straight from disk (file://), and
  these pages are meant to work that way as well as over a local server.

  Values are harvested from the markup they replace, so a fresh load looks
  identical to the static design. Counts and totals are NOT stored here —
  TL.store.derive() computes them, which is what keeps the numbers agreeing
  with each other.

  Editing anything below? Bump SCHEMA in tl-store.js or saved state wins and
  your change appears to do nothing.
*/
window.TL_SEED = {
  user: {
    firstName: "John",
    lastName: "Doe",
    role: "Verified Renter",
    email: "johndoe@gmail.com",
    phone: "+234 801 234 5678",
    location: "Lagos, Nigeria",
    joinedAt: "2025-05-12",
    photo: "images/Profile Pic.png",
  },

  /*
    Recent searches for the equipment listing. Kept in state rather than in
    its own storage key so it survives a refresh, travels with the rest of the
    prototype's data, and is wiped by the same reset control.

    Trending is not here: those five chips are fixed editorial picks and are
    printed straight into the markup.
  */
  searches: {
    recent: ["Camera"],
  },

  // The dashboard booking-history rows, plus the two currently-out rentals.
  bookings: [
    {
      id: "bk-1001",
      equipmentId: "generator-5kva",
      name: "Generator 5KVA",
      image: "images/generator 1.png",
      owner: "Emeka A.",
      ownerAvatar: "images/Profile Pic.png",
      startDate: "2026-05-20",
      endDate: "2026-05-21",
      days: 1,
      amount: 25000,
      status: "active",
    },
    {
      id: "bk-1002",
      equipmentId: "concrete-mixer",
      name: "Concrete Mixer",
      image: "images/excavator.png",
      owner: "Emeka A.",
      ownerAvatar: "images/Profile Pic.png",
      startDate: "2026-05-16",
      endDate: "2026-05-17",
      days: 1,
      amount: 20000,
      status: "completed",
    },
    {
      id: "bk-1003",
      equipmentId: "canon-eos-r50",
      name: "Canon EOS R50",
      image: "images/canon eos r50 2 1.png",
      owner: "Peace O.",
      ownerAvatar: "images/woman-profile.png",
      startDate: "2026-05-12",
      endDate: "2026-05-13",
      days: 1,
      amount: 20000,
      status: "completed",
    },
    {
      id: "bk-1004",
      equipmentId: "nikon-z30",
      name: "Nikon Z30",
      image: "images/canon eos r50 3 1.png",
      owner: "Bukky B.",
      ownerAvatar: "images/woman-profile.png",
      startDate: "2026-05-12",
      endDate: "2026-05-13",
      days: 1,
      amount: 20000,
      status: "completed",
    },
    {
      id: "bk-1005",
      equipmentId: "sony-fx3",
      name: "Sony FX3",
      image: "images/sony-fx3.png",
      owner: "Tunde B.",
      ownerAvatar: "images/Profile Pic.png",
      startDate: "2026-05-12",
      endDate: "2026-05-13",
      days: 1,
      amount: 20000,
      status: "cancelled",
    },
  ],

  /*
    Headline counts. These are seeded rather than counted from `bookings`
    because the design's figures span the user's whole history, while the
    booking table only lists the five most recent. Counting the visible rows
    would silently rewrite the dashboard to 1 active / 3 completed.

    The point of keeping them here is that every card reads this one object —
    which is what fixes the wallet showing "12" active directly above a list
    of 2.
  */
  stats: {
    activeRentals: 2,
    completedRentals: 7,
    totalSpent: 185000,
  },

  wallet: {
    available: 65079.24,
    pending: 45000,
    processing: 0,
    held: 50000,
    thisMonth: 250000,
    allTimeEarned: 550000,
    totalWithdrawn: 439000,
    platformFeePct: 12,
  },

  transactions: [
    {
      id: "tx-9001",
      description: "Payment received - Canon EOS R50",
      date: "2026-07-23T10:35:00",
      type: "credit",
      amount: 20000,
      status: "completed",
    },
    {
      id: "tx-9002",
      description: "Withdrawal to GT Bank .... 8830",
      date: "2026-07-22T14:18:00",
      type: "withdrawal",
      amount: -65000,
      status: "completed",
    },
    {
      id: "tx-9003",
      description: "Payment received - DJI Mini 3 Drone",
      date: "2026-07-21T11:42:00",
      type: "credit",
      amount: 85000,
      status: "completed",
    },
    {
      id: "tx-9004",
      description: "Payout Processing to MTN Momo",
      date: "2026-07-20T20:35:00",
      type: "withdrawal",
      amount: -20000,
      status: "processing",
    },
    {
      id: "tx-9005",
      description: "Security deposit held - Generator",
      date: "2026-07-18T16:15:00",
      type: "hold",
      amount: -50000,
      status: "held",
    },
    {
      id: "tx-9006",
      description: "Payment received - Generator",
      date: "2026-07-17T08:50:00",
      type: "credit",
      amount: 30000,
      status: "completed",
    },
  ],

  payoutAccounts: [
    { id: "pa-1", bank: "MTN Mobile Money", last4: "4021", primary: true },
    { id: "pa-2", bank: "GT Bank", last4: "8830", primary: false },
  ],
};

/*
  The equipment catalogue — everything the listing page browses and every
  detail page renders.

  Deliberately NOT part of TL_SEED. Everything in the seed is cloned into
  state and written to localStorage on every save; this is read-only reference
  data that nothing mutates, so putting it there would bloat the saved payload
  for no gain and force a schema bump every time a listing is added.

  `id` is what equipmentDetails.html?id=... looks up, so these are stable.
*/
window.TL_CATALOGUE = [
  // --- Cameras ---
  {
    id: "sony-fx3",
    name: "Sony FX3",
    owner: "Jay Alaworile",
    city: "Kagoro",
    rate: 95000,
    rating: 4.9,
    reviews: 42,
    category: "Cameras",
    availability: "ready",
    image: "images/sony-fx3.png",
  },
  {
    id: "sony-alpha-a7",
    name: "Sony Alpha A7",
    owner: "Tunde A.",
    city: "Kano",
    rate: 75000,
    rating: 4.9,
    reviews: 31,
    category: "Cameras",
    availability: "ready",
    image: "images/canon eos r50 3 1.png",
  },
  {
    id: "nikon-d5100",
    name: "Nikon D5100",
    owner: "Peace O.",
    city: "Abuja",
    rate: 50000,
    rating: 4.2,
    reviews: 18,
    category: "Cameras",
    availability: "scheduled",
    image: "images/canon eos r50 4 1.png",
  },
  {
    id: "canon-eos-r50",
    name: "Canon EOS R50",
    owner: "Bukky B.",
    city: "Akure",
    rate: 65000,
    rating: 4.4,
    reviews: 22,
    category: "Cameras",
    availability: "ready",
    image: "images/canon eos r50 2 1.png",
  },
  {
    id: "insta-360",
    name: "Insta 360",
    owner: "Emeka A.",
    city: "Warri",
    rate: 95500,
    rating: 4.3,
    reviews: 12,
    category: "Cameras",
    availability: "ready",
    image: "images/3-cam.png",
  },
  {
    id: "nikon-dslr",
    name: "Nikon DSLR",
    owner: "Daniel T.",
    city: "Calabar",
    rate: 80000,
    rating: 4.1,
    reviews: 9,
    category: "Cameras",
    availability: "scheduled",
    image: "images/2-cam.png",
  },
  {
    id: "canon-g67",
    name: "Canon G67",
    owner: "Ahmed B.",
    city: "Ikeja",
    rate: 75000,
    rating: 4.8,
    reviews: 27,
    category: "Cameras",
    availability: "ready",
    image: "images/canon.png",
  },
  {
    id: "canon-eos-rebel",
    name: "Canon EOS Rebel",
    owner: "Ama K.",
    city: "Jos",
    rate: 75000,
    rating: 4.9,
    reviews: 35,
    category: "Cameras",
    availability: "ready",
    image: "images/4-cam.png",
  },
  {
    id: "sony-dsc-850",
    name: "Sony DSC-850",
    owner: "Jay Alaworile",
    city: "Osogbo",
    rate: 95000,
    rating: 5,
    reviews: 51,
    category: "Cameras",
    availability: "ready",
    image: "images/hero-camera.png",
  },
  {
    id: "sony-dsc-w320",
    name: "Sony DSC-W320",
    owner: "Tunde A.",
    city: "Onitsha",
    rate: 95000,
    rating: 4.9,
    reviews: 24,
    category: "Cameras",
    availability: "scheduled",
    image: "images/Rectangle 305.png",
  },
  {
    id: "sony-a7",
    name: "Sony A7",
    owner: "Peace O.",
    city: "Owerri",
    rate: 85000,
    rating: 4.3,
    reviews: 16,
    category: "Cameras",
    availability: "ready",
    image: "images/Rectangle 306.png",
  },
  {
    id: "sony-zv-1",
    name: "Sony ZV-1",
    owner: "Bukky B.",
    city: "Lagos",
    rate: 85000,
    rating: 4.2,
    reviews: 14,
    category: "Cameras",
    availability: "ready",
    image: "images/Rectangle 307.png",
  },
  {
    id: "canon-eos-r6",
    name: "Canon EOS R6",
    owner: "Emeka A.",
    city: "Ibadan",
    rate: 90000,
    rating: 4.6,
    reviews: 29,
    category: "Cameras",
    availability: "scheduled",
    image: "images/Rectangle 308.png",
  },
  {
    id: "fujifilm-x-t4",
    name: "Fujifilm X-T4",
    owner: "Daniel T.",
    city: "Enugu",
    rate: 70000,
    rating: 4.5,
    reviews: 20,
    category: "Cameras",
    availability: "ready",
    image: "images/unsplash_9jCMyTLhK7k.png",
  },
  {
    id: "blackmagic-6k",
    name: "Blackmagic 6K",
    owner: "Ahmed B.",
    city: "Port Harcourt",
    rate: 88000,
    rating: 4.7,
    reviews: 33,
    category: "Cameras",
    availability: "scheduled",
    image: "images/unsplash_tY9uFNCyZvA.png",
  },

  // --- Lenses ---
  {
    id: "canon-rf-24-70",
    name: "Canon RF 24-70mm",
    owner: "Ama K.",
    city: "Lagos",
    rate: 35000,
    rating: 4.8,
    reviews: 26,
    category: "Lenses",
    availability: "ready",
    image: "images/frame(1).png",
  },
  {
    id: "sigma-18-35-art",
    name: "Sigma 18-35mm Art",
    owner: "Jay Alaworile",
    city: "Abuja",
    rate: 30000,
    rating: 4.4,
    reviews: 15,
    category: "Lenses",
    availability: "ready",
    image: "images/frame(2).png",
  },
  {
    id: "sony-gm-85",
    name: "Sony GM 85mm",
    owner: "Tunde A.",
    city: "Ikeja",
    rate: 40000,
    rating: 4.9,
    reviews: 30,
    category: "Lenses",
    availability: "scheduled",
    image: "images/frame(3).png",
  },
  {
    id: "nikon-50-14",
    name: "Nikon 50mm f/1.4",
    owner: "Peace O.",
    city: "Kano",
    rate: 20000,
    rating: 4.1,
    reviews: 11,
    category: "Lenses",
    availability: "ready",
    image: "images/frame(4).png",
  },
  {
    id: "zeiss-cp3-set",
    name: "Zeiss CP.3 Prime Set",
    owner: "Bukky B.",
    city: "Lagos",
    rate: 95000,
    rating: 5,
    reviews: 19,
    category: "Lenses",
    availability: "scheduled",
    image: "images/close-up-camera-tripod-sandy-beach-camera-with-lens 1.png",
  },

  // --- Lighting ---
  {
    id: "aputure-300d",
    name: "Aputure 300D II",
    owner: "Emeka A.",
    city: "Lagos",
    rate: 45000,
    rating: 4.7,
    reviews: 23,
    category: "Lighting",
    availability: "ready",
    image: "images/Rectangle 2.png",
  },
  {
    id: "godox-sl60",
    name: "Godox SL60 Kit",
    owner: "Daniel T.",
    city: "Warri",
    rate: 25000,
    rating: 4.2,
    reviews: 13,
    category: "Lighting",
    availability: "ready",
    image: "images/Rectangle 14.png",
  },
  {
    id: "nanlite-forza-500",
    name: "Nanlite Forza 500",
    owner: "Ahmed B.",
    city: "Abuja",
    rate: 55000,
    rating: 4.6,
    reviews: 17,
    category: "Lighting",
    availability: "scheduled",
    image: "images/Rectangle 294.png",
  },
  {
    id: "led-panel-set",
    name: "LED Panel Set",
    owner: "Ama K.",
    city: "Calabar",
    rate: 15000,
    rating: 3.8,
    reviews: 8,
    category: "Lighting",
    availability: "ready",
    image: "images/Group 8.png",
  },

  // --- Audio ---
  {
    id: "jbl-partybox-310",
    name: "JBL PartyBox 310",
    owner: "Jay Alaworile",
    city: "Lagos",
    rate: 15000,
    rating: 4.7,
    reviews: 27,
    category: "Audio",
    availability: "scheduled",
    image: "images/hero-gear.png",
  },
  {
    id: "rode-wireless-go",
    name: "Rode Wireless GO II",
    owner: "Tunde A.",
    city: "Ikeja",
    rate: 12000,
    rating: 4.5,
    reviews: 21,
    category: "Audio",
    availability: "ready",
    image: "images/Group 27.png",
  },
  {
    id: "shure-sm7b-kit",
    name: "Shure SM7B Kit",
    owner: "Peace O.",
    city: "Abuja",
    rate: 18000,
    rating: 4.8,
    reviews: 25,
    category: "Audio",
    availability: "ready",
    image: "images/p6.png",
  },
  {
    id: "sennheiser-headset",
    name: "Sennheiser Headset",
    owner: "Bukky B.",
    city: "Jos",
    rate: 8000,
    rating: 3.9,
    reviews: 7,
    category: "Audio",
    availability: "ready",
    image: "images/ad-fury.png",
  },

  // --- Decoration ---
  {
    id: "event-tent-6x6",
    name: "Event Tent 6x6",
    owner: "Emeka A.",
    city: "Osogbo",
    rate: 35000,
    rating: 4.3,
    reviews: 12,
    category: "Decoration",
    availability: "scheduled",
    image: "images/tents 1.png",
  },
  {
    id: "fog-machine",
    name: "Fog Machine",
    owner: "Daniel T.",
    city: "Lagos",
    rate: 10000,
    rating: 4,
    reviews: 10,
    category: "Decoration",
    availability: "ready",
    image: "images/Rectangle 2 (1).png",
  },
  {
    id: "stage-truss-set",
    name: "Stage Truss Set",
    owner: "Ahmed B.",
    city: "Enugu",
    rate: 45000,
    rating: 4.4,
    reviews: 14,
    category: "Decoration",
    availability: "scheduled",
    image: "images/Rectangle 2(3).png",
  },

  // --- Behind "More" ---
  {
    id: "generator-5kva",
    name: "Generator 5KVA",
    owner: "Ama K.",
    city: "Lagos",
    rate: 25000,
    rating: 4.7,
    reviews: 31,
    category: "Power",
    availability: "scheduled",
    image: "images/generator 1.png",
  },
  {
    id: "inverter-3-5kva",
    name: "Inverter 3.5KVA",
    owner: "Jay Alaworile",
    city: "Ibadan",
    rate: 30000,
    rating: 4.5,
    reviews: 18,
    category: "Power",
    availability: "ready",
    image: "images/Group 27 (1).png",
  },
  {
    id: "dewalt-drill-set",
    name: "Dewalt Drill Set",
    owner: "Tunde A.",
    city: "Lagos",
    rate: 15000,
    rating: 4.6,
    reviews: 14,
    category: "Tools",
    availability: "ready",
    image: "images/litheli-drill.png",
  },
  {
    id: "mini-excavator",
    name: "Mini Excavator",
    owner: "Peace O.",
    city: "Onitsha",
    rate: 95000,
    rating: 4.9,
    reviews: 22,
    category: "Tools",
    availability: "scheduled",
    image: "images/excavator.png",
  },
  {
    id: "macbook-pro-m2",
    name: "MacBook Pro M2",
    owner: "Bukky B.",
    city: "Lagos",
    rate: 30000,
    rating: 4.9,
    reviews: 18,
    category: "Computing",
    availability: "ready",
    image: "images/laptops 1.png",
  },
];

/*
  Detail copy, keyed by category.

  The listing carries what a card needs; the details page also wants an
  "About" paragraph, four headline specs and a specifications table. Writing
  those per listing would mean inventing thirty-six spec sheets, so they are
  held per category instead — every listing gets copy that is true of its
  class of gear rather than borrowed from a camera.
*/
window.TL_CATEGORY_DETAILS = {
  Cameras: {
    about:
      "A production-ready camera body maintained by working professionals and calibrated monthly. The package covers everything needed for narrative, commercial and event work, and ships with spare media and batteries.",
    highlights: [
      { icon: "fa-solid fa-camera", label: "Sensor", value: "Super 35 4K" },
      {
        icon: "fa-solid fa-sliders",
        label: "Dynamic Range",
        value: "17 Stops",
      },
      { icon: "fa-solid fa-gear", label: "Mount", value: "LPL / PL" },
      {
        icon: "fa-solid fa-gauge-high",
        label: "Frame Rate",
        value: "Up to 120fps",
      },
    ],
    specs: [
      ["Recording Media", "CFexpress Type B (2x included)"],
      ["Sensitivity", "EI 160 - 6400"],
      ["Power", "B-Mount battery system"],
      ["Internal NDs", "Clear, 0.6, 1.2, 1.8"],
    ],
  },

  Lenses: {
    about:
      "Optically checked and collimated before every hire. Supplied in a padded case with front and rear caps, a lens cloth and the matching filter ring.",
    highlights: [
      {
        icon: "fa-solid fa-circle-notch",
        label: "Mount",
        value: "EF / RF adapter",
      },
      {
        icon: "fa-solid fa-circle-dot",
        label: "Max Aperture",
        value: "f/1.4 - f/2.8",
      },
      {
        icon: "fa-solid fa-ruler-horizontal",
        label: "Filter Thread",
        value: "82mm",
      },
      { icon: "fa-solid fa-weight-hanging", label: "Weight", value: "1.2 kg" },
    ],
    specs: [
      ["Condition", "Checked and collimated before hire"],
      ["Included", "Padded case, caps, cloth"],
      ["Image Stabilisation", "Yes"],
      ["Minimum Focus", "0.38 m"],
    ],
  },

  Lighting: {
    about:
      "A location-ready lighting unit with its stand, modifier and cabling. Output is metered before dispatch, so what you rig is what you metered.",
    highlights: [
      { icon: "fa-solid fa-lightbulb", label: "Output", value: "300W COB" },
      {
        icon: "fa-solid fa-temperature-half",
        label: "Colour Temp",
        value: "5600K",
      },
      { icon: "fa-solid fa-plug", label: "Power", value: "Mains or V-mount" },
      { icon: "fa-solid fa-sliders", label: "Dimming", value: "0 - 100%" },
    ],
    specs: [
      ["Included", "Stand, softbox, reflector, cables"],
      ["CRI", "96+"],
      ["Control", "On-board, DMX and app"],
      ["Cooling", "Active, low noise"],
    ],
  },

  Audio: {
    about:
      "Cleaned and function-tested between hires. Comes with the cabling, stands and spare cells needed to run a session straight out of the case.",
    highlights: [
      {
        icon: "fa-solid fa-volume-high",
        label: "Type",
        value: "Live / recording",
      },
      {
        icon: "fa-solid fa-signal",
        label: "Connection",
        value: "XLR and 3.5mm",
      },
      {
        icon: "fa-solid fa-battery-full",
        label: "Runtime",
        value: "Up to 7 hours",
      },
      { icon: "fa-solid fa-box", label: "Case", value: "Hard case included" },
    ],
    specs: [
      ["Included", "Cables, stand, spare batteries"],
      ["Frequency Response", "20Hz - 20kHz"],
      ["Power", "Mains and internal cell"],
      ["Condition", "Function-tested between hires"],
    ],
  },

  Decoration: {
    about:
      "Event dressing that travels well and sets up without specialist tools. Delivered clean, with the fixings and instructions needed on site.",
    highlights: [
      {
        icon: "fa-solid fa-ruler-combined",
        label: "Footprint",
        value: "6m x 6m",
      },
      { icon: "fa-solid fa-clock", label: "Setup", value: "Under 30 minutes" },
      { icon: "fa-solid fa-people-group", label: "Crew", value: "2 people" },
      {
        icon: "fa-solid fa-truck",
        label: "Transport",
        value: "Fits a small van",
      },
    ],
    specs: [
      ["Included", "Fixings, weights, carry bags"],
      ["Setup", "No specialist tools required"],
      ["Condition", "Cleaned between hires"],
      ["Suitable For", "Indoor and covered outdoor"],
    ],
  },

  Power: {
    about:
      "Serviced on a fixed schedule with hours logged after every hire. Supplied fuelled, with leads and an earthing spike where the unit needs one.",
    highlights: [
      { icon: "fa-solid fa-bolt", label: "Output", value: "5 KVA" },
      {
        icon: "fa-solid fa-gas-pump",
        label: "Fuel",
        value: "Petrol, supplied full",
      },
      {
        icon: "fa-solid fa-clock",
        label: "Runtime",
        value: "8 hrs at half load",
      },
      { icon: "fa-solid fa-volume-low", label: "Noise", value: "68 dB at 7m" },
    ],
    specs: [
      ["Service Interval", "Every 100 running hours"],
      ["Included", "Leads, earthing spike, funnel"],
      ["Outlets", "2x 13A, 1x 16A"],
      ["Start", "Electric with recoil backup"],
    ],
  },

  Tools: {
    about:
      "Inspected against a safety checklist before release. Consumables and protective equipment are included, and the operator brief is handed over at pickup.",
    highlights: [
      {
        icon: "fa-solid fa-screwdriver-wrench",
        label: "Class",
        value: "Professional",
      },
      {
        icon: "fa-solid fa-battery-full",
        label: "Power",
        value: "Battery, 2 cells",
      },
      { icon: "fa-solid fa-shield-halved", label: "PPE", value: "Included" },
      {
        icon: "fa-solid fa-clipboard-check",
        label: "Inspection",
        value: "Before every hire",
      },
    ],
    specs: [
      ["Included", "Charger, spare cell, bits, PPE"],
      ["Certification", "Inspected and tagged"],
      ["Case", "Hard case included"],
      ["Operator Brief", "Given at pickup"],
    ],
  },

  Computing: {
    about:
      "Wiped and reimaged between hires, so nothing of the last renter comes with it. Charger and adapters are in the case, and the machine arrives fully charged.",
    highlights: [
      {
        icon: "fa-solid fa-microchip",
        label: "Processor",
        value: "Apple M2 Pro",
      },
      { icon: "fa-solid fa-memory", label: "Memory", value: "32 GB" },
      { icon: "fa-solid fa-hard-drive", label: "Storage", value: "1 TB SSD" },
      {
        icon: "fa-solid fa-display",
        label: "Display",
        value: '16" Liquid Retina',
      },
    ],
    specs: [
      ["Between Hires", "Wiped and reimaged"],
      ["Included", "Charger, USB-C and HDMI adapters"],
      ["Software", "Adobe CC and DaVinci Resolve"],
      ["Battery Health", "Above 90%"],
    ],
  },
};
