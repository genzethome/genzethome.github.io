// /assets/js/pemasukan.js
import { db, auth } from './firebase-init.js';
import "./navbar.js";
import {
    collection,
    addDoc,
    getDoc,
    serverTimestamp,
    getDocs,
    doc,
    query,
    orderBy,
    limit,
    updateDoc,
    onSnapshot,
  deleteDoc} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// ========================
// ✅ DOM ELEMENTS
// ========================
const tbody = document.querySelector("#tablePemasukan tbody");
const totalEl = document.getElementById("totalPemasukan");
let table;

// ========================
// ✅ CEK LOGIN
// ========================
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "login.html";
});

// ========================
// ✅ UTILS
// ========================
function capitalizeWords(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function truncateText(text, maxLength = 20) {
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
}

function formatUploader(email) {
  if (!email) return "-";
  return email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1);
}

function toISODate(tanggal) {
  if (!tanggal.includes("-") || !tanggal.includes(":")) return "";
  const parts = tanggal.split(/[- :]/);
  if (parts.length >= 6) {
    return `${parts[2]}-${parts[1]}-${parts[0]}T${parts[3]}:${parts[4]}:${parts[5]}`;
  }
  return "";
}

// ========================
// ✅ LOAD DATA
// ========================
function loadDataRealtime() {
  const q = collection(db, "pemasukan");

  onSnapshot(q, (snapshot) => {
    // 1. Destroy DataTables dulu (jika ada)
    if ($.fn.DataTable.isDataTable('#tablePemasukan')) {
      $('#tablePemasukan').DataTable().destroy();
    }

    // 2. Kosongkan tbody
    tbody.innerHTML = "";
    let total = 0;

    // 3. Render data ke tbody
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      total += parseInt(d.jumlah || 0);
      const nama = capitalizeWords(d.keterangan || "-");
      const namaTampil = truncateText(nama);
      const isoDate = toISODate(d.tanggal || "");

      tbody.innerHTML += `
        <tr>
          <td></td>
          <td><span data-bs-toggle="tooltip" title="${nama}">${namaTampil}</span></td>
          <td>${d.kuantitas || "-"}</td>
          <td data-order="${parseInt(d.jumlah || 0)}">Rp ${parseInt(d.jumlah || 0).toLocaleString()}</td>
          <td>${formatUploader(d.uploader)}</td>
          <td data-order="${isoDate}">${d.tanggal || "-"}</td>
          <td><input type="checkbox" class="rowCheckbox" value="${docSnap.id}"></td>
        </tr>
      `;
    });

    totalEl.textContent = "Rp " + total.toLocaleString();

    // 4. Inisialisasi DataTables setelah data sudah di tbody
    table = $('#tablePemasukan').DataTable({
      dom: 'rtip',
      lengthChange: false,
      pageLength: parseInt(document.getElementById("pageLengthSelect").value),
      order: [[5, 'desc']],
      columnDefs: [
        { targets: 0, searchable: false, orderable: false },
        { targets: 3, type: "num" }
      ]
    });

    table.on('order.dt search.dt', function () {
      table.column(0, { search: 'applied', order: 'applied' }).nodes().each(function (cell, i) {
        cell.innerHTML = i + 1;
      });
    }).draw();

    // aktifkan tooltip bootstrap
    const tooltips = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltips.map(el => new bootstrap.Tooltip(el));

    console.log("DataTables re-initialized"); // DEBUG
  });
}

// ========================
// ✅ PAGE LENGTH
// ========================
document.getElementById("pageLengthSelect").addEventListener("change", () => {
  table.page.len(parseInt(document.getElementById("pageLengthSelect").value)).draw();
});

// ========================
// ✅ SELECT ALL CHECKBOX
// ========================
document.getElementById("selectAll").addEventListener("change", (e) => {
  $('#tablePemasukan').find('tbody .rowCheckbox').prop('checked', e.target.checked);
});


