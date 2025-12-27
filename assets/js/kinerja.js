// kinerja.js
import { db } from './firebase-init.js';
import {
  collection,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';

const TABEL_BODY = document.getElementById('kinerjaBody');
const USERS = ["abi", "baruna", "firzi", "jerry", "yuda"];

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

  TABEL_BODY.innerHTML = dataArray.map(([nama, val], index) => {
    // Tentukan warna progress bar berdasarkan power
    let progressColor = 'bg-success';
    if (val.power < 30) progressColor = 'bg-danger';
    else if (val.power < 70) progressColor = 'bg-warning';

    // Tentukan Icon Rank
    let rankIcon = '';
    if (index === 0) {
      rankIcon = '<i class="fas fa-trophy text-warning fa-lg"></i>'; // Juara 1 (Emas)
    } else if (index === 1) {
      rankIcon = '<i class="fas fa-medal fa-lg" style="color: #C0C0C0;"></i>'; // Juara 2 (Perak)
    } else if (index === 2) {
      rankIcon = '<i class="fas fa-medal fa-lg" style="color: #CD7F32;"></i>'; // Juara 3 (Perunggu)
    } else {
      rankIcon = '<i class="fas fa-user-circle text-secondary fa-lg align-middle"></i>'; // Sisanya
    }

    return `
    <tr>
      <td class="align-middle text-center fw-bold">${index + 1}</td> <!-- Nomor Fixed -->
      <td class="text-start align-middle">
        <span class="fw-semibold text-dark">${kapitalAwal(nama)}</span>
      </td>
      <td class="align-middle text-center">
        ${rankIcon}
      </td>
      <td class="align-middle text-muted fw-medium">${val.hadir}</td>
      <td class="align-middle fw-medium text-dark">${formatRupiah(val.modal)}</td>
      <td class="align-middle">
        <div class="d-flex flex-column justify-content-center h-100">
            <div class="d-flex justify-content-between mb-1" style="font-size: 0.75rem;">
                <span class="fw-bold">${val.power}%</span>
            </div>
            <div class="progress shadow-sm" style="height: 6px; border-radius: 10px;">
                <div class="progress-bar ${progressColor}" role="progressbar" style="width: ${val.power}%; border-radius: 10px;" aria-valuenow="${val.power}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
        </div>
      </td>
    </tr>
  `;
  }).join("");
}

// Jalankan semua proses
async function inisialisasi() {
  const dataAwal = await ambilDataKinerja();
  const hasil = hitungPower(dataAwal);
  renderTabel(hasil);

  // Inisialisasi DataTable
  const table = $('#kinerjaTable').DataTable({
    ordering: false, // Disable user sorting (removes arrows)
    paging: false,
    info: false,
    searching: false // Optional: also remove search if not needed, but safe to keep. User asked for sort only.
  });

  // No callback needed for reordering/numbering since it's now handled by renderTabel order
  table.draw();
}

inisialisasi();
