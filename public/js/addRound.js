// addRound.js
import { showOnly } from './ui.js';

export function initAddPastRound(firebase) {
  showOnly("add-past-round-screen");

  const db = firebase.firestore();
  const courseSelect = document.getElementById("past-course-name");
  const teeSelect = document.getElementById("past-tee-name");
  const holeContainer = document.getElementById("hole-scores-container");

  courseSelect.innerHTML = `<option disabled selected>-- Select Course --</option>`;
  teeSelect.innerHTML = `<option disabled selected>-- Select Tee --</option>`;
  teeSelect.disabled = true;

  const courseMap = {};

  db.collection("courses").get().then(snapshot => {
    snapshot.forEach(doc => {
      const course = doc.data();
      if (!courseMap[course.name]) {
        courseMap[course.name] = [];
        const opt = document.createElement("option");
        opt.value = course.name;
        opt.textContent = course.name;
        courseSelect.appendChild(opt);
      }
      courseMap[course.name].push({ ...course, id: doc.id });
    });
  });

  courseSelect.onchange = () => {
    const selected = courseSelect.value;
    const tees = courseMap[selected];
    teeSelect.disabled = false;
    teeSelect.innerHTML = `<option disabled selected>-- Select Tee --</option>`;

    for (const tee of tees) {
      const opt = document.createElement("option");
      opt.value = tee.id;
      opt.textContent = tee.tee;
      teeSelect.appendChild(opt);
    }

    teeSelect.onchange = () => {
      const selectedTee = tees.find(t => t.id === teeSelect.value);
      renderHoleInputs(selectedTee.holes);
    };
  };

  function renderHoleInputs(holes) {
    holeContainer.innerHTML = "";
    holes.forEach((hole, i) => {
      const div = document.createElement("div");
      div.innerHTML = `
        <label>Hole ${i + 1}:</label>
        <input type="number" placeholder="Score" id="hole-score-${i}" required />
        <input type="number" placeholder="Putts" id="hole-putts-${i}" required />
        <br/><br/>
      `;
      holeContainer.appendChild(div);
    });
  }

  document.getElementById("past-round-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = firebase.auth().currentUser;
    const uid = user.uid;

    const courseName = courseSelect.value;
    const teeId = teeSelect.value;
    const dateStr = document.getElementById("round-date").value;
    const type = document.getElementById("round-type").value;

    const teeSnapshot = await db.collection("courses").doc(teeId).get();
    const teeData = teeSnapshot.data();

    const holes = teeData.holes || [];
    const scores = [];
    let total = 0;
    let putts = 0;

    for (let i = 0; i < holes.length; i++) {
      const score = parseInt(document.getElementById(`hole-score-${i}`).value);
      const putt = parseInt(document.getElementById(`hole-putts-${i}`).value);
      scores.push({ hole: i + 1, score, putts: putt });
      total += score;
      putts += putt;
    }

    await db.collection("users").doc(uid).collection("rounds").add({
      date: new Date(dateStr),
      course: courseName,
      tee: teeData.tee,
      type,
      total,
      putts,
      scores
    });

    alert("Round saved!");
    showOnly("home-screen");
  });
}
