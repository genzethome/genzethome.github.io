import { db } from "./firebase-init.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
};

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🌌 Initializing Cibarusah Chronicles...");

    try {
        // --- 1. DATA CALCULATION ---
        const startDate = new Date("2025-06-05");
        const today = new Date();
        const diffTime = Math.abs(today - startDate);
        const daysSince = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let totalIncome = 0;
        let totalExpense = 0;

        const incomeSnap = await getDocs(collection(db, "pemasukan"));
        incomeSnap.forEach(doc => totalIncome += parseInt(doc.data().jumlah || 0));

        const expenseSnap = await getDocs(collection(db, "pengeluaran"));
        expenseSnap.forEach(doc => totalExpense += parseInt(doc.data().jumlah || 0));

        const balance = totalIncome - totalExpense;

        // --- 2. UPDATE DOM ELEMENTS ---
        const setText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        animateValue("daysCounter", 0, daysSince, 2000);
        setText("chestRevenue", formatRupiah(totalIncome));
        setText("chestBalance", formatRupiah(balance));
        setText("shareDays", daysSince);

        // --- 3. OBSERVER FOR ANIMATIONS ---
        setupObserver();

    } catch (e) {
        console.error("Cibarusah Error:", e);
    }
});

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function animateCounter(id, endValue) {
    animateValue(id, 0, endValue, 2000);
}

function setupObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Common Animation Trigger
                entry.target.querySelectorAll('.animate-up').forEach(el => {
                    el.classList.add('visible');
                });

                // Slide 3: Radar Map
                if (entry.target.id === 'slide3') {
                    if (!entry.target.dataset.radarInit) {
                        initRadarMap(14);
                        entry.target.dataset.radarInit = "true";
                    }
                }

                // Slide 3.5: Golden Quotes
                if (entry.target.id === 'slideQuotes') {
                    if (!entry.target.dataset.quoteInit) {
                        animateCounter("ticketCount", 12);
                        entry.target.dataset.quoteInit = "true";
                    }
                }

                // Slide 5: EKG Animation
                if (entry.target.id === 'slide5') {
                    const path = entry.target.querySelector('.ekg-path');
                    if (path) {
                        path.style.animation = 'none';
                        path.offsetHeight; /* trigger reflow */
                        path.style.animation = 'dash 3s linear forwards';
                    }
                }

                // Slide 6: Outro Counters
                if (entry.target.id === 'slide6') {
                    // Re-trigger if needed, or leave static
                }
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.wrapped-slide').forEach(s => observer.observe(s));
}

function initRadarMap(count) {
    const map = document.getElementById('cibarusahMap');
    if (!map) return;
    map.querySelectorAll('.map-light').forEach(e => e.remove());
    for (let i = 0; i < count; i++) {
        const dot = document.createElement('div');
        dot.className = 'map-light';
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 40;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        dot.style.left = x + '%';
        dot.style.top = y + '%';
        dot.style.animationDelay = (Math.random() * 2) + 's';
        map.appendChild(dot);
    }
}



window.downloadShareCard = () => {
    const card = document.getElementById("shareCard");
    html2canvas(card, { backgroundColor: "#0a192f", scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'Genzet_Cibarusah_2025.png';
        link.href = canvas.toDataURL();
        link.click();
    });
};

window.revealQuiz = () => {
    const optionsContainer = document.querySelector('.quiz-options');
    const result = document.getElementById('quizResult');

    // 1. Hide options immediately
    if (optionsContainer) {
        optionsContainer.style.setProperty('display', 'none', 'important');
    }

    // 2. Show result immediately
    if (result) {
        result.classList.remove('d-none');
        result.classList.add('visible');
        result.style.display = 'block';

        // Force Reflow
        void result.offsetWidth;
        result.classList.add('animate-up');
    }

    // 3. Trigger confetti
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#ffc107', '#ffffff']
        });
    }
};
