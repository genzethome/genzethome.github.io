import { auth, db } from "./firebase-init.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";

class MyNavbar extends HTMLElement {
  connectedCallback() {
    onAuthStateChanged(auth, (user) => {
      console.log("✅ PATH:", location.pathname);
      console.log("✅ USER:", user);

      if (!user) {
        if (location.pathname.includes("form.html")) {
          console.log("✅ No login but form.html allowed.");
          return; // tidak render navbar
        }
        console.log("⏭️ No login & not form.html → redirect");
        location.href = "login.html";
        return;
      }  
      // Kalau login, render navbar
      this.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-light mb-4 border-bottom border-secondary-subtle">
          <div class="container-fluid">
            <a class="navbar-brand fw-bold" href="#">GENZET HOME</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
              <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
              <ul class="navbar-nav ms-auto">
                <li class="nav-item"><a href="/index.html" class="nav-link text-dark"><i class="fa-solid fa-chart-line"></i> Laporan</a></li>
                <li class="nav-item"><a href="/absen.html"class="nav-link text-dark"><i class="fa-solid fa-user-check"></i> Absen</a></li>
                <li class="nav-item"><a href="/pemasukan.html" class="nav-link text-dark"><i class="fa-solid fa-wallet"></i> Pemasukan</a></li>
                <li class="nav-item"><a href="/pengeluaran.html" class="nav-link text-dark"><i class="fa-solid fa-money-bill-wave"></i> Pengeluaran</a></li>
                <li class="nav-item"><a href="/assets.html" class="nav-link text-dark"><i class="fa-solid fa-box-archive"></i> Assets</a></li>
                <li class="nav-item"><a href="/form.html" class="nav-link text-dark"><i class="fa-solid fa-file-lines"></i> Formulir</a></li>
                <li class="nav-item">
                  <a href="/approval.html" class="nav-link text-dark">
                    <i class="fa-solid fa-circle-check"></i> Approval
                    <span id="approvalBadge" class="badge rounded-pill bg-danger ms-1 d-none">1</span>
                  </a>
                </li>
                <li class="nav-item"><a href="/pelanggan.html" class="nav-link text-dark"><i class="fa-solid fa-users"></i> Pelanggan</a></li>
                <li class="nav-item"><a href="/freepass.html" class="nav-link text-dark"><i class="fa-solid fa-sack-dollar"></i> Akses Gratis</a></li>
                <li class="nav-item"><a href="#" id="logoutBtn" class="nav-link text-dark"><i class="fa-solid fa-right-from-bracket"></i> Logout</a></li>
              </ul>
            </div>
          </div>
        </nav>
      `;

      setTimeout(() => {
        this.querySelector("#logoutBtn")?.addEventListener("click", (e) => {
          e.preventDefault();
          logout();
        });
      }, 0);

      checkApprovalCount();
    });
  }
}

customElements.define('my-navbar', MyNavbar);

export async function logout() {
  const result = await Swal.fire({
    title: "Keluar dari akun?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Logout"
  });
  if (result.isConfirmed) {
    await signOut(auth);
    Swal.fire("Logout berhasil", "", "success").then(() => location.href = "login.html");
  }
}

async function checkApprovalCount() {
  console.log("✅ Mulai cek approval count...");

  try {
    const snapshot = await getDocs(collection(db, "registrasi_wifi"));
    const count = snapshot.size;

    const badge = document.getElementById("approvalBadge");

    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.classList.remove("d-none");
      } else {
        badge.classList.add("d-none");
      }
    } else {
      console.error("❌ Badge element tidak ditemukan di DOM!");
    }

  } catch (err) {
    console.error("❌ Gagal mengambil data Approval:", err);
  }
}
