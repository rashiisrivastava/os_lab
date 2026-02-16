const faults = document.getElementById("faults");
const wsSize = document.getElementById("wsSize");
const belady = document.getElementById("belady");
const faultChart = document.getElementById("faultChart");

let chart;

function runMemory() {
    const algo = document.getElementById("algo").value;
    if (algo === "FIFO") runFIFO();
    if (algo === "LRU") runLRU();
    if (algo === "OPT") runOPT();
}

function getInput() {
    return {
        refs: document.getElementById("refs").value.trim().split(/\s+/).map(Number),
        frames: +document.getElementById("frames").value,
        k: +document.getElementById("k").value
    };
}

function simulate(refs, frameCount, strategy) {
    let frames = Array(frameCount).fill(null);
    let history = [];
    let faults = 0;
    let hits = 0;

    refs.forEach((page, t) => {
        let hit = frames.includes(page);

        if (hit) {
            hits++;
        } else {
            faults++;
            const empty = frames.indexOf(null);

            if (empty !== -1) {
                frames[empty] = page;
            } else {
                const victim = strategy(frames, refs, t);
                frames[victim] = page;
            }
        }

        history.push({
            page,
            frames: [...frames],
            hit
        });
    });

    return { history, faults, hits };
}

/* ---------- FIFO ---------- */
function runFIFO() {
    const { refs, frames, k } = getInput();
    let pointer = 0;

    const res = simulate(refs, frames, () => {
        const v = pointer;
        pointer = (pointer + 1) % frames;
        return v;
    });

    render(res, refs, k);
    detectBelady(refs);
}

/* ---------- LRU ---------- */
function runLRU() {
    const { refs, frames, k } = getInput();

    const res = simulate(refs, frames, (framesArr, refs, t) => {
        let past = refs.slice(0, t);
        let lastUsed = framesArr.map(f => past.lastIndexOf(f));
        return lastUsed.indexOf(Math.min(...lastUsed));
    });

    render(res, refs, k);
    belady.innerText = "";
}

/* ---------- OPT ---------- */
function runOPT() {
    const { refs, frames, k } = getInput();

    const res = simulate(refs, frames, (framesArr, refs, t) => {
        let future = refs.slice(t + 1);
        let nextUse = framesArr.map(f =>
            future.indexOf(f) === -1 ? Infinity : future.indexOf(f)
        );
        return nextUse.indexOf(Math.max(...nextUse));
    });

    render(res, refs, k);
    belady.innerText = "";
}

/* ---------- RENDER TABLE ---------- */
function render(res, refs, k) {
    const ram = document.getElementById("ram");
    ram.innerHTML = "";

    const table = document.createElement("table");

    // Reference row
    table.innerHTML =
        `<tr><th>Ref</th>${refs.map(r => `<th>${r}</th>`).join("")}</tr>`;

    // Frame rows
    for (let i = 0; i < res.history[0].frames.length; i++) {
        table.innerHTML +=
            `<tr><th>F${i + 1}</th>${
                res.history.map(h =>
                    `<td>${h.frames[i] ?? "-"}</td>`
                ).join("")
            }</tr>`;
    }

    // Hit/Fault row
    table.innerHTML +=
        `<tr><th>Result</th>${
            res.history.map(h =>
                `<td class="${h.hit ? "hit" : "fault"}">${h.hit ? "H" : "F"}</td>`
            ).join("")
        }</tr>`;

    ram.appendChild(table);

    /* METRICS */
    faults.innerText = res.faults;
    wsSize.innerText = calcWorkingSet(refs, k);
    drawChart(res.history.map((_, i) =>
        res.history.slice(0, i + 1).filter(x => !x.hit).length
    ));
}

function calcWorkingSet(refs, k) {
    const n = refs.length;
    return new Set(refs.slice(Math.max(0, n - k))).size;
}

function detectBelady(refs) {
    const f1 = simulate(refs, 3, () => 0).faults;
    const f2 = simulate(refs, 4, () => 0).faults;

    belady.innerText =
        f2 > f1 ? "⚠️ Belady’s Anomaly Detected" : "";
}
function drawChart(data) {

    if (chart) chart.destroy();

    const isLight =
        document.documentElement.getAttribute("data-theme") === "light";

    chart = new Chart(faultChart, {
        type: "line",
        data: {
            labels: data.map((_, i) => i + 1),
            datasets: [{
                label: "Cumulative Page Faults",
                data: data,
                borderColor: isLight ? "#0284c7" : "#38bdf8",
                backgroundColor: "transparent",
                tension: 0.3
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        color: isLight ? "#0f172a" : "#e5e7eb"
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: isLight ? "#0f172a" : "#e5e7eb"
                    }
                },
                y: {
                    ticks: {
                        color: isLight ? "#0f172a" : "#e5e7eb"
                    }
                }
            }
        }
    });
}

function exportCSV() {
    let csv = "Page Faults," + faults.innerText + "\n";
    csv += "Working Set Size," + wsSize.innerText;

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Memory_Results.csv";
    a.click();
}
function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
}
function compareMemory() {

    const { refs, frames } = getInput();

    const algorithms = ["FIFO", "LRU", "OPT"];

    let html = `
    <table style="margin-top:15px;">
    <tr>
        <th>Algorithm</th>
        <th>Page Faults</th>
        <th>Hit Ratio</th>
    </tr>`;

    algorithms.forEach(algo => {

        let result;

        if (algo === "FIFO") {
            let pointer = 0;
            result = simulate(refs, frames, () => {
                const v = pointer;
                pointer = (pointer + 1) % frames;
                return v;
            });
        }

        if (algo === "LRU") {
            result = simulate(refs, frames, (framesArr, refs, t) => {
                let past = refs.slice(0, t);
                let lastUsed = framesArr.map(f => past.lastIndexOf(f));
                return lastUsed.indexOf(Math.min(...lastUsed));
            });
        }

        if (algo === "OPT") {
            result = simulate(refs, frames, (framesArr, refs, t) => {
                let future = refs.slice(t + 1);
                let nextUse = framesArr.map(f =>
                    future.indexOf(f) === -1 ? Infinity : future.indexOf(f)
                );
                return nextUse.indexOf(Math.max(...nextUse));
            });
        }

        const hitRatio =
            (result.hits / refs.length).toFixed(2);

        html += `
        <tr>
            <td>${algo}</td>
            <td>${result.faults}</td>
            <td>${hitRatio}</td>
        </tr>`;
    });

    html += `</table>`;

    document.getElementById("ram").innerHTML = html;
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
