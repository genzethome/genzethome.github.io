// ✅ Import & Setup
import { db, auth } from "./firebase-init.js";
import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import "./navbar.js";
import "./invoice.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";

// ✅ DOM
const tbody = document.querySelector("#tablePelanggan tbody");
let table;

// ✅ Cek Login
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    loadPelanggan();
  }
});

// ✅ Utils
function formatAlamat(d) {
  return `${d.alamat}, RT ${d.rt}/RW ${d.rw}, ${d.kelurahan}, ${d.kecamatan}, ${d.kabupaten}, ${d.provinsi}, ${d.kodepos}`;
}
function formatRupiah(n) {
  return "Rp " + parseInt(n || 0).toLocaleString();
}
function formatTgl(tgl) {
  if (!tgl) return "-";
  const [y, m, d] = tgl.split("-");
  return `${d}-${m}-${y}`;
}

// ✅ Load Data
async function loadPelanggan() {
  const snapshot = await getDocs(collection(db, "pelanggan"));
  tbody.innerHTML = "";

  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    const alamatLengkap = formatAlamat(d);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="nomor"></td>
      <td>${d.nama || "-"}</td>
      <td><textarea class="form-control small-textarea" readonly>${alamatLengkap}</textarea></td>
      <td><textarea class="form-control small-textarea" readonly>${d.email || "-"}</textarea></td>
      <td><textarea class="form-control small-textarea" readonly>${d.nohp || "-"}</textarea></td>
      <td><span class="badge bg-success">${d.paket || "-"}</span></td>
      <td>${formatRupiah(d.nominal)}</td>
      <td>${formatTgl(d.tglPemasangan)}</td>
      <td><input type="checkbox" class="rowCheckbox" value="${docSnap.id}"></td>
    `;
    tbody.appendChild(tr);
  });

  if (table) table.destroy();

  table = $('#tablePelanggan').DataTable({
    dom: 'rtip',
    lengthChange: false,
    pageLength: parseInt(document.getElementById("pageLengthSelect").value),
    order: [[1, 'asc']],
    columnDefs: [{ targets: 0, searchable: false, orderable: false }]
  });

  table.on('draw.dt', () => {
    document.querySelectorAll('#tablePelanggan tbody td.nomor').forEach((cell, i) => {
      cell.textContent = i + 1;
    });
  });

  table.draw();
}

// ✅ Select All
document.getElementById("selectAll").addEventListener("change", (e) => {
  document.querySelectorAll(".rowCheckbox").forEach(cb => cb.checked = e.target.checked);
});

// ✅ Delete Selected
document.getElementById("deleteSelectedBtn").addEventListener("click", async () => {
  const selected = Array.from(document.querySelectorAll(".rowCheckbox:checked")).map(cb => cb.value);
  if (selected.length === 0) {
    Swal.fire("Tidak ada data dipilih!", "", "warning");
    return;
  }
  const confirm = await Swal.fire({
    title: `Hapus ${selected.length} data?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya"
  });
  if (!confirm.isConfirmed) return;

  for (const id of selected) {
    await deleteDoc(doc(db, "pelanggan", id));
  }
  Swal.fire("Berhasil!", `${selected.length} data dihapus!`, "success");
  loadPelanggan();
});

// ✅ Search SweetAlert
document.getElementById("searchBtn").addEventListener("click", () => {
  Swal.fire({
    title: "Cari Pelanggan",
    html: '<input id="swal-input1" class="swal2-input" placeholder="Ketik kata kunci...">',
    showCloseButton: true,
    showCancelButton: false,
    showConfirmButton: false,
    didOpen: () => {
      const input = Swal.getPopup().querySelector('#swal-input1');
      input.focus();
      input.addEventListener('input', (e) => {
        table.search(e.target.value).draw();
      });
    }
  });
});

// ✅ Ganti Page Length
document.getElementById("pageLengthSelect").addEventListener("change", () => {
  table.page.len(parseInt(document.getElementById("pageLengthSelect").value)).draw();
});

// ✅ Generate PDF dari Checkbox
document.getElementById("generatePdfBtn").addEventListener("click", async () => {
  const selected = Array.from(document.querySelectorAll(".rowCheckbox:checked"));
  if (selected.length === 0) {
    Swal.fire("Tidak ada data dipilih!", "", "warning");
    return;
  }

  const confirm = await Swal.fire({
    title: `Generate PDF untuk ${selected.length} pelanggan?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Generate"
  });
  if (!confirm.isConfirmed) return;

  selected.forEach(cb => {
    const row = cb.closest("tr");
    const nama = row.cells[1].innerText.trim();
    const alamat = row.cells[2].querySelector("textarea").value.trim();
    const paket = row.cells[5].innerText.trim();
    const nominal = parseInt(row.cells[6].innerText.replace(/[^\d]/g, ''));
    const tglPemasangan = row.cells[7].innerText.trim().split("-").reverse().join("-");
    const kodePelanggan = nama.replace(/\s/g, "") || "0000";

    window.generateInvoice(nama, paket, alamat, kodePelanggan, nominal, tglPemasangan);
  });
});

// ✅ Export Excel Checkbox Only
document.getElementById("generateExcelBtn").addEventListener("click", async () => {
  const selected = Array.from(document.querySelectorAll(".rowCheckbox:checked"));
  if (selected.length === 0) {
    Swal.fire("Tidak ada data dipilih!", "", "warning");
    return;
  }

  const confirm = await Swal.fire({
    title: `Export Excel untuk ${selected.length} data terpilih?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Export"
  });
  if (!confirm.isConfirmed) return;

  const rows = [];
  rows.push(["No", "Nama", "Alamat", "Email", "Telepon", "Paket", "Nominal", "Tanggal Pemasangan"]);

  selected.forEach((cb, i) => {
    const row = cb.closest("tr");
    const nama = row.cells[1].innerText.trim();
    const alamat = row.cells[2].querySelector("textarea").value.trim();
    const email = row.cells[3].querySelector("textarea").value.trim();
    const nohp = row.cells[4].querySelector("textarea").value.trim();
    const paket = row.cells[5].innerText.trim();
    const nominal = row.cells[6].innerText.trim();
    const tglPemasangan = row.cells[7].innerText.trim();

    rows.push([
      i + 1, nama, alamat, email, nohp, paket, nominal, tglPemasangan
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Pelanggan");
  XLSX.writeFile(wb, `ExportPelanggan.xlsx`);
});
