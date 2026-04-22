const express = require('express');
const fs = require('fs');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const FILE = 'data.json';

// --- DATA UTILITIES ---
function readData() {
    try {
        const raw = fs.readFileSync(FILE, 'utf8');
        return JSON.parse(raw || '[]');
    } catch { return []; }
}

function writeData(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
}

// --- ROUTES ---
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
    res.json({ message: 'Deleted successfully' });
});

app.post('/generate-pdf', async (req, res) => {
    let browser;
    try {
        const data = req.body;
        const isLocal = !process.env.PORT; // If no PORT, we are testing on your laptop
        
        let launchOptions = {};

        if (isLocal) {
            // 🔥 SEARCH FOR CHROME ON WINDOWS
            const paths = [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
            ];
            const executablePath = paths.find(p => fs.existsSync(p));
            
            if (!executablePath) {
                return res.status(500).send("Chrome not found on your computer. Install Google Chrome.");
            }

            launchOptions = {
                executablePath,
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            };
        } else {
            // ☁️ RENDER CLOUD SETTINGS
            launchOptions = {
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
            };
        }

        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        const html = `
        <html>
        <head>
            <style>
                body { font-family: 'Arial', sans-serif; padding: 10px; color: #000; line-height: 1.2; }
                .main-border { border: 2px solid black; padding: 10px; }
                .header-box { text-align: center; margin-bottom: 10px; }
                .client-title { font-size: 28px; font-weight: bold; text-decoration: underline; margin: 0; letter-spacing: 1px; }
                .sub-title-wrap { border: 1.5px solid black; display: inline-block; padding: 4px 20px; margin: 8px 0; font-weight: bold; font-size: 14px; }
                .contact-line { font-size: 11px; margin: 2px 0; }
                .jurisdiction { font-size: 10px; font-weight: bold; margin-top: 5px; border-top: 1px solid #eee; padding-top: 2px; }
                .memo-bar { background: #e0f2fe; border: 1.5px solid black; padding: 5px; font-weight: bold; margin-top: 8px; font-size: 15px; text-transform: uppercase; }
                .top-info { width: 100%; border-collapse: collapse; margin-top: 10px; }
                .top-info td { border: 1.5px solid black; padding: 8px; font-size: 12px; vertical-align: top; }
                .address-section { width: 100%; border-collapse: collapse; margin-top: -1.5px; }
                .address-section td { border: 1.5px solid black; padding: 8px; width: 50%; vertical-align: top; font-size: 11px; }
                .section-label { background: #f1f5f9; font-weight: bold; text-align: center; border-bottom: 1.5px solid black !important; font-size: 12px; }
                .item-table { width: 100%; border-collapse: collapse; margin-top: -1.5px; }
                .item-table th, .item-table td { border: 1.5px solid black; padding: 8px; text-align: center; font-size: 12px; }
                .item-table th { background: #f1f5f9; }
                .payment-header { color: #b91c1c; font-weight: bold; font-size: 12px; padding: 5px; border: 1.5px solid black; border-bottom: none; margin-top: 10px; }
                .utr-table { width: 100%; border-collapse: collapse; }
                .utr-table th, .utr-table td { border: 1.5px solid black; padding: 6px; font-size: 11px; text-align: center; }
                .utr-table th { background: #f1f5f9; }
                .footer-box { margin-top: 15px; display: flex; justify-content: space-between; font-size: 11px; }
                .stamp-side { text-align: right; font-weight: bold; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="main-border">
                <div class="header-box">
                    <h1 class="client-title">ANKIT BROKERS</h1>
                    <div class="sub-title-wrap">SUGAR BROKER AND COMMISSION AGENT</div>
                    <p class="contact-line">Siyaganj, Indore 452001 (M.P.)</p>
                    <p class="contact-line">Ph.: 2464600, 4055540, Mob.: 9425951212, 9424052922</p>
                    <div class="jurisdiction">SUBJECT TO INDORE JURISDICTION</div>
                    <div class="memo-bar">SUGAR DELIVERY MEMO</div>
                </div>

                <table class="top-info">
                    <tr>
                        <td width="65%"><b>THE MANAGING DIRECTOR SIR,</b><br>MILL NAME: <b>${data.md || ''}</b></td>
                        <td width="35%"><b>DATE:</b> ${data.date || ''}<br><b>TRUCK NO:</b> ${data.vehicle || ''}</td>
                    </tr>
                </table>

                <table class="address-section">
                    <tr><td class="section-label">BILL TO.</td><td class="section-label">SHIPPED TO.</td></tr>
                    <tr>
                        <td><b>${data.billTo?.name || ''}</b><br>${data.billTo?.place || ''}<br><b>${data.billTo?.city || ''}</b><br>GST: ${data.billTo?.gst || ''}</td>
                        <td><b>${data.shipTo?.name || ''}</b><br>${data.shipTo?.place || ''}<br><b>${data.shipTo?.city || ''}</b><br>GST: ${data.shipTo?.gst || ''}</td>
                    </tr>
                </table>

                <table class="item-table">
                    <thead><tr><th>QTY (BAGS)</th><th>GRADE</th><th>MILL RATE</th><th>SUGAR AMT</th></tr></thead>
                    <tbody><tr><td><b>${data.quantity || ''}</b></td><td>${data.grade || ''}</td><td>${data.rate || ''}</td><td><b>${data.total || ''}</b></td></tr></tbody>
                </table>

                <div class="payment-header">PAYMENT DETAILS / MILL PAYMENT</div>
                <table class="utr-table">
                    <thead><tr><th>DATE</th><th>UTR NUMBER</th><th>AMOUNT</th></tr></thead>
                    <tbody>
                        ${(data.utrDetails || []).map(utr => `
                            <tr>
                                <td>${utr.date || ''}</td>
                                <td>${utr.utrNumber || ''}</td>
                                <td>${utr.amount || ''}</td>
                            </tr>
                        `).join('')}
                        <tr style="font-weight:bold; background:#f8fafc">
                            <td colspan="2" style="text-align:right">TOTAL AMOUNT :-</td>
                            <td>${data.total || ''}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="footer-box">
                    <div><b>REMARK:</b> ${data.note || ''}<br>THANK YOU</div>
                    <div class="stamp-side">For Ankit Brokers<br><br><br>Proprietor</div>
                </div>
            </div>
        </body>
        </html>
        `;

        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        
        await browser.close();

        res.contentType("application/pdf");
        res.send(pdfBuffer);

    } catch (err) {
        console.error("PDF ERROR:", err);
        if (browser) await browser.close();
        res.status(500).send("Error generating PDF: " + err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));