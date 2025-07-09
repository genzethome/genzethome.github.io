import { auth } from "./firebase-init.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";

// SweetAlert toast
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true
});

// Form element
const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  Toast.fire({ icon: 'info', title: 'Menyambungkan...' });

  try {
    await signInWithEmailAndPassword(auth, email, password);
    Toast.fire({ icon: 'success', title: 'Login berhasil' });
    window.location.href = "index.html"; // pindah ke panel
  } catch (error) {
    Toast.fire({ icon: 'error', title: 'Login gagal' });
    console.error("❌ Login error:", error);
  }
});
