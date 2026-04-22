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
        const isLocal = !process.env.PORT;
        
        let launchOptions = {};
        if (isLocal) {
            const paths = [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
            ];
            const executablePath = paths.find(p => fs.existsSync(p));
            launchOptions = {
                executablePath,
                headless: "new",
                args: ['--no-sandbox']
            };
        } else {
            launchOptions = {
                args: chromium.args,
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
                @page { margin: 0; }
                body { 
                    font-family: 'Arial', sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    color: #000; 
                    line-height: 1.3;
                }
                .main-border { 
                    border: 2px solid black; 
                    padding: 20px; 
                    min-height: 94vh; /* 🔥 This stretches the border to full page height */
                    display: flex;
                    flex-direction: column;
                }
                .header-box { text-align: center; margin-bottom: 15px; }
                .client-title { font-size: 32px; font-weight: bold; text-decoration: underline; margin: 0; }
                .sub-title-wrap { border: 2px solid black; display: inline-block; padding: 6px 30px; margin: 10px 0; font-weight: bold; font-size: 16px; }
                .memo-bar { 
                    background: #e0f2fe !important; 
                    -webkit-print-color-adjust: exact; 
                    border: 2px solid black; 
                    padding: 10px; 
                    font-weight: bold; 
                    margin-top: 12px; 
                    font-size: 18px; 
                    text-transform: uppercase; 
                }
                table { width: 100%; border-collapse: collapse; margin-top: -1px; }
                td, th { border: 2px solid black; padding: 12px; font-size: 14px; }
                .section-label { background: #f1f5f9 !important; -webkit-print-color-adjust: exact; font-weight: bold; text-align: center; }
                .footer-box { margin-top: auto; padding-top: 20px; display: flex; justify-content: space-between; font-size: 13px; }
                .stamp-side { text-align: right; font-weight: bold; margin-top: 40px; }
            </style>
        </head>
        <body>
            <div class="main-border">
                <div class="header-box">
                    <h1 class="client-title">ANKIT BROKERS</h1>
                    <div class="sub-title-wrap">SUGAR BROKER AND COMMISSION AGENT</div>
                    <p>Siyaganj, Indore 452001 (M.P.) | Ph.: 2464600 | Mob.: 9425951212</p>
                    <div class="memo-bar">SUGAR DELIVERY MEMO</div>
                </div>

                <table>
                    <tr>
                        <td width="65%"><b>TO:</b> ${data.md || ''}</td>
                        <td width="35%"><b>DATE:</b> ${data.date || ''}<br><b>VEHICLE:</b> ${data.vehicle || ''}</td>
                    </tr>
                </table>

                <table>
                    <tr><td class="section-label">BILL TO</td><td class="section-label">SHIPPED TO</td></tr>
                    <tr>
                        <td><b>${data.billTo?.name || ''}</b><br>${data.billTo?.place || ''}<br>${data.billTo?.city || ''}<br>GST: ${data.billTo?.gst || ''}</td>
                        <td><b>${data.shipTo?.name || ''}</b><br>${data.shipTo?.place || ''}<br>${data.shipTo?.city || ''}<br>GST: ${data.shipTo?.gst || ''}</td>
                    </tr>
                </table>

                <table>
                    <tr class="section-label"><th>QTY</th><th>GRADE</th><th>RATE</th><th>TOTAL</th></tr>
                    <tr><td align="center">${data.quantity || ''}</td><td align="center">${data.grade || ''}</td><td align="center">${data.rate || ''}</td><td align="center"><b>${data.total || ''}</b></td></tr>
                </table>

                <div style="color:red; font-weight:bold; margin-top:15px; border: 2px solid black; border-bottom:none; padding: 5px;">PAYMENT DETAILS</div>
                <table>
                    <tr class="section-label"><th>DATE</th><th>UTR NUMBER</th><th>AMOUNT</th></tr>
                    ${(data.utrDetails || []).map(u => `<tr><td>${u.date}</td><td>${u.utrNumber}</td><td>${u.amount}</td></tr>`).join('')}
                    <tr style="font-weight:bold">
                        <td colspan="2" align="right">TOTAL AMOUNT :-</td>
                        <td align="center">${data.total || ''}</td>
                    </tr>
                </table>

                <div class="footer-box">
                    <div><b>REMARK:</b> ${data.note || ''}<br><br>THANK YOU</div>
                    <div class="stamp-side">For Ankit Brokers<br><br><br><br>Proprietor</div>
                </div>
            </div>
        </body>
        </html>`;

        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ 
            format: 'A4', 
            printBackground: true,
            margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
        });
        
        await browser.close();
        res.contentType("application/pdf").send(pdfBuffer);

    } catch (err) {
        if (browser) await browser.close();
        res.status(500).send(err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));