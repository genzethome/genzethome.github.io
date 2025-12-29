import { db } from "./firebase-init.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// ========================
// ✅ HELPER: Ambil 5 Bulan Terakhir
// ========================
async function getDataLast5Months(collectionName) {
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);

  const monthlyTotals = {}; // Format: "YYYY-MM" -> Total

  snapshot.forEach(doc => {
    const data = doc.data();
    const jumlah = parseInt(data.jumlah) || 0;
    const tanggalStr = data.tanggal || ""; // Format: "DD-MM-YYYY HH:mm:ss"

    // Parse Tanggal
    // Asumsi format "DD-MM-YYYY ..."
    const parts = tanggalStr.split(/[- :]/);
    if (parts.length >= 3) {
      const day = parts[0];
      const month = parts[1]; // 01-12
      const year = parts[2];

      // Buat key sorting YYYY-MM
      const key = `${year}-${month}`;

      if (!monthlyTotals[key]) monthlyTotals[key] = 0;
      monthlyTotals[key] += jumlah;
    }
  });

  // Urutkan key (Ascending)
  const sortedKeys = Object.keys(monthlyTotals).sort();

  // Ambil 5 Terakhir
  const last5Keys = sortedKeys.slice(-5);

  const labels = [];
  const totalData = [];

  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  last5Keys.forEach(key => {
    const [year, month] = key.split("-");
    const monthName = monthNames[parseInt(month)];
    labels.push(`${monthName} ${year}`); // Contoh: "Des 2025"
    totalData.push(monthlyTotals[key]);
  });

  // Jika data kurang dari 5 bulan, return apa adanya. 
  // Chart.js akan handle array pendek.
  return { labels, data: totalData };
}

// ========================
// ✅ RENDER CHART
// ========================
function renderChart(canvasId, label, labels, data, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Opsi Umum
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumSignificantDigits: 3 }).format(value);
          }
        }
      }
    }
  };

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        backgroundColor: color,
        borderRadius: 5,
        barPercentage: 0.6
      }]
    },
    options: options
  });
}

// ========================
// ✅ INIT
// ========================
async function initCharts() {
  try {
    const [incomeData, expenseData] = await Promise.all([
      getDataLast5Months("pemasukan"),
      getDataLast5Months("pengeluaran")
    ]);

    // Render Income Chart (Green)
    // Gunakan labels dari incomeData (atau expenseData, asumsi periode sama/mirip, tapi aman pakai label masing2)
    renderChart("incomeChart", "Pemasukan", incomeData.labels, incomeData.data, "#198754"); // Bootstrap success

    // Render Expense Chart (Red)
    renderChart("expenseChart", "Pengeluaran", expenseData.labels, expenseData.data, "#dc3545"); // Bootstrap danger

  } catch (error) {
    console.error("Gagal memuat chart:", error);
  }
}

// Jalankan
initCharts();
