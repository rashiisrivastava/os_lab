/* ==========================================
   UNIVERSAL REPORT GENERATOR
========================================== */

function getExperimentData() {

    const experimentName =
        document.querySelector("header h1")?.innerText || "OS Virtual Lab";

    const algorithm =
        document.querySelector("select")?.value || "N/A";

    const inputSection =
        document.querySelector(".card")?.innerText || "No Input Data";

    const resultSection =
        document.getElementById("result")?.innerText ||
        document.querySelector("#output")?.innerText ||
        "No Results";

    const dateTime = new Date().toLocaleString();

    return {
        experimentName,
        algorithm,
        inputSection,
        resultSection,
        dateTime
    };
}


/* ==========================================
   PDF EXPORT (PROFESSIONAL FORMAT)
========================================== */

async function generatePDFReport() {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const data = getExperimentData();

    doc.setFontSize(18);
    doc.text("OS Virtual Lab Report", 20, 20);

    doc.setFontSize(12);
    doc.text("Experiment: " + data.experimentName, 20, 35);
    doc.text("Algorithm: " + data.algorithm, 20, 45);
    doc.text("Generated On: " + data.dateTime, 20, 55);

    doc.text("Input Configuration:", 20, 70);
    doc.text(data.inputSection.substring(0, 800), 20, 80);

    doc.addPage();

    doc.text("Results:", 20, 20);
    doc.text(data.resultSection.substring(0, 1000), 20, 30);

    // Capture Graph Screenshot
    const graph = document.querySelector("#gantt, #ram, #graph, #chart");

    if (graph) {
        const canvas = await html2canvas(graph);
        const imgData = canvas.toDataURL("image/png");
        doc.addPage();
        doc.text("Graph Visualization:", 20, 20);
        doc.addImage(imgData, "PNG", 15, 30, 180, 90);
    }

    doc.save(data.experimentName.replace(/\s/g, "_") + "_Report.pdf");
}


/* ==========================================
   DOCX EXPORT
========================================== */

function generateDOCXReport() {

    const data = getExperimentData();

    const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
        <meta charset="utf-8">
        <title>OS Virtual Lab Report</title>
        <style>
            body { font-family: Arial; }
            h1 { text-align: center; }
            h2 { margin-top: 20px; }
            table { border-collapse: collapse; width: 100%; }
            table, th, td { border: 1px solid black; padding: 6px; }
        </style>
    </head>
    <body>

        <h1>OS Virtual Lab Report</h1>

        <p><strong>Experiment:</strong> ${data.experimentName}</p>
        <p><strong>Algorithm:</strong> ${data.algorithm}</p>
        <p><strong>Date:</strong> ${data.dateTime}</p>

        <h2>Input Configuration</h2>
        <p>${data.inputSection.replace(/\n/g, "<br>")}</p>

        <h2>Results</h2>
        <p>${data.resultSection.replace(/\n/g, "<br>")}</p>

        <h2>Conclusion</h2>
        <p>The experiment was successfully executed and analyzed.</p>

    </body>
    </html>
    `;

    const blob = new Blob(
        ['\ufeff', htmlContent],
        { type: "application/vnd.ms-word;charset=utf-8" }
    );

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download =
        data.experimentName.replace(/\s/g, "_") + "_Report.doc";
    link.click();
}

/* ==========================================
   CSV EXPORT
========================================== */

function generateCSVReport() {

    const data = getExperimentData();

    let csv = "Field,Value\n";
    csv += `Experiment,${data.experimentName}\n`;
    csv += `Algorithm,${data.algorithm}\n`;
    csv += `Generated On,${data.dateTime}\n\n`;
    csv += `"Results","${data.resultSection.replace(/\n/g, " ")}"\n`;

    const blob = new Blob([csv], { type: "text/csv" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download =
        data.experimentName.replace(/\s/g, "_") + "_Report.csv";
    link.click();
}
