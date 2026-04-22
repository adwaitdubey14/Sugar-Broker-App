const express = require('express');
const fs = require('fs');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const FILE = 'data.json';

function readData() {
    try {
        const raw = fs.readFileSync(FILE, 'utf8');
        return JSON.parse(raw || '[]');
    } catch { return []; }
}

function writeData(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/data', (req, res) => res.json(readData()));

app.post('/save', (req, res) => {
    const data = readData();
    if (req.body.id) {
        const updated = data.map(item => String(item.id) === String(req.body.id) ? { ...req.body } : item);
        writeData(updated);
    } else {
        const newEntry = { id: String(Date.now()), ...req.body };
        data.push(newEntry);
        writeData(data);
    }
    res.json({ message: 'Saved' });
});

app.delete('/delete/:id', (req, res) => {
    const data = readData().filter(item => String(item.id) !== String(req.params.id));
    writeData(data);
    res.json({ message: 'Deleted' });
});

/* app.post('/generate-pdf', async (req, res) => {
    let browser;
    try {
        const data = req.body;
        browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
        const page = await browser.newPage();

        const html = `
        <html>
        <head>
            <style>
                body { font-family: Arial; font-size: 12px; padding: 20px; }
                .main { border: 2px solid black; padding: 10px; }
                .header { text-align: center; font-size: 20px; font-weight: bold; }
                .top-row { display: flex; justify-content: space-between; margin-top: 10px; }
                .section { border: 1px solid black; padding: 8px; margin-top: 10px; }
                .flex { display: flex; justify-content: space-between; }
                .half { width: 48%; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid black; padding: 6px; text-align: center; }
                .label { font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="main">
                <div class="header">ANKIT BROKERS</div>
                <div class="top-row">
                    <div><b>Date:</b> ${data.date || ''}</div>
                    <div><b>MD:</b> ${data.md || ''}</div>
                </div>
                <div class="section flex">
                    <div class="half">
                        <div class="label">Bill To</div>
                        <div>${data.billTo?.name || ''}</div>
                        <div>${data.billTo?.place || ''}</div>
                        <div>${data.billTo?.gst || ''}</div>
                    </div>
                    <div class="half">
                        <div class="label">Ship To</div>
                        <div>${data.shipTo?.name || ''}</div>
                        <div>${data.shipTo?.place || ''}</div>
                        <div>${data.shipTo?.gst || ''}</div>
                    </div>
                </div>
                <table>
                    <tr><th>Quantity</th><th>Grade</th><th>Rate</th><th>Total</th><th>Vehicle No</th></tr>
                    <tr>
                        <td>${data.quantity || ''}</td>
                        <td>${data.grade || ''}</td>
                        <td>${data.rate || ''}</td>
                        <td>${data.total || ''}</td>
                        <td>${data.vehicle || ''}</td>
                    </tr>
                </table>
                <div class="section">
                    <div class="label">UTR Details</div>
                    <table>
                        <tr><th>UTR No</th><th>Amount</th><th>Date</th></tr>
                        <tr><td>${data.utr1 || ''}</td><td>${data.utr1Amount || ''}</td><td>${data.utr1Date || ''}</td></tr>
                        <tr><td>${data.utr2 || ''}</td><td>${data.utr2Amount || ''}</td><td>${data.utr2Date || ''}</td></tr>
                    </table>
                </div>
                <div class="section">
                    <div><b>Transport ID:</b> ${data.transportId || ''}</div>
                    <div><b>Note:</b> ${data.note || ''}</div>
                </div>
            </div>
        </body>
        </html>`;

        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=receipt.pdf' });
        res.send(pdfBuffer);
    } catch (e) {
        console.error(e);
        res.status(500).send("Error");
    } finally {
        if (browser) await browser.close();
    }
}); */

app.post('/generate-pdf', async (req, res) => {
    let browser;

    try {
        const data = req.body;

 browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: chromium.defaultViewport,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless
});

        const page = await browser.newPage();

        const html = `
        <html>
        <head>
            <style>
                body { font-family: Arial; font-size: 12px; padding: 20px; }
                .main { border: 2px solid black; padding: 10px; }
                .header { text-align: center; font-size: 20px; font-weight: bold; }
                .top-row { display: flex; justify-content: space-between; margin-top: 10px; }
                .section { border: 1px solid black; padding: 8px; margin-top: 10px; }
                .flex { display: flex; justify-content: space-between; }
                .half { width: 48%; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid black; padding: 6px; text-align: center; }
                .label { font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="main">
                <div class="header">ANKIT BROKERS</div>

                <div class="top-row">
                    <div><b>Date:</b> ${data.date || ''}</div>
                    <div><b>MD:</b> ${data.md || ''}</div>
                </div>

                <div class="section flex">
                    <div class="half">
                        <div class="label">Bill To</div>
                        <div>${data.billTo?.name || ''}</div>
                        <div>${data.billTo?.place || ''}</div>
                        <div>${data.billTo?.gst || ''}</div>
                    </div>

                    <div class="half">
                        <div class="label">Ship To</div>
                        <div>${data.shipTo?.name || ''}</div>
                        <div>${data.shipTo?.place || ''}</div>
                        <div>${data.shipTo?.gst || ''}</div>
                    </div>
                </div>

                <table>
                    <tr>
                        <th>Quantity</th>
                        <th>Grade</th>
                        <th>Rate</th>
                        <th>Total</th>
                        <th>Vehicle No</th>
                    </tr>
                    <tr>
                        <td>${data.quantity || ''}</td>
                        <td>${data.grade || ''}</td>
                        <td>${data.rate || ''}</td>
                        <td>${data.total || ''}</td>
                        <td>${data.vehicle || ''}</td>
                    </tr>
                </table>

                <div class="section">
                    <div class="label">UTR Details</div>
                    <table>
                        <tr>
                            <th>UTR No</th>
                            <th>Amount</th>
                            <th>Date</th>
                        </tr>
                        <tr>
                            <td>${data.utr1 || ''}</td>
                            <td>${data.utr1Amount || ''}</td>
                            <td>${data.utr1Date || ''}</td>
                        </tr>
                        <tr>
                            <td>${data.utr2 || ''}</td>
                            <td>${data.utr2Amount || ''}</td>
                            <td>${data.utr2Date || ''}</td>
                        </tr>
                    </table>
                </div>

                <div class="section">
                    <div><b>Transport ID:</b> ${data.transportId || ''}</div>
                    <div><b>Note:</b> ${data.note || ''}</div>
                </div>
            </div>
        </body>
        </html>
        `;

        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true
        });

        await browser.close();

        // ✅ FIXED RESPONSE (THIS IS THE MAIN FIX)
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="receipt.pdf"');
        res.setHeader('Content-Length', pdfBuffer.length);

        return res.send(pdfBuffer);

    } catch (err) {
        console.error("PDF ERROR:", err);
        if (browser) await browser.close();
        res.status(500).send("PDF generation failed");
    }
});

/* app.listen(3001, () => console.log('Server running at http://localhost:3001')); */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));