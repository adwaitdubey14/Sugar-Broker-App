const express = require('express');
const mongoose = require('mongoose');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// --- 1. DATABASE CONNECTION ---
// On your laptop, you can paste the string in the quotes. 
// On Render, it will automatically use the secret "MONGO_URI" you set in the dashboard.
const MONGO_URI = process.env.MONGO_URI || "mongodb://admin:<db_password>@ac-eslpjtn-shard-00-00.2nhq0cl.mongodb.net:27017,ac-eslpjtn-shard-00-01.2nhq0cl.mongodb.net:27017,ac-eslpjtn-shard-00-02.2nhq0cl.mongodb.net:27017/AnkitBrokers?ssl=true&replicaSet=atlas-qr4pw0-shard-0&authSource=admin&appName=Cluster0";

mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    family: 4 // Keeps the connection on IPv4 for better local stability
})
.then(() => console.log("✅ Permanent Cloud Database Connected"))
.catch(err => {
    console.error("❌ Database Connection Error!");
    console.error("Message:", err.message);
});

// --- 2. DATA SCHEMA ---
const ReceiptSchema = new mongoose.Schema({
    date: String,
    md: String,
    billTo: { name: String, place: String, city: String, gst: String },
    shipTo: { name: String, place: String, city: String, gst: String },
    utrDetails: [{ utrNumber: String, amount: String, date: String }],
    quantity: String,
    grade: String,
    rate: String,
    vehicle: String,
    total: String,
    transportId: String,
    note: String
}, { timestamps: true });

const Receipt = mongoose.model('Receipt', ReceiptSchema);

// --- 3. ROUTES ---

// Fetch all records
app.get('/data', async (req, res) => {
    try {
        const receipts = await Receipt.find().sort({ createdAt: -1 });
        const formatted = receipts.map(r => ({ ...r._doc, id: r._id }));
        res.json(formatted);
    } catch (err) { res.status(500).send(err.message); }
});

// Save or Update
app.post('/save', async (req, res) => {
    try {
        if (req.body.id) {
            await Receipt.findByIdAndUpdate(req.body.id, req.body);
        } else {
            const newReceipt = new Receipt(req.body);
            await newReceipt.save();
        }
        res.json({ message: 'Saved successfully' });
    } catch (err) { res.status(500).send(err.message); }
});

// Delete
app.delete('/delete/:id', async (req, res) => {
    try {
        await Receipt.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).send(err.message); }
});

// PDF Generation
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
        const pdfBuffer = await page.pdf({ 
            format: 'A4', 
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        });
        
        await browser.close();
        res.contentType("application/pdf").send(pdfBuffer);
    } catch (err) {
        if (browser) await browser.close();
        res.status(500).send(err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live at http://localhost:${PORT}`));