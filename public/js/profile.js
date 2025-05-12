import { showOnly } from './ui.js';

export function showProfile(firebase) {
  showOnly("profile-screen");

  const user = firebase.auth().currentUser;
  if (!user) return;

  const uid = user.uid;
  const db = firebase.firestore();
  const profileRef = db.collection("users").doc(uid).collection("meta").doc("profile");

  profileRef.get().then(async doc => {
    if (!doc.exists) {
      await profileRef.set({ name: user.email, handicap: null });
    }

    const data = doc.exists ? doc.data() : { name: user.email, handicap: null };
    document.getElementById("profile-name").value = data.name || user.email;
    document.getElementById("profile-email").value = user.email;
    document.getElementById("profile-handicap").value =
      typeof data.handicap === "number" ? data.handicap.toFixed(1) : "N/A";
  });

  document.getElementById("profile-name").addEventListener("change", async () => {
    const name = document.getElementById("profile-name").value.trim();
    await profileRef.set({ name }, { merge: true });
    document.getElementById("user-email").textContent = name;
  });
}
