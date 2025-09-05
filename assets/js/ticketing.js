  // ========================
  //  IMPORT FIREBASE
  // ========================
  import { db, auth } from "./firebase-init.js";
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
    updateDoc
  } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
  import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

  // ========================
  //  KONFIGURASI
  // ========================
  const ALLOWED_EMAILS = ["firzi@genzet.com", "abizar@genzet.com"];
  const TEKNISI = [
    { name: "abizar", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTCxmava22M50RykJabRdl8BmYtv7NVQtNcd94AS9OC2x_CEKUNjjNGzwSuyamPprP2Ok&usqp=CAU" },
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

  // ========================
  //  DATE FORMAT HELPERS
  // ========================
  function formatDateDDMMYY(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }

  function validateTimeRange(start, end) {
    if (!start || !end) return false;

    const [sd, sm, sy] = start.split("/");
    const [ed, em, ey] = end.split("/");

    const startDate = new Date(`20${sy}`, sm-1, sd);
    const endDate = new Date(`20${ey}`, em-1, ed);

    return endDate > startDate;
  }

  // ========================
  //  DOM ELEMENTS
  // ========================
  const pageContent = document.getElementById("pageContent");
  const techListDiv = document.getElementById("techniciansList");
  const form = document.getElementById("ticketForm");
  const pelangganSelect = document.getElementById("pelanggan");
  const ticketNumberInput = document.getElementById("ticketNumber");

  // ========================
  //  FIRESTORE: LOAD PELANGGAN
  // ========================
  async function loadPelanggan() {
    try {
      const pelangganRef = collection(db, "pelanggan");
      const snapshot = await getDocs(pelangganRef);

      if (snapshot.empty) {
        pelangganSelect.innerHTML = `<option value="">Tidak ada pelanggan</option>`;
        return;
      }

      pelangganSelect.innerHTML = `<option value="">Pilih Pelanggan</option>`;
      snapshot.forEach((doc) => {
        const data = doc.data();
        const opt = document.createElement("option");
        opt.value = doc.id;
        opt.textContent = data.nama || `Pelanggan ${doc.id}`;
        pelangganSelect.appendChild(opt);
      });
    } catch (err) {
      console.error("🔥 Error ambil pelanggan:", err);
      Swal.fire("Error", "Gagal memuat data pelanggan.", "error");
    }
  }

  // ========================
  //  FIRESTORE: GET NEXT TICKET NUMBER
  // ========================
  async function updateTicketNumber() {
    const ticketsRef = collection(db, "tickets");
    try {
      const q = query(ticketsRef, orderBy("ticketNumber", "desc"), limit(1));
      const snapshot = await getDocs(q);

      let nextNumber = 1;
      if (!snapshot.empty) {
        const lastTicket = snapshot.docs[0].data();
        nextNumber = lastTicket.ticketNumber + 1;
      }

      ticketNumberInput.value = `#${nextNumber}`;
      return nextNumber;
    } catch (err) {
      console.error("Gagal ambil ticket terakhir:", err);
      ticketNumberInput.value = "#?";
      return 1;
    }
  }

  // ========================
  //  AUTH GUARD
  // ========================
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      Swal.fire("Akses Ditolak", "Silakan login dulu.", "error");
      return;
    }
    if (!ALLOWED_EMAILS.includes(user.email)) {
      Swal.fire("Akses Ditolak", "Anda tidak memiliki akses Ticketing.", "warning");
      return;
    }

    pageContent.style.display = "";
    renderTechnicianCards(techListDiv);
    await loadPelanggan();
    await updateTicketNumber();
  });


// ========================
//  DOM ELEMENT UNTUK OUTPUT <pre> + BUTTON SALIN
// ========================
const outputContainer = document.createElement("div");
outputContainer.style.position = "relative";
outputContainer.style.marginTop = "1rem";

// Buat <pre>
const outputPre = document.createElement("pre");
outputPre.style.background = "#f8f9fa";
outputPre.style.padding = "1rem";
outputPre.style.borderRadius = "0.5rem";
outputPre.style.whiteSpace = "pre"; // wrap teks jika panjang
outputPre.style.display = "none"; // hide awal

