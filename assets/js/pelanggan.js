// /assets/js/pelanggan.js
import { db, auth } from "./firebase-init.js";
import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import "./navbar.js";
import "./invoice.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";

// 🔑 Pastikan user login
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    loadPelanggan();
  }
});

// 🔄 Load data pelanggan dari Firestore
export async function loadPelanggan() {
  console.log("🚀 Memuat data pelanggan...");
  const tbody = document.getElementById("pelangganTable");
  if (!tbody) {
    console.error("❌ tbody #pelangganTable tidak ditemukan!");
    return;
  }

  tbody.innerHTML = `<tr><td colspan="5">Memuat data...</td></tr>`;

  const snapshot = await getDocs(collection(db, "pelanggan"));

  if (snapshot.empty) {
    tbody.innerHTML = `<tr><td colspan="5">Belum ada data pelanggan.</td></tr>`;
    return;
  }

  tbody.innerHTML = ""; // Kosongkan lagi kalau ada data
  let no = 1;

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const alamatLengkap = `${data.alamat}, RT ${data.rt}/RW ${data.rw}, ${data.kelurahan}, ${data.kecamatan}, ${data.kabupaten}, ${data.provinsi}, ${data.kodepos}`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${no++}</td>
      <td class="text-start align-middle">${data.nama}</td>
      <td><span class="badge bg-success">${data.paket}</span></td>
      <td><textarea class="form-control small-textarea" readonly>${alamatLengkap}</textarea></td>
      <td class="text-nowrap">
        <button class="btn btn-primary btn-sm me-1" onclick="generateInvoice('${data.nama}', '${data.paket}', \`${alamatLengkap}\`, '${data.kode_pelanggan}', ${data.nominal}, '${data.tglPemasangan}')"><i class="fa-solid fa-file-pdf"></i></button>
        <button class="btn btn-danger btn-sm" onclick="hapusPelanggan('${docSnap.id}')"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 🗑️ Hapus pelanggan
window.hapusPelanggan = async function (id) {
  const confirm = await Swal.fire({
    title: 'Hapus pelanggan?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, Hapus'
  });
  if (confirm.isConfirmed) {
    await deleteDoc(doc(db, "pelanggan", id));
    Swal.fire("Dihapus!", "Data pelanggan berhasil dihapus.", "success");
    loadPelanggan();
  }
};
