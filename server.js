const express = require('express');
const mongoose = require('mongoose');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const MONGO_URI = process.env.MONGO_URI || "mongodb://admin:<db_password>@ac-eslpjtn-shard-00-00.2nhq0cl.mongodb.net:27017,ac-eslpjtn-shard-00-01.2nhq0cl.mongodb.net:27017,ac-eslpjtn-shard-00-02.2nhq0cl.mongodb.net:27017/AnkitBrokers?ssl=true&replicaSet=atlas-qr4pw0-shard-0&authSource=admin&appName=Cluster0";

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000, family: 4 })
.then(() => console.log("✅ Permanent Cloud Database Connected"))
.catch(err => console.error("❌ Database Connection Error:", err.message));

const ReceiptSchema = new mongoose.Schema({
    doNumber: String,
    date: String,
    tenderDate: String,
    season: String,
    md: String,
    billTo: { name: String, place: String, city: String, gst: String },
    shipTo: { name: String, place: String, city: String, gst: String },
    utrDetails: [{ utrNumber: String, amount: String, date: String }],
    quantity: String,
    grade: String,
    rate: String,
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

        /* const html = `
        <html>
        <head>
            <style>
                body { font-family: 'Arial', sans-serif; padding: 10px; color: #000; font-size: 12px; }
                .main-container { border: 2px solid #000; padding: 15px; position: relative; }
                .top-invocation { text-align: center; font-weight: bold; margin-bottom: 5px; }
                .header-main { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
                .firm-name { font-size: 34px; font-weight: bold; color: #b91c1c; margin: 0; }
                .firm-type { font-size: 15px; font-weight: bold; margin: 5px 0; }
                .firm-addr { font-size: 11px; margin: 2px 0; }
                .do-title-bar { background: #1e293b; color: #fff; text-align: center; padding: 6px; font-weight: bold; font-size: 19px; margin: 10px 0; }
                .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                .info-grid td { vertical-align: top; padding: 5px 0; font-size: 13px; }
                .address-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                .address-table td { width: 50%; border: 1px solid #000; padding: 10px; vertical-align: top; font-size: 12px; }
                .label-bg { background: #f3f4f6; font-weight: bold; text-align: center; border-bottom: 1px solid #000 !important; }
                .items-table { width: 100%; border-collapse: collapse; text-align: center; margin-bottom: 15px; }
                .items-table th { border: 1px solid #000; background: #f3f4f6; padding: 8px; font-size: 11px; }
                .items-table td { border: 1px solid #000; padding: 10px; font-size: 13px; }
                .utr-section-title { font-weight: bold; font-size: 14px; margin-bottom: 5px; text-decoration: underline; }
                .utr-table { width: 100%; border-collapse: collapse; font-size: 12px; }
                .utr-table th, .utr-table td { border: 1px solid #000; padding: 8px; text-align: center; }
                .footer { margin-top: 25px; display: flex; justify-content: space-between; }
                .note-area { width: 65%; font-size: 11px; line-height: 1.4; }
                .sign-area { width: 30%; text-align: right; font-weight: bold; padding-top: 40px; }
            </style>
        </head>
        <body>
            <div class="top-invocation">|| Shri Mahavirai Namah: ||</div>
            <div class="main-container">
                <div class="header-main">
                    <h1 class="firm-name">ANKIT BROKERS</h1>
                    <div class="firm-type">SUGAR BROKER & COMMISSION AGENT</div>
                    <div class="firm-addr">SIYAGANJ, INDORE, 452001 (MP) | Mob: 9425951212, 9424052922</div>
                    <div style="font-size: 10px; margin-top: 5px;">SUBJECT TO INDORE JURISDICTION</div>
                </div>
                <div class="do-title-bar">DELIVERY ORDER</div>
                <table class="info-grid">
                    <tr>
                        <td width="60%">
                            <b>THE MANAGING DIRECTOR SIR,</b><br>
                            MILL NAME:- <b>${data.md}</b><br><hr>
                            TENDER DATE: ${data.tenderDate}
                        </td>
                        <td width="40%" style="text-align: right;">
                            <b>DO. NO:</b> ${data.doNumber}<br>
                            <b>DATE :-</b> ${data.date}
                        </td>
                    </tr>
                </table>
                <table class="address-table">
                    <tr><td class="label-bg">BILLED TO.</td><td class="label-bg">SHIPPED TO.</td></tr>
                    <tr>
                        <td><b>${data.billTo.name}</b><br>${data.billTo.place}<br>${data.billTo.city}<br><hr><b>GSTIN: ${data.billTo.gst}</b></td>
                        <td><b>${data.shipTo.name}</b><br>${data.shipTo.place}<br>${data.shipTo.city}<br><hr><b>GSTIN: ${data.shipTo.gst}</b></td>
                    </tr>
                </table>
                <table class="items-table">
                    <thead>
                        <tr><th>SEASON</th><th>GRADE</th><th>MILL RATE</th><th>QUINTALS</th><th>VEHICLE NUMBER</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>${data.season}</td><td>${data.grade}</td><td>${data.rate}</td><td>${data.quantity}</td><td>${data.vehicle}</td></tr>
                        <tr>
                            <td colspan="4" style="text-align: right; border-right: none; font-weight: bold;">SUGAR AMT  :-</td>
                            <td style="border-left: none; font-weight: bold;">${data.total}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="utr-section-title" style="color":"#b91c1c">PAYMENT DETAILS</div>
                <table class="utr-table">
                    <thead><tr><th>DATE</th><th>UTR NUMBER</th><th>AMOUNT</th></tr></thead>
                    <tbody>
                        ${(data.utrDetails || []).map(u => `<tr><td>${u.date}</td><td>${u.utrNumber}</td><td>${u.amount}</td></tr>`).join('')}
                        <tr style="font-weight: bold; background: #f3f4f6"><td colspan="2" style="text-align: right","color":"#b91c1c">TOTAL AMOUNT :-</td><td>${data.total}</td></tr>
                    </tbody>
                </table>
                <div class="footer">
                    <div class="note-area"><b>NOTE:</b><br>Please Confirm The RTGS Amount Credited To Your A/C At Your Risk & Then Load The Vehicle.<br>Please Load Dry And Fresh Goods.<br><b>THANK YOU</b></div>
                    <div class="sign-area">For ANKIT BROKERS<br><br></div>
                </div>
            </div>
        </body>
        </html>`; */

 const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: A4;
    margin: 14mm 12mm 14mm 12mm;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, sans-serif;
    font-size: 11px;
    color: #000;
    background: #fff;
  }
 
  /* OUTER BORDER */
  .outer {
    border: 2.5px solid #000;
    padding: 12px 14px 14px 14px;
  }
 
  /* INVOCATION */
  .invocation {
    text-align: center;
    font-weight: bold;
    font-size: 11px;
    margin-bottom: 6px;
    letter-spacing: 0.5px;
  }
 
  /* HEADER */
  .header {
    text-align: center;
    border-bottom: 2px solid #000;
    padding-bottom: 8px;
    margin-bottom: 8px;
  }
  .firm-name {
    font-size: 36px;
    font-weight: 900;
    color: #b91c1c;
    letter-spacing: 1px;
    line-height: 1;
  }
  .firm-type {
    font-size: 13px;
    font-weight: bold;
    margin: 4px 0 2px;
    letter-spacing: 0.3px;
  }
  .firm-addr {
    font-size: 10.5px;
    margin: 1px 0;
  }
  .jurisdiction {
    font-size: 9.5px;
    margin-top: 3px;
    font-style: italic;
  }
 
  /* DELIVERY ORDER BANNER */
  .do-banner {
    color: #b91c1c;
    text-align: center;
    padding: 7px 0;
    font-size: 20px;
    font-weight: bold;
    margin: 5px 0;
  }
 
  /* INFO ROW */
  .info-row {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
  }
  .info-row td {
    vertical-align: top;
    padding: 3px 0;
    font-size: 11.5px;
    line-height: 1.6;
  }
  .info-row .right-col {
    text-align: right;
    white-space: nowrap;
    padding-left: 10px;
  }
 
  /* ADDRESS TABLE */
  .addr-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
  }
  .addr-table td {
    width: 50%;
    border: 1.5px solid #000;
    padding: 7px 9px;
    vertical-align: top;
    font-size: 11px;
    line-height: 1.6;
  }
  .addr-label {
    background: #e5e7eb;
    font-weight: bold;
    text-align: center;
    font-size: 11px;
    padding: 5px 9px;
    border-bottom: 1.5px solid #000 !important;
  }
  .addr-table hr {
    border: none;
    border-top: 1px solid #555;
    margin: 5px 0;
  }
 
  /* ITEMS TABLE */
  .items-table {
    width: 100%;
    border-collapse: collapse;
    text-align: center;
    margin-bottom: 14px;
  }
  .items-table th {
    border: 1.5px solid #000;
    background: #e5e7eb;
    padding: 7px 4px;
    font-size: 10.5px;
    font-weight: bold;
    letter-spacing: 0.2px;
  }
  .items-table td {
    border: 1.5px solid #000;
    padding: 10px 4px;
    font-size: 12px;
  }
  .sugar-label {
    text-align: right;
    font-weight: bold;
    border-right: none !important;
    padding-right: 6px;
    font-size: 11.5px;
  }
  .sugar-val {
    border-left: none !important;
    font-weight: bold;
    font-size: 12px;
  }
 
  /* PAYMENT DETAILS */
  .payment-title {
    font-weight: bold;
    font-size: 13px;
    margin-bottom: 5px;
    color: #b91c1c;
    letter-spacing: 0.3px;
  }
  .utr-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11.5px;
    margin-bottom: 20px;
  }
  .utr-table th {
    border: 1.5px solid #000;
    background: #e5e7eb;
    padding: 7px;
    text-align: center;
    font-size: 10.5px;
    font-weight: bold;
  }
  .utr-table td {
    border: 1.5px solid #000;
    padding: 8px;
    text-align: center;
  }
  .utr-total {
    background: #e5e7eb;
    font-weight: bold;
  }
  .utr-total-label {
    text-align: right;
    padding-right: 8px;
    font-size: 11.5px;
    color: #b91c1c;
  }
 
  /* FOOTER */
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 8px;
  }
  .note-area {
    width: 65%;
    font-size: 10.5px;
    line-height: 1.6;
  }
  .sign-area {
    width: 32%;
    text-align: right;
    font-weight: bold;
    font-size: 11.5px;
  }
  .sign-gap {
    display: block;
    height: 45px;
  }
