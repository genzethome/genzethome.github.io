// /assets/js/freepass.js
import { db, auth } from './firebase-init.js';
import "./navbar.js";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// ✅ DOM
const tbody = document.querySelector("#tableFreepass tbody");
const totalEl = document.getElementById("totalFreepass");
let table;

// ✅ Cek Login
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "login.html";
});

// ✅ Utils
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

// ✅ Load Data
async function loadData() {
  const snapshot = await getDocs(collection(db, "freepass"));
  tbody.innerHTML = "";
  let total = 0;

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
        <td data-order="${parseInt(d.jumlah || 0)}">${parseInt(d.jumlah || 0).toLocaleString()} Mbps</td>
        <td>${formatUploader(d.uploader)}</td>
        <td data-order="${isoDate}">${d.tanggal || "-"}</td>
        <td><input type="checkbox" class="rowCheckbox" value="${docSnap.id}"></td>
      </tr>
    `;
  });

  totalEl.textContent = total.toLocaleString() + " Mbps";

  if (table) table.destroy();

  table = $('#tableFreepass').DataTable({
    dom: 'rtip',
    lengthChange: false,
    pageLength: parseInt(document.getElementById("pageLengthSelect").value),
    order: [[4, 'desc']],
    columnDefs: [
      { targets: 0, searchable: false, orderable: false },
      { targets: 2, type: "num" }
    ]
  });

  table.on('order.dt search.dt', function () {
    table.column(0, { search: 'applied', order: 'applied' }).nodes().each(function (cell, i) {
      cell.innerHTML = i + 1;
    });
  }).draw();

  const tooltips = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltips.map(el => new bootstrap.Tooltip(el));
}

// ✅ Page Length
document.getElementById("pageLengthSelect").addEventListener("change", () => {
  table.page.len(parseInt(document.getElementById("pageLengthSelect").value)).draw();
});

// ✅ Select All
document.getElementById("selectAll").addEventListener("change", (e) => {
  document.querySelectorAll(".rowCheckbox").forEach(cb => cb.checked = e.target.checked);
});

// ✅ Delete Selected
document.getElementById("deleteSelectedBtn").addEventListener("click", async () => {
  const selectedIds = [...document.querySelectorAll(".rowCheckbox:checked")].map(cb => cb.value);
  if (selectedIds.length === 0) return Swal.fire("Pilih data yang akan dihapus!", "", "warning");
  const res = await Swal.fire({ title: "Hapus data terpilih?", icon: "warning", showCancelButton: true, confirmButtonText: "Ya" });
  if (res.isConfirmed) {
    for (const id of selectedIds) await deleteDoc(doc(db, "freepass", id));
    await loadData();
    Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Data terhapus", showConfirmButton: false, timer: 2000 });
  }
});

// ✅ Export Selected to Excel
document.getElementById("exportExcelBtn").addEventListener("click", async () => {
  const selected = [...document.querySelectorAll(".rowCheckbox:checked")].map(cb => cb.closest("tr"));
  if (selected.length === 0) {
    Swal.fire("Pilih data yang akan di-export!", "", "warning");
    return;
  }

  const result = await Swal.fire({
    title: `Export ${selected.length} data ke Excel?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Export",
    cancelButtonText: "Batal"
  });

  if (!result.isConfirmed) return;

  const rows = [["No", "Nama", "Mbps", "User", "Tanggal & Waktu"]];
  selected.forEach((row, idx) => {
    const cells = row.querySelectorAll("td");
    rows.push([
      idx + 1,
      cells[1].innerText,
      cells[2].innerText,
      cells[3].innerText,
      cells[4].innerText
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Freepass");

  XLSX.writeFile(wb, `Freepass_Selected.xlsx`);

  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: "File berhasil dibuat",
    showConfirmButton: false,
    timer: 2000
  });
});

// ✅ Search
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

// ✅ Form Submit
document.getElementById("freepassForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const keterangan = document.getElementById("keterangan").value.trim();
  const jumlah = parseInt(document.getElementById("jumlah").value.trim()) || 20; // default 20 jika kosong
  const now = new Date();
  const tanggal = `${String(now.getDate()).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  const uploader = auth.currentUser?.email || "-";
  await addDoc(collection(db, "freepass"), { keterangan, jumlah, tanggal, uploader });
  e.target.reset();
  await loadData();
  Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Data berhasil ditambahkan!', showConfirmButton: false, timer: 2000 });
});

// ✅ Load di awal
loadData();
