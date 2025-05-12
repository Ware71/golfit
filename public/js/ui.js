// ui.js
export function showOnly(id) {
  const ids = [
    "login-form",
    "home-screen",
    "courses-screen",
    "profile-screen",
    "clubs-screen",
    "rounds-screen",
    "stats-screen",
    "add-round-options-screen",
    "add-past-round-screen"
  ];
  ids.forEach(el => {
    const elRef = document.getElementById(el);
    if (elRef) elRef.style.display = el === id ? "block" : "none";
  });
}

export function showHome() {
  showOnly("home-screen");
}

export function showAddRoundOptions() {
  showOnly("add-round-options-screen");
}

export function showAddPastRound() {
  showOnly("add-past-round-screen");
}
