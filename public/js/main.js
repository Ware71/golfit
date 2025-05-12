import 'https://www.gstatic.com/firebasejs/11.7.1/firebase-auth-compat.js';
import 'https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore-compat.js';
import { initAuth } from './auth.js';
import { showCourses } from './courses.js';
import { showStats } from './stats.js';
import { showProfile } from './profile.js';
import { showClubs } from './clubs.js';
import { showRounds, exportRounds } from './rounds.js';
import { showOnly, showHome, showAddRoundOptions } from './ui.js';
import { initAddPastRound } from './addRound.js';

const app = firebase.app();

document.addEventListener('DOMContentLoaded', () => {
  initAuth(app);

  document.querySelectorAll("[onclick='showCourses()']").forEach(el => {
    el.onclick = () => showCourses(app);
  });

  document.querySelectorAll("[onclick='showStats()']").forEach(el => {
    el.onclick = () => showStats(app);
  });

  document.querySelectorAll("[onclick='showProfile()']").forEach(el => {
    el.onclick = () => showProfile(app);
  });

  document.querySelectorAll("[onclick='showClubs()']").forEach(el => {
    el.onclick = () => showClubs(app);
  });

  document.querySelectorAll("[onclick='showRounds()']").forEach(el => {
    el.onclick = () => showRounds(app);
  });

  const exportBtn = document.querySelector("#rounds-screen button[onclick='exportRounds()']");
  if (exportBtn) {
    exportBtn.onclick = () => exportRounds(app);
  }

  document.querySelectorAll("[onclick='showAddRoundOptions()']").forEach(el => {
    el.onclick = () => showAddRoundOptions();
  });

  document.querySelectorAll("[onclick='showAddPastRound()']").forEach(el => {
    el.onclick = () => showOnly("add-past-round-screen");
  });

  document.querySelectorAll("[onclick='showHome()']").forEach(el => {
    el.onclick = () => showHome();
  });

  // ✅ Add New Course button toggles form visibility and text
  const toggleBtn = document.getElementById("toggle-add-course-btn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const container = document.getElementById("add-course-container");
      const isHidden = container.style.display === "none" || container.style.display === "";
      container.style.display = isHidden ? "block" : "none";
      toggleBtn.textContent = isHidden ? "✖ Cancel" : "➕ Add New Course";
    });
  }
});

// ✅ Make handlers accessible to inline HTML `onclick`
window.showHome = showHome;
window.showCourses = () => showCourses(app);
window.showStats = () => showStats(app);
window.showProfile = () => showProfile(app);
window.showClubs = () => showClubs(app);
window.showRounds = () => showRounds(app);
window.showAddRoundOptions = showAddRoundOptions;
window.showAddPastRound = () => initAddPastRound(app);
window.exportRounds = () => exportRounds(app);

