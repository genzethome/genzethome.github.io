// /assets/js/invoice.js
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";

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
