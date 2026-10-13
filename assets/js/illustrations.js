/*
 * Printix — product illustrations drawn as SVG.
 * Placeholders until real product photos are available: replace by adding
 * an `image` field to a product in products.js (see catalogue.js).
 *
 * art fields:
 *   kind     tee | tee-pair | polo | mug | frame | collage | cap
 *   body     garment / mug / cap colour (hex)
 *   inner    mug inside and handle colour (hex)
 *   frame    frame moulding colour (hex)
 *   scale    0.8–1.1, used to show size changes
 *   badge    short text shown in a corner pill (e.g. the chosen size)
 *   back     tee: also show the back print
 *   giftBox  mug: show a gift box beside it
 */
(function (root) {
  "use strict";

  var C = "#00AEEF", M = "#EC008C", Y = "#FFD200", K = "#13204A", O = "#FF6A13";
  var uid = 0;

  // Colour names used in products.js mapped to the colours drawn on screen.
  var NAMED = {
    white: "#FFFFFF", black: "#1B1F2A", navy: "#13204A", red: "#D7263D",
    orange: "#FF6A13", blue: "#1F6FD1", pink: "#F06AAE", green: "#1E9E5A",
    wood: "#A8743F", grey: "#8A93A6", yellow: "#FFD200", maroon: "#7A1F2B"
  };

  function colourFor(label) {
    return NAMED[String(label || "").trim().toLowerCase()] || null;
  }

  var palettes = [
    { sky: C, sun: Y, far: M, near: K },
    { sky: Y, sun: O, far: M, near: K },
    { sky: M, sun: Y, far: C, near: K },
    { sky: "#BFE9FB", sun: O, far: C, near: K }
  ];

  // A tiny "photo": sky, sun and two hills, clipped to a rectangle.
  function photo(x, y, w, h, v) {
    var p = palettes[(v || 0) % palettes.length];
    var id = "pxclip" + (++uid);
    return '<clipPath id="' + id + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2"/></clipPath>' +
      '<g clip-path="url(#' + id + ')">' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + p.sky + '"/>' +
      '<circle cx="' + (x + w * 0.68) + '" cy="' + (y + h * 0.38) + '" r="' + (Math.min(w, h) * 0.17) + '" fill="' + p.sun + '"/>' +
      '<path d="M' + x + ' ' + (y + h * 0.78) + ' Q' + (x + w * 0.3) + ' ' + (y + h * 0.42) + ' ' + (x + w * 0.62) + ' ' + (y + h * 0.74) + ' T' + (x + w) + ' ' + (y + h * 0.66) + ' V' + (y + h) + ' H' + x + 'Z" fill="' + p.far + '"/>' +
      '<path d="M' + x + ' ' + (y + h * 0.9) + ' Q' + (x + w * 0.45) + ' ' + (y + h * 0.66) + ' ' + (x + w) + ' ' + (y + h * 0.88) + ' V' + (y + h) + ' H' + x + 'Z" fill="' + p.near + '"/>' +
      '</g>';
  }

  // Small splash mark for logo prints (polo chest, caps).
  function splash(cx, cy, s) {
    return '<g transform="translate(' + cx + ' ' + cy + ') scale(' + s + ')">' +
      '<circle cx="-5" cy="-3" r="7" fill="' + M + '"/>' +
      '<circle cx="5" cy="-4" r="6" fill="' + C + '"/>' +
      '<circle cx="1" cy="5" r="6" fill="' + Y + '"/>' +
      '<circle cx="9" cy="5" r="3" fill="' + O + '"/></g>';
  }

  function isDark(hex) {
    var h = (hex || "#fff").replace("#", "");
    var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 110;
  }

  function strokeFor(body) {
    return isDark(body) ? "#56607E" : K;
  }

  // Slightly darker shade for folds and inner surfaces.
  function shade(hex, amt) {
    var h = (hex || "#ffffff").replace("#", "");
    var out = "#";
    for (var i = 0; i < 3; i++) {
      var v = Math.max(0, Math.min(255, Math.round(parseInt(h.substr(i * 2, 2), 16) * (1 - amt))));
      out += ("0" + v.toString(16)).slice(-2);
    }
    return out;
  }

  var TEE = "M62 32 L82 24 Q100 38 118 24 L138 32 L170 60 L152 82 L140 73 L140 176 L60 176 L60 73 L48 82 L30 60 Z";

  function teeShape(body) {
    var s = strokeFor(body);
    return '<path d="' + TEE + '" fill="' + body + '" stroke="' + s + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M82 24 Q100 44 118 24" fill="' + shade(body, 0.12) + '" stroke="' + s + '" stroke-width="2.5"/>';
  }

  function tee(a, v) {
    var body = a.body || "#FFFFFF";
    if (!a.back) return teeShape(body) + photo(77, 66, 46, 52, v);
    // Front and back: back view sits behind, offset up and to the right.
    return '<g transform="translate(46 -6) scale(.74)" opacity=".96">' +
        teeShape(body).replace('Q100 44 118 24', 'Q100 30 118 24') + photo(74, 52, 52, 66, v + 2) +
        '<text x="100" y="166" text-anchor="middle" font-size="15" font-weight="800" fill="' + strokeFor(body) + '">BACK</text>' +
      '</g>' +
      '<g transform="translate(-22 18) scale(.84)">' + teeShape(body) + photo(77, 66, 46, 52, v) + '</g>';
  }

  function polo(a) {
    var body = a.body || "#FFFFFF";
    var s = strokeFor(body);
    return '<path d="' + TEE + '" fill="' + body + '" stroke="' + s + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M82 24 L94 44 L100 30 L106 44 L118 24" fill="' + shade(body, 0.08) + '" stroke="' + s + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<line x1="100" y1="44" x2="100" y2="68" stroke="' + s + '" stroke-width="2"/>' +
      '<circle cx="100" cy="52" r="1.8" fill="' + s + '"/><circle cx="100" cy="61" r="1.8" fill="' + s + '"/>' +
      splash(121, 66, 0.9);
  }

  function teePair(a) {
    var first = a.body || "#FFFFFF";
    var second = isDark(first) ? "#FFFFFF" : K;
    return '<g transform="translate(-22 18) scale(.78)">' + tee({ body: first }, 2) + '</g>' +
      '<g transform="translate(66 26) scale(.78)">' + tee({ body: second }, 0) + '</g>';
  }

  function giftBox() {
    return '<g transform="translate(140 128)">' +
      '<rect x="0" y="10" width="50" height="40" rx="3" fill="' + O + '" stroke="' + K + '" stroke-width="2.5"/>' +
      '<rect x="-3" y="2" width="56" height="12" rx="3" fill="' + O + '" stroke="' + K + '" stroke-width="2.5"/>' +
      '<rect x="20" y="2" width="10" height="48" fill="' + Y + '" stroke="' + K + '" stroke-width="2"/>' +
      '<path d="M25 2 C14 -12 2 -2 25 2 C48 -2 36 -12 25 2Z" fill="' + Y + '" stroke="' + K + '" stroke-width="2"/></g>';
  }

  function mug(a, v) {
    var body = a.body || "#FFFFFF";
    var s = strokeFor(body);
    var inner = a.inner || (isDark(body) ? "#2B3142" : "#E7EAF0");
    var handle = a.inner || body;
    var printArt = photo(58, 74, 70, 64, v);
    if (a.magic) {
      var gid = "pxfade" + (++uid);
      printArt += '<defs><linearGradient id="' + gid + '" x1="0" x2="1"><stop offset=".45" stop-color="' + body + '" stop-opacity="0"/><stop offset=".7" stop-color="' + body + '" stop-opacity="1"/></linearGradient></defs>' +
        '<rect x="57" y="73" width="72" height="66" fill="url(#' + gid + ')"/>' +
        '<path d="M80 52 q-6 -9 0 -16 q6 -7 0 -14 M96 52 q-6 -9 0 -16 q6 -7 0 -14" fill="none" stroke="#9AA3B8" stroke-width="2" stroke-linecap="round"/>';
    }
    var cup = '<path d="M138 82 C176 82 176 140 138 140" fill="none" stroke="' + s + '" stroke-width="16" stroke-linecap="round"/>' +
      '<path d="M138 82 C176 82 176 140 138 140" fill="none" stroke="' + handle + '" stroke-width="10" stroke-linecap="round"/>' +
      '<path d="M46 62 V150 Q46 162 58 162 H128 Q140 162 140 150 V62 Z" fill="' + body + '" stroke="' + s + '" stroke-width="2.5"/>' +
      '<ellipse cx="93" cy="62" rx="47" ry="9" fill="' + inner + '" stroke="' + s + '" stroke-width="2.5"/>' +
      printArt;
    if (a.giftBox) return '<g transform="translate(-14 -6)">' + cup + '</g>' + giftBox();
    return cup;
  }

  function frame(a, v) {
    var f = a.frame || K;
    var edge = isDark(f) ? f : shade(f, 0.35);
    return '<rect x="48" y="26" width="104" height="140" rx="3" fill="' + f + '" stroke="' + edge + '" stroke-width="2"/>' +
      '<rect x="58" y="36" width="84" height="120" fill="#FFFFFF" stroke="' + shade(f, 0.2) + '" stroke-width="1"/>' +
      photo(66, 44, 68, 104, v) +
      '<path d="M70 166 L62 180 M130 166 L138 180" stroke="' + edge + '" stroke-width="5" stroke-linecap="round"/>';
  }

  function collage(a) {
    var f = a.frame || K;
    var out = '<rect x="18" y="40" width="164" height="120" rx="3" fill="' + f + '"/><rect x="26" y="48" width="148" height="104" fill="#FFFFFF"/>';
    var cells = [[32, 54, 64, 44], [100, 54, 32, 44], [136, 54, 32, 44], [32, 102, 32, 44], [68, 102, 64, 44], [136, 102, 32, 44]];
    for (var i = 0; i < cells.length; i++) out += photo(cells[i][0], cells[i][1], cells[i][2], cells[i][3], i);
    return out;
  }

  function cap(a) {
    var body = a.body || K;
    var s = strokeFor(body);
    return '<path d="M38 126 Q100 112 178 130 Q160 148 38 134 Z" fill="' + shade(body, 0.1) + '" stroke="' + s + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M46 126 Q48 62 104 58 Q156 62 160 126 Q100 116 46 126 Z" fill="' + body + '" stroke="' + s + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M104 58 Q86 80 84 122 M104 58 Q126 82 130 120" fill="none" stroke="' + s + '" stroke-width="1.5" opacity=".6"/>' +
      '<circle cx="104" cy="58" r="4" fill="' + s + '"/>' +
      splash(104, 96, 1.25);
  }

  function badge(text) {
    var t = String(text).replace(/[<>&"]/g, "");
    var w = Math.max(30, 14 + t.length * 8.2);
    return '<g transform="translate(' + (194 - w) + ' 166)">' +
      '<rect width="' + w + '" height="26" rx="13" fill="' + K + '"/>' +
      '<text x="' + (w / 2) + '" y="17.5" text-anchor="middle" font-size="13" font-weight="800" fill="#FFFFFF">' + t + '</text></g>';
  }

  var drawers = { "tee": tee, "tee-pair": teePair, "polo": polo, "mug": mug, "frame": frame, "collage": collage, "cap": cap };

  function render(art, variant, title) {
    art = art || {};
    var draw = drawers[art.kind] || tee;
    var inner = draw(art, variant || 0);
    var s = Number(art.scale);
    if (isFinite(s) && s > 0 && s !== 1) {
      inner = '<g transform="translate(100 104) scale(' + s.toFixed(3) + ') translate(-100 -104)">' + inner + '</g>';
    }
    if (art.badge) inner += badge(art.badge);
    return '<svg viewBox="0 0 200 200" role="img" aria-label="' + (title || "Product illustration") + '" xmlns="http://www.w3.org/2000/svg" font-family="Archivo, system-ui, sans-serif">' +
      inner + '</svg>';
  }

  // Option ids whose choices are colours, and which part of the drawing they colour.
  var COLOUR_OPTIONS = { colour: "body", inner: "inner", finish: "frame" };

  /*
   * Illustration settings for a product with the customer's choices applied,
   * so the picture follows colour, size, print area and packing.
   */
  function forSelections(p, selections) {
    var a = {};
    for (var k in p.art) if (Object.prototype.hasOwnProperty.call(p.art, k)) a[k] = p.art[k];
    var sel = selections || {};
    Object.keys(COLOUR_OPTIONS).forEach(function (optId) {
      var hex = sel[optId] ? colourFor(sel[optId]) : null;
      if (hex) a[COLOUR_OPTIONS[optId]] = hex;
    });
    var size = null;
    (p.options || []).forEach(function (o) { if (o.id === "size") size = o; });
    if (size && sel.size) {
      var idx = -1;
      size.choices.forEach(function (c, i) { if (c.label === sel.size) idx = i; });
      if (idx >= 0) {
        var range = a.kind === "frame" ? [0.8, 1] : a.kind === "collage" ? [0.86, 1] : [0.84, 1.08];
        var t = size.choices.length > 1 ? idx / (size.choices.length - 1) : 1;
        a.scale = range[0] + t * (range[1] - range[0]);
        a.badge = sel.size;
      }
    }
    if (sel.print === "Front and back") a.back = true;
    if (sel.box === "Gift box") a.giftBox = true;
    return a;
  }

  root.PrintixArt = { render: render, colourFor: colourFor, forSelections: forSelections, COLOUR_OPTIONS: COLOUR_OPTIONS };
})(window);
