import { db } from "./firebase-init.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import "./invoice.js";

const timelineDiv = document.getElementById("timeline");

// 🔍 Deteksi format tanggal
function parseDate(str) {
  const parts = str.split('-').map(Number);
  if (parts[0] > 1900) {
    // YYYY-MM-DD
    return new Date(parts[0], parts[1] - 1, parts[2]);
  } else {
    // DD-MM-YYYY
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
}

async function loadTimeline() {
  const snapshot = await getDocs(collection(db, "pelanggan"));
  const items = [];
  const today = new Date();

  // 1. Ambil data & hitung jatuh tempo untuk sorting
  snapshot.forEach(doc => {
    const d = doc.data();
    const alamatLengkap = `${d.alamat}, RT ${d.rt}/RW ${d.rw}, ${d.kelurahan}, ${d.kecamatan}, ${d.kabupaten}, ${d.provinsi}, ${d.kodepos}`;

    // Hitung jatuh tempo
    const pasangDate = parseDate(d.tglPemasangan);
    const dd = pasangDate.getDate();
    let jatuhTempo = new Date(today.getFullYear(), today.getMonth(), dd);

    // Jika tanggal tagihan bulan ini sudah lewat hari ini,
    // berarti jatuh tempo berikutnya adalah bulan depan?
    // (LOGIKA ASLI: if (today.getDate() > dd) jatuhTempo.setMonth(jatuhTempo.getMonth() + 1); )
    // Mari kita pertahankan logika asli visualnya, tapi kita butuh nilai pasti untuk sorting.
    if (today.getDate() > dd) {
      jatuhTempo.setMonth(jatuhTempo.getMonth() + 1);
    }

    items.push({
      nama: d.nama,
      paket: d.paket || "-",
      alamat: alamatLengkap,
      kodePelanggan: d.kode_pelanggan || "0000",
      nominal: d.nominal || 0,
      tglPasang: d.tglPemasangan,
      jatuhTempoDate: jatuhTempo, // Simpan objek Date untuk sorting
      nohp: d.nohp || "" // Ambil No HP
    });
  });

  // 2. Urutkan dari yang paling dekat deadline-nya (jatuhTempoDate terkecil dlu)
  items.sort((a, b) => a.jatuhTempoDate - b.jatuhTempoDate);

  // 3. Render
  let html = '';
  items.forEach(item => {
    // Karena jatuhTempoDate sudah dihitung, kita bisa pakai langsung untuk diffDays
    // Namun untuk konsistensi variabel display, kita hitung ulang atau pakai yg ada.

    const jatuhTempo = item.jatuhTempoDate;
    const diffDays = Math.ceil((jatuhTempo - today) / (1000 * 60 * 60 * 24));
    const isToday = diffDays === 0;
    const isWarning = diffDays <= 7 && diffDays >= 0;

    const jatuhTempoStr = `${String(jatuhTempo.getDate()).padStart(2, '0')}-${String(jatuhTempo.getMonth() + 1).padStart(2, '0')}-${jatuhTempo.getFullYear()}`;

    // Format No HP untuk WhatsApp (08xxx -> 628xxx)
    let hp = item.nohp.replace(/\D/g, '');
    if (hp.startsWith('0')) {
      hp = '62' + hp.slice(1);
    }

    // Buat Pesan WhatsApp
    const message = `Halo ${item.nama},
Kami ingin mengingatkan bahwa tagihan WiFi Anda sebesar Rp ${Number(item.nominal).toLocaleString('id-ID')} akan jatuh tempo pada ${jatuhTempoStr}, . Mohon pastikan pembayaran dilakukan tepat waktu agar layanan tidak terganggu.
Terima kasih atas perhatian Anda.

Payment Information: a/n Abizar Alghifari
BCA : 567-708-9917
e-Wallet : 089636515580`;

    const waLink = `https://wa.me/${hp}?text=${encodeURIComponent(message)}`;

    html += `
      <div class="card ${isWarning ? 'bg-danger text-white' : 'bg-light'} shadow-sm flex-shrink-0"
        style="min-width: 220px; cursor: pointer;"
        onclick="window.open('${waLink}', '_blank')">
        <div class="card-body">
          <h6 class="card-title mb-1">
            <i class="fas fa-user"></i> ${item.nama}
          </h6>
          <p class="card-text mb-1">
            <i class="fas fa-money-bill"></i> Rp ${Number(item.nominal).toLocaleString()}
          </p>
          <p class="card-text mb-1">
            <i class="fas fa-wifi"></i> ${item.paket}
          </p>
          <small class="${isWarning ? 'text-white' : 'text-muted'}">
            <i class="fas fa-calendar"></i> ${jatuhTempoStr}
            ${isToday ? '<span class="badge bg-dark ms-1">Hari Ini</span>' : ''}
          </small>
        </div>
      </div>
    `;
  });

  timelineDiv.innerHTML = html || '<p class="text-muted">Tidak ada jadwal.</p>';
}

loadTimeline();
