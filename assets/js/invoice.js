import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";

// Helper function to generate PDF document
function createInvoiceDoc(nama, paket, alamat, kode_pelanggan, nominal, tglPemasangan) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // -- Config --
  const primaryColor = [0, 51, 153];
  const secondaryColor = [0, 81, 200];

  // -- Gradient Header --
  const headerH = 25;
  const pageWidth = doc.internal.pageSize.getWidth();
  for (let y = 0; y < headerH; y++) {
    const ratio = y / headerH;
    const r = Math.round(primaryColor[0] * (1 - ratio) + secondaryColor[0] * ratio);
    const g = Math.round(primaryColor[1] * (1 - ratio) + secondaryColor[1] * ratio);
    const b = Math.round(primaryColor[2] * (1 - ratio) + secondaryColor[2] * ratio);
    doc.setFillColor(r, g, b);
    doc.rect(0, y, pageWidth, 1, 'F');
  }

  // Header Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("GENZET HOME", 15, 17);

  // Invoice No
  const periodeNow = new Date();
  const invoiceMonthYear = (periodeNow.getMonth() + 1).toString().padStart(2, '0') + periodeNow.getFullYear();
  const noInvoice = `GH-${kode_pelanggan}${invoiceMonthYear}`;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`NO: ${noInvoice}`, pageWidth - 15, 17, { align: 'right' });

  // -- Content Info --
  const startY = 45;

  // "Bill To"
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 15, startY);

  doc.setFont("helvetica", "normal");
  doc.text(nama, 15, startY + 7);

  // Alamat with wrapping
  const alamatSplit = doc.splitTextToSize(alamat, 80);
  doc.text(alamatSplit, 15, startY + 14);

  // "From"
  const rightColX = 120;
  doc.setFont("helvetica", "bold");
  doc.text("From:", rightColX, startY);

  doc.setFont("helvetica", "normal");
  doc.text("GENZET HOME", rightColX, startY + 7);
  doc.text("Jl. Bambu Apus, Jakarta Timur", rightColX, startY + 14);

  // -- Table Data --
  const periodeStr = periodeNow.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  const pemasanganDate = new Date(tglPemasangan);
  const pemasanganMonthYear = (pemasanganDate.getMonth() + 1).toString().padStart(2, '0') + pemasanganDate.getFullYear();

  // Columns: Description, Qty, Periode, Price (Total removed from header)
  const bodyRows = [
    [`Internet Paket ${paket}`, '1', periodeStr, `Rp${Number(nominal).toLocaleString("id-ID")}`]
  ];

  if (pemasanganMonthYear === invoiceMonthYear) {
    bodyRows.push([
      'Jasa Instalasi', '1', periodeStr, `Rp${Number(50000).toLocaleString("id-ID")}`
    ]);
  }

  const totalTagihan = Number(nominal) + (pemasanganMonthYear === invoiceMonthYear ? 50000 : 0);

  bodyRows.push([
    { content: 'TOTAL', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
    `Rp${Number(totalTagihan).toLocaleString("id-ID")}`
  ]);

  // -- AutoTable --
  doc.autoTable({
    startY: startY + 40,
    head: [['Description', 'Qty', 'Periode', 'Price']], // Removed 'Total'
    body: bodyRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 13,
      cellPadding: 8,
      valign: 'middle',
      textColor: [50, 50, 50]
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      3: { fontStyle: 'bold', halign: 'right' } // Price column (last one now)
    },
    margin: { left: 15, right: 15 }
  });

  // -- Footer Info --
  const finalY = doc.lastAutoTable.finalY + 15;
  const tanggalStr = `${periodeNow.getDate().toString().padStart(2, '0')}-${(periodeNow.getMonth() + 1).toString().padStart(2, '0')}-${periodeNow.getFullYear()}`;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Tanggal Cetak: ${tanggalStr}`, pageWidth - 15, finalY - 5, { align: 'right' });

  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);

  // Payment Info Box
  doc.setFont("helvetica", "bold");
  doc.text("Payment Information:", 15, finalY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  let payY = finalY + 7;
  doc.text("a/n Abizar Alghifari", 15, payY); payY += 6;
  doc.text("BCA : 567-708-9917", 15, payY); payY += 6;
  // BRI Removed
  doc.text("e-Wallet : 089636515580", 15, payY); payY += 10;

  doc.setFontSize(11);
  doc.setTextColor(0, 51, 153);
  doc.text("Harap mengirimkan bukti pembayaran melalui WhatsApp.", 15, payY);

  return { doc, noInvoice };
}

window.generateInvoice = async function (nama, paket, alamat, kode_pelanggan, nominal, tglPemasangan) {
  const confirm = await Swal.fire({
    title: 'Memproses Invoice...',
    timer: 800,
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  const { doc } = createInvoiceDoc(nama, paket, alamat, kode_pelanggan, nominal, tglPemasangan);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};

window.downloadInvoiceAndOpenWhatsApp = async function (nama, paket, alamat, kode_pelanggan, nominal, tglPemasangan, waLink) {
  const confirm = await Swal.fire({
    title: 'Mengunduh Invoice...',
    text: 'Invoice akan diunduh dan WhatsApp akan dibuka.',
    timer: 1500,
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  const { doc, noInvoice } = createInvoiceDoc(nama, paket, alamat, kode_pelanggan, nominal, tglPemasangan);

  // Download PDF
  doc.save(`${noInvoice}.pdf`);

  // Open WhatsApp after a short delay to ensure download starts
  setTimeout(() => {
    window.open(waLink, '_blank');
  }, 1000);
};
