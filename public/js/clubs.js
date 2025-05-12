import { showOnly } from './ui.js';

export function showClubs(firebase) {
  showOnly("clubs-screen");

  const user = firebase.auth().currentUser;
  const uid = user.uid;
  const db = firebase.firestore();
  const clubList = document.getElementById("club-list");
  clubList.innerHTML = "";

  db.collection("users").doc(uid).collection("clubs").orderBy("carry", "desc").get().then(snapshot => {
    snapshot.forEach(doc => {
      const club = doc.data();
      const docRef = doc.ref;
      const li = document.createElement("li");

      const span = document.createElement("span");
      span.textContent = `${club.type} - ${club.brand} ${club.model}`;

      const carryInput = document.createElement("input");
      carryInput.type = "number";
      carryInput.value = club.carry || 0;
      carryInput.className = "carry-input";
      carryInput.title = "Click to edit carry distance";

      carryInput.onchange = () => {
        const newCarry = parseInt(carryInput.value) || 0;
        docRef.update({ carry: newCarry }).then(() => showClubs(firebase));
      };

      const btn = document.createElement("button");
      btn.textContent = "❌";
      btn.className = "delete-icon";
      btn.onclick = () => {
        docRef.delete().then(() => showClubs(firebase));
      };

      li.appendChild(span);
      li.appendChild(carryInput);
      li.appendChild(btn);
      clubList.appendChild(li);
    });
  });

  document.getElementById("club-form").onsubmit = function (e) {
    e.preventDefault();
    const type = document.getElementById("club-type").value;
    const brand = document.getElementById("club-brand").value;
    const model = document.getElementById("club-model").value;
    const carry = parseInt(document.getElementById("club-carry").value) || 0;

    db.collection("users").doc(uid).collection("clubs").add({
      type, brand, model, carry
    }).then(() => {
      showClubs(firebase);
    });
  };
}