// tombol salin
const copyBtn = document.createElement("button");
copyBtn.innerHTML = `<i class="fa-solid fa-copy"></i>`;
copyBtn.style.position = "absolute";
copyBtn.style.top = "0.5rem";
copyBtn.style.right = "0.5rem";
copyBtn.className = "btn btn-sm btn-outline-secondary";
copyBtn.title = "Salin ke clipboard";
copyBtn.style.display = "none"; // hide awal
copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(outputPre.textContent)
    .then(() => Swal.fire("Berhasil!", "Teks disalin ke clipboard.", "success"))
    .catch(() => Swal.fire("Gagal!", "Gagal menyalin teks.", "error"));
});

outputContainer.appendChild(outputPre);
outputContainer.appendChild(copyBtn);

// pasang ke bawah form
form.parentElement.appendChild(outputContainer);

// ========================
//  DATE FORMAT HELPERS (HARI, DD/MM/YYYY)
// ========================
function formatDateWithDay(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const days = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const dayName = days[d.getDay()];
  const day = String(d.getDate()).padStart(2,"0");
  const month = String(d.getMonth()+1).padStart(2,"0");
  const year = d.getFullYear();
  return `${dayName}, ${day}/${month}/${year}`;
}

// ========================
//  DI DALAM FORM SUBMIT, GANTI PANGGILAN FORMAT TANGGAL
// ========================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const selected = getSelectedTechnicians();
  const pelangganId = pelangganSelect.value.trim();
  const problem = document.getElementById("problemDesc").value.trim();
  const aksi = document.getElementById("aksiInput").value.trim();   // <-- ambil Aksi
  const startTimeRaw = document.getElementById("startTime").value;
  const startTime = formatDateWithDay(startTimeRaw);

  if (!pelangganId) { Swal.fire("Oops!", "Pelanggan wajib dipilih.", "warning"); return; }
  if (!problem) { Swal.fire("Oops!", "Deskripsi problem wajib diisi.", "warning"); return; }
  if (selected.length === 0) { Swal.fire("Oops!", "Pilih minimal satu teknisi.", "warning"); return; }

  const user = auth.currentUser;
  if (!user) { Swal.fire("Error!", "Sesi login tidak ditemukan.", "error"); return; }

  const nextTicketNumber = await updateTicketNumber();

  try {
    // Ambil data pelanggan
    const pelangganRef = collection(db, "pelanggan");
    const snapshot = await getDocs(pelangganRef);
    let pelangganData = { nama: pelangganId, alamat: "-" };
    snapshot.forEach(doc => {
      if (doc.id === pelangganId) {
        pelangganData = doc.data();
      }
    });

    // Simpan tiket ke Firestore
    await addDoc(collection(db, "tickets"), {
      ticketNumber: nextTicketNumber,
      createdBy: user.email,
      pelanggan: pelangganData.nama,        // nama pelanggan
      alamat: pelangganData.alamat || "-",  // alamat pelanggan
      problem,
      aksi: aksi || "-",                    // <-- field aksi
      technicians: selected,
      startTime,
      createdAt: serverTimestamp(),
    });

    Swal.fire("Berhasil!", "Ticket berhasil dibuat.", "success");
    loadTicketsTable(); // reload tabel

    // Template output
    outputPre.textContent =
`\`\`\`
Genzet Home
Kunjungan Teknisi
===========================

Customer  : ${pelangganData.nama}
No Tiket  : #${nextTicketNumber}
Alamat    : ${pelangganData.alamat || "-"}
Kendala   : ${problem}
Aksi      : ${aksi || "-"}
Teknisi   : ${selected.join(", ")}
Jadwal    : ${startTime}
\`\`\``;

    outputPre.style.display = "block";
    copyBtn.style.display = "block";

    form.reset();
    document.querySelectorAll(".tech-card.selected").forEach(el => el.classList.remove("selected"));
    await updateTicketNumber();
  } catch (err) {
    console.error("Gagal menambah ticket:", err);
    Swal.fire("Gagal!", err.message || "Terjadi kesalahan.", "error");
  }
});

