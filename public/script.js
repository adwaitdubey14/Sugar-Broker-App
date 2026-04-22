let editId = null;

function addUTRRow(data = { utrNumber: '', amount: '', date: '' }) {
    const container = document.getElementById('utrContainer');
    const div = document.createElement('div');
    div.className = 'utr-row';
    div.style.borderBottom = "1px solid #e2e8f0";
    div.style.paddingBottom = "15px";
    div.style.marginBottom = "15px";
    
    div.innerHTML = `
        <div class="form-grid">
            <div class="label-group"><label>UTR Number</label><input class="utr-num" value="${data.utrNumber || ''}"></div>
            <div class="label-group"><label>Amount</label><input class="utr-amt" type="number" value="${data.amount || ''}"></div>
            <div class="label-group"><label>Date</label><input class="utr-date" type="date" value="${data.date || ''}"></div>
            <button class="btn btn-danger" type="button" onclick="this.parentElement.parentElement.remove()">Remove</button>
        </div>
    `;
    container.appendChild(div);
}

function calculate() {
    const quantity = parseFloat(document.getElementById('quantity').value) || 0;
    const rate = parseFloat(document.getElementById('rate').value) || 0;
    document.getElementById('total').value = (quantity * rate).toFixed(2);
}

function getFormData() {
    const utrRows = document.querySelectorAll('.utr-row');
    const utrArray = Array.from(utrRows).map(row => ({
        utrNumber: row.querySelector('.utr-num').value,
        amount: row.querySelector('.utr-amt').value,
        date: row.querySelector('.utr-date').value
    }));

    return {
        date: document.getElementById('date').value,
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
        utrDetails: utrArray,
        transportId: document.getElementById('transportId').value,
        note: document.getElementById('note').value,
        quantity: document.getElementById('quantity').value,
        grade: document.getElementById('grade').value,
        rate: document.getElementById('rate').value,
        vehicle: document.getElementById('vehicle').value,
        total: document.getElementById('total').value
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
        table.innerHTML += `
            <tr>
                <td>${item.date || ''}</td>
                <td>${item.md || ''}</td>
                <td>${item.billTo?.name || ''}</td>
                <td>${item.quantity || ''}</td>
                <td>${item.rate || ''}</td>
                <td>${item.total || ''}</td>
                <td>
                    <button onclick="editData('${item.id}')">Edit</button>
                    <button onclick="deleteData('${item.id}')">Delete</button>
                    <button onclick="downloadPDF('${item.id}')">PDF</button>
                </td>
            </tr>`;
    });
}

async function downloadPDF(id) {
    const res = await fetch('/data');
    const data = await res.json();
    const item = data.find(i => String(i.id) === String(id));
    if (item) sendToPDF(item);
}

function generatePDF() { sendToPDF(getFormData()); }

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
        a.download = `AnkitBrokers_${Date.now()}.pdf`;
        a.click();
    } catch (err) { alert("PDF Error: Check Terminal"); }
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
    const item = data.find(i => String(i.id) === String(id));
    if (!item) return;
    editId = item.id;
    document.getElementById('date').value = item.date || '';
    document.getElementById('md').value = item.md || '';
    document.getElementById('billName').value = item.billTo?.name || '';
    document.getElementById('billPlace').value = item.billTo?.place || '';
    document.getElementById('billCity').value = item.billTo?.city || '';
    document.getElementById('billGST').value = item.billTo?.gst || '';
    document.getElementById('shipName').value = item.shipTo?.name || '';
    document.getElementById('shipPlace').value = item.shipTo?.place || '';
    document.getElementById('shipCity').value = item.shipTo?.city || '';
    document.getElementById('shipGST').value = item.shipTo?.gst || '';
    document.getElementById('quantity').value = item.quantity || '';
    document.getElementById('grade').value = item.grade || '';
    document.getElementById('rate').value = item.rate || '';
    document.getElementById('vehicle').value = item.vehicle || '';
    document.getElementById('total').value = item.total || '';
    document.getElementById('transportId').value = item.transportId || '';
    document.getElementById('note').value = item.note || '';
    document.getElementById('utrContainer').innerHTML = '';
    (item.utrDetails || []).forEach(u => addUTRRow(u));
    showForm();
}

function resetForm() {
    editId = null;
    document.querySelectorAll('input, textarea').forEach(i => i.value = '');
    document.getElementById('utrContainer').innerHTML = '';
    addUTRRow();
   /*  document.getElementById('date').valueAsDate = new Date(); */
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    resetForm();
    document.getElementById('quantity').addEventListener('input', calculate);
    document.getElementById('rate').addEventListener('input', calculate);
});