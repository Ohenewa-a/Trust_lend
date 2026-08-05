/*
  Dashboard page: booking-history filtering, plus stat cards fed from the
  store so the headline numbers agree with the table beneath them.
*/
(function () {
  function renderStats() {
    const stats = TL.store.derive();

    const set = function (id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    // Two-digit padding matches the design's "02" / "07" treatment.
    const pad = function (n) {
      return String(n).padStart(2, "0");
    };

    set("statActiveRentals", pad(stats.activeRentals));
    set("statCompletedRentals", pad(stats.completedRentals));
    set("statTotalSpent", TL.fmt.naira0(stats.totalSpent));
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderStats();

    TL.ui.initFilterGroup({
      group: "bookings",
      rows: "#bookingsBody tr[data-status]",
      attr: "data-status",
      empty: "#bookingsEmpty",
    });
  });

  TL.store.on("tl:state-changed", renderStats);
})();
