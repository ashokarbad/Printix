// Run with: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const lib = require("../assets/js/lib.js");

// Load the browser data files into a sandbox to test them with real data.
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of ["config.js", "products.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../assets/js", f), "utf8"), sandbox);
}
const cfg = sandbox.window.PRINTIX_CONFIG;
const products = sandbox.window.PRINTIX_PRODUCTS;
const categories = sandbox.window.PRINTIX_CATEGORIES;

test("order total uses catalogue prices and option add-ons", () => {
  const r = lib.calculateOrder(products, "photo-tshirt", { size: "XXL", colour: "Black", print: "Front and back" }, 2);
  assert.equal(r.ok, true);
  assert.equal(r.unit, 399 + 50 + 50 + 150);
  assert.equal(r.total, r.unit * 2);
});

test("order rejects options and quantities not in the catalogue", () => {
  assert.equal(lib.calculateOrder(products, "photo-tshirt", { size: "M", colour: "Gold", print: "Front only" }, 1).ok, false);
  assert.equal(lib.calculateOrder(products, "photo-tshirt", { colour: "White", print: "Front only" }, 1).ok, false);
  assert.equal(lib.calculateOrder(products, "photo-mug", { box: "Standard" }, 0).ok, false);
  assert.equal(lib.calculateOrder(products, "photo-mug", { box: "Standard" }, 1.5).ok, false);
  assert.equal(lib.calculateOrder(products, "photo-mug", { box: "Standard" }, 501).ok, false);
  assert.equal(lib.calculateOrder(products, "team-tshirt", {}, 20).ok, false);
  assert.equal(lib.calculateOrder(products, "nope", {}, 1).ok, false);
});

test("catalogue data is consistent", () => {
  const ids = new Set();
  const cats = new Set(categories.map((c) => c.id));
  for (const p of products) {
    assert.ok(!ids.has(p.id), "duplicate id " + p.id);
    ids.add(p.id);
    assert.ok(cats.has(p.category), p.id + " has unknown category");
    assert.ok(p.price === null || (Number.isInteger(p.price) && p.price > 0), p.id + " price");
    for (const o of p.options) assert.ok(o.choices.length > 0, p.id + "." + o.id + " has no choices");
  }
});

test("Indian mobile numbers are normalised", () => {
  assert.equal(lib.normalizeIndianMobile("+91 98765 43210"), "9876543210");
  assert.equal(lib.normalizeIndianMobile("09876543210"), "9876543210");
  assert.equal(lib.normalizeIndianMobile("12345"), null);
  assert.equal(lib.normalizeIndianMobile("5876543210"), null);
});

test("cart reprices from the catalogue and ignores saved prices", () => {
  const cart = lib.priceCart(products, [
    { productId: "photo-mug", selections: { box: "Gift box" }, qty: 2, price: 1 },
    { productId: "logo-cap", selections: { colour: "Red" }, qty: 3 }
  ]);
  assert.equal(cart.lines.length, 2);
  assert.equal(cart.lines[0].calc.total, (249 + 50) * 2);
  assert.equal(cart.total, (249 + 50) * 2 + 249 * 3);
  assert.equal(cart.count, 5);
  assert.equal(cart.dropped, 0);
});

test("cart merges identical lines and drops invalid ones", () => {
  const cart = lib.priceCart(products, [
    { productId: "logo-cap", selections: { colour: "Navy" }, qty: 1 },
    { productId: "logo-cap", selections: { colour: "Navy" }, qty: 2 },
    { productId: "logo-cap", selections: { colour: "Gold" }, qty: 1 },
    { productId: "team-tshirt", selections: {}, qty: 20 },
    { productId: "photo-tshirt", selections: { colour: "White", print: "Front only" }, qty: 1 },
    { productId: "nope", qty: 1 },
    null,
    "junk"
  ]);
  assert.equal(cart.lines.length, 1);
  assert.equal(cart.lines[0].qty, 3);
  assert.equal(cart.dropped, 6);
});

test("cart keys ignore option order", () => {
  assert.equal(lib.cartKey("x", { a: "1", b: "2" }), lib.cartKey("x", { b: "2", a: "1" }));
  assert.notEqual(lib.cartKey("x", { a: "1" }), lib.cartKey("x", { a: "2" }));
});

test("cart message is laid out in clear sections", () => {
  const cart = lib.priceCart(products, [
    { productId: "photo-tshirt", selections: { size: "M", colour: "Black", print: "Front only" }, qty: 2 },
    { productId: "photo-mug", selections: { box: "Standard" }, qty: 1 }
  ]);
  const msg = lib.cartMessage(cart, { name: "Ravi", phone: "9876543210", notes: "Name: *Ravi*" }, { pricesConfirmed: false });
  assert.match(msg, /\*Order: 3 items\*/);
  assert.match(msg, /\*1\. Photo T-shirt\*\n• Size: M\n• Shirt colour: Black\n• Print area: Front only\n• Qty: 2 × ₹449 = \*₹898\*\n\n\*2\. Classic photo mug\*/);
  assert.match(msg, /─+\n\*Total: ₹1,147\*\n_Website prices\. Please confirm the final price\._/);
  assert.match(msg, /\*My details\*\nName: Ravi\nMobile: 98765 43210\nNotes: Name: Ravi\n/);
  assert.doesNotMatch(lib.cartMessage(cart, {}, { pricesConfirmed: true }), /Website prices/);
});

test("quote message is laid out in clear sections", () => {
  const msg = lib.quoteMessage({ product: "Event & bulk caps", qty: 50, specs: "Navy", details: "", name: "Asha", phone: "9876543210", email: "a@b.in" });
  assert.match(msg, /\*Quote request\*\n• Product: Event & bulk caps\n• Quantity: 50\n• Size \/ colour \/ finish: Navy\n\n/);
  assert.match(msg, /\*My details\*\nName: Asha\nMobile: 98765 43210\nEmail: a@b\.in/);
  assert.doesNotMatch(msg, /Details:/);
});
test("site config never exposes a UPI ID or payment details", () => {
  const text = JSON.stringify(cfg);
  assert.doesNotMatch(text, /upi|@ybl|@ok|@paytm/i);
  for (const f of fs.readdirSync(path.join(__dirname, "../assets/js"))) {
    if (!f.endsWith(".js")) continue;
    const src = fs.readFileSync(path.join(__dirname, "../assets/js", f), "utf8");
    assert.doesNotMatch(src, /upi:\/\/|qrcode/i, f + " references UPI links or QR codes");
  }
});

test("WhatsApp links encode the message", () => {
  assert.equal(lib.whatsappLink("+91 87669 96567", "Hi & bye"), "https://wa.me/918766996567?text=Hi%20%26%20bye");
});

test("rupee formatting", () => {
  assert.equal(lib.formatINR(125000), "₹1,25,000");
  assert.equal(lib.formatINR(1250.5), "₹1,250.50");
});
