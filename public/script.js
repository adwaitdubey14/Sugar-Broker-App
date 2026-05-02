/* let editId = null;

function validateGST(gst) {
    if (!gst || gst.trim() === "") return true;
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst.toUpperCase());
}

function setupGSTListeners() {
    const gstInputs = ['billGST', 'shipGST'];
    gstInputs.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
            if (e.target.value.length > 0 && !validateGST(e.target.value)) {
                e.target.style.border = "2px solid #ef4444";
                e.target.style.backgroundColor = "#fef2f2";
            } else {
                e.target.style.border = "";
                e.target.style.backgroundColor = "";
            }
        });
    });
}

function setupSearchFilter() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    searchInput.addEventListener('keyup', function() {
        const filter = this.value.toUpperCase();
        const rows = document.querySelector("#dataTable tbody").rows;
        for (let i = 0; i < rows.length; i++) {
            const clientName = rows[i].cells[2].textContent || rows[i].cells[2].innerText;
            rows[i].style.display = clientName.toUpperCase().includes(filter) ? "" : "none";
        }
    });
}

// DYNAMIC GRADE ROWS logic
function addGradeRow(data = { season: '2025-26', grade: '', rate: '', quantity: '' }) {
    const container = document.getElementById('gradeContainer');
    const div = document.createElement('div');
    div.className = 'grade-row';
    div.style.marginBottom = "10px";
    div.style.padding = "10px";
    div.style.background = "#f8fafc";
    div.style.borderRadius = "8px";
    div.innerHTML = `
        <div class="form-grid">
            <input class="row-season" placeholder="Season" value="${data.season || ''}">
            <input class="row-grade" placeholder="Grade" value="${data.grade || ''}">
            <input class="row-rate" type="number" placeholder="Rate" value="${data.rate || ''}" oninput="calculate()">
            <input class="row-qty" type="number" placeholder="Quintals" value="${data.quantity || ''}" oninput="calculate()">
            <button class="btn-danger" type="button" onclick="this.parentElement.parentElement.remove(); calculate();">Remove</button>
        </div>
    `;
    container.appendChild(div);
}

function addUTRRow(data = { utrNumber: '', amount: '', date: '' }) {
    const container = document.getElementById('utrContainer');
    const div = document.createElement('div');
    div.className = 'utr-row';
    div.innerHTML = `
        <div class="form-grid" style="margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:10px;">
            <input class="utr-num" placeholder="UTR Number" value="${data.utrNumber || ''}">
            <input class="utr-amt" type="number" placeholder="Amount" value="${data.amount || ''}">
            <input class="utr-date" type="date" value="${data.date || ''}">
            <button class="btn-danger" type="button" onclick="this.parentElement.parentElement.remove()">Remove</button>
        </div>
    `;
    container.appendChild(div);
}

function calculate() {
    let subtotal = 0;
    const rows = document.querySelectorAll('.grade-row');
    rows.forEach(row => {
        const rate = parseFloat(row.querySelector('.row-rate').value) || 0;
        const qty = parseFloat(row.querySelector('.row-qty').value) || 0;
        subtotal += (rate * qty);
    });
    document.getElementById('total').value = (subtotal * 1.05).toFixed(2);
}

function copyBilling() {
    document.getElementById('shipName').value = document.getElementById('billName').value;
    document.getElementById('shipPlace').value = document.getElementById('billPlace').value;
    document.getElementById('shipCity').value = document.getElementById('billCity').value;
    document.getElementById('shipGST').value = document.getElementById('billGST').value;
}

function getFormData() {
    const gradeRows = document.querySelectorAll('.grade-row');
    const orderItems = Array.from(gradeRows).map(row => ({
        season: row.querySelector('.row-season').value,
        grade: row.querySelector('.row-grade').value,
        rate: row.querySelector('.row-rate').value,
        quantity: row.querySelector('.row-qty').value
    }));

    return {
        doNumber: document.getElementById('doNumber').value,
        date: document.getElementById('date').value,
        tenderDate: document.getElementById('tenderDate').value,
        md: document.getElementById('md').value,
        billTo: {
            name: document.getElementById('billName').value,
            place: document.getElementById('billPlace').value,
            city: document.getElementById('billCity').value,
            gst: document.getElementById('billGST').value
        },
        shipTo: {
            name: document.getElementById('shipName').value,
            place: document.getElementById('shipPlace').value,
            city: document.getElementById('shipCity').value,
            gst: document.getElementById('shipGST').value
        },
        orderItems, // Now includes Season per item
        utrDetails: Array.from(document.querySelectorAll('.utr-row')).map(row => ({
            utrNumber: row.querySelector('.utr-num').value,
            amount: row.querySelector('.utr-amt').value,
            date: row.querySelector('.utr-date').value
        })),
        vehicle: document.getElementById('vehicle').value,
        total: document.getElementById('total').value,
        note: document.getElementById('note').value
    };
}

async function saveData() {
    const data = getFormData();
    if (editId) data.id = editId;
    await fetch('/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    alert("✅ Record Saved Successfully");
    editId = null;
    await loadData();
    showTable();
    resetForm();
}

async function loadData() {
    const res = await fetch('/data');
    const data = await res.json();
    const table = document.querySelector('#dataTable tbody');
    table.innerHTML = '';
    data.forEach(item => {
        const id = item.id || item._id; 
        table.innerHTML += `
            <tr>
                <td>${item.date || ''}</td>
                <td>${item.md || ''}</td>
                <td>${item.billTo?.name || ''}</td>
                <td>${item.vehicle || ''}</td>
                <td>${item.total || ''}</td>
                <td>
                    <button class="btn-sm" onclick="editData('${id}')">Edit</button>
                    <button class="btn-sm btn-danger" onclick="deleteData('${id}')">Delete</button>
                    <button class="btn-sm btn-primary" onclick="downloadPDF('${id}')">PDF</button>
                </td>
            </tr>`;
    });
}

async function downloadPDF(id) {
    const res = await fetch('/data');
    const data = await res.json();
    const item = data.find(i => (i.id || i._id) === String(id));
    if (item) sendToPDF(item);
}

function generatePDF() { 
    sendToPDF(getFormData()); 
}

async function sendToPDF(itemData) {
    try {
        const response = await fetch('/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DO_${itemData.doNumber || 'Draft'}.pdf`;
        a.click();
    } catch (err) { alert("PDF Error"); }
}

async function deleteData(id) {
    if (confirm('Delete?')) {
        await fetch('/delete/' + encodeURIComponent(id), { method: 'DELETE' });
        loadData();
    }
}

async function editData(id) {
    const res = await fetch('/data');
    const data = await res.json();
    const item = data.find(i => (i.id || i._id) === String(id));
    if (!item) return;
    
    editId = item.id || item._id;
    document.getElementById('doNumber').value = item.doNumber || '';
    document.getElementById('date').value = item.date || '';
    document.getElementById('tenderDate').value = item.tenderDate || '';
    document.getElementById('season').value = item.season || '';
    document.getElementById('md').value = item.md || '';
    document.getElementById('billName').value = item.billTo?.name || '';
    document.getElementById('billPlace').value = item.billTo?.place || '';
    document.getElementById('billCity').value = item.billTo?.city || '';
    document.getElementById('billGST').value = item.billTo?.gst || '';
    document.getElementById('shipName').value = item.shipTo?.name || '';
    document.getElementById('shipPlace').value = item.shipTo?.place || '';
    document.getElementById('shipCity').value = item.shipTo?.city || '';
    document.getElementById('shipGST').value = item.shipTo?.gst || '';
    document.getElementById('vehicle').value = item.vehicle || '';
    document.getElementById('total').value = item.total || '';
    document.getElementById('note').value = item.note || '';
    
    // Fill Dynamic Grades
    document.getElementById('gradeContainer').innerHTML = '';
    (item.orderItems || []).forEach(g => addGradeRow(g));

    // Fill Dynamic UTRs
    document.getElementById('utrContainer').innerHTML = '';
    (item.utrDetails || []).forEach(u => addUTRRow(u));

    showForm();
}

function resetForm() {
    editId = null;
    document.querySelectorAll('#formSection input, #formSection textarea').forEach(i => i.value = '');
    document.getElementById('gradeContainer').innerHTML = '';
    document.getElementById('utrContainer').innerHTML = '';
    addGradeRow();
    addUTRRow();
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupGSTListeners();
    setupSearchFilter();
    resetForm();
}); */



