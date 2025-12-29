// my-navbar.js
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
                <li class="nav-item"><a href="/index.html" class="nav-link text-dark" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Laporan"><i class="fa-solid fa-chart-line"></i> <span class="nav-text">Laporan</span></a></li>
                <li class="nav-item"><a href="/absen.html" class="nav-link text-dark" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Absen"><i class="fa-solid fa-user-check"></i> <span class="nav-text">Absen</span></a></li>
                <li class="nav-item"><a href="/pemasukan.html" class="nav-link text-dark" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Pemasukan"><i class="fa-solid fa-wallet"></i> <span class="nav-text">Pemasukan</span></a></li>
                <li class="nav-item"><a href="/pengeluaran.html" class="nav-link text-dark" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Pengeluaran"><i class="fa-solid fa-money-bill-wave"></i> <span class="nav-text">Pengeluaran</span></a></li>
                <li class="nav-item"><a href="/pengeluaran-tetap.html" class="nav-link text-dark" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Pengeluaran Tetap"><i class="fa-solid fa-money-check-dollar"></i> <span class="nav-text">Pengeluaran Tetap</span></a></li>
                <li class="nav-item"><a href="/assets.html" class="nav-link text-dark" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Assets"><i class="fa-solid fa-box-archive"></i> <span class="nav-text">Assets</span></a></li>
                <li class="nav-item"><a href="/wrapped.html" class="nav-link text-dark fw-bold" data-bs-toggle="tooltip" data-bs-placement="bottom" title="2025 Wrapped"><i class="fa-solid fa-gift text-warning"></i> <span class="nav-text">Wrapped</span></a></li>
                <li class="nav-item"><a href="/form.html" class="nav-link text-dark" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Formulir"><i class="fa-solid fa-file-lines"></i> <span class="nav-text">Formulir</span></a></li>
                <li class="nav-item">
                  <a href="/approval.html" class="nav-link text-dark" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Approval">
                    <i class="fa-solid fa-circle-check"></i> <span class="nav-text">Approval</span>
                    <span id="approvalBadge" class="badge rounded-pill bg-danger ms-1 d-none">1</span>
                  </a>
                </li>
                <li class="nav-item"><a href="/ticketing.html" class="nav-link text-dark" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Ticket"><i class="fa-solid fa-ticket"></i> <span class="nav-text">Ticket</span></a></li>
                <li class="nav-item"><a href="/pelanggan.html" class="nav-link text-dark" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Pelanggan"><i class="fa-solid fa-users"></i> <span class="nav-text">Pelanggan</span></a></li>
                <li class="nav-item"><a href="/freepass.html" class="nav-link text-dark" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Akses Gratis"><i class="fa-solid fa-sack-dollar"></i> <span class="nav-text">Akses Gratis</span></a></li>
                <li class="nav-item"><a href="#" id="logoutBtn" class="nav-link text-dark" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Logout"><i class="fa-solid fa-right-from-bracket"></i> <span class="nav-text">Logout</span></a></li>
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

        // ✅ Inisialisasi tooltip hanya untuk desktop
        initTooltips();
        window.addEventListener("resize", initTooltips);

        // ✅ Tandai link aktif sesuai path
        highlightActiveNav();
      }, 0);

      checkApprovalCount();
    });
  }
}

customElements.define("my-navbar", MyNavbar);

// 🔹 Fungsi logout
export async function logout() {
  const result = await Swal.fire({
    title: "Keluar dari akun?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Logout"
  });
  if (result.isConfirmed) {
    await signOut(auth);
    Swal.fire("Logout berhasil", "", "success").then(
      () => (location.href = "login.html")
    );
  }
}

// 🔹 Fungsi cek approval badge
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

// 🔹 Tooltip hanya untuk desktop
function initTooltips() {
  const tooltipTriggerList = document.querySelectorAll(
    "[data-bs-toggle='tooltip']"
  );
  tooltipTriggerList.forEach((el) => {
    if (window.innerWidth >= 992) {
      if (!bootstrap.Tooltip.getInstance(el)) {
        new bootstrap.Tooltip(el);
      }
    } else {
      if (bootstrap.Tooltip.getInstance(el)) {
        bootstrap.Tooltip.getInstance(el).dispose();
      }
    }
  });
}

// 🔹 Tandai nav aktif berdasarkan path
function highlightActiveNav() {
  let path = location.pathname.split("/").pop();
  if (!path) path = "index.html"; // ✅ default kalau kosong → index.html

  // Hapus dulu semua state aktif
  document.querySelectorAll(".navbar-nav .nav-link").forEach((link) => {
    link.classList.remove("disabled-nav");
    link.querySelector("i")?.classList.remove("active-icon");
  });

  // Cari link yang cocok
  const activeLink = document.querySelector(`.navbar-nav .nav-link[href="/${path}"]`);
  if (activeLink) {
    activeLink.classList.add("disabled-nav");
    const icon = activeLink.querySelector("i");
    if (icon) icon.classList.add("active-icon");
  }
}

// 🔹 Tambah CSS global buat icon aktif & disable hover
const style = document.createElement("style");
style.textContent = `
  .navbar-nav .nav-link i.active-icon {
    border-bottom: 3px solid var(--bs-success);
    padding-bottom: 3px;
    color: var(--bs-success);
  }
  .navbar-nav .nav-link.disabled-nav {
    pointer-events: none !important;
    cursor: default !important;
    opacity: 0.9;
  }
  .navbar-nav .nav-link.disabled-nav:hover i {
    background: none !important;
    box-shadow: none !important;
  }
`;
document.head.appendChild(style);
