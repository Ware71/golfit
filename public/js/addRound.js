import { showOnly } from './ui.js';
import {
  getLatestStatusAndRoundCount
} from './handicaps.js';

export function initAddPastRound(firebase) {
  showOnly("add-past-round-screen");

  const db = firebase.firestore();
  const courseSelect = document.getElementById("past-course-name");
  const teeSelect = document.getElementById("past-tee-name");
  const roundTypeSelect = document.getElementById("round-type");
  const holeContainer = document.getElementById("hole-scores-container");

  courseSelect.innerHTML = `<option disabled selected>-- Select Course --</option>`;
  teeSelect.innerHTML = `<option disabled selected>-- Select Tee --</option>`;
  teeSelect.disabled = true;

  const courseMap = {};
  let currentNumHoles = 18;

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
      const holeCount = selectedTee.holes.length;
      roundTypeSelect.innerHTML = `<option>${holeCount === 9 ? '9 Holes' : '18 Holes'}</option>`;
      roundTypeSelect.disabled = true;
      renderHoleInputs(selectedTee.holes);
    };
  };

   // Update totals on any change
    function updateTotals() {
      let totalScore = 0;
      let totalPutts = 0;
      for (let j = 0; j < currentNumHoles; j++) {
        const s = parseInt(document.getElementById(`hole-score-${j}`)?.value);
        const p = parseInt(document.getElementById(`hole-putts-${j}`)?.value);
        if (!isNaN(s)) totalScore += s;
        if (!isNaN(p)) totalPutts += p;
      }
      document.getElementById("total-score").textContent = totalScore;
      document.getElementById("total-putts").textContent = totalPutts;
    };

  function renderHoleInputs(holes) {
  holeContainer.innerHTML = "";
  currentNumHoles = holes.length;

  for (let i = 0; i < currentNumHoles; i++) {
    const hole = holes[i];
    const div = document.createElement("div");
    div.className = "hole-row";

    div.innerHTML = `
      <div class="hole-info">
        <span>Hole ${i + 1}</span>
        <span>Par ${hole.par}</span>
        <span>SI ${hole.si}</span>
      </div>
      <div class="hole-inputs">
        <input type="text" readonly placeholder="Score" id="hole-score-${i}" class="score-input" />
        <input type="number" readonly placeholder="Putts" id="hole-putts-${i}" class="putts-input" />
      </div>
    `;

    holeContainer.appendChild(div);

    const scoreInput = div.querySelector(`#hole-score-${i}`);
    const puttsInput = div.querySelector(`#hole-putts-${i}`);

    scoreInput.addEventListener("click", () => openScorePopup(scoreInput, hole.par));
    puttsInput.addEventListener("click", () => openPuttsPopup(puttsInput));
  
    scoreInput.addEventListener("input", updateTotals);
    scoreInput.addEventListener("change", updateTotals);

    puttsInput.addEventListener("input", updateTotals);
    puttsInput.addEventListener("change", updateTotals);
  }

  // Add totals box at bottom
  const totalsDiv = document.createElement("div");
  totalsDiv.id = "round-totals";
  totalsDiv.innerHTML = `
    <strong>Total Score:</strong> <span id="total-score">0</span>
    &nbsp;&nbsp;|&nbsp;&nbsp;
    <strong>Total Putts:</strong> <span id="total-putts">0</span>
  `;
  holeContainer.appendChild(totalsDiv);
  updateTotals();
}


