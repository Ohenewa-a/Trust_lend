/*
  Equipment listing: search, filter, paginate, pick one.

  This is the step that was missing — the page used to open straight onto a
  single camera's spec sheet. Cards here link through to
  equipmentDetails.html?id=..., which is where the specs and the booking form
  now live.

  Two tiers of control, deliberately. The search box commits as you type, so
  finding something by name is immediate. The filter rail edits a *pending*
  copy and only "Apply filters" commits it, so a half-ticked set of boxes never
  leaves the results in a state nobody asked for.
*/
(function () {
  const PAGE_SIZE = 12;
  const PRICE_FLOOR = 5000;
  const PRICE_CEILING = 100000;

  // Recent searches are a convenience, not a log — five is plenty.
  const RECENT_LIMIT = 5;

  // Matches the rail's lg: breakpoint, where the filters stop collapsing.
  const WIDE = "(min-width: 1024px)";

  function byId(id) {
    return document.getElementById(id);
  }

  function emptyFilters() {
    return {
      query: "",
      city: "",
      categories: [],
      availability: [],
      minRating: 0,
      minPrice: PRICE_FLOOR,
      maxPrice: PRICE_CEILING,
    };
  }

  function cloneFilters(source) {
    return {
      query: source.query,
      city: source.city,
      categories: source.categories.slice(),
      availability: source.availability.slice(),
      minRating: source.minRating,
      minPrice: source.minPrice,
      maxPrice: source.maxPrice,
    };
  }

  // What the grid reflects, what the rail is editing, and where we are.
  let committed = emptyFilters();
  let pending = emptyFilters();
  let page = 1;

  /* ---------------- filtering ---------------- */

  function matches(item, filters) {
    /*
      A query hits the name OR the category, so searching "Camera" returns the
      cameras even though not one of them has "camera" in its name.
    */
    if (filters.query) {
      const haystack = (item.name + " " + item.category).toLowerCase();
      if (haystack.indexOf(filters.query) === -1) return false;
    }

    if (filters.city && item.city !== filters.city) return false;

    if (
      filters.categories.length &&
      filters.categories.indexOf(item.category) === -1
    ) {
      return false;
    }

    if (
      filters.availability.length &&
      filters.availability.indexOf(item.availability) === -1
    ) {
      return false;
    }

    if (item.rating < filters.minRating) return false;
    if (item.rate < filters.minPrice) return false;

    // The top of the range reads "₦100,000+", so a maximum parked at the
    // ceiling means "no upper bound" rather than "at most ₦100,000".
    if (filters.maxPrice < PRICE_CEILING && item.rate > filters.maxPrice) {
      return false;
    }

    return true;
  }

  // A short sentence describing what is narrowing the list, or the honest
  // "No filters applied" when nothing is.
  function summarise(filters) {
    const parts = [];

    if (filters.query) parts.push('"' + filters.query + '"');
    if (filters.categories.length) parts.push(filters.categories.join(", "));
    if (filters.city) parts.push(filters.city);
    if (filters.minRating) parts.push(filters.minRating + "★ and up");

    if (filters.availability.length === 1) {
      parts.push(
        filters.availability[0] === "ready"
          ? "readily available"
          : "on schedule",
      );
    }

    if (filters.minPrice > PRICE_FLOOR || filters.maxPrice < PRICE_CEILING) {
      parts.push(
        TL.fmt.naira0(filters.minPrice) +
          " – " +
          TL.fmt.naira0(filters.maxPrice) +
          (filters.maxPrice >= PRICE_CEILING ? "+" : ""),
      );
    }

    return parts.length ? parts.join(" · ") : "No filters applied";
  }

  /* ---------------- pager ---------------- */

  function pageButton(label, targetPage, options) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tl-page";

    if (options && options.icon) {
      const icon = document.createElement("i");
      icon.className = options.icon;
      icon.setAttribute("aria-hidden", "true");
      button.appendChild(icon);
      button.setAttribute("aria-label", label);
    } else {
      button.textContent = label;
    }

    if (options && options.disabled) button.disabled = true;
    if (options && options.current) button.setAttribute("aria-current", "page");

    button.addEventListener("click", function () {
      page = targetPage;
      render();

      // A page change repaints content well above the fold; without this the
      // reader is left staring at the bottom of a list they have not read.
      const grid = byId("results");
      if (typeof grid.scrollIntoView === "function") {
        grid.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    });

    return button;
  }

  function renderPager(totalPages) {
    const pager = byId("pager");
    pager.textContent = "";

    // One page of results is not a thing worth paginating.
    if (totalPages < 2) return;

    pager.appendChild(
      pageButton("Previous page", page - 1, {
        icon: "fa-solid fa-chevron-left",
        disabled: page === 1,
      }),
    );

    for (let n = 1; n <= totalPages; n += 1) {
      pager.appendChild(pageButton(String(n), n, { current: n === page }));
    }

    pager.appendChild(
      pageButton("Next page", page + 1, {
        icon: "fa-solid fa-chevron-right",
        disabled: page === totalPages,
      }),
    );
  }

  /* ---------------- render ---------------- */

  function render() {
    const found = (window.TL_CATALOGUE || []).filter(function (item) {
      return matches(item, committed);
    });

    const totalPages = Math.max(1, Math.ceil(found.length / PAGE_SIZE));

    // Filtering down can strand us past the end of the list.
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * PAGE_SIZE;

    const grid = byId("results");
    grid.textContent = "";
    found.slice(start, start + PAGE_SIZE).forEach(function (item) {
      grid.appendChild(TL.ui.productCard(item));
    });

    byId("resultCount").textContent =
      found.length +
      (found.length === 1 ? " result" : " results") +
      (totalPages > 1 ? " · page " + page + " of " + totalPages : "");

    byId("activeSummary").textContent = summarise(committed);

    TL.ui.toggle(byId("resultsEmpty"), found.length === 0);
    renderPager(totalPages);
  }

  /* ---------------- recent searches ---------------- */

  function recentList() {
    const state = TL.store.get();
    if (!state.searches) state.searches = { recent: [] };
    if (!Array.isArray(state.searches.recent)) state.searches.recent = [];
    return state.searches.recent;
  }

  function renderRecent() {
    const container = byId("recentList");
    const terms = recentList();

    container.textContent = "";

    terms.forEach(function (term) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "tl-chip";
      chip.dataset.recent = term;
      chip.textContent = term;
      container.appendChild(chip);
    });

    TL.ui.toggle(byId("recentEmpty"), terms.length === 0);
  }

  function rememberSearch(term) {
    const value = term.trim();
    if (!value) return;

    const terms = recentList();

    // Case-insensitive de-dupe, most recent first — searching the same thing
    // twice should move it to the front, not add a second chip.
    const existing = terms.findIndex(function (entry) {
      return entry.toLowerCase() === value.toLowerCase();
    });
    if (existing !== -1) terms.splice(existing, 1);

    terms.unshift(value);
    terms.splice(RECENT_LIMIT);

    TL.store.save();
    renderRecent();
  }

  /* ---------------- rail ---------------- */

  function paintPriceTrack() {
    const span = PRICE_CEILING - PRICE_FLOOR;
    const left = ((pending.minPrice - PRICE_FLOOR) / span) * 100;
    const right = ((pending.maxPrice - PRICE_FLOOR) / span) * 100;

    const fill = byId("priceFill");
    fill.style.left = left + "%";
    fill.style.width = Math.max(0, right - left) + "%";

    byId("priceMinLabel").textContent = TL.fmt.naira0(pending.minPrice);
    byId("priceMaxLabel").textContent =
      TL.fmt.naira0(pending.maxPrice) +
      (pending.maxPrice >= PRICE_CEILING ? "+" : "");
  }

  // Pushes the pending filters back onto the controls, so the rail and the
  // object it edits can never drift apart.
  function syncRail() {
    document.querySelectorAll("[data-category]").forEach(function (box) {
      box.checked = pending.categories.indexOf(box.value) !== -1;
    });

    byId("ratingChips")
      .querySelectorAll("[data-rating]")
      .forEach(function (chip) {
        chip.setAttribute(
          "aria-pressed",
          String(Number(chip.dataset.rating) === pending.minRating),
        );
      });

    byId("citySelect").value = pending.city;
    byId("availReady").checked = pending.availability.indexOf("ready") !== -1;
    byId("availScheduled").checked =
      pending.availability.indexOf("scheduled") !== -1;
    byId("priceMin").value = pending.minPrice;
    byId("priceMax").value = pending.maxPrice;

    paintPriceTrack();
  }

  function toggleMembership(list, value) {
    const at = list.indexOf(value);
    if (at === -1) list.push(value);
    else list.splice(at, 1);
  }

  /* ---------------- wiring ---------------- */

  document.addEventListener("DOMContentLoaded", function () {
    const dock = byId("searchDock");
    if (!dock || !window.TL_CATALOGUE) return;

    const searchInput = byId("searchInput");
    const clearQuery = byId("clearQuery");
    const rail = byId("filterRail");
    const toggleButton = byId("toggleFilters");
    const priceMin = byId("priceMin");
    const priceMax = byId("priceMax");

    /*
      The rail is a permanent fixture from lg up and a collapsible panel below
      it. Inline display is the only lever that beats the lg: utilities, so the
      breakpoint is watched here rather than left to CSS alone.
    */
    const wide = window.matchMedia ? window.matchMedia(WIDE) : null;

    function setRail(open) {
      TL.ui.toggle(rail, open);
      toggleButton.setAttribute("aria-expanded", String(open));
    }

    function applyBreakpoint() {
      if (!wide || wide.matches) setRail(true);
      else setRail(false);
    }

    applyBreakpoint();
    if (wide && wide.addEventListener) {
      wide.addEventListener("change", applyBreakpoint);
    }

    toggleButton.addEventListener("click", function () {
      setRail(rail.style.display === "none");
    });

    renderRecent();
    syncRail();
    render();

    /* -------- search -------- */

    // Focus and click both: after submitting, the field keeps focus, so a
    // focus handler alone would leave the popup impossible to reopen by
    // clicking the very control that opens it.
    function setSearchPanel(open) {
      TL.ui.toggle(byId("searchPanel"), open);
      searchInput.setAttribute("aria-expanded", String(open));
    }

    searchInput.addEventListener("focus", function () {
      setSearchPanel(true);
    });

    searchInput.addEventListener("click", function () {
      setSearchPanel(true);
    });

    // Typing filters live; the term is only remembered once it is submitted.
    searchInput.addEventListener("input", function () {
      committed.query = searchInput.value.trim().toLowerCase();
      page = 1;
      TL.ui.toggle(clearQuery, searchInput.value !== "");
      render();
    });

    function submitSearch() {
      rememberSearch(searchInput.value);
      committed.query = searchInput.value.trim().toLowerCase();
      pending.query = committed.query;
      page = 1;
      TL.ui.toggle(clearQuery, searchInput.value !== "");
      render();
      setSearchPanel(false);
    }

    searchInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        submitSearch();
      } else if (event.key === "Escape") {
        setSearchPanel(false);
      }
    });

    byId("searchSubmit").addEventListener("click", submitSearch);

    clearQuery.addEventListener("click", function () {
      searchInput.value = "";
      submitSearch();
      searchInput.focus();
    });

    byId("clearRecent").addEventListener("click", function () {
      recentList().length = 0;
      TL.store.save();
      renderRecent();
      TL.ui.toast("Recent searches cleared");
    });

    // One delegated handler covers both chip lists — a recent chip and a
    // trending chip do the same thing once clicked.
    byId("searchPanel").addEventListener("click", function (event) {
      const chip = event.target.closest("[data-recent], [data-trending]");
      if (!chip) return;

      searchInput.value = chip.dataset.recent || chip.dataset.trending;
      submitSearch();
    });

    // Clicking away closes the popup; the rail is not part of it.
    document.addEventListener("click", function (event) {
      if (!dock.contains(event.target)) setSearchPanel(false);
    });

    /* -------- rail -------- */

    byId("moreCategories").addEventListener("click", function (event) {
      const extra = byId("extraCategories");
      const open = extra.style.display === "none";
      TL.ui.toggle(extra, open);
      event.currentTarget.setAttribute("aria-expanded", String(open));
    });

    byId("categoryList").addEventListener("change", function (event) {
      const box = event.target.closest("[data-category]");
      if (!box) return;

      const at = pending.categories.indexOf(box.value);
      if (box.checked && at === -1) pending.categories.push(box.value);
      else if (!box.checked && at !== -1) pending.categories.splice(at, 1);
    });

    byId("citySelect").addEventListener("change", function (event) {
      pending.city = event.currentTarget.value;
    });

    byId("availReady").addEventListener("change", function (event) {
      toggleMembership(pending.availability, "ready");
      event.currentTarget.checked =
        pending.availability.indexOf("ready") !== -1;
    });

    byId("availScheduled").addEventListener("change", function (event) {
      toggleMembership(pending.availability, "scheduled");
      event.currentTarget.checked =
        pending.availability.indexOf("scheduled") !== -1;
    });

    byId("ratingChips").addEventListener("click", function (event) {
      const chip = event.target.closest("[data-rating]");
      if (!chip) return;

      const value = Number(chip.dataset.rating);
      // Single-select, and pressing the active chip clears it.
      pending.minRating = pending.minRating === value ? 0 : value;
      syncRail();
    });

    /*
      Two thumbs on one track will cross if you let them. Each input is clamped
      against the other so the handles can meet but never swap sides.
    */
    priceMin.addEventListener("input", function () {
      const value = Math.min(Number(priceMin.value), pending.maxPrice);
      priceMin.value = value;
      pending.minPrice = value;
      paintPriceTrack();
    });

    priceMax.addEventListener("input", function () {
      const value = Math.max(Number(priceMax.value), pending.minPrice);
      priceMax.value = value;
      pending.maxPrice = value;
      paintPriceTrack();
    });

    byId("applyFilters").addEventListener("click", function () {
      // The query belongs to the search box, not the rail — carry the live one
      // across so applying filters never quietly drops the search term.
      pending.query = searchInput.value.trim().toLowerCase();
      committed = cloneFilters(pending);
      page = 1;
      render();

      // On narrow screens the rail is covering the results it just changed.
      if (wide && !wide.matches) setRail(false);

      TL.ui.toast(byId("resultCount").textContent);
    });

    byId("resetFilters").addEventListener("click", function () {
      // Reset clears the rail; the search term is the search box's business.
      const query = pending.query;
      pending = emptyFilters();
      pending.query = query;
      syncRail();
    });

    byId("clearAllFilters").addEventListener("click", function () {
      committed = emptyFilters();
      pending = emptyFilters();
      searchInput.value = "";
      TL.ui.hide(clearQuery);
      page = 1;
      syncRail();
      render();
    });
  });
})();
