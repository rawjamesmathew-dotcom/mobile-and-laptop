
/* ============================================================
   GTS — Central Catalogue Data (single source of truth)
   Admin edits persist to localStorage; public pages read from it.
   ============================================================ */
const GTS_BRAND = {
  name: "GTS",
  tagline: "The Excellent Brand from Overseas",
  email: "samith.gts@gmail.com",
  categories: [
    { key: "mobile", label: "Mobile Accessories", headline: "Power Meets Portability", blurb: "Chargers, audio, power and protection — engineered for everyday performance." },
    { key: "laptop", label: "Laptop Accessories", headline: "Built for the Desk", blurb: "Stands, hubs, input and carry — precision tools for serious work." }
  ],
  countries: [
    { code: "LK", name: "Sri Lanka" }, { code: "IN", name: "India" }, { code: "NP", name: "Nepal" },
    { code: "BD", name: "Bangladesh" }, { code: "PK", name: "Pakistan" }
  ],
  wholesaleTiers: [
    { min: 10, label: "10+ units", discount: "10% off retail" },
    { min: 25, label: "25+ units", discount: "18% off retail" },
    { min: 50, label: "50+ units", discount: "25% off retail" }
  ]
};

/* wholesaleTier: index into wholesaleTiers, or null */
const GTS_SEED_PRODUCTS = [
  { id:"p01", slug:"voltcore-65w-gan-charger", name:"VoltCore 65W GaN Charger", category:"mobile", type:"Wall Charger", art:"charger",
    price:8900, sale:6900, stock:"in", stockQty:240, featured:true, isNew:true, status:"published",
    desc:"A pocket-size 65W GaN-II fast charger with dual USB-C and one USB-A port. Charges a phone to 60% in about 30 minutes and comfortably powers a laptop, with multi-layer surge and heat protection.",
    specs:{Output:"65W Max · USB-C PD 3.0",Ports:"2× USB-C · 1× USB-A",Input:"100–240V universal",Protection:"Surge / heat / short-circuit"}, created:"2026-09-02", updated:"2026-10-30" },
  { id:"p02", slug:"aerobuds-pro-tws", name:"AeroBuds Pro TWS", category:"mobile", type:"True Wireless Earbuds", art:"earbuds",
    price:12500, sale:9900, stock:"in", stockQty:180, featured:true, isNew:true, status:"published",
    desc:"Hybrid active noise cancellation, 11mm drivers and a low-latency game mode. Up to 36 hours total playtime with the wireless-charging case, tuned for clear calls on the move.",
    specs:{ANC:"Hybrid ANC · −35dB",Battery:"9h + 27h case",Driver:"11mm dynamic",Charging:"USB-C · Wireless"}, created:"2026-09-05", updated:"2026-10-28" },
  { id:"p03", slug:"flexbraid-100w-cable", name:"FlexBraid 100W USB-C Cable", category:"mobile", type:"Charging Cable", art:"cable",
    price:2400, sale:null, stock:"in", stockQty:900, featured:false, isNew:false, status:"published",
    desc:"Double-braided nylon USB-C cable rated for 100W PD and 480Mbps data. Bend-tested beyond 30,000 cycles with aluminium housings that refuse to fray.",
    specs:{Power:"100W PD · E-Marker chip",Length:"1.5m / 2m options",Data:"480Mbps",Build:"Nylon braid · alloy shell"}, created:"2026-08-14", updated:"2026-10-12" },
  { id:"p04", slug:"titan-shield-magsafe-case", name:"TitanShield MagSafe Case", category:"mobile", type:"Phone Case", art:"case",
    price:3200, sale:2600, stock:"in", stockQty:520, featured:false, isNew:false, status:"published",
    desc:"Slim aramid-textured shell with raised lips, corner airbags and full MagSafe magnet array. Military-grade drop protection without the bulk.",
    specs:{Material:"Aramid texture PC + TPU",Drop:"1.8m tested",Magnet:"N52 MagSafe array",Fit:"Precision cutouts"}, created:"2026-08-20", updated:"2026-10-20" },
  { id:"p05", slug:"powercell-20000-pd", name:"PowerCell 20,000mAh PD", category:"mobile", type:"Power Bank", art:"powerbank",
    price:9800, sale:null, stock:"low", stockQty:14, featured:true, isNew:false, status:"published",
    desc:"A 20,000mAh airline-safe power bank with 22.5W fast output, dual USB-A plus USB-C, and a smart LED display. Keeps a phone alive for a week of heavy use.",
    specs:{Capacity:"20,000mAh · 74Wh",Output:"22.5W max",Display:"LED percentage",Cert:"Airline-safe rating"}, created:"2026-07-30", updated:"2026-10-25" },
  { id:"p06", slug:"gripmount-desk-stand", name:"GripMount Adjustable Desk Stand", category:"mobile", type:"Phone Stand", art:"mount",
    price:2900, sale:null, stock:"in", stockQty:310, featured:false, isNew:false, status:"published",
    desc:"A weighted, fully adjustable aluminium phone stand with 270° rotation and anti-slip pads — hands-free video calls, streams and counter-top retail display.",
    specs:{Material:"CNC aluminium",Rotation:"270° · dual hinge",Base:"Weighted anti-slip",Fold:"Pocket-flat design"}, created:"2026-08-02", updated:"2026-09-28" },
  { id:"p07", slug:"sonicbeat-neckband", name:"SonicBeat Sport Neckband", category:"mobile", type:"Neckband Earphones", art:"earbuds",
    price:4500, sale:3600, stock:"in", stockQty:260, featured:false, isNew:true, status:"published",
    desc:"Flexible memory-neckband earphones with 14-hour battery, sweat resistance and magnetic earbuds. Built for commuters, gyms and long delivery shifts.",
    specs:{Battery:"14h continuous",Driver:"10mm",Rating:"IPX5 sweatproof",Call:"ENC mic"}, created:"2026-09-18", updated:"2026-10-29" },
  { id:"p08", slug:"lensguard-tempered-kit", name:"LensGuard Tempered Glass Kit", category:"mobile", type:"Screen Protector", art:"case",
    price:1500, sale:null, stock:"in", stockQty:1200, featured:false, isNew:false, status:"draft",
    desc:"9H tempered glass with an alignment frame for bubble-free fitting. Oleophobic coating resists fingerprints and scratches. (Draft — pending final packaging photos.)",
    specs:{Hardness:"9H tempered",Coating:"Oleophobic",Kit:"2× glass · frame · wipes",Fit:"Case-friendly"}, created:"2026-09-25", updated:"2026-10-31" },

  { id:"p09", slug:"elevate-alu-laptop-stand", name:"Elevate Aluminium Laptop Stand", category:"laptop", type:"Laptop Stand", art:"stand",
    price:7400, sale:5900, stock:"in", stockQty:150, featured:true, isNew:true, status:"published",
    desc:"Single-piece anodised aluminium stand that raises the screen to eye level and improves airflow. Supports up to 20kg with silicone pads front and back.",
    specs:{Material:"Anodised aluminium",Lift:"15cm eye-level raise",Load:"Up to 20kg",Fit:"10–17\" laptops"}, created:"2026-09-10", updated:"2026-10-27" },
  { id:"p10", slug:"hyperhub-8in1-usbc", name:"HyperHub 8-in-1 USB-C Hub", category:"laptop", type:"USB-C Hub", art:"hub",
    price:11200, sale:9200, stock:"in", stockQty:95, featured:true, isNew:false, status:"published",
    desc:"Eight ports from one USB-C: 4K HDMI, 100W PD pass-through, SD/TF readers, three USB-A and gigabit Ethernet — in a CNC aluminium shell that runs cool.",
    specs:{Video:"4K@30Hz HDMI",Power:"100W PD pass-through",Ports:"8-in-1",Data:"5Gbps USB"}, created:"2026-08-25", updated:"2026-10-22" },
  { id:"p11", slug:"precision-mx-wireless-mouse", name:"Precision MX Wireless Mouse", category:"laptop", type:"Wireless Mouse", art:"mouse",
    price:5600, sale:null, stock:"in", stockQty:220, featured:false, isNew:false, status:"published",
    desc:"Ergonomic silent-click mouse with 4000DPI sensor, dual Bluetooth + 2.4GHz modes and 90-day battery. Tracks on glass, marble and rough counters.",
    specs:{Sensor:"4000DPI optical",Battery:"90 days · AA",Modes:"BT ×2 · 2.4GHz",Click:"Silent switches"}, created:"2026-07-15", updated:"2026-10-05" },
  { id:"p12", slug:"keyflow-lowprofile-keyboard", name:"KeyFlow Low-Profile Keyboard", category:"laptop", type:"Keyboard", art:"keyboard",
    price:8900, sale:7900, stock:"in", stockQty:110, featured:false, isNew:true, status:"published",
    desc:"Low-profile scissor keyboard with white backlight, aluminium deck and tri-mode connectivity. Laptop-feel keys for full-day typing comfort.",
    specs:{Keys:"Low-profile scissor",Backlight:"White LED ×3",Modes:"BT ×3 · 2.4G · wired",Battery:"Rechargeable"}, created:"2026-09-12", updated:"2026-10-26" },
  { id:"p13", slug:"armourcarry-15-sleeve", name:"ArmourCarry 15\" Sleeve", category:"laptop", type:"Laptop Sleeve", art:"sleeve",
    price:4800, sale:null, stock:"low", stockQty:9, featured:false, isNew:false, status:"published",
    desc:"Water-repellent exterior, plush inner and reinforced corners for 15-inch laptops. Magnetic closure with a quick-access front pocket for cables.",
    specs:{Fit:"13–15.6\" laptops",Shell:"Water-repellent",Lining:"Plush micro-fibre",Pocket:"Magnetic front"}, created:"2026-08-08", updated:"2026-10-15" },
  { id:"p14", slug:"cyclone-cooling-pad", name:"Cyclone Cooling Pad", category:"laptop", type:"Cooling Pad", art:"coolpad",
    price:6800, sale:5400, stock:"in", stockQty:130, featured:false, isNew:false, status:"published",
    desc:"Five whisper-quiet fans with adjustable speed and RGB edge light. Folds flat for travel and doubles as an ergonomic riser.",
    specs:{Fans:"5× whisper fans",Speed:"Stepless dial",Light:"RGB edge",Fit:"12–17\" laptops"}, created:"2026-08-18", updated:"2026-10-18" },
  { id:"p15", slug:"dockedesk-usb-dock", name:"DockDesk 12-port Dock", category:"laptop", type:"Docking Station", art:"hub",
    price:18500, sale:null, stock:"in", stockQty:60, featured:false, isNew:true, status:"published",
    desc:"A full desktop dock: dual 4K HDMI, DisplayPort, 100W PD, Ethernet, six USB ports, audio in/out. One cable turns a laptop into a workstation.",
    specs:{Video:"Dual 4K HDMI + DP",Power:"100W PD",Ports:"12-in-1",Network:"Gigabit Ethernet"}, created:"2026-09-22", updated:"2026-10-30" },
  { id:"p16", slug:"typepro-usbc-adapter-kit", name:"TypePro Adapter Kit (5pc)", category:"laptop", type:"Adapter Kit", art:"cable",
    price:3900, sale:3200, stock:"out", stockQty:0, featured:false, isNew:false, status:"published",
    desc:"Five essential USB-C adapters — HDMI, VGA, USB-A, Ethernet and SD — in a zip case. The field kit for mixed-generation offices. (Restock arriving soon.)",
    specs:{Kit:"5 adapters · zip case",Video:"HDMI + VGA",Data:"USB-A ×2 · SD",Network:"Ethernet"}, created:"2026-07-22", updated:"2026-10-10" }
];