</style>
</head>
<body>
 
<div class="invocation">|| Shri Mahavirai Namah: ||</div>
 
<div class="outer">
 
  <!-- HEADER -->
  <div class="header">
    <div class="firm-name">ANKIT BROKERS</div>
    <div class="firm-type">SUGAR BROKER &amp; COMMISSION AGENT</div>
    <div class="firm-addr">SIYAGANJ, INDORE, 452001 (MP) | Mob: 9425951212, 9424052922</div>
    <div class="jurisdiction">SUBJECT TO INDORE JURISDICTION</div>
  </div>
 
  <!-- DELIVERY ORDER BANNER -->
  <div class="do-banner">DELIVERY ORDER</div>
 
  <!-- INFO ROW -->
  <table class="info-row">
    <tr>
      <td width="62%">
        <b>THE MANAGING DIRECTOR SIR,</b><br>
        MILL NAME:- &nbsp;<b>${data.md}</b>
      </td>
      <td class="right-col">
        <b>DO. NO :-</b> ${data.doNumber}<br>
        <b>DATE :-</b> ${data.date}
      </td>
    </tr>
  </table>
  <hr style="border:none; border-top:1px solid #000; margin:6px 0; width:100%;">
        TENDER DATE:&nbsp; ${data.tenderDate} <br><br>
 
  <!-- BILLED / SHIPPED TO -->
  <table class="addr-table">
    <tr>
      <td class="addr-label">BILLED TO.</td>
      <td class="addr-label">SHIPPED TO.</td>
    </tr>
    <tr>
      <td>
        <b>${data.billTo.name}</b><br>
        ${data.billTo.place}<br>
        ${data.billTo.city}
        <hr>
        <b>GSTIN: ${data.billTo.gst}</b>
      </td>
      <td>
        <b>${data.shipTo.name}</b><br>
        ${data.shipTo.place}<br>
        ${data.shipTo.city}
        <hr>
        <b>GSTIN: ${data.shipTo.gst}</b>
      </td>
    </tr>
  </table>
 
  <!-- ITEMS TABLE -->
  <table class="items-table">
    <thead>
      <tr>
        <th>SEASON</th>
        <th>GRADE</th>
        <th>MILL RATE</th>
        <th>QUINTALS</th>
        <th>VEHICLE NUMBER</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${data.season}</td>
        <td>${data.grade}</td>
        <td>${data.rate}</td>
        <td>${data.quantity}</td>
        <td>${data.vehicle}</td>
      </tr>
      <tr>
        <td colspan="4" class="sugar-label">SUGAR AMT &nbsp;:-</td>
        <td class="sugar-val">${data.total}</td>
      </tr>
    </tbody>
  </table>
 
  <!-- PAYMENT DETAILS -->
  <div class="payment-title">PAYMENT DETAILS &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; &emsp; MILL PAYMENT</div>
  <table class="utr-table">
    <thead>
      <tr>
        <th>DATE</th>
        <th>UTR NUMBER</th>
        <th>AMOUNT</th>
      </tr>
    </thead>
    <tbody>
      ${(data.utrDetails || []).map(u =>
        `<tr><td>${u.date}</td><td>${u.utrNumber}</td><td>${u.amount}</td></tr>`
      ).join('')}
      <tr class="utr-total">
        <td colspan="2" class="utr-total-label">TOTAL AMOUNT :-</td>
        <td>${data.total}</td>
      </tr>
    </tbody>
  </table>
 
  <!-- FOOTER -->
  <div class="footer">
    <div class="note-area">
      <b>NOTE:</b><br>
      Please Confirm The RTGS Amount Credited To Your A/C At Your Risk &amp; Then Load The Vehicle.<br>
      Please Load Dry And Fresh Goods.<br>
      <b>THANK YOU</b>
    </div>
    <div class="sign-area">
      For ANKIT BROKERS<br>
      <span class="sign-gap"></span>
    </div>
  </div>
 
</div>
</body>
</html>`;

        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }});
        await browser.close();
        res.contentType("application/pdf").send(pdfBuffer);
    } catch (err) {
        if (browser) await browser.close();
        res.status(500).send(err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live at http://localhost:${PORT}`));