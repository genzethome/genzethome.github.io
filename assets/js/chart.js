import { db } from "./firebase-init.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const targetNames = ["firzi", "abizar", "yuda", "zahdan", "jerry", "baruna", "maulana"];

async function ambilData() {
  const hasil = {};
  targetNames.forEach(name => hasil[name] = 0);

  const pemasukanCol = collection(db, "pemasukan");
  const snapshot = await getDocs(pemasukanCol);

  snapshot.forEach(doc => {
    const data = doc.data();
    const ket = (data.keterangan || "").toLowerCase().trim();
    const jumlah = parseInt(data.jumlah) || 0;

    const cocok = targetNames.find(name => ket.includes(name));
    if (cocok) hasil[cocok] += jumlah;
  });

  return hasil;
}

function buatChart(labels, data) {
  const ctxBar = document.getElementById("barChart").getContext("2d");
  const ctxPie = document.getElementById("pieChart").getContext("2d");

  const colors = [
    "#3498db", "#e74c3c", "#f1c40f",
    "#1abc9c", "#9b59b6", "#e67e22", "#2ecc71"
  ];

  // ✅ BAR
  new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      }
    }
  });

  // ✅ PIE
  new Chart(ctxPie, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }, // legend hilang
        tooltip: { enabled: true }  // tooltip bawaan Chart.js aktif
      }
    }
  });
}

ambilData().then(res => {
  const labels = targetNames.map(name => name.charAt(0).toUpperCase() + name.slice(1));
  const data = targetNames.map(name => res[name]);
  buatChart(labels, data);
});
