import { showOnly } from './ui.js';

export function showRounds(firebase) {
  showOnly("rounds-screen");

  const user = firebase.auth().currentUser;
  const uid = user.uid;
  const db = firebase.firestore();
  const list = document.getElementById("round-list");
  list.innerHTML = "";

  db.collection("users").doc(uid).collection("rounds")
    .orderBy("date", "desc")
    .get().then(snapshot => {
      snapshot.forEach(doc => {
        const r = doc.data();
        const date = new Date(r.date.seconds * 1000).toLocaleDateString();
        const li = document.createElement("li");
        li.innerHTML = `<strong>${r.course}</strong> (${r.tee}) – ${r.total} <small>${r.putts || 0} putts</small> <em>${date}</em>`;
        list.appendChild(li);
      });
    });
}

export function exportRounds(firebase) {
  const user = firebase.auth().currentUser;
  const uid = user.uid;
  const db = firebase.firestore();

  db.collection("users").doc(uid).collection("rounds").get().then(snapshot => {
    let csv = "Date,Course,Tee,Total,Putts\n";
    snapshot.forEach(doc => {
      const r = doc.data();
      const date = new Date(r.date.seconds * 1000).toLocaleDateString();
      csv += `${date},${r.course},${r.tee},${r.total},${r.putts || 0}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "golfit_rounds.csv";
    link.click();
  });
}
