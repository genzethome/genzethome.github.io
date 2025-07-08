import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCxjTmRPiF4OrRAsneB_SUi1SpGOgkwrYg",
  authDomain: "genzet-home.firebaseapp.com",
  projectId: "genzet-home",
  storageBucket: "genzet-home.appspot.com",
  messagingSenderId: "586231239859",
  appId: "1:586231239859:web:9fc3a69f2f2ef0bf8c8cc6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const timelineDiv = document.getElementById("timeline");

async function loadTimeline() {
  const snapshot = await getDocs(collection(db, "pelanggan"));
  const items = [];
  snapshot.forEach(doc => {
    const d = doc.data();
    items.push({
      nama: d.nama,
      paket: d.paket || '-',
      alamat: d.alamat || '-',
      kodePelanggan: d.kodePelanggan || '0000',
      nominal: d.nominal || 0,
      tglPasang: d.tglPemasangan
    });
  });

  // Urutkan berdasarkan tanggal pasang (hanya tanggal)
  items.sort((a, b) => {
    const [ddA] = a.tglPasang.split('-').map(Number);
    const [ddB] = b.tglPasang.split('-').map(Number);
    return ddA - ddB;
  });

  const today = new Date();
  let html = '';

  items.forEach(item => {
    const [yyyy, mm, dd] = item.tglPasang.split('-').map(Number);

    let jatuhTempo = new Date(today.getFullYear(), today.getMonth(), dd);
    if (today.getDate() > dd) {
      jatuhTempo.setMonth(jatuhTempo.getMonth() + 1);
    }

    const diffTime = jatuhTempo - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isToday = diffDays === 0;
    const isWarning = diffDays <= 7 && diffDays >= 0;

    const cardClass = isWarning ? 'bg-danger text-white' : 'bg-light';

    const ddFix = String(jatuhTempo.getDate()).padStart(2, '0');
    const mmFix = String(jatuhTempo.getMonth() + 1).padStart(2, '0');
    const yyyyFix = jatuhTempo.getFullYear();
    const jatuhTempoStr = `${ddFix}-${mmFix}-${yyyyFix}`;

    html += `
      <div class="card ${cardClass} shadow-sm flex-shrink-0" style="min-width: 220px; cursor: pointer;"
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

// ✅ Fungsi generateInvoice (TIDAK DIHAPUS)
window.generateInvoice = async function (nama, paket, alamat, kodePelanggan, nominal, tglPemasangan) {
  const { jsPDF } = window.jspdf;

  const periodeNow = new Date();
  const periodeStr = periodeNow.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  const [dd, mm, yyyy] = tglPemasangan.split('-').map(Number);
  const pemasanganDate = new Date(yyyy, mm - 1, dd);

  const pemasanganMonthYear = `${String(pemasanganDate.getMonth() + 1).padStart(2, '0')}${pemasanganDate.getFullYear()}`;
  const invoiceMonthYear = `${String(periodeNow.getMonth() + 1).padStart(2, '0')}${periodeNow.getFullYear()}`;

  const noInvoice = `INV-${kodePelanggan}${invoiceMonthYear}`;

  await Swal.fire({
    title: '<div style="font-size: .9rem;">Memproses Invoice...</div>',
    html: `<div style="overflow: hidden; min-height: 50px; display: flex; align-items: center; justify-content: center;">
      <div class="spinner-border text-primary" role="status"></div>
    </div>`,
    timer: 1000,
    allowOutsideClick: false,
    showConfirmButton: false,
    scrollbarPadding: false
  });

  const doc = new jsPDF();
  doc.setFillColor(0, 51, 153);
  doc.rect(0, 0, 210, 20, 'F');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("GENZET HOME", 14, 12);
  doc.setFontSize(10);
  doc.text(`NO: ${noInvoice}`, 160, 12);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text("Bill To:", 14, 35);
  doc.text(nama, 14, 42);
  const alamatSplit = doc.splitTextToSize(alamat, 80);
  doc.text(alamatSplit, 14, 49);

  doc.text("From:", 130, 35);
  doc.text("GENZET HOME", 130, 42);
  doc.text("Jl. Bambu Apus, Jakarta Timur", 130, 49);

  const bodyRows = [
    [`Internet Paket ${paket}`, '1', periodeStr, `Rp ${Number(nominal).toLocaleString("id-ID")}`, `Rp ${Number(nominal).toLocaleString("id-ID")}`]
  ];

  if (pemasanganMonthYear === invoiceMonthYear) {
    bodyRows.push(['Jasa Instalasi', '1', periodeStr, `Rp ${Number(50000).toLocaleString("id-ID")}`, `Rp ${Number(50000).toLocaleString("id-ID")}`]);
  }

  const totalTagihan = bodyRows.reduce((sum, row) => sum + parseInt(row[4].replace(/[^\d]/g, ''), 10), 0);
  bodyRows.push([{ content: 'TOTAL', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }, `Rp ${Number(totalTagihan).toLocaleString("id-ID")}`]);

  doc.autoTable({
    startY: 75,
    head: [['Description', 'Qty', 'Periode', 'Price', 'Total']],
    body: bodyRows,
    styles: { fontSize: 12, cellPadding: 6 },
    headStyles: { fillColor: [0, 51, 153] },
    margin: { left: 15, right: 15 }
  });

  const tanggalStr = `${String(periodeNow.getDate()).padStart(2, '0')}-${String(periodeNow.getMonth() + 1).padStart(2, '0')}-${periodeNow.getFullYear()}`;
  doc.setFontSize(10);
  doc.text(`Tanggal: ${tanggalStr}`, 130, doc.lastAutoTable.finalY + 10);

  doc.text("Payment Information:", 14, doc.lastAutoTable.finalY + 10);
  doc.text("Bank: BANK BCA", 14, doc.lastAutoTable.finalY + 17);
  doc.text("No. Rek: 1234567890", 14, doc.lastAutoTable.finalY + 24);
  doc.text("Email: support@genzet.com", 14, doc.lastAutoTable.finalY + 31);

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};
