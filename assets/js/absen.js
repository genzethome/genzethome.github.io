import "./navbar.js";
import { db, auth } from './firebase-init.js';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js';

const absenForm = document.getElementById('absenForm');
const usernameInput = document.getElementById('username');
const tanggalInput = document.getElementById('tanggal');
const keteranganInput = document.getElementById('keterangan');
const kegiatanInputs = document.getElementsByName('kegiatan');
const tableBody = document.getElementById('absenBody');
const pageLengthSelect = document.getElementById('pageLengthSelect');

let currentUserName = '';

// ✅ Atur tanggal default hari ini
function setTodayToDateInput() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  tanggalInput.value = todayStr;
  tanggalInput.max = todayStr;
}
setTodayToDateInput();

// ✅ Cek login user dan load data
onAuthStateChanged(auth, (user) => {
  if (user) {
    const email = user.email || '';
    const displayName = email.split('@')[0];
    currentUserName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    usernameInput.value = currentUserName;
    loadAbsen();
  } else {
    window.location.href = 'login.html';
  }
});

// ✅ Submit form absen
absenForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const tanggal = tanggalInput.value;
  const keterangan = keteranganInput.value.trim();
  const kegiatan = [...kegiatanInputs].find(i => i.checked)?.value;

  if (!tanggal || !keterangan || !kegiatan) {
    return Swal.fire('Oops!', 'Lengkapi semua form!', 'warning');
  }

  try {
    await addDoc(collection(db, 'absen'), {
      nama: currentUserName,
      tanggal,
      keterangan,
      kegiatan,
      waktu: Timestamp.now(),
    });

    Swal.fire('Berhasil!', 'Absen berhasil disimpan.', 'success');
    absenForm.reset();
    usernameInput.value = currentUserName;
    setTodayToDateInput(); // Reset tanggal
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
});

// ✅ Format waktu input
function formatWaktu(timestamp) {
  const date = timestamp?.toDate?.();
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// ✅ Format tanggal dari yyyy-mm-dd ke dd-mm-yyyy
function formatTanggalYYYYMMDD(str) {
  if (!str || typeof str !== 'string') return '-';
  const [y, m, d] = str.split('-');
  return `${d}-${m}-${y}`;
}

// ✅ Realtime load absen
// ... import tetap sama ...

function loadAbsen() {
  const q = query(collection(db, 'absen'), orderBy('waktu', 'desc'));
  onSnapshot(q, (snapshot) => {
    tableBody.innerHTML = '';

    snapshot.forEach((docItem) => {
      const data = docItem.data();
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td></td> <!-- Kosong dulu, nanti diisi DataTables -->
        <td>${data.nama}</td>
        <td>${data.kegiatan}</td>
        <td>
          <textarea class="form-control small-textarea" readonly>${data.keterangan}</textarea>
        </td>
        <td>${formatTanggalYYYYMMDD(data.tanggal)}</td>
        <td>${formatWaktu(data.waktu)}</td>
        <td><input type="checkbox" data-id="${docItem.id}" /></td>
      `;

      tableBody.appendChild(tr);
    });

    // ✅ Refresh atau inisialisasi DataTable ulang
    if ($.fn.DataTable.isDataTable('#tabelAbsen')) {
      $('#tabelAbsen').DataTable().destroy();
    }

    const table = $('#tabelAbsen').DataTable({
      pageLength: parseInt(pageLengthSelect.value),
      columnDefs: [
        { orderable: false, targets: 0 } // Kolom No tidak bisa di-sort
      ],
      order: [] // Tidak ada sort default
    });

    // ✅ Update isi kolom No tiap kali table berubah (filter, sort, paging)
    table.on('order.dt search.dt draw.dt', function () {
      table.column(0, { search: 'applied', order: 'applied', page: 'current' })
        .nodes().each((cell, i) => {
          cell.innerHTML = i + 1;
        });
    }).draw();
  });
}

// ✅ Select All Checkbox Logic
const selectAllCheckbox = document.getElementById('selectAll');
selectAllCheckbox.addEventListener('change', () => {
  const checkboxes = document.querySelectorAll('#absenBody input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
});

// ✅ Hapus data yang dicentang
const deleteBtn = document.getElementById('deleteSelectedBtn');
deleteBtn.addEventListener('click', async () => {
  const checkedBoxes = document.querySelectorAll('#absenBody input[type="checkbox"]:checked');

  if (checkedBoxes.length === 0) {
    return Swal.fire('Tidak ada data', 'Pilih data yang ingin dihapus.', 'info');
  }

  const konfirmasi = await Swal.fire({
    title: 'Yakin ingin hapus?',
    text: `${checkedBoxes.length} data akan dihapus secara permanen!`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, hapus',
    cancelButtonText: 'Batal'
  });

  if (!konfirmasi.isConfirmed) return;

  const hapusPromises = [];

  checkedBoxes.forEach(cb => {
    const docId = cb.dataset.id;
    if (docId) {
      const docRef = doc(db, 'absen', docId);
      hapusPromises.push(deleteDoc(docRef));
    }
  });

  try {
    await Promise.all(hapusPromises);
    Swal.fire('Berhasil', `${hapusPromises.length} data dihapus.`, 'success');
    selectAllCheckbox.checked = false; // reset centang semua
  } catch (err) {
    Swal.fire('Error', 'Gagal menghapus data.', 'error');
  }
});

// ✅ Export data terpilih ke Excel
const exportBtn = document.getElementById('exportExcelBtn');
exportBtn.addEventListener('click', () => {
  const checkedBoxes = document.querySelectorAll('#absenBody input[type="checkbox"]:checked');

  if (checkedBoxes.length === 0) {
    return Swal.fire('Tidak ada data', 'Pilih data yang ingin diekspor.', 'info');
  }

  const data = [];

  checkedBoxes.forEach(cb => {
    const row = cb.closest('tr');
    const rowData = {
      No: row.children[1].textContent,
      Nama: row.children[2].textContent,
      Kegiatan: row.children[3].textContent,
      Jam: row.children[4].textContent,
      Tanggal: row.children[5].textContent,
    };
    data.push(rowData);
  });

  // Buat worksheet dan workbook
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Absen Terpilih");

  // Simpan ke file Excel
  XLSX.writeFile(workbook, "absen_terpilih.xlsx");

  Swal.fire('Berhasil', `${data.length} data berhasil diexport ke Excel.`, 'success');
});

// ✅ Search Realtime SweetAlert2
document.getElementById('searchIcon').addEventListener('click', () => {
  Swal.fire({
    title: 'Cari Absen',
    input: 'text',
    inputPlaceholder: 'Ketik untuk mencari...',
    inputAttributes: {
      autocapitalize: 'off',
      autocorrect: 'off',
    },
    showCancelButton: true,
    cancelButtonText: 'Tutup',
    showConfirmButton: false,
    didOpen: () => {
      const input = Swal.getInput();

      input.addEventListener('input', () => {
        const keyword = input.value.toLowerCase();
        const rows = document.querySelectorAll('#absenBody tr');

        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          row.style.display = text.includes(keyword) ? '' : 'none';
        });
      });
    },
  });
});




// ✅ Update panjang halaman jika dropdown berubah
pageLengthSelect.addEventListener('change', () => {
  $('#tabelAbsen').DataTable().page.len(parseInt(pageLengthSelect.value)).draw();
});
