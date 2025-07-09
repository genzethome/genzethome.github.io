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

  snapshot.forEach(doc => {
    const d = doc.data();

    // ✅ ALAMAT KOMPLIT
    const alamatLengkap = `${d.alamat}, RT ${d.rt}/RW ${d.rw}, ${d.kelurahan}, ${d.kecamatan}, ${d.kabupaten}, ${d.provinsi}, ${d.kodepos}`;

    items.push({
      nama: d.nama,
      paket: d.paket || "-",
      alamat: alamatLengkap,
      kodePelanggan: d.kode_pelanggan || "0000",
      nominal: d.nominal || 0,
      tglPasang: d.tglPemasangan
    });
  });

  // ✅ Urutkan by tglPasang
  items.sort((a, b) => parseDate(a.tglPasang) - parseDate(b.tglPasang));

  const today = new Date();
  let html = '';

  items.forEach(item => {
    const pasangDate = parseDate(item.tglPasang);
    const dd = pasangDate.getDate();

    let jatuhTempo = new Date(today.getFullYear(), today.getMonth(), dd);
    if (today.getDate() > dd) jatuhTempo.setMonth(jatuhTempo.getMonth() + 1);

    const diffDays = Math.ceil((jatuhTempo - today) / (1000 * 60 * 60 * 24));
    const isToday = diffDays === 0;
    const isWarning = diffDays <= 7 && diffDays >= 0;

    const jatuhTempoStr = `${String(jatuhTempo.getDate()).padStart(2, '0')}-${String(jatuhTempo.getMonth() + 1).padStart(2, '0')}-${jatuhTempo.getFullYear()}`;

    html += `
      <div class="card ${isWarning ? 'bg-danger text-white' : 'bg-light'} shadow-sm flex-shrink-0"
        style="min-width: 220px; cursor: pointer;"
        onclick="window.generateInvoice(
          '${item.nama.replace(/'/g, "\\'")}',
          '${item.paket.replace(/'/g, "\\'")}',
          '${item.alamat.replace(/'/g, "\\'")}',
          '${item.kodePelanggan}',
          ${item.nominal},
          '${item.tglPasang}'
        )">
        <div class="card-body">
          <h6 class="card-title mb-1">
            <i class="fas fa-user"></i> ${item.nama}
          </h6>
          <p class="card-text mb-1">
            <i class="fas fa-money-bill"></i> Rp ${Number(item.nominal).toLocaleString()}
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