// ========================
//  INISIALISASI DATATABLE
// ========================
let ticketsTable;

$(document).ready(function () {
  // Inisialisasi DataTable
ticketsTable = $('#tableTickets').DataTable({
  paging: true,
  searching: true,
  info: true,
  order: [] // biar urut sesuai Firestore (createdAt desc)
});


  // Load data pertama kali
  loadTicketsTable();
});

// ========================
//  LOAD TABEL
// ========================
async function loadTicketsTable() {
  ticketsTable.clear();

  const ticketsRef = collection(db, "tickets");
  const q = query(ticketsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  console.log("Jumlah tiket:", snapshot.size); // debug

  snapshot.forEach((doc) => {
    const data = doc.data();

    ticketsTable.row.add([
      `<span class="view-ticket" data-id="${doc.id}" style="cursor:pointer;">
        #${data.ticketNumber}
      </span>`,
      `<span class="view-ticket" data-id="${doc.id}" style="cursor:pointer;">
        ${data.pelanggan || "-"}
      </span>`,
      `<span class="view-ticket" data-id="${doc.id}" style="cursor:pointer;">
        ${data.alamat || "-"}
      </span>`,
      `<span class="view-ticket" data-id="${doc.id}" style="cursor:pointer;">
        ${data.problem || "-"}
      </span>`,
      `<span class="aksi-cell" data-id="${doc.id}" style="cursor:pointer;">
        ${data.aksi || "-"}
      </span>`,
      `<span class="view-ticket" data-id="${doc.id}" style="cursor:pointer;">
        ${(data.technicians || []).join(", ")}
      </span>`,
      `<span class="view-ticket" data-id="${doc.id}" style="cursor:pointer;">
        ${data.startTime || "-"}
      </span>`,
    ]);
  });

  ticketsTable.draw();
}

// ========================
//  EVENT: EDIT AKSI
// ========================
$('#tableTickets tbody').on('click', 'span.aksi-cell', async function () {
  const ticketId = $(this).data("id");
  if (!ticketId) return;

  const ref = doc(db, "tickets", ticketId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();

  // SweetAlert form input
  const { value: aksiBaru } = await Swal.fire({
    title: `Edit Aksi - Tiket #${data.ticketNumber}`,
    input: "text",
    inputValue: data.aksi || "",
    showCancelButton: true,
    confirmButtonText: "Simpan",
    cancelButtonText: "Batal"
  });

  if (aksiBaru !== null && aksiBaru !== undefined) {
  await updateDoc(ref, { aksi: aksiBaru.trim() || "-" });
    Swal.fire("Berhasil", "Aksi berhasil diperbarui.", "success");
    await loadTicketsTable(); // reload tabel
  }
});


// ========================
//  VIEW DETAIL TIKET
// ========================
$(document).on("click", ".view-ticket", async function () {
  const ticketId = $(this).data("id");
  const docSnap = await getDoc(doc(db, "tickets", ticketId));

  if (docSnap.exists()) {
    const data = docSnap.data();

    const ticketText = 
`\`\`\`
Genzet Home
Kunjungan Teknisi
===========================

Customer  : ${data.pelanggan || "-"}
No Tiket  : #${data.ticketNumber}
Alamat    : ${data.alamat || "-"}
Kendala   : ${data.problem || "-"}
Aksi      : ${data.aksi || "-"}
Teknisi   : ${(data.technicians || []).join(", ")}
Jadwal    : ${data.startTime || "-"}
\`\`\``;

    Swal.fire({
      title: "Detail Tiket",
      html: `<pre style="text-align:left; white-space:pre-wrap;">${ticketText}</pre>`,
      showCancelButton: true,
      confirmButtonText: "Copy",
      cancelButtonText: "Tutup",
    }).then((result) => {
      if (result.isConfirmed) {
        navigator.clipboard.writeText(ticketText);
        Swal.fire("Copied!", "Teks berhasil disalin.", "success");
      }
    });
  }
});
