const express = require('express');
const mongoose = require('mongoose');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.static('public'));

 const MONGO_URI = process.env.MONGO_URI || "mongodb://admin:Aadibhai1@ac-eslpjtn-shard-00-00.2nhq0cl.mongodb.net:27017,ac-eslpjtn-shard-00-01.2nhq0cl.mongodb.net:27017,ac-eslpjtn-shard-00-02.2nhq0cl.mongodb.net:27017/AnkitBrokers?ssl=true&replicaSet=atlas-qr4pw0-shard-0&authSource=admin&appName=Cluster0"; 

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000, family: 4 })
.then(() => console.log("✅ Database Connected"))
.catch(err => console.error("❌ DB Error:", err.message));

const ReceiptSchema = new mongoose.Schema({
    doNumber: String,
    date: String,
    tenderDate: String,
    season: String,
    md: String,
    billTo: { name: String, place: String, city: String, gst: String },
    shipTo: { name: String, place: String, city: String, gst: String },
    utrDetails: [{ utrNumber: String, amount: String, date: String }],
    orderItems: [{ grade: String, rate: String, quantity: String }],
    vehicle: String,
    total: String,
    note: String
}, { timestamps: true });

const Receipt = mongoose.model('Receipt', ReceiptSchema);

app.get('/data', async (req, res) => {
    const receipts = await Receipt.find().sort({ createdAt: -1 });
    res.json(receipts.map(r => ({ ...r._doc, id: r._id })));
});

app.post('/save', async (req, res) => {
    if (req.body.id) await Receipt.findByIdAndUpdate(req.body.id, req.body);
    else await new Receipt(req.body).save();
    res.json({ message: 'Saved successfully' });
});

app.delete('/delete/:id', async (req, res) => {
    await Receipt.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
});

