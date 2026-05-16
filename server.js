const express = require('express');
const mongoose = require('mongoose');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const app = express();
const fs = require('fs');
const path = require('path');

app.use(express.json());
app.use(express.static('public'));

const MONGO_URI = process.env.MONGO_URI || "mongodb://admin:<db_password>@ac-eslpjtn-shard-00-00.2nhq0cl.mongodb.net:27017,ac-eslpjtn-shard-00-01.2nhq0cl.mongodb.net:27017,ac-eslpjtn-shard-00-02.2nhq0cl.mongodb.net:27017/AnkitBrokers?ssl=true&replicaSet=atlas-qr4pw0-shard-0&authSource=admin&appName=Cluster0";


mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000, family: 4 })
.then(() => console.log("✅ Database Connected"))
.catch(err => console.error("❌ DB Error:", err.message));

const ReceiptSchema = new mongoose.Schema({
    businessType: String,
    businessDetails: {
        name: String,
        subtitle: String,
        address: String,
        mobile1: String,
        mobile2: String,
        jurisdiction: String
    },
    doNumber: String,
    date: String,
    tenderDate: String,
    md: String,
    billTo: { name: String, place: String, city: String, gst: String },
    shipTo: { name: String, place: String, city: String, gst: String },
    utrDetails: [{ utrNumber: String, amount: String, date: String }],
    orderItems: [{ season: String, grade: String, rate: String, quantity: String }],
    vehicle: String,
    total: String
}, { timestamps: true });

const Receipt = mongoose.model('Receipt', ReceiptSchema);

app.get('/data', async (req, res) => {
    const receipts = await Receipt.find().sort({ createdAt: -1 });
    res.json(receipts.map(r => ({ ...r._doc, id: r._id })));
});

app.get('/suggest/mills', async (req, res) => {
    const data = await Receipt.distinct('md');
    res.json(data.filter(Boolean));
});

app.get('/suggest/parties', async (req, res) => {
    const billNames = await Receipt.distinct('billTo.name');
    const shipNames = await Receipt.distinct('shipTo.name');
    const combined = [...billNames, ...shipNames];
    const unique = [...new Set(combined)];
    res.json(unique.filter(Boolean));
});

