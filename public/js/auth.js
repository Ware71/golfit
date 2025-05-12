import { showOnly, showHome } from './ui.js';

export function initAuth(firebase) {
  const auth = firebase.auth();
  const loginForm = document.getElementById('login-form');
  const homeScreen = document.getElementById('home-screen');
  const logoutButton = document.getElementById('logout-button');
  const userEmail = document.getElementById('user-email');

  auth.onAuthStateChanged(async user => {
    if (user) {
      // Show main app UI
      loginForm.style.display = 'none';
      homeScreen.style.display = 'block';
      logoutButton.style.display = 'block';

      const uid = user.uid;
      const db = firebase.firestore();
      const profileDoc = await db.collection("users").doc(uid).collection("meta").doc("profile").get();
      const name = profileDoc.exists && profileDoc.data().name ? profileDoc.data().name : user.email;

      userEmail.textContent = name;
    } else {
      // Show login screen
      showOnly("login-form");
      logoutButton.style.display = 'none'; // 🔒 Hide logout only
    }
  });

  document.getElementById('login-btn').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password).catch(e => alert(e.message));
  });

  document.getElementById('signup-btn').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, password).catch(e => alert(e.message));
  });

  logoutButton.addEventListener('click', () => {
    auth.signOut();
    showOnly("login-form");
    logoutButton.style.display = 'none';
  });
}
