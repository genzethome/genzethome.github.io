// /assets/js/navbar.js
import { auth } from "./firebase-init.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";

class MyNavbar extends HTMLElement {
  connectedCallback() {
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
               <li class="nav-item"><a href="/pemasukan.html" class="nav-link text-dark"><i class="fa-solid fa-wallet"></i> Pemasukan</a></li>
               <li class="nav-item"><a href="/pengeluaran.html" class="nav-link text-dark"><i class="fa-solid fa-money-bill-wave"></i> Pengeluaran</a></li>
               <li class="nav-item"><a href="/assets.html" class="nav-link text-dark"><i class="fa-solid fa-box-archive"></i> Assets</a></li>
               <li class="nav-item"><a href="/form.html" class="nav-link text-dark"><i class="fa-solid fa-file-lines"></i> Formulir</a></li>
               <li class="nav-item"><a href="/approval.html" class="nav-link text-dark"><i class="fa-solid fa-circle-check"></i> Approval</a></li>
               <li class="nav-item"><a href="/pelanggan.html" class="nav-link text-dark"><i class="fa-solid fa-users"></i> Pelanggan</a></li>
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
