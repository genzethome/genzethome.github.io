// kinerja.js
import { db, auth } from './firebase-init.js';
import {
  collection,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js';

const TABEL_BODY = document.getElementById('kinerjaBody');
const TABEL_GAJI_BODY = document.getElementById('gajiBody');
const DISTRIBUSI_CARD = document.getElementById('distribusiCard');
const USERS = ["abi", "baruna", "firzi", "jerry", "yuda"];
const ALLOWED_EMAILS = ['firzi@genzet.com', 'abizar@genzet.com'];

// ... (UTILS and DATA FETCHING code remains same) ...

// ========================
// ✅ INIT
// ========================
async function inisialisasi() {
  const { userData, netProfit } = await ambilData();

  // 1. Render Performa (Visible to everyone)
  const dataPerforma = hitungPower(userData);
  renderPerforma(dataPerforma);

  // 2. Check Access for Salary Panel
  onAuthStateChanged(auth, (user) => {
    if (user && ALLOWED_EMAILS.includes(user.email)) {
      // Show Card
      if (DISTRIBUSI_CARD) DISTRIBUSI_CARD.classList.remove('d-none');

      // Calculate and Render
      const dataGaji = hitungGaji(userData, netProfit);
      renderGaji(dataGaji);
    } else {
      // Ensure hidden
      if (DISTRIBUSI_CARD) DISTRIBUSI_CARD.classList.add('d-none');
    }
  });
}

inisialisasi();

// ========================
// ✅ UTILS
// ========================
const normalisasiNama = (nama) =>
  nama.toLowerCase().replace("abizar", "abi").trim();

const kapitalAwal = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1);

const formatRupiah = (angka) => {
  if (typeof angka !== 'number') angka = parseInt(angka) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(angka);
};

// ========================
// ✅ DATA FETCHING
// ========================
async function ambilData() {
  const absenSnap = await getDocs(collection(db, 'absen'));
  const pemasukanSnap = await getDocs(collection(db, 'pemasukan'));
  const pelangganSnap = await getDocs(collection(db, 'pelanggan'));
  const pengeluaranTetapSnap = await getDocs(collection(db, 'pengeluaran_tetap'));

  const data = Object.fromEntries(USERS.map(n => [n, { hadir: 0, modal: 0 }]));

  // Hitung hadir
  absenSnap.forEach(doc => {
    const d = doc.data();
    const nama = normalisasiNama(d.nama || d.username || "");
    if (USERS.includes(nama)) data[nama].hadir++;
  });

  // Hitung modal
  pemasukanSnap.forEach(doc => {
    const d = doc.data();
    const ket = normalisasiNama(d.keterangan || "");
    const nama = USERS.find(n => ket.includes(n));
    if (nama) data[nama].modal += parseInt(d.jumlah || 0);
  });

  // Hitung Keuangan (Profit Bersih)
  let income = 0;
  pelangganSnap.forEach(d => income += parseInt(d.data().nominal || 0));

  let expense = 0;
  pengeluaranTetapSnap.forEach(d => expense += parseInt(d.data().jumlah || 0));

  const gross = income - expense;
  const kas = Math.round(gross * 0.05); // 5% Kas
  const net = gross - kas;

  return { userData: data, netProfit: net };
}

// ========================
// ✅ LOGIC 1: PERFORMA (RANK & POWER)
// ========================
function hitungPower(userData) {
  const maxHadir = Math.max(...Object.values(userData).map(d => d.hadir)) || 1;
  const maxModal = Math.max(...Object.values(userData).map(d => d.modal)) || 1;

  const skor = Object.entries(userData).map(([nama, val]) => {
    const s = ((val.hadir / maxHadir) * 0.3) + ((val.modal / maxModal) * 0.7);
    return { nama, ...val, score: s };
  });

  const totalScore = skor.reduce((acc, v) => acc + v.score, 0) || 1;

  let result = skor.map(v => ({
    ...v,
    power: Math.round((v.score / totalScore) * 100)
  }));

  // Koreksi 100%
  const totalPower = result.reduce((acc, v) => acc + v.power, 0);
  const diff = 100 - totalPower;
  if (diff !== 0) {
    result.sort((a, b) => b.power - a.power);
    result[0].power += diff;
  }

  return result.sort((a, b) => b.power - a.power);
}