// ========================
// ✅ DELETE SELECTED
// ========================
document.getElementById("deleteSelectedBtn").addEventListener("click", async () => {
  const selectedIds = $('#tablePemasukan').find('tbody .rowCheckbox:checked').map(function() {
    return this.value;
  }).get();
  if (selectedIds.length === 0) return Swal.fire("Pilih data yang akan dihapus!", "", "warning");

  const res = await Swal.fire({
    title: "Hapus data terpilih?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya"
  });

  if (res.isConfirmed) {
    for (const id of selectedIds) {
      await deleteDoc(doc(db, "pemasukan", id));
    }
    // Tidak perlu panggil loadDataRealtime, onSnapshot otomatis reload tabel

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Data terhapus",
      showConfirmButton: false,
      timer: 2000
    });
  }
});


// ========================
// ✅ EXPORT TO EXCEL
// ========================
document.getElementById("exportExcelBtn").addEventListener("click", async () => {
  const selectedIds = [...document.querySelectorAll(".rowCheckbox:checked")].map(cb => cb.value);
  if (selectedIds.length === 0) {
    Swal.fire("Pilih data yang akan di-export!", "", "warning");
    return;
  }

  const result = await Swal.fire({
    title: `Export ${selectedIds.length} data ke Excel?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Export",
    cancelButtonText: "Batal"
  });

  if (!result.isConfirmed) return;

  const rows = [["No", "Nama", "Qty", "Nominal", "User", "Tanggal & Waktu"]];
  const promises = selectedIds.map(id => getDoc(doc(db, "pemasukan", id)));
  const docs = await Promise.all(promises);

  docs.forEach((docSnap, idx) => {
    if (docSnap.exists()) {
      const d = docSnap.data();
      rows.push([
        String(idx + 1), // pastikan string agar style bisa diterapkan
        capitalizeWords(d.keterangan || "-"),
        String(d.kuantitas || "-"),
        "Rp " + parseInt(d.jumlah || 0).toLocaleString(),
        formatUploader(d.uploader),
        d.tanggal || "-"
      ]);
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set style rata kiri untuk semua cell
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cell_address]) continue;
      ws[cell_address].s = { alignment: { horizontal: "left" } };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pemasukan");

  XLSX.writeFile(wb, `Pemasukan_Selected.xlsx`);

  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: "File berhasil dibuat",
    showConfirmButton: false,
    timer: 2000
  });
});

// ========================
// ✅ SEARCH DENGAN SWEETALERT
// ========================
document.getElementById("searchBtn").addEventListener("click", () => {
  Swal.fire({
    title: "Cari Data",
    html: '<input id="swal-input1" class="swal2-input" placeholder="Ketik kata kunci...">',
    showCloseButton: true,
    showCancelButton: false,
    showConfirmButton: false,
    didOpen: () => {
      const input = Swal.getPopup().querySelector('#swal-input1');
      input.focus();
      input.value = table.search();
      input.dispatchEvent(new Event('input'));
      input.addEventListener('input', (e) => {
        table.search(e.target.value).draw();
      });
    }
  });
});

// ========================
// ✅ FORM SUBMIT
// ========================
document.getElementById("pemasukanForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const keterangan = document.getElementById("keterangan").value.trim();
  const kuantitas = parseInt(document.getElementById("kuantitas").value.trim());
  const jumlah = parseInt(document.getElementById("jumlah").value.trim());

  const now = new Date();
  const tanggal = `${String(now.getDate()).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  const uploader = auth.currentUser?.email || "-";

  try {
    await addDoc(collection(db, "pemasukan"), { keterangan, kuantitas, jumlah, tanggal, uploader });
    e.target.reset();

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Data berhasil ditambahkan!',
      showConfirmButton: false,
      timer: 2000
    });

    // Tidak perlu panggil loadDataRealtime, onSnapshot otomatis reload tabel

  } catch (err) {
    console.error("❌ Gagal tambah data:", err);
    Swal.fire("Error", "Gagal menambahkan data.", "error");
  }
});


// ========================
// ✅ LOAD PERTAMA KALI
// ========================
// ✅ Load realtime di awal
loadDataRealtime();
