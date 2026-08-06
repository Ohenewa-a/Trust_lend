/*
  State, persistence and formatting for the TrustLend prototype.

  There is no backend. State starts as a deep clone of TL_SEED and is written
  to localStorage on every change, so a withdrawal made on the wallet page is
  still there after a refresh and is visible from the other pages.
*/
window.TL = window.TL || {};

(function () {
  const KEY = "trustlend.state";

  // Bump this after editing tl-data.js, otherwise saved state keeps winning
  // and the edit looks like it did nothing.
  const SCHEMA = 3;

  let state = null;

  /*
    Safari throws on localStorage access from file:// rather than returning
    null, so every access goes through these. When storage is unavailable the
    prototype still runs — it just forgets on refresh, and says so.
  */
  const memory = new Map();
  let persistent = true;

  function readRaw() {
    try {
      return window.localStorage.getItem(KEY);
    } catch (error) {
      persistent = false;
      return memory.get(KEY) || null;
    }
  }

  function writeRaw(value) {
    try {
      window.localStorage.setItem(KEY, value);
    } catch (error) {
      persistent = false;
      memory.set(KEY, value);
    }
  }

  function clearRaw() {
    try {
      window.localStorage.removeItem(KEY);
    } catch (error) {
      memory.delete(KEY);
    }
  }

  function freshState() {
    const seed = JSON.parse(JSON.stringify(window.TL_SEED));
    seed.schema = SCHEMA;
    return seed;
  }

  function boot() {
    if (state) return state;

    const saved = readRaw();
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        state = parsed && parsed.schema === SCHEMA ? parsed : freshState();
      } catch (error) {
        state = freshState();
      }
    } else {
      state = freshState();
    }

    return state;
  }

  function save() {
    writeRaw(JSON.stringify(state));
    document.dispatchEvent(
      new CustomEvent("tl:state-changed", { detail: state }),
    );
  }

  function reset() {
    clearRaw();
    state = null;
    boot();
    window.location.reload();
  }

  /*
    Every figure any page displays comes from here, so the same number can't
    be told two ways. The static markup managed exactly that: the wallet
    claimed 12 active rentals directly above a list of 2, and the profile page
    hardcoded the same four figures in three places each.

    Money is computed live — it changes when you withdraw. Rental counts come
    from the seed, because the design's totals cover a longer history than the
    five rows the booking table shows.
  */
  function derive() {
    const bookings = state.bookings || [];
    const wallet = state.wallet || {};
    const stats = state.stats || {};

    const allTimeEarned = wallet.allTimeEarned || 0;
    const platformFee = Math.round(
      (allTimeEarned * (wallet.platformFeePct || 0)) / 100,
    );

    return {
      activeRentals: stats.activeRentals || 0,
      completedRentals: stats.completedRentals || 0,
      totalSpent: stats.totalSpent || 0,
      cancelledRentals: bookings.filter((b) => b.status === "cancelled").length,
      totalBookings: bookings.length,

      totalBalance: (wallet.available || 0) + (wallet.pending || 0),
      allTimeEarned: allTimeEarned,
      totalWithdrawn: wallet.totalWithdrawn || 0,
      platformFee: platformFee,
      netEarnings: allTimeEarned - platformFee,
    };
  }

  TL.store = {
    boot: boot,
    save: save,
    reset: reset,
    derive: derive,
    get: function () {
      return state || boot();
    },
    isPersistent: function () {
      return persistent;
    },
    on: function (event, handler) {
      document.addEventListener(event, handler);
    },
  };
})();

/*
  Formatting helpers.

  Naira is prefixed by hand rather than via Intl.NumberFormat with
  currency:'NGN' — that renders "NGN 30,000.00" instead of "₦30,000.00" in
  several browsers.
*/
(function () {
  function group(value, decimals) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  TL.fmt = {
    // ₦30,000.00 — for money that has cents worth showing.
    naira2: function (value) {
      return "₦" + group(Number(value) || 0, 2);
    },

    // ₦30,000 — for headline figures and table amounts.
    naira0: function (value) {
      return "₦" + group(Math.round(Number(value) || 0), 0);
    },

    // Signed, for transaction rows: -₦65,000 / ₦20,000
    nairaSigned: function (value) {
      const amount = Number(value) || 0;
      return (amount < 0 ? "-" : "") + TL.fmt.naira0(Math.abs(amount));
    },

    /*
      Nights between two yyyy-mm-dd strings. Parsed as UTC deliberately: a
      local-time parse across a daylight-saving boundary yields 6.958 days,
      and Math.round would be papering over it.
    */
    dayCount: function (startValue, endValue) {
      if (!startValue || !endValue) return 0;
      const start = Date.parse(startValue + "T00:00:00Z");
      const end = Date.parse(endValue + "T00:00:00Z");
      if (Number.isNaN(start) || Number.isNaN(end)) return 0;
      return Math.round((end - start) / 86400000);
    },

    todayISO: function () {
      return new Date().toISOString().slice(0, 10);
    },

    // "23 Jul 2026, 10:35 AM" — matches the transaction table's existing format.
    dateTime: function (value) {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);

      const day = String(date.getDate()).padStart(2, "0");
      const month = date.toLocaleString("en-US", { month: "short" });
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const suffix = hours >= 12 ? "PM" : "AM";
      const hour12 = String(hours % 12 || 12).padStart(2, "0");

      return `${day} ${month} ${date.getFullYear()}, ${hour12}:${minutes} ${suffix}`;
    },
  };
})();
