// /assets/js/laporan.js
import { db, auth } from "./firebase-init.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";

let totalPemasukan = 0, totalPengeluaran = 0, totalAssets = 0, saldo = 0;

onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "login.html";
  else refreshLaporan();
});

export async function refreshLaporan() {
  totalPemasukan = totalPengeluaran = totalAssets = saldo = 0;

  const pemasukanSnap = await getDocs(collection(db, "pemasukan"));
  pemasukanSnap.forEach(doc => totalPemasukan += parseInt(doc.data().jumlah || 0));

  const pengeluaranSnap = await getDocs(collection(db, "pengeluaran"));
  pengeluaranSnap.forEach(doc => totalPengeluaran += parseInt(doc.data().jumlah || 0));

  const assetsSnap = await getDocs(collection(db, "assets"));
  assetsSnap.forEach(doc => totalAssets += parseInt(doc.data().jumlah || 0));

  saldo = totalPemasukan - totalPengeluaran;

  animateNumber("totalPemasukan", totalPemasukan);
  animateNumber("totalPengeluaran", totalPengeluaran);
  animateNumber("totalAssets", totalAssets);
  animateNumber("saldoAkhir", saldo);

  tampilkanProgress(totalPemasukan, totalPengeluaran, totalAssets, saldo);
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

document.getElementById("refreshBtn").addEventListener("click", refreshLaporan);
