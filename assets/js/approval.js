// ✅ approval.js FINAL
import { db, auth } from './firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { collection, getDocs, doc, deleteDoc, addDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import './navbar.js'; // pastikan navbar.js sudah expose <my-navbar> dan logout()

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      loadData().catch(err => {
        console.error("[LOAD ERROR]", err);
        Swal.fire("Gagal memuat data!", err.message, "error");
      });
    }
  });
});

async function loadData() {
  const tbody = document.getElementById("approvalTable");
  tbody.innerHTML = `<tr><td colspan="5">Memuat data...</td></tr>`;

  const snapshot = await getDocs(collection(db, "registrasi_wifi"));

  if (snapshot.empty) {
    tbody.innerHTML = `<tr><td colspan="5">Tidak ada data registrasi.</td></tr>`;
    return;
  }

  tbody.innerHTML = ""; // bersihkan

  let no = 1;
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const alamatLengkap = `${data.alamat}, RT ${data.rt}/RW ${data.rw}, ${data.kelurahan}, ${data.kecamatan}, Kode Pos ${data.kodepos}`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${no++}</td>
      <td>${data.nama}</td>
      <td><span class="badge bg-success">${data.paket}</span></td>
      <td><textarea class="form-control small-textarea" rows="1" readonly>${alamatLengkap}</textarea></td>
      <td>
        <button class="btn btn-success btn-sm me-2 approve-btn" data-id="${docSnap.id}" title="Setujui"><i class="fa-solid fa-circle-check"></i></button>
        <button class="btn btn-danger btn-sm decline-btn" data-id="${docSnap.id}" title="Tolak"><i class="fa-solid fa-circle-xmark"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Bind buttons
  tbody.querySelectorAll('.approve-btn').forEach(btn => {
    btn.addEventListener('click', () => handleApproval(btn.dataset.id));
  });
  tbody.querySelectorAll('.decline-btn').forEach(btn => {
    btn.addEventListener('click', () => handleDecline(btn.dataset.id));
  });
}

async function handleApproval(id) {
  try {
    const docRef = doc(db, "registrasi_wifi", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return Swal.fire("Data tidak ditemukan", "", "error");

    const data = docSnap.data();

    const confirm = await Swal.fire({
      title: 'Setujui Registrasi?',
      html: `<b>${data.nama}</b><br>${data.paket}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Setujui'
    });

    if (confirm.isConfirmed) {
      const pelangganSnapshot = await getDocs(collection(db, "pelanggan"));
      const nextKode = (pelangganSnapshot.size + 1).toString().padStart(5, '0');

      await addDoc(collection(db, "pelanggan"), {
        ...data,
        kode_pelanggan: nextKode
      });

      await deleteDoc(docRef);

      Swal.fire("Disetujui!", `${data.nama} telah ditambahkan.<br>Kode Pelanggan: ${nextKode}`, "success");
      await loadData();
    }
  } catch (err) {
    console.error("[APPROVAL ERROR]", err);
    Swal.fire("Gagal!", err.message, "error");
  }
}

async function handleDecline(id) {
  try {
    const docRef = doc(db, "registrasi_wifi", id);
    const confirm = await Swal.fire({
      title: 'Tolak Registrasi?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Tolak'
    });
    if (confirm.isConfirmed) {
      await deleteDoc(docRef);
      Swal.fire("Ditolak!", "Permintaan telah ditolak.", "success");
      await loadData();
    }
  } catch (err) {
    console.error("[DECLINE ERROR]", err);
    Swal.fire("Gagal!", err.message, "error");
  }
}
