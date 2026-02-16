/* ========================================
   GENERATE TABLES
======================================== */

function generateTables() {

    const p = +document.getElementById("pCount").value;
    const r = +document.getElementById("rCount").value;

    const tablesDiv = document.getElementById("tables");
    tablesDiv.innerHTML = "";

    function createTable(title) {

        let html = `<h3>${title}</h3><table><tr><th></th>`;

        for (let j = 0; j < r; j++) {
            html += `<th>R${j}</th>`;
        }

        html += `</tr>`;

        for (let i = 0; i < p; i++) {
            html += `<tr><td>P${i}</td>`;

            for (let j = 0; j < r; j++) {
                html += `<td><input type="number" value="0" min="0"></td>`;
            }

            html += `</tr>`;
        }

        html += `</table>`;
        return html;
    }

    tablesDiv.innerHTML += createTable("Allocation Matrix");
    tablesDiv.innerHTML += createTable("Request Matrix");
}


/* ========================================
   READ MATRIX
======================================== */

function readMatrix(index) {

    const tables = document.querySelectorAll("#tables table");

    if (!tables[index]) return [];

    const rows = tables[index].querySelectorAll("tr");

    return Array.from(rows)
        .slice(1)
        .map(row =>
            Array.from(row.querySelectorAll("input"))
                .map(input => +input.value)
        );
}


/* ========================================
   RUN DEADLOCK ANALYSIS
======================================== */

function runDeadlock() {

    const resultDiv = document.getElementById("result");
    const graphDiv = document.getElementById("graph");

    resultDiv.innerHTML = "";
    graphDiv.innerHTML = "";

    const tables = document.querySelectorAll("#tables table");

    if (tables.length < 2) {
        resultDiv.innerHTML = `
            <div class="block" style="background:#ef4444;color:white;">
                Please click "Generate Tables" first.
            </div>
        `;
        return;
    }

    const alloc = readMatrix(0);
    const req = readMatrix(1);

    const graph = buildWaitForGraph(alloc, req);

    renderGraph(graph);

    if (document.getElementById("noHoldWait").checked) {
        show("Hold & Wait prevented → No Deadlock", "success");
        return;
    }

    if (detectCycle(graph)) {
        recover(graph);
    } else {
        show("No Deadlock Detected ✅", "success");
    }
}


/* ========================================
   BUILD WAIT-FOR GRAPH
======================================== */

function buildWaitForGraph(alloc, req) {

    const graph = {};
    const p = alloc.length;

    for (let i = 0; i < p; i++) {
        graph[i] = [];
    }

    for (let i = 0; i < p; i++) {
        for (let j = 0; j < req[i].length; j++) {

            if (req[i][j] > 0) {

                for (let k = 0; k < p; k++) {

                    if (alloc[k][j] > 0 && i !== k) {
                        graph[i].push(k);
                    }
                }
            }
        }
    }

    return graph;
}


/* ========================================
   CYCLE DETECTION (DFS)
======================================== */

function detectCycle(graph) {

    const visited = {};
    const stack = {};

    function dfs(v) {

        if (stack[v]) return true;
        if (visited[v]) return false;

        visited[v] = stack[v] = true;

        for (let neighbor of graph[v]) {
            if (dfs(neighbor)) return true;
        }

        stack[v] = false;
        return false;
    }

    return Object.keys(graph).some(v => dfs(v));
}


/* ========================================
   RECOVERY
======================================== */

function recover(graph) {

    const victim = Math.max(...Object.keys(graph));

    show(`Deadlock Detected ⚠️<br>Recovery: Killed P${victim}`, "danger");
}


/* ========================================
   RENDER GRAPH
======================================== */

function renderGraph(graph) {

    const container = document.getElementById("graph");
    container.innerHTML = "";

    let hasEdges = false;

    Object.keys(graph).forEach(p => {

        graph[p].forEach(n => {

            hasEdges = true;

            const edge = document.createElement("div");
            edge.className = "block";
            edge.innerText = `P${p} → P${n}`;
            container.appendChild(edge);
        });
    });

    if (!hasEdges) {

        const empty = document.createElement("div");
        empty.className = "block";
        empty.style.background = "var(--border)";
        empty.style.color = "var(--text)";
        empty.innerText = "No Wait-For Edges";

        container.appendChild(empty);
    }
}
function show(message, type) {

    const resultDiv = document.getElementById("result");

    resultDiv.innerHTML = `
        <div class="block ${type === "danger" ? "result-danger" : "result-success"}"
             style="background:${type === "danger" ? "#ef4444" : "#22c55e"}; color:white;">
            ${message}
        </div>
    `;
}


/* ========================================
   COMPARE MODE
======================================== */

function compareDeadlock() {

    const tables = document.querySelectorAll("#tables table");

    if (tables.length < 2) {
        alert("Generate tables first.");
        return;
    }

    const alloc = readMatrix(0);
    const req = readMatrix(1);

    const graph = buildWaitForGraph(alloc, req);
    const deadlock = detectCycle(graph);

    let html = `
        <table style="margin-top:15px;">
            <tr>
                <th>Mode</th>
                <th>Result</th>
            </tr>
            <tr>
                <td>Detection</td>
                <td>${deadlock ? "Deadlock ⚠️" : "Safe ✅"}</td>
            </tr>
            <tr>
                <td>Hold & Wait Disabled</td>
                <td>No Deadlock (Prevented)</td>
            </tr>
        </table>
    `;

    document.getElementById("result").innerHTML = html;
}


/* ========================================
   EXPORT PDF
======================================== */

function exportPDF() {

    if (!window.jspdf) {
        alert("jsPDF library not loaded.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("OS Virtual Lab – Deadlock Analysis", 20, 20);

    doc.setFontSize(12);

    const resultText =
        document.getElementById("result").innerText || "No result yet.";

    doc.text(resultText, 20, 40);

    doc.save("Deadlock_Analysis.pdf");
}


/* ========================================
   THEME TOGGLE
======================================== */

function toggleTheme() {

    const current =
        document.documentElement.getAttribute("data-theme");

    const next = current === "light" ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
}

(function () {

    const saved = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);

})();
