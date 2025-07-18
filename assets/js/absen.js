// absen.js
import { db, auth } from './firebase-init.js';
import {
  collection, addDoc, Timestamp, onSnapshot, query, orderBy, deleteDoc, doc
} from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js';
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";
import './navbar.js';

// Format tanggal dd-mm-yyyy (string)
function formatTanggalStr(dateObj) {
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// Parse tanggal input (yyyy-mm-dd) jadi Date object
function parseTanggalInput(str) {
  const [yyyy, mm, dd] = str.split('-');
  return new Date(`${yyyy}-${mm}-${dd}`);
}

const tanggalInput = document.getElementById('tanggal');
const namaInput = document.getElementById('nama');
const absenForm = document.getElementById('absenForm');
const tableBody = document.querySelector('#tabelAbsen tbody');
const selectAllCheckbox = document.getElementById('selectAll');
const pageLengthSelect = document.getElementById('pageLengthSelect');
const searchBtn = document.getElementById('searchBtn');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');

let dataTable;
const absenCol = collection(db, "absen");

let currentUserName = '';
const today = new Date();
const todayISO = today.toISOString().split('T')[0];
tanggalInput.value = todayISO;
tanggalInput.max = todayISO;

// Auto isi nama dari user login
onAuthStateChanged(auth, user => {
  if (user) {
    currentUserName = capitalize(user.email.split('@')[0]);
    namaInput.value = currentUserName;
  } else {
    currentUserName = '';
    namaInput.value = '';
  }
});

// Fungsi capitalize huruf awal
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Submit form absen
absenForm.addEventListener('submit', async e => {
  e.preventDefault();
  const nama = namaInput.value.trim();
  const kegiatan = absenForm.querySelector('input[name="kegiatan"]:checked');
  if (!kegiatan) {
    return Swal.fire("Oops", "Silakan pilih jenis pekerjaan!", "warning");
  }
  const tanggalRaw = parseTanggalInput(tanggalInput.value);
  const tanggalFormatted = formatTanggalStr(tanggalRaw);

  try {
    await addDoc(absenCol, {
      nama,
      kegiatan: kegiatan.value,
      tanggal: tanggalFormatted,
      timestamp: Timestamp.now(),
      keterangan: "Hadir"
    });

    Swal.fire("Berhasil", "Absen berhasil disimpan!", "success");
    absenForm.reset();
    namaInput.value = currentUserName;
    tanggalInput.value = todayISO;
  } catch (err) {
    console.error("Gagal simpan absen:", err);
    Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan absen.", "error");
  }
});

// Load data realtime dan render DataTable
function loadDataAbsen() {
  const q = query(absenCol, orderBy("timestamp", "desc"));

  onSnapshot(q, snapshot => {
    let html = '';
    let no = 1;
    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      const id = docSnap.id;
      const tanggalInputStr = d.timestamp ? formatTanggalStr(d.timestamp.toDate()) : '-';

      html += `
        <tr data-id="${id}">
          <td>${no++}</td>
          <td>${d.nama}</td>
          <td>${d.kegiatan}</td>
          <td>${d.tanggal}</td>
          <td>${tanggalInputStr}</td>
          <td><input type="checkbox" class="checkbox-item" data-id="${id}"></td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;

    if (dataTable) {
      dataTable.destroy();
    }

    dataTable = new DataTable('#tabelAbsen', {
      responsive: true,
      autoWidth: false,
      pageLength: parseInt(pageLengthSelect.value),
      language: {
        emptyTable: "Belum ada data absen",
        search: "",
        lengthMenu: "Tampilkan _MENU_ data",
        info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
        paginate: {
          first: "Awal",
          last: "Akhir",
          next: "›",
          previous: "‹"
        }
      },
      dom: 'rtp'
    });

    // Reset selectAll checkbox
    selectAllCheckbox.checked = false;
  });
}

loadDataAbsen();

// Select All checkbox behavior
selectAllCheckbox.addEventListener('change', () => {
  const allCheckboxes = document.querySelectorAll('.checkbox-item');
  allCheckboxes.forEach(cb => {
    cb.checked = selectAllCheckbox.checked;
  });
});

// Change page length
pageLengthSelect.addEventListener('change', () => {
  if (dataTable) {
    dataTable.page.len(parseInt(pageLengthSelect.value)).draw();
  }
});

// Search realtime via Swal input dengan event input realtime
searchBtn.addEventListener('click', () => {
  Swal.fire({
    title: 'Cari Nama, Kegiatan, atau Tanggal',
    html: `<input type="text" id="swalInput" class="swal2-input" placeholder="Masukkan kata kunci pencarian...">`,
    showCancelButton: true,
    focusConfirm: false,
    didOpen: () => {
      const input = Swal.getPopup().querySelector('#swalInput');
      input.focus();

      // Ketika user ketik langsung search dan refresh table
      input.addEventListener('input', () => {
        const keyword = input.value.trim();
        if (dataTable) {
          dataTable.search(keyword).draw();
        }
      });
    },
    preConfirm: () => {
      const input = Swal.getPopup().querySelector('#swalInput');
      return input.value.trim();
    }
  });
});

// Delete selected data realtime
deleteSelectedBtn.addEventListener('click', async () => {
  const selectedCheckboxes = document.querySelectorAll('.checkbox-item:checked');
  if (selectedCheckboxes.length === 0) {
    return Swal.fire("Tidak ada data terpilih", "", "info");
  }
  const jumlah = selectedCheckboxes.length;

  const confirmResult = await Swal.fire({
    title: `Hapus ${jumlah} data?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal"
  });

  if (!confirmResult.isConfirmed) return;

  try {
    const hapusPromises = [];
    selectedCheckboxes.forEach(cb => {
      const id = cb.getAttribute('data-id');
      if (id) {
        hapusPromises.push(deleteDoc(doc(db, "absen", id)));
      }
    });
    await Promise.all(hapusPromises);
    Swal.fire("Dihapus!", `${jumlah} data berhasil dihapus.`, "success");
  } catch (err) {
    console.error("Gagal hapus data:", err);
    Swal.fire("Gagal", "Terjadi kesalahan saat menghapus data.", "error");
  }
});

// Export Excel hanya data yang dipilih
exportExcelBtn.addEventListener('click', () => {
  const selectedCheckboxes = document.querySelectorAll('.checkbox-item:checked');
  if (selectedCheckboxes.length === 0) {
    return Swal.fire("Tidak ada data terpilih untuk diexport", "", "info");
  }

  // Buat array data export
  const exportData = [];
  exportData.push(["No", "Nama", "Kegiatan", "Tanggal Absen", "Tanggal Input"]);

  let no = 1;
  selectedCheckboxes.forEach(cb => {
    const tr = cb.closest('tr');
    const cols = tr.querySelectorAll('td');
    exportData.push([
      no++,
      cols[1].textContent.trim(),
      cols[2].textContent.trim(),
      cols[3].textContent.trim(),
      cols[4].textContent.trim()
    ]);
  });

  // Buat worksheet dan workbook XLSX
  const ws = XLSX.utils.aoa_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Absen");

  // Simpan file Excel dengan nama absen_TIMESTAMP.xlsx
  XLSX.writeFile(wb, `absen_${Date.now()}.xlsx`);
});
