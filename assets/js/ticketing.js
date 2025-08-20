// ========================
//  IMPORT FIREBASE
// ========================
import { db, auth } from "./firebase-init.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";  // 🔥 sesuaikan versi
import {
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";        // 🔥 sesuaikan versi

// ========================
//  KONFIGURASI
// ========================
const ALLOWED_EMAILS = ["firzi@genzet.com", "abizar@genzet.com"];
const TEKNISI = [
  { name: "abi", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTCxmava22M50RykJabRdl8BmYtv7NVQtNcd94AS9OC2x_CEKUNjjNGzwSuyamPprP2Ok&usqp=CAU" },
  { name: "baruna", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTCxmava22M50RykJabRdl8BmYtv7NVQtNcd94AS9OC2x_CEKUNjjNGzwSuyamPprP2Ok&usqp=CAU" },
  { name: "firzi", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTCxmava22M50RykJabRdl8BmYtv7NVQtNcd94AS9OC2x_CEKUNjjNGzwSuyamPprP2Ok&usqp=CAU" },
  { name: "jerry", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTCxmava22M50RykJabRdl8BmYtv7NVQtNcd94AS9OC2x_CEKUNjjNGzwSuyamPprP2Ok&usqp=CAU" },
  { name: "mahija", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTCxmava22M50RykJabRdl8BmYtv7NVQtNcd94AS9OC2x_CEKUNjjNGzwSuyamPprP2Ok&usqp=CAU" },
  { name: "maulana", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTCxmava22M50RykJabRdl8BmYtv7NVQtNcd94AS9OC2x_CEKUNjjNGzwSuyamPprP2Ok&usqp=CAU" },
  { name: "yuda", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTCxmava22M50RykJabRdl8BmYtv7NVQtNcd94AS9OC2x_CEKUNjjNGzwSuyamPprP2Ok&usqp=CAU" },
  { name: "zahdan", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTCxmava22M50RykJabRdl8BmYtv7NVQtNcd94AS9OC2x_CEKUNjjNGzwSuyamPprP2Ok&usqp=CAU" },
];

// ========================
//  HELPER FUNCTIONS
// ========================
const kapitalAwal = (str) => str.charAt(0).toUpperCase() + str.slice(1);

function renderTechnicianCards(container) {
  container.innerHTML = "";
  TEKNISI.forEach((t) => {
    const displayName = kapitalAwal(t.name);

    const card = document.createElement("div");
    card.className = "tech-card";
    card.dataset.value = displayName;
    card.innerHTML = `
      <img src="${t.img}" alt="${displayName}">
      <div>${displayName}</div>
    `;

    card.addEventListener("click", () => {
      card.classList.toggle("selected");
    });

    container.appendChild(card);
  });
}

function getSelectedTechnicians() {
  return Array.from(document.querySelectorAll(".tech-card.selected"))
    .map((el) => el.dataset.value);
}

function validateTimeRange(start, end) {
  if (!start || !end) return false;
  return new Date(end) > new Date(start);
}

// ========================
//  DOM ELEMENTS
// ========================
const pageContent = document.getElementById("pageContent");
const techListDiv = document.getElementById("techniciansList");
const form = document.getElementById("ticketForm");
const pelangganSelect = document.getElementById("pelanggan"); // dropdown pelanggan

// ========================
//  FIRESTORE: LOAD PELANGGAN
// ========================

async function loadPelanggan() {
  console.log("🔍 loadPelanggan() dipanggil...");
  console.log("📦 db object:", db);

  try {
    if (!db || typeof db !== "object") {
      console.error("❌ db tidak valid:", db);
      return;
    }

    const pelangganRef = collection(db, "pelanggan");
    console.log("📂 Ref pelanggan:", pelangganRef);

    const snapshot = await getDocs(pelangganRef);
    console.log("📸 Jumlah dokumen:", snapshot.size);

    if (snapshot.empty) {
      console.warn("⚠️ Collection pelanggan kosong!");
      pelangganSelect.innerHTML = `<option value="">-- Tidak ada pelanggan --</option>`;
      return;
    }

    pelangganSelect.innerHTML = `<option value="">-- Pilih Pelanggan --</option>`;
    snapshot.forEach((doc) => {
      console.log("📄 Data pelanggan:", doc.id, doc.data());
      const data = doc.data();
      const opt = document.createElement("option");
      opt.value = doc.id;
      opt.textContent = data.nama || `Pelanggan ${doc.id}`;
      pelangganSelect.appendChild(opt);
    });

    console.log("✅ Data pelanggan berhasil dimuat ke dropdown");
  } catch (err) {
    console.error("🔥 Error ambil pelanggan:", err);
    Swal.fire("Error", "Gagal memuat data pelanggan.", "error");
  }
}




// ========================
//  AUTH GUARD
// ========================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    Swal.fire("Akses Ditolak", "Silakan login dulu.", "error");
    return;
  }

  if (!ALLOWED_EMAILS.includes(user.email)) {
    Swal.fire("Akses Ditolak", "Anda tidak memiliki akses Ticketing.", "warning");
    return;
  }

  // Render konten hanya untuk user yang diizinkan
  pageContent.style.display = "";
  renderTechnicianCards(techListDiv);
  loadPelanggan();
});

// ========================
//  FORM SUBMIT
// ========================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const selected = getSelectedTechnicians();
  const pelanggan = pelangganSelect.value;
  const problem = document.getElementById("problemDesc").value.trim();
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;

  if (!pelanggan) {
    Swal.fire("Oops!", "Pelanggan wajib dipilih.", "warning");
    return;
  }

  if (!problem) {
    Swal.fire("Oops!", "Deskripsi problem wajib diisi.", "warning");
    return;
  }

  if (selected.length === 0) {
    Swal.fire("Oops!", "Pilih minimal satu teknisi.", "warning");
    return;
  }

  if (!validateTimeRange(startTime, endTime)) {
    Swal.fire("Oops!", "Waktu selesai harus lebih besar dari waktu mulai.", "warning");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    Swal.fire("Error!", "Sesi login tidak ditemukan.", "error");
    return;
  }

  try {
    await addDoc(collection(db, "tickets"), {
      createdBy: user.email,
      pelanggan, // simpan id pelanggan
      problem,
      technicians: selected,
      startTime,
      endTime,
      createdAt: serverTimestamp(),
    });

    Swal.fire("Berhasil!", "Ticket berhasil dibuat.", "success");
    form.reset();
    document.querySelectorAll(".tech-card.selected")
      .forEach((el) => el.classList.remove("selected"));
  } catch (err) {
    console.error("Gagal menambah ticket:", err);
    Swal.fire("Gagal!", err.message || "Terjadi kesalahan.", "error");
  }
});
