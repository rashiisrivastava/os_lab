const ROTATIONAL_LATENCY = 1; 

function runDisk() {
    const algo = document.getElementById("algo").value;
    if (algo === "FCFS") diskFCFS();
    if (algo === "SSTF") diskSSTF();
    if (algo === "SCAN") diskSCAN();
    if (algo === "CSCAN") diskCSCAN();
}

function getDiskInput() {
    return {
        requests: document.getElementById("queue").value.trim().split(" ").map(Number),
        head: +document.getElementById("head").value,
        size: +document.getElementById("diskSize").value,
        dir: document.getElementById("direction").value
    };
}
function renderDisk(order, startHead) {
    let seek = 0;
    let current = startHead;

    const chart = document.getElementById("chart");
    chart.innerHTML = "";

    order.forEach(r => {
        const move = Math.abs(r - current);
        seek += move + ROTATIONAL_LATENCY;

        const div = document.createElement("div");
        div.className = "block";
        div.innerText = `${current} → ${r}`;
        chart.appendChild(div);

        current = r;
    });

    document.getElementById("seek").innerText = seek;
    document.getElementById("throughput").innerText =
        (order.length / seek).toFixed(3);
}
function diskFCFS() {
    const { requests, head } = getDiskInput();
    renderDisk([...requests], head);
}

function diskSSTF() {
    let { requests, head } = getDiskInput();
    let pending = [...requests];
    let order = [];

    while (pending.length) {
        pending.sort((a, b) =>
            Math.abs(a - head) - Math.abs(b - head)
        );
        let next = pending.shift();
        order.push(next);
        head = next;
    }

    renderDisk(order, getDiskInput().head);
}

function diskSCAN() {
    const { requests, head, size, dir } = getDiskInput();

    let left = requests.filter(r => r < head).sort((a, b) => b - a);
    let right = requests.filter(r => r >= head).sort((a, b) => a - b);

    let order =
        dir === "RIGHT"
            ? [...right, size, ...left]
            : [...left, 0, ...right];

    renderDisk(order, head);
}

function diskCSCAN() {
    const { requests, head, size, dir } = getDiskInput();

    let left = requests.filter(r => r < head).sort((a, b) => a - b);
    let right = requests.filter(r => r >= head).sort((a, b) => a - b);

    let order =
        dir === "RIGHT"
            ? [...right, size, 0, ...left]
            : [...left, 0, size, ...right];

    renderDisk(order, head);
}
function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
}

(function () {
    const saved = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
})();
function exportCSV() {
    let csv = "Metric,Value\n";
    csv += `Total Seek Time,${seek.innerText}\n`;
    csv += `Throughput,${throughput.innerText}\n`;

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Disk_Scheduling_Results.csv";
    a.click();
}

function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("OS Virtual Lab – Disk Scheduling Results", 20, 20);

    doc.setFontSize(12);
    doc.text(`Total Seek Time: ${seek.innerText}`, 20, 40);
    doc.text(`Throughput: ${throughput.innerText}`, 20, 50);

    doc.save("Disk_Scheduling_Results.pdf");
}
function simulateDiskAlgo(algo) {

    const { requests, head, size, dir } = getDiskInput();
    let order = [];

    if (algo === "FCFS") {
        order = [...requests];
    }

    if (algo === "SSTF") {
        let pending = [...requests];
        let h = head;

        while (pending.length) {
            pending.sort((a, b) =>
                Math.abs(a - h) - Math.abs(b - h)
            );
            let next = pending.shift();
            order.push(next);
            h = next;
        }
    }

    if (algo === "SCAN") {
        let left = requests.filter(r => r < head).sort((a,b)=>b-a);
        let right = requests.filter(r => r >= head).sort((a,b)=>a-b);

        order = dir === "RIGHT"
            ? [...right, size - 1, ...left]
            : [...left, 0, ...right];
    }

    if (algo === "CSCAN") {
        let left = requests.filter(r => r < head).sort((a,b)=>a-b);
        let right = requests.filter(r => r >= head).sort((a,b)=>a-b);

        order = dir === "RIGHT"
            ? [...right, size - 1, 0, ...left]
            : [...left, 0, size - 1, ...right];
    }

    let seek = 0;
    let current = head;

    order.forEach(r => {
        seek += Math.abs(r - current) + ROTATIONAL_LATENCY;
        current = r;
    });

    return {
        seek: seek,
        throughput: (order.length / seek).toFixed(3)
    };
}

function compareDisk() {

    const algorithms = ["FCFS", "SSTF", "SCAN", "CSCAN"];

    let html = `
    <table style="margin-top:15px;">
    <tr>
        <th>Algorithm</th>
        <th>Total Seek</th>
        <th>Throughput</th>
    </tr>`;

    algorithms.forEach(algo => {
        const res = simulateDiskAlgo(algo);

        html += `
        <tr>
            <td>${algo}</td>
            <td>${res.seek}</td>
            <td>${res.throughput}</td>
        </tr>`;
    });

    html += `</table>`;

    document.getElementById("chart").innerHTML = html;
}
function exportPDF() {

    if (!window.jspdf) {
        alert("jsPDF library not loaded.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("OS Virtual Lab Report", 20, 20);

    doc.setFontSize(12);

    doc.text("Generated on: " + new Date().toLocaleString(), 20, 35);

    doc.save("OS_Virtual_Lab_Report.pdf");
}
