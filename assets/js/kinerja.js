// kinerja.js
import { db } from './firebase-init.js';
import {
  collection,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';

const TABEL_BODY = document.getElementById('kinerjaBody');
const USERS = ["abi", "baruna", "firzi", "jerry", "mahija", "maulana", "yuda", "zahdan"];

// Normalisasi nama input jadi lowercase + ganti nama panjang
const normalisasiNama = (nama) =>
  nama.toLowerCase().replace("abizar", "abi").trim();

const kapitalAwal = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1);

// Format angka jadi Rupiah
const formatRupiah = (angka) => {
  if (typeof angka !== 'number') angka = parseInt(angka) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(angka);
};

// Ambil dan hitung data dari Firestore
async function ambilDataKinerja() {
  const absenSnap = await getDocs(collection(db, 'absen'));
  const pemasukanSnap = await getDocs(collection(db, 'pemasukan'));

  // Buat struktur awal
  const kinerja = Object.fromEntries(USERS.map(n => [n, { hadir: 0, modal: 0 }]));

  // Hitung jumlah hadir
  absenSnap.forEach(doc => {
    const data = doc.data();
    const nama = normalisasiNama(data.nama || data.username || "");
    if (USERS.includes(nama)) kinerja[nama].hadir++;
  });

  // Hitung total modal dari pemasukan
  pemasukanSnap.forEach(doc => {
    const data = doc.data();
    const ket = normalisasiNama(data.keterangan || "");
    const jumlah = parseInt(data.jumlah) || 0;
    const nama = USERS.find(n => ket.includes(n));
    if (nama) kinerja[nama].modal += jumlah;
  });

  return kinerja;
}

// Hitung power proporsional agar total 100%
function hitungPower(data) {
  const maxHadir = Math.max(...Object.values(data).map(d => d.hadir));
  const maxModal = Math.max(...Object.values(data).map(d => d.modal));

  // Hitung skor mentah
  const skorMentah = Object.fromEntries(Object.entries(data).map(([nama, val]) => {
    const hadirScore = maxHadir ? val.hadir / maxHadir : 0;
    const modalScore = maxModal ? val.modal / maxModal : 0;
    const score = hadirScore * 0.30 + modalScore * 0.70;
    return [nama, { ...val, score }];
  }));

  const totalScore = Object.values(skorMentah).reduce((acc, val) => acc + val.score, 0) || 1;

  // Hitung power awal
  let powerFinal = Object.fromEntries(Object.entries(skorMentah).map(([nama, val]) => {
    const power = Math.round((val.score / totalScore) * 100);
    return [nama, { ...val, power }];
  }));

  // Koreksi pembulatan agar total tetap 100%
  let totalPower = Object.values(powerFinal).reduce((acc, val) => acc + val.power, 0);
  const selisih = 100 - totalPower;

  if (selisih !== 0) {
    const urut = Object.entries(powerFinal).sort(([, a], [, b]) => b.power - a.power);
    const target = urut[0][0]; // Ambil yang power-nya paling besar
    powerFinal[target].power += selisih;
  }

  return powerFinal;
}

// Tampilkan tabel HTML
function renderTabel(data) {
  const dataArray = Object.entries(data).sort(([, a], [, b]) => b.power - a.power);

  TABEL_BODY.innerHTML = dataArray.map(([nama, val]) => `
    <tr>
      <td></td> <!-- Nomor: akan diisi ulang oleh DataTables -->
      <td class="text-start">${kapitalAwal(nama)}</td>
      <td>${val.hadir}</td>
      <td>${formatRupiah(val.modal)}</td>
      <td><strong>${val.power}%</strong></td>
    </tr>
  `).join("");
}

// Jalankan semua proses
async function inisialisasi() {
  const dataAwal = await ambilDataKinerja();
  const hasil = hitungPower(dataAwal);
  renderTabel(hasil);

  // Inisialisasi DataTable
  const table = $('#kinerjaTable').DataTable({
    columnDefs: [
      { orderable: false, searchable: false, targets: 0 },
    ],
    order: [[4, 'desc']],
    paging: false,
    info: false
  });

  // Isi ulang nomor urut setelah sort/filter
  table.on('order.dt search.dt', function () {
    table.column(0, { search: 'applied', order: 'applied' })
      .nodes().each((cell, i) => {
        cell.innerHTML = i + 1;
      });
  }).draw();
}

inisialisasi();
