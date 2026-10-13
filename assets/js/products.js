/*
 * Printix — product catalogue.
 * SAMPLE PRICES: every price below is a placeholder chosen for the demo.
 * Confirm each one with the owner, then set pricesConfirmed: true in config.js.
 *
 * price      base price in ₹ for one piece (null = quote only)
 * options    each option list adds `add` (₹ per piece) to the base price
 * minQty     smallest quantity accepted in the order form
 * art        which illustration to draw (see illustrations.js)
 */
window.PRINTIX_CATEGORIES = [
  { id: "tshirts", name: "T-shirts", blurb: "Photo tees, couple sets, logo polos and matching team shirts." },
  { id: "mugs", name: "Mugs", blurb: "Classic, magic and inner-colour mugs for gifts and desks." },
  { id: "frames", name: "Photo frames", blurb: "Tabletop frames and collage frames for walls." },
  { id: "caps", name: "Caps", blurb: "Printed caps for adults, kids, teams and events." }
];

window.PRINTIX_PRODUCTS = [
  {
    id: "photo-tshirt",
    category: "tshirts",
    name: "Photo T-shirt",
    summary: "Round-neck cotton tee with your photo or artwork printed on the front.",
    details: "Good for birthdays, gifts and one-off designs. Send a clear photo or design file on WhatsApp.",
    price: 399,
    minQty: 1,
    popular: true,
    art: { kind: "tee", body: "#FFFFFF" },
    options: [
      { id: "size", label: "Size", choices: [
        { label: "S", add: 0 }, { label: "M", add: 0 }, { label: "L", add: 0 },
        { label: "XL", add: 0 }, { label: "XXL", add: 50 }
      ]},
      { id: "colour", label: "Shirt colour", choices: [
        { label: "White", add: 0 }, { label: "Black", add: 50 }, { label: "Navy", add: 50 }
      ]},
      { id: "print", label: "Print area", choices: [
        { label: "Front only", add: 0 }, { label: "Front and back", add: 150 }
      ]}
    ]
  },
  {
    id: "team-tshirt",
    category: "tshirts",
    name: "Team & event T-shirts",
    summary: "Matching tees with your logo for teams, offices, college events and clubs.",
    details: "Price depends on quantity, colours in the design and print size. Ask for a quote with your logo and count.",
    price: null,
    minQty: 10,
    art: { kind: "tee", body: "#13204A" },
    options: []
  },
  {
    id: "couple-tshirt",
    category: "tshirts",
    name: "Couple T-shirt set",
    summary: "Two tees with matching or paired designs, names or a shared photo.",
    details: "Tell us both sizes in the notes when you send your order.",
    price: 749,
    minQty: 1,
    art: { kind: "tee-pair", body: "#FFFFFF" },
    options: [
      { id: "colour", label: "Shirt colour", choices: [
        { label: "White", add: 0 }, { label: "Black", add: 100 }
      ]}
    ]
  },
  {
    id: "polo-tshirt",
    category: "tshirts",
    name: "Logo polo T-shirt",
    summary: "Collared polo with your logo printed on the chest. Smart enough for the office.",
    details: "Ideal for staff uniforms and shop counters.",
    price: 549,
    minQty: 1,
    art: { kind: "polo", body: "#FFFFFF" },
    options: [
      { id: "size", label: "Size", choices: [
        { label: "S", add: 0 }, { label: "M", add: 0 }, { label: "L", add: 0 },
        { label: "XL", add: 0 }, { label: "XXL", add: 50 }
      ]},
      { id: "colour", label: "Shirt colour", choices: [
        { label: "White", add: 0 }, { label: "Navy", add: 50 }, { label: "Black", add: 50 }
      ]}
    ]
  },
  {
    id: "photo-mug",
    category: "mugs",
    name: "Classic photo mug",
    summary: "White 11 oz ceramic mug printed with your photo, name or message.",
    details: "Print wraps around the mug. Hand-wash to keep the print bright.",
    price: 249,
    minQty: 1,
    popular: true,
    art: { kind: "mug", body: "#FFFFFF" },
    options: [
      { id: "box", label: "Packing", choices: [
        { label: "Standard", add: 0 }, { label: "Gift box", add: 50 }
      ]}
    ]
  },
  {
    id: "magic-mug",
    category: "mugs",
    name: "Magic mug",
    summary: "Black mug that reveals your photo when you pour in something hot.",
    details: "A favourite surprise gift. Hand-wash only.",
    price: 399,
    minQty: 1,
    art: { kind: "mug", body: "#1B1F2A", magic: true },
    options: [
      { id: "box", label: "Packing", choices: [
        { label: "Standard", add: 0 }, { label: "Gift box", add: 50 }
      ]}
    ]
  },
  {
    id: "inner-colour-mug",
    category: "mugs",
    name: "Inner colour mug",
    summary: "White mug with a coloured inside and handle, printed with your design.",
    details: "Pick the inside colour to match your photo or brand.",
    price: 299,
    minQty: 1,
    art: { kind: "mug", body: "#FFFFFF", inner: "#FF6A13" },
    options: [
      { id: "inner", label: "Inside colour", choices: [
        { label: "Orange", add: 0 }, { label: "Red", add: 0 }, { label: "Blue", add: 0 },
        { label: "Green", add: 0 }, { label: "Pink", add: 0 }, { label: "Black", add: 0 }
      ]}
    ]
  },
  {
    id: "tabletop-frame",
    category: "frames",
    name: "Tabletop photo frame",
    summary: "Your photo printed and framed with a stand, ready for a desk or shelf.",
    details: "Choose a size. We check your photo's quality before printing.",
    price: 449,
    minQty: 1,
    popular: true,
    art: { kind: "frame" },
    options: [
      { id: "size", label: "Size", choices: [
        { label: "6 × 8 in", add: 0 }, { label: "8 × 10 in", add: 100 }, { label: "8 × 12 in", add: 150 }
      ]},
      { id: "finish", label: "Frame finish", choices: [
        { label: "Black", add: 0 }, { label: "White", add: 0 }, { label: "Wood", add: 50 }
      ]}
    ]
  },
  {
    id: "collage-frame",
    category: "frames",
    name: "Collage wall frame",
    summary: "Several photos arranged into one wall frame. Good for anniversaries and family walls.",
    details: "Send up to 12 photos on WhatsApp. We share the layout for approval before printing.",
    price: 799,
    minQty: 1,
    art: { kind: "collage" },
    options: [
      { id: "size", label: "Size", choices: [
        { label: "12 × 18 in", add: 0 }, { label: "16 × 20 in", add: 300 }
      ]}
    ]
  },
  {
    id: "logo-cap",
    category: "caps",
    name: "Printed cap",
    summary: "Adjustable cotton cap with your logo, name or short text on the front.",
    details: "One size fits most adults.",
    price: 249,
    minQty: 1,
    popular: true,
    art: { kind: "cap", body: "#13204A" },
    options: [
      { id: "colour", label: "Cap colour", choices: [
        { label: "Navy", add: 0 }, { label: "Black", add: 0 }, { label: "White", add: 0 }, { label: "Red", add: 0 }
      ]}
    ]
  },
  {
    id: "kids-cap",
    category: "caps",
    name: "Kids cap",
    summary: "Smaller cap for children, printed with a name or favourite picture.",
    details: "Fits roughly ages 3 to 10.",
    price: 199,
    minQty: 1,
    art: { kind: "cap", body: "#FF6A13" },
    options: [
      { id: "colour", label: "Cap colour", choices: [
        { label: "Orange", add: 0 }, { label: "Blue", add: 0 }, { label: "Pink", add: 0 }
      ]}
    ]
  },
  {
    id: "bulk-caps",
    category: "caps",
    name: "Event & bulk caps",
    summary: "Caps in quantity for events, rallies, sports days and company giveaways.",
    details: "Price depends on quantity and print colours. Ask for a quote with your logo and count.",
    price: null,
    minQty: 20,
    art: { kind: "cap", body: "#FFFFFF" },
    options: []
  }
];