/* Gallery — designed placeholder artwork (no unlicensed photos) */
const GTS_SEED_GALLERY = [
  { id:"g1", title:"VoltCore Charging Station", tag:"mobile", country:"", alt:"Stylised artwork of the VoltCore 65W GaN charger on a dark surface", public:true, art:"charger" },
  { id:"g2", title:"Desk Setup — Elevate Stand", tag:"laptop", country:"", alt:"Stylised artwork of a laptop on the Elevate aluminium stand", public:true, art:"stand" },
  { id:"g3", title:"AeroBuds Pro — Studio Shot", tag:"mobile", country:"", alt:"Stylised artwork of AeroBuds Pro earbuds with case", public:true, art:"earbuds" },
  { id:"g4", title:"HyperHub Connectivity", tag:"laptop", country:"", alt:"Stylised artwork of the HyperHub 8-in-1 USB-C hub", public:true, art:"hub" },
  { id:"g5", title:"KeyFlow Typing Scene", tag:"laptop", country:"", alt:"Stylised artwork of the KeyFlow low-profile keyboard", public:true, art:"keyboard" },
  { id:"g6", title:"Street Audio — SonicBeat", tag:"mobile", country:"", alt:"Stylised artwork of SonicBeat neckband earphones", public:true, art:"cable" },
  { id:"g7", title:"Precision MX at Work", tag:"laptop", country:"", alt:"Stylised artwork of the Precision MX wireless mouse", public:true, art:"mouse" },
  { id:"g8", title:"PowerCell Travel Kit", tag:"mobile", country:"", alt:"Stylised artwork of the PowerCell power bank with cable", public:true, art:"powerbank" }
];