app.post('/generate-pdf', async (req, res) => {
    let browser;
    try {
        const data = req.body;
        const isLocal = !process.env.PORT;
        let launchOptions = isLocal ? {
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            headless: "new", args: ['--no-sandbox']
        } : {
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        };

        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Sanskrit&display=swap" rel="stylesheet">
<style>
    @page { size: A4; margin: 8mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #000; line-height: 1.2; }
    
    .invocation { text-align: center; font-weight: bold; font-size: 14px; font-family: 'Tiro Devanagari Sanskrit', serif; margin-bottom: 4px; }
    .outer-border { border: 1.5px solid #000; padding: 10px; }
    
    /* Header Area */
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 10px; }
    .firm-name { font-size: 32px; font-weight: 900; color: #b91c1c; margin-bottom: 2px; }
    .firm-type { font-size: 12px; font-weight: bold; margin-bottom: 2px; }
    .firm-addr { font-size: 9px; }
    .jurisdiction { font-size: 8.5px; font-style: italic; margin-top: 2px; }
    
    .do-banner { color: #b91c1c; text-align: center; font-size: 18px; font-weight: bold; margin: 8px 0; border-top: 1px solid #eee; padding-top: 5px; }

     .payment-title {
    font-weight: bold;
    font-size: 13px;
    margin-bottom: 5px;
    color: #b91c1c;
    letter-spacing: 0.3px;
  }
    
    /* Integrated Info Grid */
    .compact-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .compact-table td, .compact-table th { border: 1px solid #000; padding: 5px 8px; vertical-align: top; }
    
    .label-cell { background: #e5e7eb; font-weight: bold; text-align: center; font-size: 9.5px; }
    .right-align { text-align: right; }
    .bold-text { font-weight: bold; }
    
    /* Footnote section */
    .footer { display: flex; justify-content: space-between; margin-top: 15px; font-size: 9.5px; }
    .note-text { width: 70%; line-height: 1.4; }
    .sign-area { width: 25%; text-align: right; font-weight: bold; }
</style>
</head>
<body>
<div class="invocation">|| जय श्री कृष्णा ||</div>
<div class="outer-border">
    <div class="header">
        <h1 class="firm-name">ANKIT BROKERS</h1>
        <div class="firm-type">SUGAR BROKER & COMMISSION AGENT</div>
        <div class="firm-addr">SIYAGANJ, INDORE, 452001 (MP) | Mob: 9425951212, 9424052922</div>
        <div class="jurisdiction">SUBJECT TO INDORE JURISDICTION</div>
    </div>

    <div class="do-banner">DELIVERY ORDER</div>

    <!-- Compact Ref Table -->
    <table style="width: 100%; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 5px;">
        <tr>
            <td style="font-size: 11px;">
                <span class="bold-text">THE MANAGING DIRECTOR SIR,</span><br>
                MILL NAME:- <span class="bold-text">${data.md}</span>
            </td>
            <td style="text-align: right; font-size: 11px;">
                <span class="bold-text">DO. NO :-</span> ${data.doNumber}<br>
                <span class="bold-text">DATE :-</span> ${data.date}
            </td>
        </tr>
    </table>
    <div style="font-size: 10px; padding: 4px 0; border-bottom: 1px solid #000; margin-bottom: 8px;">
        <span class="bold-text">TENDER DATE:</span> ${data.tenderDate}
    </div>

    <!-- Billed / Shipped Section -->
    <table class="compact-table">
        <tr>
            <td class="label-cell">BILLED TO.</td>
            <td class="label-cell">SHIPPED TO.</td>
        </tr>
        <tr>
            <td>
                <span class="bold-text">${data.billTo.name}</span><br>
                ${data.billTo.place}<br>
                ${data.billTo.city}<br>
                <span class="bold-text"><br><hr><br>GSTIN: ${data.billTo.gst}</span>
            </td>
            <td>
                <span class="bold-text">${data.shipTo.name}</span><br>
                ${data.shipTo.place}<br>
                ${data.shipTo.city}<br>
                <span class="bold-text"><br><hr><br>GSTIN: ${data.shipTo.gst}</span>
            </td>
        </tr>
    </table>

    <!-- Order Items Section -->
  <table class="compact-table" style="text-align: center;">
    <thead>
        <tr>
            <th class="label-cell">SEASON</th>
            <th class="label-cell">GRADE</th>
            <th class="label-cell">MILL RATE</th>
            <th class="label-cell">QUINTALS</th>
            <th class="label-cell">VEHICLE NUMBER</th>
        </tr>
    </thead>
    <tbody>
        ${(data.orderItems || []).map((item, index) => `
            <tr>
                <td>${item.season}</td>
                <td>${item.grade}</td>
                <td>${item.rate}</td>
                <td>${item.quantity}</td>
                ${index === 0 ? `<td rowspan="${data.orderItems.length}" style="vertical-align: middle; font-weight: bold;">${data.vehicle}</td>` : ''}
            </tr>
        `).join('')}
        <tr>
            <td colspan="4" class="right-align bold-text" style="font-size: 10px;">SUGAR AMT :-</td>
            <td class="bold-text" style="font-size: 11px;">${data.total}</td>
        </tr>
    </tbody>
</table>

    
     <!-- PAYMENT DETAILS -->
  <div class="payment-title">PAYMENT DETAILS &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; MILL PAYMENT</div>
    <table class="compact-table" style="text-align: center;">
        <thead>
            <tr>
                <th class="label-cell">DATE</th>
                <th class="label-cell">UTR NUMBER</th>
                <th class="label-cell">AMOUNT</th>
            </tr>
        </thead>
        <tbody>
            ${(data.utrDetails || []).map(u => `
                <tr><td>${u.date}</td><td>${u.utrNumber}</td><td>${u.amount}</td></tr>
            `).join('')}
            <tr>
                <td colspan="2" class="right-align bold-text" style="color: #b91c1c; font-size: 10px;">TOTAL AMOUNT :-</td>
                <td class="bold-text" style="font-size: 11px;">${data.total}</td>
            </tr>
        </tbody>
    </table>

    <!-- Footer -->
    <div class="footer">
        <div class="note-text">
            <span class="bold-text">NOTE:</span><br>
            Please Confirm The RTGS Amount Credited To Your A/C At Your Risk & Then Load The Vehicle.<br>
            Please Load Dry And Fresh Goods.<br>
            <span class="bold-text">THANK YOU</span>
        </div>
        <div class="sign-area">
            For ANKIT BROKERS<br><br><br>
           
        </div>
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

app.listen(process.env.PORT || 3000, () => console.log("Server Live"));