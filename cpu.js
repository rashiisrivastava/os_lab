const processTable = document.getElementById("processTable");
const algorithm = document.getElementById("algorithm");
const output = document.getElementById("output");
const cpuUtil = document.getElementById("cpuUtil");
const throughput = document.getElementById("throughput");
const csCount = document.getElementById("csCount");
const csOver = document.getElementById("csOver");

const CONTEXT_SWITCH = 1;
let count = 2;

/* ---------------- ADD PROCESS ---------------- */
function addProcess() {
    count++;
    processTable.innerHTML += `
    <tr>
        <td>P${count}</td>
        <td><input type="number" value="0"></td>
        <td><input type="number" value="1"></td>
        <td><input type="number" value="1"></td>
    </tr>`;
}

/* ---------------- GET PROCESSES ---------------- */
function getProcesses() {
    return [...processTable.rows].map((r, i) => ({
        pid: `P${i + 1}`,
        at: +r.cells[1].children[0].value,
        bt: +r.cells[2].children[0].value,
        pr: +r.cells[3].children[0].value,
        rt: +r.cells[2].children[0].value,
        wt: 0,
        tat: 0,
        done: false,
        added: false,
        waitingTime: 0
    }));
}

/* ---------------- RUN CPU ---------------- */
function runCPU() {
    const algo = algorithm.value;
    const processes = getProcesses();
    const cores = +document.getElementById("cores").value;
    simulate(processes, algo, cores);
}

/* ---------------- SIMULATION ---------------- */
function simulate(processes, algo, cores) {
    let time = 0;
    let completed = 0;
    let cs = 0;
    let gantt = [];

    const quantum = +document.getElementById("quantum").value || Infinity;

    const coreState = Array.from({ length: cores }, () => ({
        proc: null,
        qLeft: quantum
    }));

    const readyQueue = [];
    const totalBurst = processes.reduce((s, p) => s + p.bt, 0);

    while (completed < processes.length) {

        /* ---- ADD ARRIVED PROCESSES ---- */
        processes.forEach(p => {
            if (p.at <= time && !p.added && !p.done) {
                readyQueue.push(p);
                p.added = true;
            }
        });

        /* ---- PRIORITY AGING ---- */
        processes.forEach(p => {
            if (!p.done && readyQueue.includes(p)) {
                p.waitingTime++;
                if (p.waitingTime >= 5) {
                    p.pr = Math.max(0, p.pr - 1);
                    p.waitingTime = 0;
                }
            }
        });

        /* ---- SORT READY QUEUE ---- */
        if (algo === "SJF" || algo === "SRTF") {
            readyQueue.sort((a, b) => a.rt - b.rt);
        }
        if (algo === "PRIORITY" || algo === "PPRIORITY") {
            readyQueue.sort((a, b) => a.pr - b.pr);
        }

        /* ---- CORE SCHEDULING ---- */
        coreState.forEach(core => {

            if (core.proc) {
                const preempt =
                    (algo === "SRTF" && readyQueue[0] && readyQueue[0].rt < core.proc.rt) ||
                    (algo === "PPRIORITY" && readyQueue[0] && readyQueue[0].pr < core.proc.pr) ||
                    (algo === "RR" && core.qLeft === 0);

                if (preempt) {
                    readyQueue.push(core.proc);
                    core.proc = null;
                    cs++;
                }
            }

            if (!core.proc && readyQueue.length) {
                core.proc = readyQueue.shift();
                core.qLeft = quantum;
            }
        });

        /* ---- IDLE TIME HANDLING ---- */
        if (
            readyQueue.length === 0 &&
            coreState.every(c => !c.proc)
        ) {
            time++;
            continue;
        }

        /* ---- EXECUTION ---- */
        coreState.forEach((core, c) => {
            if (!core.proc) return;

            const last = gantt[gantt.length - 1];
            if (last && last.pid === core.proc.pid && last.core === c) {
                last.e++;
            } else {
                gantt.push({
                    pid: core.proc.pid,
                    s: time,
                    e: time + 1,
                    core: c
                });
            }

            core.proc.rt--;
            core.qLeft--;

            if (core.proc.rt === 0) {
                core.proc.done = true;
                core.proc.tat = time + 1 - core.proc.at;
                core.proc.wt = core.proc.tat - core.proc.bt;
                completed++;
                core.proc = null;
                cs++;
            }
        });

        time++;
    }

    render(gantt, processes, totalBurst, time, cs);
}

