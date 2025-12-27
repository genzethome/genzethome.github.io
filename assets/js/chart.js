import { db } from "./firebase-init.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const targetNames = ["abi", "baruna", "firzi", "jerry", "yuda"];

// 1. Data Penanaman Modal (Existing)
async function ambilDataModal() {
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

// 2. Data Pemasukan 5 Bulan Terakhir
async function ambilDataPemasukan5Bulan() {
  const pemasukanCol = collection(db, "pemasukan");
  // Fetch all to parse dates manually since format is DD-MM-YYYY string
  const snapshot = await getDocs(pemasukanCol);

  const monthlyTotals = {}; // key: "YYYY-MM", value: total

  snapshot.forEach(doc => {
    const data = doc.data();
    const jumlah = parseInt(data.jumlah) || 0;
    const tanggalStr = data.tanggal || ""; // "28-12-2025 00:38:16"

    // Parse DD-MM-YYYY
    const parts = tanggalStr.split(/[- :]/);
    if (parts.length >= 3) {
      const day = parts[0];
      const month = parts[1]; // 01-12
      const year = parts[2];

      const key = `${year}-${month}`;
      if (!monthlyTotals[key]) monthlyTotals[key] = 0;
      monthlyTotals[key] += jumlah;
    }
  });

  // Sort keys (YYYY-MM)
  const sortedKeys = Object.keys(monthlyTotals).sort();
  // Take last 5
  const last5Keys = sortedKeys.slice(-5);

  const labels = [];
  const data = [];

  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  last5Keys.forEach(key => {
    const [year, month] = key.split("-");
    const monthName = monthNames[parseInt(month)];
    labels.push(`${monthName} ${year}`); // Month + Year (e.g. "Des 2025")
    data.push(monthlyTotals[key]);
  });

  return { labels, data };
}

function buatChart(modalLabels, modalData, incomeLabels, incomeData) {
  const ctxBar = document.getElementById("barChart").getContext("2d");
  const ctxPie = document.getElementById("pieChart").getContext("2d");

  const colors = [
    "#3498db", "#e74c3c", "#f1c40f", "#1abc9c",
    "#9b59b6", "#e67e22", "#2ecc71", "#34495e"
  ];

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          font: { size: 11 }
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            // Abbreviate large numbers (e.g. 1jt) to save space or just keep it clean
            return value.toLocaleString('id-ID');
          }
        }
      }
    }
  };

  // ✅ BAR 1: Penanaman Modal
  new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: modalLabels,
      datasets: [{
        label: 'Modal',
        data: modalData,
        backgroundColor: colors
      }]
    },
    options: {
      ...commonOptions,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Penanaman Modal' }
      }
    }
  });

  // ✅ BAR 2: Pemasukan 5 Bulan Terakhir
  new Chart(ctxPie, {
    type: "bar",
    data: {
      labels: incomeLabels,
      datasets: [{
        label: 'Pemasukan',
        data: incomeData,
        backgroundColor: colors,
        borderWidth: 1
      }]
    },
    options: {
      ...commonOptions,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Pemasukan 5 Bulan Terakhir' }
      },
      scales: {
        ...commonOptions.scales,
        y: {
          ...commonOptions.scales.y,
          ticks: {
            callback: function (value) {
              return 'Rp ' + value.toLocaleString('id-ID');
            }
          }
        }
      }
    }
  });
}

// Execute
Promise.all([ambilDataModal(), ambilDataPemasukan5Bulan()]).then(([resModal, resIncome]) => {
  // Prep Modal Data
  const modalLabels = targetNames.map(name => name.charAt(0).toUpperCase() + name.slice(1));
  const modalData = targetNames.map(name => resModal[name]);

  // Prep Income Data (already processed)
  buatChart(modalLabels, modalData, resIncome.labels, resIncome.data);
});
