import { showOnly } from './ui.js';

export function showCourses(firebase) {
  showOnly("courses-screen");

  const db = firebase.firestore();
  const courseSelect = document.getElementById("course-name-select");
  const teeSelect = document.getElementById("tee-select");
  const courseDetails = document.getElementById("selected-course-details");

  courseSelect.innerHTML = '<option disabled selected value="">-- Select a course --</option>';
  teeSelect.innerHTML = '<option disabled selected value="">-- Select a tee --</option>';
  teeSelect.disabled = true;
  courseDetails.innerHTML = '';

  db.collection("courses").get().then(snapshot => {
    const courseMap = {};

    snapshot.forEach(doc => {
      const course = doc.data();
      const name = course.name;
      const tee = course.tee;

      if (!courseMap[name]) {
        courseMap[name] = [];
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        courseSelect.appendChild(option);
      }

      courseMap[name].push({ ...course, id: doc.id });
    });

    courseSelect.onchange = () => {
      const selected = courseSelect.value;
      const tees = courseMap[selected];

      teeSelect.innerHTML = '<option disabled selected value="">-- Select a tee --</option>';
      teeSelect.disabled = false;
      courseDetails.innerHTML = '';

      for (const tee of tees) {
        const option = document.createElement("option");
        option.value = tee.id;
        option.textContent = tee.tee;
        teeSelect.appendChild(option);
      }

      teeSelect.onchange = () => {
        const selectedTee = tees.find(t => t.id === teeSelect.value);
        if (!selectedTee) return;

        let detailsHTML = `
          <p><strong>Par:</strong> ${selectedTee.par}</p>
          <p><strong>CR:</strong> ${selectedTee.cr}</p>
          <p><strong>SR:</strong> ${selectedTee.sr}</p>
        `;

        if (selectedTee.holes && Array.isArray(selectedTee.holes)) {
          detailsHTML += `
            <h4>Scorecard</h4>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                <thead>
                  <tr style="background-color: #f5f5f5;">
                    <th style="border: 1px solid #ccc; padding: 0.5rem;">Hole</th>
                    <th style="border: 1px solid #ccc; padding: 0.5rem;">Par</th>
                    <th style="border: 1px solid #ccc; padding: 0.5rem;">SI</th>
                  </tr>
                </thead>
                <tbody>
                  ${selectedTee.holes.map((hole, i) => `
                    <tr>
                      <td style="border: 1px solid #ccc; padding: 0.5rem;">${i + 1}</td>
                      <td style="border: 1px solid #ccc; padding: 0.5rem;">${hole.par}</td>
                      <td style="border: 1px solid #ccc; padding: 0.5rem;">${hole.si}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `;
        }

        courseDetails.innerHTML = detailsHTML;
      };
    };
  });

  // ✅ Generate 18 hole inputs
  const holeInputsContainer = document.getElementById("hole-inputs");
  if (holeInputsContainer) {
    holeInputsContainer.innerHTML = "";
    for (let i = 1; i <= 18; i++) {
      const div = document.createElement("div");
      div.style.marginBottom = "0.5rem";
      div.innerHTML = `
        <label>Hole ${i}:</label><br />
        <input type="number" id="hole-${i}-par" placeholder="Par" required style="width: 45%; margin-right: 10%;" />
        <input type="number" id="hole-${i}-si" placeholder="SI" required style="width: 45%;" />
      `;
      holeInputsContainer.appendChild(div);
    }
  }

  // ✅ Handle Add Course form submission
  const addCourseForm = document.getElementById("add-course-form");
  if (addCourseForm) {
    addCourseForm.onsubmit = async (e) => {
      e.preventDefault();

      const name = document.getElementById("new-course-name").value.trim();
      const tee = document.getElementById("new-course-tee").value.trim();
      const par = parseFloat(document.getElementById("new-course-par").value);
      const cr = parseFloat(document.getElementById("new-course-cr").value);
      const sr = parseInt(document.getElementById("new-course-sr").value);

      const holes = [];
      for (let i = 1; i <= 18; i++) {
        const parInput = document.getElementById(`hole-${i}-par`);
        const siInput = document.getElementById(`hole-${i}-si`);
        const holePar = parseInt(parInput.value);
        const holeSI = parseInt(siInput.value);
        if (!isNaN(holePar) && !isNaN(holeSI)) {
          holes.push({ par: holePar, si: holeSI });
        }
      }

      if (holes.length !== 18) {
        alert("Please complete all 18 hole entries.");
        return;
      }

      await db.collection("courses").add({
        name, tee, par, cr, sr, holes
      });

      alert("Course added!");
      addCourseForm.reset();
      document.getElementById("add-course-container").style.display = "none";
      document.getElementById("toggle-add-course-btn").textContent = "➕ Add New Course";
      showCourses(firebase); // reload updated list
    };
  }
}