/* ---------------- RENDER OUTPUT ---------------- */
function render(gantt, processes, totalBurst, totalTime, cs) {
    const ganttDiv = document.getElementById("gantt");
    ganttDiv.innerHTML = "";

    gantt.forEach(b => {
        const div = document.createElement("div");
        div.className = "block";
        div.innerText = `${b.pid} (${b.s}-${b.e})`;
        ganttDiv.appendChild(div);
    });

    output.innerHTML =
        `<tr><th>PID</th><th>WT</th><th>TAT</th></tr>` +
        processes.map(p =>
            `<tr><td>${p.pid}</td><td>${p.wt}</td><td>${p.tat}</td></tr>`
        ).join("");

    const effectiveTime = totalTime + cs * CONTEXT_SWITCH;

    cpuUtil.innerText =
        ((totalBurst / effectiveTime) * 100).toFixed(2);

    throughput.innerText =
        (processes.length / totalTime).toFixed(2);

    csCount.innerText = cs;

    csOver.innerText =
        ((cs * CONTEXT_SWITCH / effectiveTime) * 100).toFixed(2);
}

/* ---------------- THEME ---------------- */
function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
}

(function () {
    const saved = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
})();
function exportCSV() {
    let csv = "PID,WT,TAT\n";
    const rows = output.querySelectorAll("tr");

    rows.forEach((r, i) => {
        if (i === 0) return;
        const cols = r.querySelectorAll("td");
        csv += `${cols[0].innerText},${cols[1].innerText},${cols[2].innerText}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "CPU_Scheduling.csv";
    a.click();
}
function cloneProcesses(processes) {
    return processes.map(p => ({
        ...p,
        rt: p.bt,
        wt: 0,
        tat: 0,
        done: false,
        added: false,
        waitingTime: 0
    }));
}

function calculateAverages(processes, totalBurst, totalTime, cs) {

    const avgWT =
        processes.reduce((s, p) => s + p.wt, 0) / processes.length;

    const avgTAT =
        processes.reduce((s, p) => s + p.tat, 0) / processes.length;

    const effectiveTime = totalTime + cs * CONTEXT_SWITCH;

    const cpuUtil =
        ((totalBurst / effectiveTime) * 100);

    return {
        avgWT: avgWT.toFixed(2),
        avgTAT: avgTAT.toFixed(2),
        cpuUtil: cpuUtil.toFixed(2)
    };
}

function simulateForComparison(processes, algo, cores) {

    let time = 0;
    let completed = 0;
    let cs = 0;
    const quantum = +document.getElementById("quantum").value || Infinity;

    const coreState = Array.from({ length: cores }, () => ({
        proc: null,
        qLeft: quantum
    }));

    const readyQueue = [];
    const totalBurst = processes.reduce((s, p) => s + p.bt, 0);

    while (completed < processes.length) {

        processes.forEach(p => {
            if (p.at <= time && !p.added && !p.done) {
                readyQueue.push(p);
                p.added = true;
            }
        });

        if (algo === "SJF" || algo === "SRTF") {
            readyQueue.sort((a, b) => a.rt - b.rt);
        }

        if (algo === "PRIORITY" || algo === "PPRIORITY") {
            readyQueue.sort((a, b) => a.pr - b.pr);
        }

        coreState.forEach(core => {

            if (core.proc) {
                const preempt =
                    (algo === "SRTF" && readyQueue[0] && readyQueue[0].rt < core.proc.rt) ||
                    (algo === "PPRIORITY" && readyQueue[0] && readyQueue[0].pr < core.proc.pr) ||
                    (algo === "RR" && core.qLeft === 0);

                if (preempt) {
                    readyQueue.push(core.proc);
                    core.proc = null;
                    cs++;
                }
            }

            if (!core.proc && readyQueue.length) {
                core.proc = readyQueue.shift();
                core.qLeft = quantum;
            }
        });

        if (readyQueue.length === 0 && coreState.every(c => !c.proc)) {
            time++;
            continue;
        }

        coreState.forEach(core => {
            if (!core.proc) return;

            core.proc.rt--;
            core.qLeft--;

            if (core.proc.rt === 0) {
                core.proc.done = true;
                core.proc.tat = time + 1 - core.proc.at;
                core.proc.wt = core.proc.tat - core.proc.bt;
                completed++;
                core.proc = null;
                cs++;
            }
        });

        time++;
    }

    return calculateAverages(processes, totalBurst, time, cs);
}

function compareAlgorithms() {

    const baseProcesses = getProcesses();
    const cores = +document.getElementById("cores").value;

    const algorithms = [
        "FCFS",
        "SJF",
        "SRTF",
        "PRIORITY",
        "PPRIORITY",
        "RR"
    ];

    let html =
        `<table style="margin-top:15px;">
        <tr>
            <th>Algorithm</th>
            <th>Avg WT</th>
            <th>Avg TAT</th>
            <th>CPU Util (%)</th>
        </tr>`;

    algorithms.forEach(algo => {

        const cloned = cloneProcesses(baseProcesses);
        const result = simulateForComparison(cloned, algo, cores);

        html += `
        <tr>
            <td>${algo}</td>
            <td>${result.avgWT}</td>
            <td>${result.avgTAT}</td>
            <td>${result.cpuUtil}</td>
        </tr>`;
    });

    html += `</table>`;

    document.getElementById("gantt").innerHTML = "";
    output.innerHTML = html;
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
