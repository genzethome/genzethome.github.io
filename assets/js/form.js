// form.js
import { db, auth } from "./firebase-init.js";
import "./navbar.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

let currentUser = null;

// Cek auth
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  console.log("✅ Status user di form:", user);
});

// Logout
export async function logout() {
  const result = await Swal.fire({
    title: "Keluar dari akun?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Logout"
  });
  if (result.isConfirmed) {
    await signOut(auth);
    Swal.fire("Logout berhasil", "", "success").then(() => {
      window.location.reload();
    });
  }
}

// Batasi hanya angka di input RT, RW, Kodepos, Telepon
['rt', 'rw', 'kodepos', 'telepon'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
    });
  }
});

// Submit form registrasi
document.getElementById("regWifiForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!this.checkValidity()) {
    this.classList.add('was-validated');
    return;
  }

  const paket = document.getElementById("paket").value;
  let nominal = 0;
  if (paket === "15Mbps") nominal = 150000;
  else if (paket === "40Mbps") nominal = 210000;

  const tglFormatted = document.getElementById("tglPemasangan").value.trim();

  const data = {
    nama: document.getElementById("nama").value.trim(),
    email: document.getElementById("email").value.trim(),
    alamat: document.getElementById("alamat").value.trim(),
    rt: document.getElementById("rt").value.trim(),
    rw: document.getElementById("rw").value.trim(),
    kelurahan: document.getElementById("kelurahan").value.trim(),
    kecamatan: document.getElementById("kecamatan").value.trim(),
    kabupaten: document.getElementById("kabupaten").value.trim(),
    provinsi: document.getElementById("provinsi").value.trim(),
    kodepos: document.getElementById("kodepos").value.trim(),
    nohp: document.getElementById("telepon").value.trim(),
    paket: paket,
    nominal: nominal,
    tglPemasangan: tglFormatted,
    uploader: currentUser?.email || "-"
  };

  await addDoc(collection(db, "registrasi_wifi"), data);

  Swal.fire({
    icon: "success",
    title: "Registrasi Berhasil!",
    html: `<b>${data.nama}</b><br>Paket: <b>${data.paket}</b>`,
    confirmButtonText: "OK"
  });

  this.reset();
  this.classList.remove("was-validated");
});

// Disclaimer modal saat halaman dibuka
window.addEventListener("load", () => {
  Swal.fire({
    title: 'Syarat & Ketentuan',
    html: `<ol class="text-start small ps-3">
      <li>Lokasi pemasangan sudah terjangkau oleh jaringan layanan GenzetHome.</li>
      <li>Gratis biaya pemasangan selama masa promosi berlaku.</li>
      <li>Layanan GenzetHome adalah pra bayar, ditagihkan di awal masa berlangganan dan tagihan akan dikirimkan melalui email atau WhatsApp.</li>
      <li>Pembayaran tagihan dapat dilakukan melalui Virtual Account Bank, Alfamart, dan Indomaret.</li>
      <li>Harga langganan sudah termasuk pajak 11%.</li>
      <li>Kecepatan layanan internet yang ditawarkan adalah kecepatan maksimum yang dapat dicapai.</li>
    </ol>`,
    confirmButtonText: 'Saya Setuju',
    confirmButtonColor: '#198754',
    allowOutsideClick: false
  });
});