let editId = null;

// --- NAVIGATION ---
function showForm() {
    document.getElementById('formSection').classList.remove('hidden');
    document.getElementById('tableSection').classList.add('hidden');
    document.getElementById('formBtn').classList.add('active');
    document.getElementById('tableBtn').classList.remove('active');
}

function showTable() {
    document.getElementById('formSection').classList.add('hidden');
    document.getElementById('tableSection').classList.remove('hidden');
    document.getElementById('tableBtn').classList.add('active');
    document.getElementById('formBtn').classList.remove('active');
    loadData();
}

// --- DYNAMIC ROWS ---
function addGradeRow(data = { season: '2025-26', grade: '', rate: '', quantity: '' }) {
    const container = document.getElementById('gradeContainer');
    const div = document.createElement('div');
    div.className = 'dynamic-row grade-row';
    div.innerHTML = `
        <div class="row-inputs">
            <div class="label-group"><label>Season</label><input class="row-season" value="${data.season || '2025-26'}"></div>
            <div class="label-group"><label>Grade</label><input class="row-grade" value="${data.grade || ''}"></div>
            <div class="label-group"><label>Rate</label><input class="row-rate" type="number" value="${data.rate || ''}" oninput="calculate()"></div>
            <div class="label-group"><label>Qty</label><input class="row-qty" type="number" value="${data.quantity || ''}" oninput="calculate()"></div>
        </div>
        <button class="remove-btn" type="button" onclick="this.parentElement.remove(); calculate();">×</button>
    `;
    container.appendChild(div);
}

