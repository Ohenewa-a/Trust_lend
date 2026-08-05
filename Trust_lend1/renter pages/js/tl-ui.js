/*
  Shared UI behaviour for every page.

  Tailwind is loaded through the browser build, which only generates CSS for
  class names it can find in the served markup. Nothing here invents a class
  string at runtime: elements are hidden with inline styles, dynamic state
  rides on aria-* attributes, and anything that needs styling of its own lives
  in style.css.
*/
window.TL = window.TL || {};

TL.ui = (function () {
  /* ---------------- visibility ---------------- */

  /*
    Inline display rather than toggling a `hidden` class: `hidden` is
    display:none at the same specificity as the flex/grid utilities several of
    these elements already carry, so it silently loses. An inline style always
    wins.
  */
  function hide(el) {
    if (el) el.style.display = "none";
  }

  function show(el) {
    if (el) el.style.display = "";
  }

  function toggle(el, visible) {
    if (visible) show(el);
    else hide(el);
  }

  /* ---------------- toasts ---------------- */

  let toastTimer = null;

  function toast(message) {
    let node = document.getElementById("tlToast");

    if (!node) {
      node = document.createElement("div");
      node.id = "tlToast";
      node.className = "tl-toast";
      node.setAttribute("role", "status");
      node.setAttribute("aria-live", "polite");
      document.body.appendChild(node);
    }

    node.textContent = message;
    node.classList.add("tl-toast--on");

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      node.classList.remove("tl-toast--on");
    }, 2600);
  }

  /* ---------------- sidebar ---------------- */

  /*
    Off-canvas menu for small screens. The panel is always in the DOM but
    parked off-screen and `invisible`, which also keeps its links out of the
    tab order while closed. Desktop is unaffected: the md: variants win inside
    the breakpoint, so toggling the base classes never touches it.
  */
  function initSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const openButton = document.getElementById("menuButton");
    const closeButton = document.getElementById("closeSidebar");
    if (!sidebar || !overlay || !openButton) return;

    const desktop = window.matchMedia("(min-width: 768px)");

    function setMenu(open) {
      sidebar.classList.toggle("-translate-x-full", !open);
      sidebar.classList.toggle("invisible", !open);
      overlay.classList.toggle("hidden", !open);
      openButton.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    }

    openButton.addEventListener("click", function () {
      setMenu(true);
    });
    if (closeButton) {
      closeButton.addEventListener("click", function () {
        setMenu(false);
      });
    }
    overlay.addEventListener("click", function () {
      setMenu(false);
    });

    sidebar.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setMenu(false);
    });

    desktop.addEventListener("change", function (event) {
      if (event.matches) setMenu(false);
    });
  }

  /* ---------------- filter chips ---------------- */

  /*
    One filter component for both tables. Selection is carried on
    aria-pressed — screen readers get it for free and style.css can target it,
    so no class juggling is involved.

    The chosen chip is remembered per page for the length of the tab, which
    makes the tables feel like they hold their place.
  */
  function initFilterGroup(options) {
    const container = document.querySelector(
      '[data-filter-group="' + options.group + '"]',
    );
    const empty = options.empty ? document.querySelector(options.empty) : null;
    if (!container) return null;

    const storageKey = "trustlend.filter." + options.group;

    function apply(value) {
      let visible = 0;

      /*
        Queried on every call rather than cached: the wallet replaces its rows
        when a withdrawal lands, and a cached list would still be pointing at
        the elements that were thrown away.
      */
      document.querySelectorAll(options.rows).forEach(function (row) {
        const match =
          value === "all" || row.getAttribute(options.attr) === value;
        toggle(row, match);
        if (match) visible += 1;
      });

      container.querySelectorAll("[data-filter]").forEach(function (chip) {
        chip.setAttribute(
          "aria-pressed",
          String(chip.dataset.filter === value),
        );
      });

      if (empty) toggle(empty, visible === 0);
      if (typeof options.onChange === "function")
        options.onChange(value, visible);

      try {
        window.sessionStorage.setItem(storageKey, value);
      } catch (error) {
        /* session storage is a nicety; never break filtering over it */
      }
    }

    /*
      The wallet re-runs this after re-rendering its table, so guard against
      stacking a second click handler on the same chip row each time.
    */
    if (!container.dataset.filterBound) {
      container.dataset.filterBound = "true";
      container.addEventListener("click", function (event) {
        const chip = event.target.closest("[data-filter]");
        if (chip && container.contains(chip)) apply(chip.dataset.filter);
      });
    }

    let initial = "all";
    try {
      initial = window.sessionStorage.getItem(storageKey) || "all";
    } catch (error) {
      /* ignore */
    }
    apply(initial);

    // Returned so callers can re-apply after re-rendering a table body.
    return {
      apply: apply,
      current: function () {
        const pressed = container.querySelector(
          '[data-filter][aria-pressed="true"]',
        );
        return pressed ? pressed.dataset.filter : "all";
      },
    };
  }

  /* ---------------- modals ---------------- */

  /*
    Modal markup is pre-seeded in the HTML and hidden on boot rather than being
    built here — see the note at the top of this file about class generation.

    No full focus trap: for a prototype, aria-modal plus moving focus in and
    restoring it on close covers the value without another 40 lines.
  */
  let lastOpener = null;

  function openModal(modal, opener, focusTarget) {
    if (!modal) return;
    lastOpener = opener || null;
    show(modal);
    document.body.style.overflow = "hidden";

    const target = focusTarget || modal.querySelector("input, select, button");
    if (target) target.focus();
  }

  function closeModal(modal) {
    if (!modal) return;
    hide(modal);
    document.body.style.overflow = "";
    if (lastOpener) {
      lastOpener.focus();
      lastOpener = null;
    }
  }

  /*
    Wires the parts every modal shares: hidden on boot, closed by Escape, by
    the backdrop, and by anything marked data-modal-close.
  */
  function initModal(modal) {
    if (!modal) return;
    hide(modal);

    modal.addEventListener("click", function (event) {
      if (
        event.target.hasAttribute("data-modal-backdrop") ||
        event.target.closest("[data-modal-close]")
      ) {
        closeModal(modal);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modal.style.display !== "none")
        closeModal(modal);
    });
  }

  /* ---------------- product cards ---------------- */

  /*
    One card builder for the listing grid and for the "more like this" strip on
    the details page. It is here rather than in either page's script because
    both need the identical card, and two copies would drift.

    Note what it does NOT use: Tailwind utilities. These nodes are created
    after the browser build has scanned the page, so every class they carry is
    defined in style.css (.tl-product and friends).
  */
  function stars(rating) {
    const wrap = document.createElement("span");
    wrap.className = "tl-product__stars";

    // Half a star up rounds to a full one, which is how the design's four- and
    // five-star rows read.
    const filled = Math.round(rating);

    for (let i = 1; i <= 5; i += 1) {
      const star = document.createElement("i");
      star.className = "fa-solid fa-star" + (i > filled ? " tl-star--off" : "");
      star.setAttribute("aria-hidden", "true");
      wrap.appendChild(star);
    }

    // The glyphs are decorative; the rating is announced once, here.
    const label = document.createElement("span");
    label.className = "tl-sr-only";
    label.textContent = rating + " out of 5";
    wrap.appendChild(label);

    return wrap;
  }

  function productCard(item) {
    const card = document.createElement("a");
    card.className = "tl-product";
    card.href = "equipmentDetails.html?id=" + encodeURIComponent(item.id);

    const image = document.createElement("img");
    image.className = "tl-product__image";
    image.src = item.image;
    image.alt = item.name;
    image.loading = "lazy";
    card.appendChild(image);

    const body = document.createElement("div");
    body.className = "tl-product__body";

    const titleRow = document.createElement("div");
    titleRow.className = "tl-product__row";

    const name = document.createElement("p");
    name.className = "tl-product__name";
    name.textContent = item.name;

    const city = document.createElement("span");
    city.className = "tl-product__city";
    city.textContent = item.city;

    titleRow.appendChild(name);
    titleRow.appendChild(city);
    body.appendChild(titleRow);

    const priceRow = document.createElement("div");
    priceRow.className = "tl-product__row";

    const price = document.createElement("span");
    price.className = "tl-product__price";
    price.textContent = TL.fmt.naira0(item.rate);

    const per = document.createElement("span");
    per.className = "tl-product__per";
    per.textContent = "/day";
    price.appendChild(per);

    const ready = item.availability === "ready";
    const pill = document.createElement("span");
    pill.className =
      "tl-product__pill" + (ready ? "" : " tl-product__pill--sched");
    pill.textContent = ready ? "Available" : "On schedule";

    priceRow.appendChild(price);
    priceRow.appendChild(pill);
    body.appendChild(priceRow);

    body.appendChild(stars(item.rating));
    card.appendChild(body);

    return card;
  }

  /* ---------------- placeholder links ---------------- */

  /*
    The footers carry ~60 href="#" links. Left alone, every click jumps the
    page to the top, which reads as breakage. One delegated handler turns the
    lot into an honest "not built yet" message without touching the markup.
  */
  function initPlaceholderLinks() {
    document.addEventListener("click", function (event) {
      const link = event.target.closest('a[href="#"]');
      if (!link) return;
      event.preventDefault();
      toast((link.textContent || "That page").trim() + " is coming soon");
    });
  }

  /* ---------------- storage notice ---------------- */

  // Safari blocks localStorage on file:// — say so rather than silently forgetting.
  function initStorageNotice() {
    if (TL.store.isPersistent()) return;

    const banner = document.getElementById("storageNotice");
    if (banner) show(banner);
  }

  function initResetControl() {
    document.addEventListener("click", function (event) {
      const trigger = event.target.closest('[data-action="reset-demo"]');
      if (!trigger) return;
      event.preventDefault();
      TL.store.reset();
    });
  }

  function init() {
    TL.store.boot();
    initSidebar();
    initPlaceholderLinks();
    initStorageNotice();
    initResetControl();
  }

  return {
    init: init,
    initSidebar: initSidebar,
    initFilterGroup: initFilterGroup,
    initModal: initModal,
    openModal: openModal,
    closeModal: closeModal,
    productCard: productCard,
    stars: stars,
    show: show,
    hide: hide,
    toggle: toggle,
    toast: toast,
  };
})();

document.addEventListener("DOMContentLoaded", function () {
  TL.ui.init();
});
