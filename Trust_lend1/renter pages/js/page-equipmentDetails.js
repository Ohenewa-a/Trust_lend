/*
  Equipment details: one listing from TL_CATALOGUE, picked by ?id=.

  Two things this page owes the rest of the prototype. It has to render
  whichever listing the grid sent it — otherwise "pick one that you want to
  rent" leads everyone to the same camera — and the price breakdown has to
  agree with its own dates, which the static markup did not.
*/
(function () {
  // Terms are the same across the marketplace, so they live here rather than
  // being repeated on every one of the thirty-six listings.
  const DISCOUNT_PCT = 10;
  const DEPOSIT = 5000;

  // Note: the fee is a percentage of the GROSS subtotal, not of the discounted
  // amount — that is what produces ₦2,400 on ₦30,000.
  const SERVICE_FEE_PCT = 8;

  const RELATED_LIMIT = 4;

  let item = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    const el = byId(id);
    if (el) el.textContent = value;
  }

  /* ---------------- which listing ---------------- */

  function resolveItem() {
    const catalogue = window.TL_CATALOGUE || [];
    const wanted = new URLSearchParams(window.location.search).get("id");

    const found = catalogue.filter(function (entry) {
      return entry.id === wanted;
    })[0];

    if (found) return { item: found, known: true };

    // A stale or hand-typed id should not produce a blank page. Fall back to
    // the first listing and say so, rather than pretending it was asked for.
    return { item: catalogue[0], known: !wanted };
  }

  /* ---------------- rendering ---------------- */

  function renderHighlights(details) {
    const wrap = byId("highlights");
    wrap.textContent = "";

    details.highlights.forEach(function (spec) {
      const cell = document.createElement("div");
      cell.style.textAlign = "center";

      const icon = document.createElement("i");
      icon.className = spec.icon;
      icon.style.fontSize = "15px";
      icon.style.color = "#10265e";
      icon.setAttribute("aria-hidden", "true");

      const label = document.createElement("p");
      label.textContent = spec.label;

      const value = document.createElement("p");
      value.textContent = spec.value;

      [label, value].forEach(function (line) {
        line.style.fontSize = "11px";
        line.style.fontWeight = "600";
        line.style.color = "#10265e";
        line.style.margin = "0";
      });
      label.style.marginTop = "0.5rem";

      cell.appendChild(icon);
      cell.appendChild(label);
      cell.appendChild(value);
      wrap.appendChild(cell);
    });
  }

  function renderSpecs(details) {
    const body = byId("specsBody");
    body.textContent = "";

    details.specs.forEach(function (pair, index) {
      const row = document.createElement("tr");
      if (index < details.specs.length - 1) {
        row.style.borderBottom = "1px solid #f0f4fb";
      }

      const feature = document.createElement("td");
      feature.textContent = pair[0];
      feature.style.padding = "0.75rem";
      feature.style.color = "#8a97ad";

      const value = document.createElement("td");
      value.textContent = pair[1];
      value.style.padding = "0.75rem";
      value.style.textAlign = "right";
      value.style.color = "#2f5bd0";

      row.appendChild(feature);
      row.appendChild(value);
      body.appendChild(row);
    });
  }

  function renderRelated() {
    const catalogue = window.TL_CATALOGUE || [];

    const others = catalogue
      .filter(function (entry) {
        return entry.category === item.category && entry.id !== item.id;
      })
      .slice(0, RELATED_LIMIT);

    if (!others.length) return;

    const grid = byId("related");
    others.forEach(function (entry) {
      grid.appendChild(TL.ui.productCard(entry));
    });

    setText("relatedHeading", "More in " + item.category);
    TL.ui.show(byId("relatedSection"));
  }

  function renderItem(known) {
    const details = (window.TL_CATEGORY_DETAILS || {})[item.category] || {
      about: "",
      highlights: [],
      specs: [],
    };

    document.title = "TrustLend - " + item.name;
    setText("pageTitle", item.name);

    const hero = byId("heroImage");
    hero.src = item.image;
    hero.alt = item.name;

    setText("itemName", item.name);
    setText("itemRating", item.rating.toFixed(2));
    setText("itemReviews", "(" + item.reviews + " Rentals)");
    setText("itemCity", item.city);
    setText("itemCategory", item.category);
    setText("itemAbout", details.about);
    setText("itemRate", TL.fmt.naira0(item.rate));
    setText("ownerName", item.owner);
    setText("ownerRentals", String(item.reviews * 4));
    setText("deliveryLine", "Self Pickup (" + item.city + ")");
    setText(
      "depositNote",
      "Refundable Deposit: " +
        TL.fmt.naira0(DEPOSIT) +
        ". Held securely and released 24 hours after gear return. Insurance coverage included.",
    );

    // The badge repeats what the card said, so the two cannot disagree.
    const badge = byId("itemAvailability");
    const ready = item.availability === "ready";
    badge.lastChild.textContent = ready ? " AVAILABLE NOW" : " ON SCHEDULE";
    if (!ready) {
      badge.style.background = "#fff3d4";
      badge.style.color = "#b47f06";
    }

    renderHighlights(details);
    renderSpecs(details);
    renderRelated();

    TL.ui.toggle(byId("unknownNotice"), !known);
  }

  /* ---------------- pricing ---------------- */

  function quote(days) {
    const subtotal = item.rate * days;
    const discount = (subtotal * DISCOUNT_PCT) / 100;
    const serviceFee = (subtotal * SERVICE_FEE_PCT) / 100;

    return {
      days: days,
      subtotal: subtotal,
      discount: discount,
      serviceFee: serviceFee,
      deposit: DEPOSIT,
      total: subtotal - discount + serviceFee + DEPOSIT,
    };
  }

  function recalcPrice() {
    const startEl = byId("startDate");
    const endEl = byId("endDate");
    const errorEl = byId("dateError");
    const bookButton = byId("bookNowButton");
    if (!startEl || !endEl) return null;

    const days = TL.fmt.dayCount(startEl.value, endEl.value);

    if (days < 1) {
      errorEl.textContent = "The return date must be after the pickup date.";
      TL.ui.show(errorEl);
      bookButton.disabled = true;
      bookButton.style.opacity = "0.5";
      bookButton.style.cursor = "not-allowed";
      return null;
    }

    TL.ui.hide(errorEl);
    bookButton.disabled = false;
    bookButton.style.opacity = "";
    bookButton.style.cursor = "";

    const price = quote(days);

    setText(
      "priceRateLine",
      TL.fmt.naira2(item.rate) + " x " + days + (days === 1 ? " day" : " days"),
    );
    setText("priceSubtotal", TL.fmt.naira2(price.subtotal));
    setText("priceDiscount", "-" + TL.fmt.naira2(price.discount));
    setText("priceServiceFee", TL.fmt.naira2(price.serviceFee));
    setText("priceDeposit", TL.fmt.naira2(price.deposit));
    setText("priceTotal", TL.fmt.naira2(price.total));

    return price;
  }

  /* ---------------- wiring ---------------- */

  document.addEventListener("DOMContentLoaded", function () {
    const startEl = byId("startDate");
    const endEl = byId("endDate");
    if (!startEl || !endEl || !window.TL_CATALOGUE) return;

    const resolved = resolveItem();
    if (!resolved.item) return;

    item = resolved.item;
    renderItem(resolved.known);

    TL.ui.initModal(byId("bookingModal"));

    // Keep the range coherent: no past pickups, no returns before pickup.
    startEl.min = TL.fmt.todayISO();
    endEl.min = startEl.value;

    startEl.addEventListener("change", function () {
      endEl.min = startEl.value;
      recalcPrice();
    });
    endEl.addEventListener("change", recalcPrice);

    byId("bookNowButton").addEventListener("click", function (event) {
      const price = recalcPrice();
      if (!price) return;

      setText(
        "bookingSummary",
        item.name + " · " + price.days + (price.days === 1 ? " day" : " days"),
      );
      setText("bookingTotal", TL.fmt.naira2(price.total));
      TL.ui.openModal(byId("bookingModal"), event.currentTarget);
    });

    // Runs on load, which is what corrects the days/price mismatch.
    recalcPrice();
  });
})();