function addUTRRow(data = { utrNumber: '', amount: '', date: '' }) {
    const container = document.getElementById('utrContainer');
    const div = document.createElement('div');
    div.className = 'dynamic-row utr-row';
    div.innerHTML = `
        <div class="row-inputs">
            <div class="label-group"><label>UTR No</label><input class="utr-num" value="${data.utrNumber || ''}"></div>
            <div class="label-group"><label>Amount</label><input class="utr-amt" type="number" value="${data.amount || ''}"></div>
            <div class="label-group"><label>Date</label><input class="utr-date" type="date" value="${data.date || ''}"></div>
        </div>
        <button class="remove-btn" type="button" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(div);
}

function calculate() {
    let subtotal = 0;
    document.querySelectorAll('.grade-row').forEach(row => {
        const rate = parseFloat(row.querySelector('.row-rate').value) || 0;
        const qty = parseFloat(row.querySelector('.row-qty').value) || 0;
        subtotal += (rate * qty);
    });
    document.getElementById('total').value = (subtotal * 1.05).toFixed(2);
}

function copyBilling() {
    document.getElementById('shipName').value = document.getElementById('billName').value;
    document.getElementById('shipPlace').value = document.getElementById('billPlace').value;
    document.getElementById('shipCity').value = document.getElementById('billCity').value;
    document.getElementById('shipGST').value = document.getElementById('billGST').value;
}

function setupSearchFilter() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    searchInput.addEventListener('keyup', function() {
        const filter = this.value.toUpperCase();
        const rows = document.querySelector("#dataTable tbody").rows;
        for (let i = 0; i < rows.length; i++) {
            const clientName = rows[i].cells[2].textContent || rows[i].cells[2].innerText;
            rows[i].style.display = clientName.toUpperCase().includes(filter) ? "" : "none";
        }
    });
}

function getFormData() {
    return {
        doNumber: document.getElementById('doNumber').value,
        date: document.getElementById('date').value,
        tenderDate: document.getElementById('tenderDate').value,
        md: document.getElementById('md').value,
        billTo: {
            name: document.getElementById('billName').value,
            place: document.getElementById('billPlace').value,
            city: document.getElementById('billCity').value,
            gst: document.getElementById('billGST').value
        },
        shipTo: {
            name: document.getElementById('shipName').value,
            place: document.getElementById('shipPlace').value,
            city: document.getElementById('shipCity').value,
            gst: document.getElementById('shipGST').value
        },
        orderItems: Array.from(document.querySelectorAll('.grade-row')).map(row => ({
            season: row.querySelector('.row-season').value,
            grade: row.querySelector('.row-grade').value,
            rate: row.querySelector('.row-rate').value,
            quantity: row.querySelector('.row-qty').value
        })),
        utrDetails: Array.from(document.querySelectorAll('.utr-row')).map(row => ({
            utrNumber: row.querySelector('.utr-num').value,
            amount: row.querySelector('.utr-amt').value,
            date: row.querySelector('.utr-date').value
        })),
        vehicle: document.getElementById('vehicle').value,
        total: document.getElementById('total').value
    };
}

async function saveData() {
    const data = getFormData();
    if (editId) data.id = editId;
    try {
        await fetch('/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        alert("✅ Record Saved Successfully");
        resetForm();
        showTable();
    } catch (e) { alert("Save Failed"); }
}

async function loadData() {
    const res = await fetch('/data');
    const data = await res.json();
    const tableBody = document.querySelector('#dataTable tbody');
    tableBody.innerHTML = '';
    data.forEach(item => {
        const id = item.id || item._id;
        tableBody.innerHTML += `
            <tr>
                <td>${item.date || ''}</td>
                <td>${item.md || ''}</td>
                <td>${item.billTo?.name || ''}</td>
                <td>${item.vehicle || ''}</td>
                <td>${item.total || ''}</td>
                <td>
                    <button class="btn-sm btn-edit" onclick="editData('${id}')">Edit</button>
                    <button class="btn-sm btn-danger" onclick="deleteData('${id}')">Del</button>
                    <button class="btn-sm btn-primary" onclick="downloadPDF('${id}')">PDF</button>
                </td>
            </tr>`;
    });
}

async function editData(id) {
    const res = await fetch('/data');
    const data = await res.json();
    const item = data.find(i => (i.id || i._id) === id);
    if (!item) return;
    
    editId = item.id || item._id;
    document.getElementById('doNumber').value = item.doNumber || '';
    document.getElementById('date').value = item.date || '';
    document.getElementById('tenderDate').value = item.tenderDate || '';
    document.getElementById('md').value = item.md || '';
    document.getElementById('billName').value = item.billTo?.name || '';
    document.getElementById('billPlace').value = item.billTo?.place || '';
    document.getElementById('billCity').value = item.billTo?.city || '';
    document.getElementById('billGST').value = item.billTo?.gst || '';
    document.getElementById('shipName').value = item.shipTo?.name || '';
    document.getElementById('shipPlace').value = item.shipTo?.place || '';
    document.getElementById('shipCity').value = item.shipTo?.city || '';
    document.getElementById('shipGST').value = item.shipTo?.gst || '';
    document.getElementById('vehicle').value = item.vehicle || '';
    document.getElementById('total').value = item.total || '';
    
    document.getElementById('gradeContainer').innerHTML = '';
    (item.orderItems || []).forEach(g => addGradeRow(g));
    document.getElementById('utrContainer').innerHTML = '';
    (item.utrDetails || []).forEach(u => addUTRRow(u));
    
    showForm();
}

async function deleteData(id) {
    if (confirm('Delete this record?')) {
        await fetch('/delete/' + id, { method: 'DELETE' });
        loadData();
    }
}

async function downloadPDF(id) {
    const res = await fetch('/data');
    const data = await res.json();
    const item = data.find(i => (i.id || i._id) === id);
    if (!item) return;

    const response = await fetch('/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DO_${item.doNumber || 'Record'}.pdf`;
    a.click();
}

function generatePDF() { sendToPDF_Direct(getFormData()); }

async function sendToPDF_Direct(itemData) {
    const response = await fetch('/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DO_Draft.pdf`;
    a.click();
}

function resetForm() {
    editId = null;
    document.querySelectorAll('#formSection input').forEach(i => i.value = '');
    document.getElementById('gradeContainer').innerHTML = '';
    document.getElementById('utrContainer').innerHTML = '';
    addGradeRow();
    addUTRRow();
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupSearchFilter();
    resetForm();
});