app.get('/next-do/:businessType', async (req, res) => {
    const type = req.params.businessType;
    if (type === 'other') return res.json({ next: '' });

    const latest = await Receipt.findOne({ businessType: type }).sort({ createdAt: -1 });
    let nextNumber = 1;
    if (latest && latest.doNumber) {
        nextNumber = parseInt(latest.doNumber) + 1 || 1;
    }
    res.json({ next: nextNumber });
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

app.get('/ping', (req, res) => res.send('Server Active'));

// 🔥 COMPLETELY FIXED PARTY AUTOFILL LOGIC 🔥

app.get('/party', async (req, res) => {

    try {

        const inputName = (req.query.name || '')
            .trim()
            .replace(/\s+/g, ' ')
            .toUpperCase();
        if (!inputName) {
            return res.json({});
        }

        const records = await Receipt.find().sort({ createdAt: -1 });
        for (const record of records) {

            // BILL TO CHECK
            if (record.billTo?.name) {

                const dbName = record.billTo.name
                    .trim()
                    .replace(/\s+/g, ' ')
                    .toUpperCase();

                if (dbName === inputName) {

                    return res.json({
                        place: record.billTo.place || '',
                        city: record.billTo.city || '',
                        gst: record.billTo.gst || ''
                    });
                }
            }

            // SHIP TO CHECK
            if (record.shipTo?.name) {

                const dbName = record.shipTo.name
                    .trim()
                    .replace(/\s+/g, ' ')
                    .toUpperCase();

                if (dbName === inputName) {

                    return res.json({
                        place: record.shipTo.place || '',
                        city: record.shipTo.city || '',
                        gst: record.shipTo.gst || ''
                    });
                }
            }
        }

        res.json({});

    } catch (e) {


        res.status(500).json({
            error: 'Party Fetch Failed'
        });
    }
});

function getBase64Image(imagePath) {

    try {

        const image = fs.readFileSync(imagePath);

        return `data:image/png;base64,${image.toString('base64')}`;

    } catch (e) {

        console.error('Signature Load Error:', e);

        return '';
    }
}

app.post('/generate-pdf', async (req, res) => {
    let browser;
    try {
        const data = req.body;
        const isLocal = !process.env.PORT;

        let launchOptions = isLocal ? {
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            headless: "new",
            args: ['--no-sandbox']
        } : {
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        };

        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        const ankitSignature = getBase64Image(
    path.join(__dirname, 'public/signatures/ankit-sign.png')
);

const pawanSignature = getBase64Image(
    path.join(__dirname, 'public/signatures/pawan-sign.png')
);

const signature =
    data.businessType === 'pawan'
        ? pawanSignature
        : ankitSignature;

        const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Sanskrit&display=swap" rel="stylesheet">
<style>
    @page { size: A4; margin: 4mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; }
    body { font-family: Arial, sans-serif; font-size: 11.5px; color: #000; line-height: 1.25; }
    .invocation { text-align: center; font-weight: bold; font-size: 15px; font-family: 'Tiro Devanagari Sanskrit', serif; margin-bottom: 3px; }
    .outer-border { border: 1.5px solid #000; padding: 12px; page-break-inside: avoid; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 6px; }
    .firm-name { font-size: 36px; font-weight: 900; color: #b91c1c; margin-bottom: 2px; }
    .firm-type { font-size: 13px; font-weight: bold; }
    .firm-addr { font-size: 10px; }
    .jurisdiction { font-size: 9px; font-style: italic; margin-top: 2px; }
    .do-banner { color: #b91c1c; text-align: center; font-size: 20px; font-weight: bold; margin: 4px 0; border-top: 1px solid #eee; padding-top: 4px; }
    .payment-title { font-weight: bold; font-size: 14px; margin-bottom: 5px; color: #b91c1c; letter-spacing: 0.4px; }
    .compact-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .compact-table td, .compact-table th { border: 1px solid #000; padding: 6px 10px; font-size: 11px; vertical-align: top; }
    .label-cell { background: #e5e7eb; font-weight: bold; text-align: center; }
    .right-align { text-align: right; }
    .bold-text { font-weight: bold; }
    .footer { display: flex; justify-content: space-between; margin-top: 12px; font-size: 10px; }
    .note-text { width: 70%; line-height: 1.4; }
    .sign-area { width: 25%; text-align: right; font-weight: bold; }
</style>
</head>
<body>
<div class="invocation">|| जय श्री कृष्णा ||</div>
<div class="outer-border">
    <div class="header">
        <h1 class="firm-name">${data.businessDetails?.name || 'ANKIT BROKERS'}</h1>
        <div class="firm-type">${data.businessDetails?.subtitle || 'SUGAR BROKER & COMMISSION AGENT'}</div>
        <div class="firm-addr">
            ${data.businessDetails?.address || ''} | Mob: ${data.businessDetails?.mobile1 || ''}${data.businessDetails?.mobile2 ? ', ' + data.businessDetails.mobile2 : ''}
        </div>
        <div class="jurisdiction">SUBJECT TO ${data.businessDetails?.jurisdiction || 'INDORE'} JURISDICTION</div>
    </div>

    <div class="do-banner">DELIVERY ORDER</div>

    <table style="width:100%; margin-bottom:6px; border-bottom:1px solid #000;">
        <tr>
            <td style="font-size:12px;">
                <span class="bold-text">THE MANAGING DIRECTOR SIR,</span><br>
                MILL NAME:- <span class="bold-text">${data.md}</span>
            </td>
            <td style="text-align:right; font-size:12px;">
                <span class="bold-text">DO. NO :-</span> ${data.doNumber}<br>
                <span class="bold-text">DATE :-</span> ${data.date}
            </td>
        </tr>
    </table>

    <div style="font-size:11px; padding:3px 0; border-bottom:1px solid #000; margin-bottom:6px;">
        <span class="bold-text">TENDER DATE:</span> ${data.tenderDate}
    </div>

    <table class="compact-table">
        <tr>
            <td class="label-cell" style="width:50%;">BILLED TO.</td>
            <td class="label-cell" style="width:50%;">SHIPPED TO.</td>
        </tr>
        <tr>
            <td style="height:70px;">
                <span class="bold-text">${data.billTo.name}</span><br>
                ${data.billTo.place}<br>
                ${data.billTo.city}<br>
                <span class="bold-text"><br><hr><br>GSTIN: ${data.billTo.gst}</span>
            </td>
            <td style="height:70px;">
                <span class="bold-text">${data.shipTo.name}</span><br>
                ${data.shipTo.place}<br>
                ${data.shipTo.city}<br>
                <span class="bold-text"><br><hr><br>GSTIN: ${data.shipTo.gst}</span>
            </td>
        </tr>
    </table>

    <table class="compact-table" style="text-align:center;">
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
                <td colspan="4" class="right-align bold-text">SUGAR AMT :-</td>
                <td class="bold-text">${data.total}</td>
            </tr>
        </tbody>
    </table>

    <div class="payment-title">PAYMENT DETAILS &emsp; &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; MILL PAYMENT</div>

    <table class="compact-table" style="text-align:center;">
        <thead>
            <tr>
                <th class="label-cell">DATE</th>
                <th class="label-cell">UTR NUMBER</th>
                <th class="label-cell">AMOUNT</th>
            </tr>
        </thead>
        <tbody>
            ${(data.utrDetails || []).map(u => `
                <tr>
                    <td>${u.date}</td>
                    <td>${u.utrNumber}</td>
                    <td>${u.amount}</td>
                </tr>
            `).join('')}
            <tr>
                <td colspan="2" class="right-align bold-text" style="color:#b91c1c;">TOTAL AMOUNT :-</td>
                <td class="bold-text">${data.total}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        <div class="note-text">
            <span class="bold-text">NOTE:</span><br>
            Please Confirm The RTGS Amount Credited To Your A/C At Your Risk & Then Load The Vehicle.<br>
            Please Load Dry And Fresh Goods.<br>
            <span class="bold-text">THANK YOU</span>
        </div>
        <div class="sign-area">

    <img
        src="${signature}"
        style="
            width:100px;
            height:auto;
            object-fit:contain;
            margin-bottom:8px;
        "
    />

    <div>
        For ${data.businessDetails?.name || 'ANKIT BROKERS'}
    </div>

</div>
    </div>
</div>
</body>
</html>`;

        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.evaluate(() => { document.body.style.zoom = "1.32"; });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
        });

        await browser.close();
        res.contentType("application/pdf").send(pdfBuffer);
    } catch (err) {
        if (browser) await browser.close();
        res.status(500).send(err.message);
    }
});

app.listen(process.env.PORT || 3000, () => console.log("Server Live"));