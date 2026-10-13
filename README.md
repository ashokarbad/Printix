# Printix website

Static 5-page website for Printix (custom T-shirts, mugs, photo frames and caps), built for GitHub Pages. Plain HTML, CSS and JavaScript: no build step, no backend, no paid services.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home |
| `products/index.html` | Products: search, category filters, options dialog with live colour/size preview, add to cart |
| `about/index.html` | About |
| `contact/index.html` | Contact details and quote form |
| `policies/index.html` | Privacy, terms, payments and refunds, shipping and delivery |

## Before you go live — must do

1. **Prices.** Every price in `assets/js/products.js` is a sample. Confirm each one with the owner, then set `pricesConfirmed: true` in `assets/js/config.js` to hide the "starting prices" notice.
2. **Policies.** Fill every yellow `[... — confirm]` item in `policies/index.html` (production days, refund window, delivery, file retention, other payment methods). Remove the `mark class="tbc"` tags once filled.
3. **About.** The About page and policies describe a "preview before print" process and "we don't use your designs without permission". Make sure the owner actually works this way, or change the text. There is an HTML comment in `about/index.html` for the owner's own story.
4. **Site URL.** Replace `https://YOUR-SITE-URL/` in all five `index.html` files, `robots.txt` and `sitemap.xml` with the real address (for example `https://ashokarbad.github.io/printix/` or your custom domain). One find-and-replace across the folder does it.
5. **Logo.** The logo is a 144 × 144 px image. It's fine in the header, but get an SVG or a 1000 px+ transparent PNG for sharp social previews and print.
6. **Optional details.** `config.js` has empty `email`, `address` and `mapUrl`. They stay hidden until you fill them in. Add opening days to `hoursDays` (e.g. `"Monday to Saturday"`).

## Payments

The website does not take payments and never shows a QR code or UPI ID. Customers send their order on WhatsApp; the shop replies with a design preview, the final price and payment details. Check the money has arrived in your account before printing; a screenshot alone isn't proof.

If you later want online payment on the site, use a payment gateway (Razorpay, PhonePe PG, Cashfree) with server-side verification. That needs a backend, which GitHub Pages can't host.

## How orders and quotes reach the shop

GitHub Pages can't receive form submissions or file uploads, so everything goes through WhatsApp.

**Cart.** Customers choose options and press "Add to cart" on any product, on the home page or the products page. The cart button in the header shows how many items are in it on every page. In the cart they can change quantities, remove items, add their name, mobile number and notes, and press "Send order on WhatsApp". WhatsApp opens with one message listing every item, its options, quantity and price, and the total. They press send there and attach their photos in the same chat.

- The cart is saved in the customer's own browser (`localStorage`), so it survives moving between pages and closing the tab. Nothing reaches the shop until they press send in WhatsApp. If a browser blocks storage (some private windows), the cart still works but empties when they change page.
- Only product ids, options and quantities are saved. Prices are recalculated from `products.js` every time, so changing a price updates existing carts, and items whose product or option no longer exists are removed with a notice.
- After sending, the customer can empty the cart with "I've sent it – empty my cart". It isn't emptied automatically, because the site can't tell whether they actually pressed send in WhatsApp.
- Products priced "On request" (team T-shirts, bulk caps) aren't added to the cart; they go through the quote form.

**Quotes.** The quote form on the Contact page opens WhatsApp with the request filled in.

## Editing content

- Business details: `assets/js/config.js`
- Products, options and prices: `assets/js/products.js` (comments at the top explain the fields)
- Product pictures: drawn as SVG by `assets/js/illustrations.js`. In the order dialog the picture follows the chosen colour, inside colour, frame finish, size, print area and gift box. New colour names go in the `NAMED` list at the top of that file. To use a real photo, put it in `assets/img/` and add `image: "assets/img/your-photo.webp"` to that product.
- Featured products on the home page: set `popular: true` (four works best).
- Colours and type: CSS variables at the top of `assets/css/style.css`.
- The header and footer are repeated in each `index.html`; change all five if you edit them.

## Preview locally

The folder is self-contained: double-click `index.html` and every page, link and product dialog works offline. No server, internet or install needed (WhatsApp buttons need internet to send, of course).

All links point at `.../index.html` so they work from disk. On the live site the address bar stays clean: `index.html` is hidden and the `?category=`, `?product=` and `#section` parts that pages use to talk to each other are removed once the page has loaded. Visitors see addresses like `printix.in/products/`. Opened from a folder, the browser always shows the file path; that's normal and only you see it.

## Tests

```
node --test tests/lib.test.js
```

Covers price calculation, rejection of options and quantities not in the catalogue, cart repricing, merging and clean-up, the cart's WhatsApp message, phone validation, catalogue data consistency, and a check that no UPI link or QR code has crept back into the site.

## Deploy to GitHub Pages

1. Create a repository (e.g. `printix`) and push the contents of this folder to the `main` branch root.
2. Repository **Settings → Pages → Build and deployment → Deploy from a branch → `main` / root**.
3. The site appears at `https://<username>.github.io/printix/` within a minute or two. Enforce HTTPS is on by default for github.io.
4. **Use your own domain** (e.g. `printix.in`) so the address bar reads `printix.in` instead of `username.github.io/printix/`. Buy the domain, add it under Settings → Pages → Custom domain (GitHub creates a `CNAME` file for you), point the domain's DNS at GitHub as GitHub's instructions describe, then tick **Enforce HTTPS**. Finally, replace `YOUR-SITE-URL` with `printix.in` everywhere (see "Before you go live").

## Security notes

- No secrets anywhere: everything in this folder is public. Never add passwords, API keys or bank details.
- A Content Security Policy is set with a `<meta>` tag (GitHub Pages can't set headers): scripts, fonts and images load only from this site. If you add Google Maps embeds or analytics later, update the policy in each page's `<head>`.
- No cookies, analytics or third-party scripts. The font (Archivo, SIL Open Font License) is bundled locally.
- All text that customers type is escaped before it's shown on the page.