function openScorePopup(input, par) {
  let popup = document.getElementById("score-selector");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "score-selector";
    popup.className = "score-popup";
    document.body.appendChild(popup);
  }

  popup.innerHTML = "";
  popup.style.display = "grid";

  const scores = [1, 2, 3, 4, 5, 6, 7, 8, "+"];

  scores.forEach(score => {
    const btn = document.createElement("button");
    btn.textContent = score;

    if (score === "+") {
      btn.className = "score-popup plus";
      btn.onclick = () => {
        popup.style.display = "none";
        updateTotals();

        // Create a new editable input and insert it in place of the original
        const editable = input.cloneNode(true);
        editable.removeAttribute("readonly");
        editable.setAttribute("type", "text");
        editable.setAttribute("inputmode", "numeric");
        editable.setAttribute("pattern", "[0-9]*");
        editable.value = "";
        editable.classList.add("manual-score");

        input.replaceWith(editable);
        editable.focus();

        // After blur, lock it again and restore the original input structure
        editable.addEventListener("blur", () => {
        const value = editable.value.trim();

        // Transfer edited value back into original input
        input.value = value;

        // Also transfer ID back to ensure totals keep working
        input.setAttribute("id", editable.id);

        // Re-enable readonly and restore input element
        input.setAttribute("readonly", true);
        editable.replaceWith(input);

        // Trigger total update
        updateTotals();
      }, { once: true });

      };
    } else {
      const delta = score - par;
      btn.dataset.score = score;

      if (delta <= -3) {
        btn.className = "score-score albatross"; // black filled circle
      } else if (delta === -2) {
        btn.className = "score-score eagle"; // double outline circle
      } else if (delta === -1) {
        btn.className = "score-score birdie"; // single outline circle
      } else if (delta === 0) {
        btn.className = "score-score par"; // plain number
      } else if (delta === 1) {
        btn.className = "score-score bogey"; // single outline square
      } else if (delta === 2) {
        btn.className = "score-score double"; // double outline square
      } else {
        btn.className = "score-score triple"; // black filled square
      }

      btn.onclick = () => {
        input.value = score;
        popup.style.display = "none";
        updateTotals();
      };
    }

    popup.appendChild(btn);
  });

  const rect = input.getBoundingClientRect();
  popup.style.top = `${rect.bottom + window.scrollY + 8}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;
}

function openPuttsPopup(input) {
  let popup = document.getElementById("putts-selector");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "putts-selector";
    popup.className = "score-popup putts-popup";
    document.body.appendChild(popup);
  }

  popup.innerHTML = "";
  popup.style.display = "grid";

  const options = [1, 2, 3, "4+"];

  options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;

    if (option === "4+") {
      btn.className = "score-popup plus";
      btn.onclick = () => {
        popup.style.display = "none";
        updateTotals();

        // Clone input and replace it to force iOS keyboard to open
        const editable = input.cloneNode(true);
        editable.removeAttribute("readonly");
        editable.setAttribute("type", "text");
        editable.setAttribute("inputmode", "numeric");
        editable.setAttribute("pattern", "[0-9]*");
        editable.value = "";
        editable.classList.add("manual-score");

        input.replaceWith(editable);
        editable.focus();

        editable.addEventListener("blur", () => {
        const value = editable.value.trim();

        // Transfer edited value back into original input
        input.value = value;

        // Also transfer ID back to ensure totals keep working
        input.setAttribute("id", editable.id);

        // Re-enable readonly and restore input element
        input.setAttribute("readonly", true);
        editable.replaceWith(input);

        // Trigger total update
        updateTotals();
      }, { once: true });

      };
    } else {
      btn.className = "score-score par"; // Neutral style for putts
      btn.onclick = () => {
        input.value = option;
        popup.style.display = "none";
        updateTotals();
      };
    }

    popup.appendChild(btn);
  });

  const rect = input.getBoundingClientRect();
  popup.style.top = `${rect.bottom + window.scrollY + 8}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;
}



  document.body.addEventListener("click", (e) => {
    const popup = document.getElementById("score-selector");
    if (popup && !popup.contains(e.target) && !e.target.classList.contains("score-input")) {
      popup.style.display = "none";
    }
    const puttsPopup = document.getElementById("putts-selector");
    if (puttsPopup && !puttsPopup.contains(e.target) && !e.target.classList.contains("putts-input")) {
      puttsPopup.style.display = "none";
}
  });

  document.getElementById("past-round-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById("submit-round");
    submitBtn.disabled = true;

    try {
      const user = firebase.auth().currentUser;
      const uid = user.uid;

      const courseName = courseSelect.value;
      const teeId = teeSelect.value;
      const dateStr = document.getElementById("round-date").value;
      const type = roundTypeSelect.value;

      const teeSnapshot = await db.collection("courses").doc(teeId).get();
      const teeData = teeSnapshot.data();

      const scores = [];
      let total = 0;
      let putts = 0;

      for (let i = 0; i < currentNumHoles; i++) {
        const scoreVal = document.getElementById(`hole-score-${i}`).value;
        const puttsVal = document.getElementById(`hole-putts-${i}`).value;
        if (scoreVal.trim() === "" || puttsVal.trim() === "") {
          alert(`Please complete all scores and putts before submitting.`);
          submitBtn.disabled = false;
          return; // stop form submission
        }
      }

      for (let i = 0; i < currentNumHoles; i++) {
        const score = parseInt(document.getElementById(`hole-score-${i}`).value);
        const putt = parseInt(document.getElementById(`hole-putts-${i}`).value);
        const hole = teeData.holes[i];

        scores.push({
        hole: i + 1,
        score,
        putts: putt,
        par: hole.par,
        si: hole.si
      });
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

      // ✅ Fetch all past rounds
      const roundsSnapshot = await db.collection("users").doc(uid).collection("rounds").get();
      const roundHistory = [];

      roundsSnapshot.forEach(doc => {
        roundHistory.push(doc.data());
      });

      // ✅ Use your helper function
      const newDate = new Date(dateStr);
      const { isLatest, validRoundCount } = getLatestStatusAndRoundCount(newDate, roundHistory);

      // ✅ Show feedback
      if (isLatest) {
        alert(`✅ Round saved! This is your latest round. You now have ${validRoundCount} valid rounds.`);
      } else {
        alert(`✅ Round saved! ⚠️ This is not your latest round. You have ${validRoundCount} valid rounds.`);
      }
      // Reset the course and tee dropdowns
      courseSelect.selectedIndex = 0;
      teeSelect.selectedIndex = 0;
      teeSelect.disabled = true;

      // Clear round type and hole inputs
      roundTypeSelect.innerHTML = `<option>--</option>`;
      roundTypeSelect.disabled = true;
      holeContainer.innerHTML = ""; // 🔁 clears all holes and totals
      document.getElementById("total-score").textContent = "0";
      document.getElementById("total-putts").textContent = "0";

      showOnly("add-round-options-screen");
    } catch (error) {
    alert("Error saving round: " + error.message);
  } finally {
    submitBtn.disabled = false;
  }
  });
}
