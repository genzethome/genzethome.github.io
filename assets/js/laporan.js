import { db, auth } from "./firebase-init.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";

let totalPemasukan = 0, totalPengeluaran = 0, totalAssets = 0, saldo = 0;
let totalPelanggan = 0, penghasilanPelanggan = 0, totalMbps = 0, totalPengeluaranTetap = 0;

onAuthStateChanged(auth, (user) => {
  refreshLaporan();
});

export async function refreshLaporan() {
  totalPemasukan = totalPengeluaran = totalAssets = saldo = 0;
  totalPelanggan = penghasilanPelanggan = totalMbps = totalPengeluaranTetap = 0;

  const pemasukanSnap = await getDocs(collection(db, "pemasukan"));
  pemasukanSnap.forEach(doc => totalPemasukan += parseInt(doc.data().jumlah || 0));

  const pengeluaranSnap = await getDocs(collection(db, "pengeluaran"));
  pengeluaranSnap.forEach(doc => totalPengeluaran += parseInt(doc.data().jumlah || 0));

  const assetsSnap = await getDocs(collection(db, "assets"));
  assetsSnap.forEach(doc => totalAssets += parseInt(doc.data().jumlah || 0));

  const pengeluaranTetapSnap = await getDocs(collection(db, "pengeluaran_tetap"));
  pengeluaranTetapSnap.forEach(doc => totalPengeluaranTetap += parseInt(doc.data().jumlah || 0));

  const pelangganSnap = await getDocs(collection(db, "pelanggan"));

  // 🗂️ Hitung total dan data pelanggan
  const kecamatanCount = {};

  pelangganSnap.forEach(doc => {
    totalPelanggan += 1;
    const data = doc.data();
    const harga = parseInt(data.nominal || 0);
    const mbps = parseInt(data.paket.replace(/[^\d]/g, "") || 0);
    const kecamatan = data.kecamatan || "Tidak Diketahui";

    penghasilanPelanggan += harga;
    totalMbps += mbps;

    // Simpan kecamatan unik
    kecamatanCount[kecamatan] = true;
  });

  saldo = totalPemasukan - totalPengeluaran;

  animateNumber("totalPemasukan", totalPemasukan);
  animateNumber("totalPengeluaran", totalPengeluaran);
  animateNumber("totalAssets", totalAssets);
  animateNumber("saldoAkhir", saldo);

  animateNumberPlain("totalPelanggan", totalPelanggan);
  animateNumber("penghasilanPelanggan", penghasilanPelanggan);
  animateNumberPlain("totalMbps", totalMbps, " Mbps");
  animateNumber("totalPengeluaranTetap", totalPengeluaranTetap);

  tampilkanProgress(totalPemasukan, totalPengeluaran, totalAssets, saldo);

  // ✅ Render Area Penyebaran (HANYA NAMA KECAMATAN)
  const areaList = document.getElementById("areaPenyebaran");
  if (areaList) {
    areaList.innerHTML = "";
    for (const kecamatan of Object.keys(kecamatanCount)) {
      const div = document.createElement("div");
      div.textContent = kecamatan;
      areaList.appendChild(div);
    }
  }
}

function tampilkanProgress(pemasukan, pengeluaran, assets, saldo) {
  const total = pemasukan + pengeluaran + assets + Math.abs(saldo);
  const persenPemasukan = pemasukan > 0 ? Math.round((pemasukan / total) * 100) : 0;
  const persenPengeluaran = pengeluaran > 0 ? Math.round((pengeluaran / total) * 100) : 0;
  const persenAssets = assets > 0 ? Math.round((assets / total) * 100) : 0;
  const persenSaldo = saldo !== 0 ? Math.round((Math.abs(saldo) / total) * 100) : 0;

  document.getElementById("progressPemasukan").style.width = "0%";
  document.getElementById("progressPengeluaran").style.width = "0%";
  document.getElementById("progressAssets").style.width = "0%";
  document.getElementById("progressSaldo").style.width = "0%";

  setTimeout(() => {
    document.getElementById("progressPemasukan").style.width = persenPemasukan + "%";
    document.getElementById("progressPengeluaran").style.width = persenPengeluaran + "%";
    document.getElementById("progressAssets").style.width = persenAssets + "%";
    document.getElementById("progressSaldo").style.width = persenSaldo + "%";
  }, 100);
}

function animateNumber(elementId, targetValue) {
  const el = document.getElementById(elementId);
  let start = 0;
  const duration = 500;
  const startTime = performance.now();

  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = Math.floor(progress * targetValue);
    el.textContent = "Rp " + value.toLocaleString();
    if (progress < 1) requestAnimationFrame(updateNumber);
  }

  requestAnimationFrame(updateNumber);
}

function animateNumberPlain(elementId, targetValue, suffix = "") {
  const el = document.getElementById(elementId);
  let start = 0;
  const duration = 500;
  const startTime = performance.now();

  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = Math.floor(progress * targetValue);
    el.textContent = value.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(updateNumber);
  }

  requestAnimationFrame(updateNumber);
}

document.getElementById("refreshBtn").addEventListener("click", refreshLaporan);
