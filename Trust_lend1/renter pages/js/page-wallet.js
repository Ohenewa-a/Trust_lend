/*
  Wallet page: balances, the transaction table, and a withdraw flow that
  actually moves money in the demo store.

  Class strings below are copied verbatim from the static rows in wallet.html.
  That is deliberate, not sloppy — Tailwind's browser build only emits CSS for
  classes it finds in the markup, so anything invented here would come out
  unstyled. If you need a new visual variant, add an example row to the HTML
  first.
*/
(function () {
  const MIN_WITHDRAWAL = 1000;

  // type → the icon, colours and label already used by the static rows.
  const TYPES = {
    credit: {
      icon: "fa-arrow-down",
      chip: "grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#e5f7ee] text-[9px] text-[#12764a]",
      typeClass: "px-3 py-3 text-[#12764a]",
      label: "Credit",
    },
    withdrawal: {
      icon: "fa-arrow-up",
      chip: "grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#eaf0ff] text-[9px] text-[#2f5bd0]",
      typeClass: "px-3 py-3 text-[#2f5bd0]",
      label: "Withdrawal",
    },
    hold: {
      icon: "fa-shield-halved",
      chip: "grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#efeaff] text-[9px] text-[#6b46d6]",
      typeClass: "px-3 py-3 text-[#6b46d6]",
      label: "Hold",
    },
  };

  const STATUSES = {
    completed: {
      icon: "fa-circle-check",
      pill: "inline-flex items-center gap-1 rounded-full bg-[#e5f7ee] px-2 py-0.5 text-[9px] font-semibold text-[#12764a]",
      label: "Completed",
    },
    processing: {
      icon: "fa-clock",
      pill: "inline-flex items-center gap-1 rounded-full bg-[#fff3d4] px-2 py-0.5 text-[9px] font-semibold text-[#b47f06]",
      label: "Processing",
    },
    held: {
      icon: "fa-lock",
      pill: "inline-flex items-center gap-1 rounded-full bg-[#efeaff] px-2 py-0.5 text-[9px] font-semibold text-[#6b46d6]",
      label: "Held",
    },
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    const el = byId(id);
    if (el) el.textContent = value;
  }

  /* ---------------- rendering ---------------- */

  function renderBalances() {
    const state = TL.store.get();
    const wallet = state.wallet;
    const stats = TL.store.derive();

    setText("availableBalance", TL.fmt.naira2(wallet.available));
    setText("statTotalBalance", TL.fmt.naira0(stats.totalBalance));
    setText("statPending", TL.fmt.naira0(wallet.pending));
    setText("subPending", TL.fmt.naira0(wallet.pending));
    setText("subProcessing", TL.fmt.naira0(wallet.processing));
    setText("subHeld", TL.fmt.naira0(wallet.held));
    setText("subActiveRentals", String(stats.activeRentals));

    setText("ytdEarned", TL.fmt.naira0(stats.allTimeEarned));
    setText("ytdWithdrawn", TL.fmt.naira0(stats.totalWithdrawn));
    setText("ytdFee", TL.fmt.naira0(stats.platformFee));
    setText("ytdNet", TL.fmt.naira0(stats.netEarnings));
  }

  /*
    Rows are assembled with createElement rather than an HTML string so that
    transaction descriptions (which include user-entered bank names) can never
    be parsed as markup.
  */
  function buildRow(tx) {
    const type = TYPES[tx.type] || TYPES.credit;
    const status = STATUSES[tx.status] || STATUSES.completed;

    const row = document.createElement("tr");
    row.className = "border-b border-[#f0f4fb]";
    row.setAttribute("data-type", tx.type);

    const descCell = document.createElement("td");
    descCell.className = "px-3 py-3";
    const descWrap = document.createElement("div");
    descWrap.className = "flex items-center gap-2";
    const chip = document.createElement("span");
    chip.className = type.chip;
    const chipIcon = document.createElement("i");
    chipIcon.className = "fa-solid " + type.icon;
    chip.appendChild(chipIcon);
    const desc = document.createElement("span");
    desc.className = "font-medium text-[#10265e]";
    desc.textContent = tx.description;
    descWrap.appendChild(chip);
    descWrap.appendChild(desc);
    descCell.appendChild(descWrap);

    const dateCell = document.createElement("td");
    dateCell.className = "px-3 py-3 text-[#8a97ad]";
    dateCell.textContent = TL.fmt.dateTime(tx.date);

    const typeCell = document.createElement("td");
    typeCell.className = type.typeClass;
    typeCell.textContent = type.label;

    const amountCell = document.createElement("td");
    amountCell.className = "px-3 py-3 font-semibold text-[#10265e]";
    amountCell.textContent = TL.fmt.nairaSigned(tx.amount);

    const statusCell = document.createElement("td");
    statusCell.className = "px-3 py-3";
    const pill = document.createElement("span");
    pill.className = status.pill;
    const pillIcon = document.createElement("i");
    pillIcon.className = "fa-solid " + status.icon;
    pill.appendChild(pillIcon);
    pill.appendChild(document.createTextNode(" " + status.label));
    statusCell.appendChild(pill);

    row.appendChild(descCell);
    row.appendChild(dateCell);
    row.appendChild(typeCell);
    row.appendChild(amountCell);
    row.appendChild(statusCell);

    return row;
  }

  function renderTransactions() {
    const body = byId("txBody");
    const empty = byId("txEmpty");
    if (!body) return;

    const transactions = TL.store.get().transactions || [];

    body.textContent = "";
    transactions.forEach(function (tx) {
      body.appendChild(buildRow(tx));
    });
    if (empty) body.appendChild(empty);

    // Re-applies the active chip to the rows that just replaced the old ones.
    TL.ui.initFilterGroup({
      group: "transactions",
      rows: "#txBody tr[data-type]",
      attr: "data-type",
      empty: "#txEmpty",
    });
  }

  function renderAccounts() {
    const list = byId("payoutAccounts");
    const select = byId("withdrawAccount");
    const accounts = TL.store.get().payoutAccounts || [];

    if (list) {
      list.textContent = "";

      accounts.forEach(function (account, index) {
        const row = document.createElement("div");
        row.className =
          index === 0
            ? "flex items-center gap-2.5 border-b border-[#f0f4fb] pb-3"
            : "flex items-center gap-2.5 pt-3";

        const tile = document.createElement("span");
        tile.className =
          "grid h-7 w-7 shrink-0 place-items-center rounded-[6px] bg-[#ffc43d] text-[8px] font-bold text-[#10265e]";
        tile.textContent = account.bank.slice(0, 3).toUpperCase();

        const details = document.createElement("div");
        details.className = "min-w-0 flex-1";
        const name = document.createElement("p");
        name.className = "text-[10px] font-semibold text-[#10265e]";
        name.textContent = account.bank;
        const masked = document.createElement("p");
        masked.className = "text-[9px] text-[#8a97ad]";
        masked.textContent = "· · · · " + account.last4;
        details.appendChild(name);
        details.appendChild(masked);

        row.appendChild(tile);
        row.appendChild(details);

        if (account.primary) {
          const badge = document.createElement("span");
          badge.className =
            "shrink-0 rounded-full bg-[#f0f2f5] px-2 py-0.5 text-[8px] font-semibold text-[#8a97ad]";
          badge.textContent = "Default";
          row.appendChild(badge);
        }

        list.appendChild(row);
      });
    }

    if (select) {
      select.textContent = "";
      accounts.forEach(function (account) {
        const option = document.createElement("option");
        option.value = account.id;
        option.textContent = account.bank + " · · · · " + account.last4;
        if (account.primary) option.selected = true;
        select.appendChild(option);
      });
    }
  }

  function renderAll() {
    renderBalances();
    renderTransactions();
    renderAccounts();
  }

  /* ---------------- withdraw ---------------- */

  function showError(el, message) {
    if (!el) return;
    el.textContent = message;
    TL.ui.show(el);
  }

  function clearError(el) {
    if (!el) return;
    el.textContent = "";
    TL.ui.hide(el);
  }

  function submitWithdrawal() {
    const state = TL.store.get();
    const errorEl = byId("withdrawError");
    const amountEl = byId("withdrawAmount");
    const accountEl = byId("withdrawAccount");
    const amount = Number(amountEl.value);

    if (!amountEl.value.trim() || Number.isNaN(amount) || amount <= 0) {
      showError(errorEl, "Enter an amount to withdraw.");
      return;
    }
    if (amount < MIN_WITHDRAWAL) {
      showError(
        errorEl,
        "Minimum withdrawal is " + TL.fmt.naira0(MIN_WITHDRAWAL) + ".",
      );
      return;
    }
    if (amount > state.wallet.available) {
      showError(errorEl, "That is more than your available balance.");
      return;
    }

    const account = (state.payoutAccounts || []).find(function (a) {
      return a.id === accountEl.value;
    });
    if (!account) {
      showError(errorEl, "Add a payout account first.");
      return;
    }

    state.wallet.available -= amount;
    state.wallet.processing += amount;
    state.wallet.totalWithdrawn = (state.wallet.totalWithdrawn || 0) + amount;

    state.transactions.unshift({
      id: "tx-" + Date.now(),
      description: "Withdrawal to " + account.bank + " .... " + account.last4,
      date: new Date().toISOString(),
      type: "withdrawal",
      amount: -amount,
      status: "processing",
    });

    TL.store.save();
    TL.ui.closeModal(byId("withdrawModal"));
    TL.ui.toast(TL.fmt.naira0(amount) + " is on its way to " + account.bank);
  }

  function submitAccount() {
    const state = TL.store.get();
    const errorEl = byId("accountError");
    const bank = byId("accountBank").value.trim();
    const last4 = byId("accountLast4").value.trim();
    const primary = byId("accountPrimary").checked;

    if (!bank) {
      showError(errorEl, "Enter the bank or provider name.");
      return;
    }
    if (!/^\d{4}$/.test(last4)) {
      showError(errorEl, "Enter the last 4 digits of the account number.");
      return;
    }

    if (primary) {
      state.payoutAccounts.forEach(function (account) {
        account.primary = false;
      });
    }

    state.payoutAccounts.push({
      id: "pa-" + Date.now(),
      bank: bank,
      last4: last4,
      primary: primary || state.payoutAccounts.length === 0,
    });

    TL.store.save();
    TL.ui.closeModal(byId("accountModal"));
    TL.ui.toast(bank + " added as a payout account");
  }

  /* ---------------- wiring ---------------- */

  document.addEventListener("DOMContentLoaded", function () {
    const withdrawModal = byId("withdrawModal");
    const accountModal = byId("accountModal");

    TL.ui.initModal(withdrawModal);
    TL.ui.initModal(accountModal);

    renderAll();

    document.addEventListener("click", function (event) {
      const withdrawTrigger = event.target.closest(
        '[data-action="open-withdraw"]',
      );
      if (withdrawTrigger) {
        const available = TL.store.get().wallet.available;
        clearError(byId("withdrawError"));
        byId("withdrawAmount").value = "";
        byId("withdrawAmount").max = available;
        setText("withdrawAvailable", "Available: " + TL.fmt.naira2(available));
        TL.ui.openModal(withdrawModal, withdrawTrigger, byId("withdrawAmount"));
        return;
      }

      const accountTrigger = event.target.closest(
        '[data-action="open-add-account"]',
      );
      if (accountTrigger) {
        clearError(byId("accountError"));
        byId("accountBank").value = "";
        byId("accountLast4").value = "";
        byId("accountPrimary").checked = false;
        TL.ui.openModal(accountModal, accountTrigger, byId("accountBank"));
      }
    });

    byId("withdrawSubmit").addEventListener("click", submitWithdrawal);
    byId("accountSubmit").addEventListener("click", submitAccount);

    // Enter should submit from either amount-style field.
    byId("withdrawAmount").addEventListener("keydown", function (event) {
      if (event.key === "Enter") submitWithdrawal();
    });
    byId("accountLast4").addEventListener("keydown", function (event) {
      if (event.key === "Enter") submitAccount();
    });
  });

  TL.store.on("tl:state-changed", renderAll);
})();
