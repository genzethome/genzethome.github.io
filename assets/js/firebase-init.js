// /assets/js/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCxjTmRPiF4OrRAsneB_SUi1SpGOgkwrYg",
  authDomain: "genzet-home.firebaseapp.com",
  projectId: "genzet-home",
  storageBucket: "genzet-home.appspot.com",
  messagingSenderId: "586231239859",
  appId: "1:586231239859:web:9fc3a69f2f2ef0bf8c8cc6"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