// ========================
// ✅ LOGIC 2: GAJI & DIVIDEN (RUPIAH)
// ========================
function hitungGaji(userData, netProfit) {
  const salaryPool = Math.round(netProfit * 0.30);
  const dividendPool = Math.round(netProfit * 0.70);

  let totalHadir = Object.values(userData).reduce((acc, v) => acc + v.hadir, 0);
  let totalModal = Object.values(userData).reduce((acc, v) => acc + v.modal, 0);

  const result = Object.entries(userData).map(([nama, val]) => {
    const gaji = totalHadir ? Math.round((val.hadir / totalHadir) * salaryPool) : 0;
    const dividen = totalModal ? Math.round((val.modal / totalModal) * dividendPool) : 0;

    // Rumus String untuk Tooltip
    const rumusGaji = totalHadir
      ? `Rumus: ${val.hadir} (Absen) / ${totalHadir} (Total) x ${formatRupiah(salaryPool)}`
      : "Tidak ada absen global";

    const rumusDividen = totalModal
      ? `Rumus: ${formatRupiah(val.modal)} (Modal) / ${formatRupiah(totalModal)} (Total) x ${formatRupiah(dividendPool)}`
      : "Tidak ada modal global";

    return { nama, gaji, dividen, total: gaji + dividen, rumusGaji, rumusDividen };
  });

  return result.sort((a, b) => b.total - a.total);
}

// ========================
// ✅ RENDER
// ========================
function renderPerforma(data) {
  TABEL_BODY.innerHTML = data.map((val, index) => {
    let rankArrow = '';
    if (index === 0) rankArrow = '<i class="fas fa-trophy text-warning fa-lg"></i>';
    else if (index === 1) rankArrow = '<i class="fas fa-medal fa-lg text-secondary"></i>';
    else if (index === 2) rankArrow = '<i class="fas fa-medal fa-lg" style="color: #CD7F32;"></i>';
    else rankArrow = '<i class="fas fa-user-circle text-muted fa-lg"></i>';

    let color = 'bg-success';
    if (val.power < 30) color = 'bg-danger';
    else if (val.power < 70) color = 'bg-warning';

    return `
      <tr>
        <td class="text-center fw-bold">${index + 1}</td>
        <td>${kapitalAwal(val.nama)}</td>
        <td class="text-center">${rankArrow}</td>
        <td class="text-muted text-center">${val.hadir}</td>
        <td class="text-dark">${formatRupiah(val.modal)}</td>
        <td>
          <div class="d-flex align-items-center">
            <span class="me-2 fw-bold" style="font-size:0.8rem;">${val.power}%</span>
            <div class="progress flex-grow-1" style="height: 6px;">
              <div class="progress-bar ${color}" style="width: ${val.power}%"></div>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function renderGaji(data) {
  if (!TABEL_GAJI_BODY) return;

  TABEL_GAJI_BODY.innerHTML = data.map((val, index) => `
    <tr>
      <td class="text-center fw-bold align-middle">${index + 1}</td>
      <td class="align-middle fw-semibold">${kapitalAwal(val.nama)}</td>
      
      <td class="align-middle" style="cursor: help;" 
          data-bs-toggle="tooltip" data-bs-placement="top" title="${val.rumusGaji}">
        <span class="text-muted">${formatRupiah(val.gaji)}</span>
      </td>

      <td class="align-middle" style="cursor: help;" 
          data-bs-toggle="tooltip" data-bs-placement="top" title="${val.rumusDividen}">
        <span class="text-muted">${formatRupiah(val.dividen)}</span>
      </td>

      <td class="align-middle fw-bold text-success">
        ${formatRupiah(val.total)}
      </td>
    </tr>
  `).join("");

  // Initialize Bootstrap Tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}


