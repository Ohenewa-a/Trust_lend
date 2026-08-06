/*
  Profile page.

  This page used to fetch its identity fields from a hosted API behind a
  bearer-token box. That has been removed — the fields now render from the
  local demo store like every other page.
*/
(function () {
  function renderProfile() {
    const user = TL.store.get().user;
    if (!user) return;

    const set = function (id, value) {
      const el = document.getElementById(id);
      if (el && value) el.textContent = value;
    };

    set(
      "profileName",
      [user.firstName, user.lastName].filter(Boolean).join(" "),
    );
    set("profileEmail", user.email);
    set("profilePhone", user.phone);
    set("profileLocation", user.location);

    if (user.joinedAt) {
      const joined = new Date(user.joinedAt + "T00:00:00Z");
      set(
        "profileJoined",
        "Joined on " +
          joined.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "UTC",
          }),
      );
    }

    /*
      Role is set via a child span, not on the badge itself: the badge also
      holds a check icon, and writing textContent on the parent would delete it.
      (The removed API code had exactly that bug.)
    */
    const role = document.getElementById("profileRoleText");
    if (role && user.role) role.textContent = user.role;

    const photo = document.getElementById("profileImage");
    if (photo && user.photo) photo.src = user.photo;
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderProfile();
  });

  TL.store.on("tl:state-changed", renderProfile);
})();
