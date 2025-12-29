// assets/js/gaji.js
import { db, auth } from './firebase-init.js';
import {
    collection,
    getDocs,
} from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js';

const TABEL_GAJI_BODY = document.getElementById('gajiBody');
const ALLOWED_EMAILS = ['firzi@genzet.com', 'abizar@genzet.com'];
const USERS = ["abi", "baruna", "firzi", "jerry", "yuda"];

// ========================
// 🔒 ACCESS CONTROL
// ========================
onAuthStateChanged(auth, (user) => {
    if (user && ALLOWED_EMAILS.includes(user.email)) {
        // Access Granted
        document.getElementById('mainContent').classList.remove('d-none');
        inisialisasi();
    } else {
        // Access Denied
        document.getElementById('accessDenied').classList.remove('d-none');
        document.getElementById('mainContent').classList.add('d-none');
    }
});

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
// ✅ LOGIC: Hitung Gaji
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

// ========================
// ✅ INIT
// ========================
async function inisialisasi() {
    try {
        const { userData, netProfit } = await ambilData();
        const dataGaji = hitungGaji(userData, netProfit);
        renderGaji(dataGaji);
    } catch (error) {
        console.error("Gagal mengambil data:", error);
        TABEL_GAJI_BODY.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Gagal memuat data. Periksa koneksi internet.</td></tr>`;
    }
}
