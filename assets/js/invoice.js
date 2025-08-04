  import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";

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

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const periodeNow = new Date();
    const periodeStr = periodeNow.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

    const pemasanganDate = new Date(tglPemasangan);
    const pemasanganMonthYear = (pemasanganDate.getMonth() + 1).toString().padStart(2, '0') + pemasanganDate.getFullYear();
    const invoiceMonthYear = (periodeNow.getMonth() + 1).toString().padStart(2, '0') + periodeNow.getFullYear();
    const noInvoice = `GH-${kode_pelanggan}${invoiceMonthYear}`;

    // ========== [SISANYA SAMA] ==========
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
      [`Internet Paket ${paket}`, '1', periodeStr, `Rp${Number(nominal).toLocaleString("id-ID")}`, `Rp${Number(nominal).toLocaleString("id-ID")}`]
    ];

    if (pemasanganMonthYear === invoiceMonthYear) {
      bodyRows.push([
        'Jasa Instalasi', '1', periodeStr, `Rp${Number(50000).toLocaleString("id-ID")}`, `Rp${Number(50000).toLocaleString("id-ID")}`
      ]);
    }

    const totalTagihan = bodyRows.reduce((sum, row) => sum + Number(row[4].replace(/[^\d]/g, '')), 0);
    bodyRows.push([
      { content: 'TOTAL', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
      `Rp${Number(totalTagihan).toLocaleString("id-ID")}`
    ]);

    doc.autoTable({
      startY: 75,
      head: [['Description', 'Qty', 'Periode', 'Price', 'Total']],
      body: bodyRows,
      styles: { halign: 'left', valign: 'middle', fontSize: 12, cellPadding: 6 },
      headStyles: { fillColor: [0, 51, 153], halign: 'left', valign: 'middle' },
      margin: { left: 15, right: 15 }
    });

    const tanggalStr = `${periodeNow.getDate().toString().padStart(2, '0')}-${(periodeNow.getMonth() + 1).toString().padStart(2, '0')}-${periodeNow.getFullYear()}`;

    doc.setFontSize(10);
    doc.text(`Tanggal Cetak: ${tanggalStr}`, 150, doc.lastAutoTable.finalY + 50);

    doc.setFontSize(10);
    doc.text("Payment Information: a/n Abizar Alghifari", 14, doc.lastAutoTable.finalY + 5);
    doc.text("140901003602535 (BRI)", 14, doc.lastAutoTable.finalY + 14);
    doc.text("567-708-9917 (BCA)", 14, doc.lastAutoTable.finalY + 21);
    doc.text("089636515580 (Dana, Shopee, Ovo, Gopay)", 14, doc.lastAutoTable.finalY + 28);
    doc.text("harap mengirimkan bukti pembayaran melalui whatsapp", 14, doc.lastAutoTable.finalY + 50);

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");
  };
