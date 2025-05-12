import { showOnly } from './ui.js';

export function showStats(firebase) {
  showOnly("stats-screen");

  const user = firebase.auth().currentUser;
  const uid = user.uid;
  const db = firebase.firestore();

  db.collection("users").doc(uid).collection("rounds")
    .orderBy("date", "desc").limit(20)
    .get().then(snapshot => {
      const labels = [];
      const data = [];
      snapshot.docs.reverse().forEach(doc => {
        const r = doc.data();
        labels.push(new Date(r.date.seconds * 1000).toLocaleDateString());
        data.push(r.handicap || null);
      });

      const ctx = document.getElementById("handicap-chart").getContext("2d");
      new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [{
            label: "Handicap",
            data: data,
            borderColor: "#1976d2",
            backgroundColor: "rgba(25, 118, 210, 0.2)",
            tension: 0.2,
          }]
        },
        options: {
          scales: {
            y: { beginAtZero: false }
          }
        }
      });
    });
}