/* Demo testimonials — layout preview only, never real reviews */
const GTS_SEED_TESTIMONIALS = [
  { id:"t01", name:"DEMO Retailer A", role:"Phone shop owner · Colombo", country:"LK", rating:5, text:"Demo content for layout preview. Wholesale tiers arrived labelled and on time; reordering was straightforward.", status:"demo", consent:false, date:"2026-09-14", demo:true },
  { id:"t02", name:"DEMO Distributor B", role:"Accessories distributor · Kathmandu", country:"NP", rating:4, text:"Demo content for layout preview. Consistent stock across the hub and sleeve range for our reseller network.", status:"demo", consent:false, date:"2026-09-28", demo:true },
  { id:"t03", name:"DEMO Customer C", role:"Online buyer · Dhaka", country:"BD", rating:5, text:"Demo content for layout preview. The 65W charger replaced three adapters in my bag. Solid build.", status:"demo", consent:false, date:"2026-10-06", demo:true },
  { id:"t04", name:"DEMO Reseller D", role:"Computer store · Karachi", country:"PK", rating:4, text:"Demo content for layout preview. Stand and hub pairing sells well as a workstation bundle.", status:"demo", consent:false, date:"2026-10-19", demo:true },
  { id:"t05", name:"DEMO Buyer E", role:"Corporate procurement · Mumbai", country:"IN", rating:5, text:"Demo content for layout preview. Enquiry flow was clear and the 25-unit tier pricing was honoured on invoice.", status:"demo", consent:false, date:"2026-10-25", demo:true },
  { id:"t06", name:"DEMO Retailer F", role:"Accessories kiosk · Kandy", country:"LK", rating:5, text:"Demo content for layout preview. Case and glass kit move fast; restock turnaround is dependable.", status:"demo", consent:false, date:"2026-10-30", demo:true }
];

/* Wholesale price for a product at a quantity (10/25/50 tier discounts) */
function gtsWholesalePrice(product, qty){
  const tiers = GTS_BRAND.wholesaleTiers;
  let applied = 0;
  for (const t of tiers) if (qty >= t.min) applied = t.min;
  const base = (product.sale && product.sale < product.price) ? product.sale : product.price;
  const disc = applied === 50 ? 0.25 : applied === 25 ? 0.18 : applied === 10 ? 0.10 : 0;
  return { unit: Math.round(base * (1 - disc)), discount: disc, tier: applied };
}
