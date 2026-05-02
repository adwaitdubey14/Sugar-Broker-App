let editId = null;

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
            // Index 2 is "Party Name"
            const clientName = rows[i].cells[2].textContent || rows[i].cells[2].innerText;
            rows[i].style.display = clientName.toUpperCase().includes(filter) ? "" : "none";
        }
    });
}

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
    const qtyEl = document.getElementById('quantity');
    const rateEl = document.getElementById('rate');
    const totalEl = document.getElementById('total');
    
    if(!qtyEl || !rateEl || !totalEl) return;

    const quantity = parseFloat(qtyEl.value) || 0;
    const rate = parseFloat(rateEl.value) || 0;
    const subtotal = quantity * rate;
    const totalWithGST = subtotal * 1.05; // 5% GST calculation
    totalEl.value = totalWithGST.toFixed(2);
}

function getFormData() {
    const utrRows = document.querySelectorAll('.utr-row');
    const utrArray = Array.from(utrRows).map(row => ({
        utrNumber: row.querySelector('.utr-num').value,
        amount: row.querySelector('.utr-amt').value,
        date: row.querySelector('.utr-date').value
    }));

    return {
        doNumber: document.getElementById('doNumber').value,
        date: document.getElementById('date').value,
        tenderDate: document.getElementById('tenderDate').value,
        season: document.getElementById('season').value,
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
        quantity: document.getElementById('quantity').value,
        grade: document.getElementById('grade').value,
        rate: document.getElementById('rate').value,
        vehicle: document.getElementById('vehicle').value,
        total: document.getElementById('total').value,
        note: document.getElementById('note').value
    };
}

async function saveData() {
    const data = getFormData();
    if (!validateGST(data.billTo.gst) || !validateGST(data.shipTo.gst)) {
        alert("❌ Invalid GST Number.");
        return;
    }
    if (editId) data.id = editId;
    
    try {
        const response = await fetch('/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if(response.ok) {
            alert("✅ Record Saved Successfully");
            editId = null;
            await loadData();
            showTable(); // Ensure this function exists in your HTML <script>
            resetForm();
        }
    } catch (err) {
        alert("Error saving data");
    }
}

async function loadData() {
    const res = await fetch('/data');
    const data = await res.json();
    const table = document.querySelector('#dataTable tbody');
    table.innerHTML = '';
    data.forEach(item => {
        // Use item._id if item.id is undefined
        const id = item.id || item._id; 
        table.innerHTML += `
            <tr>
                <td>${item.date || ''}</td>
                <td>${item.md || ''}</td>
                <td>${item.billTo?.name || ''}</td>
                <td>${item.quantity || ''}</td>
                <td>${item.rate || ''}</td>
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
    const data = getFormData();
    sendToPDF(data); 
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
    } catch (err) { 
        alert("PDF Error: Is the server sleeping?"); 
    }
}

async function deleteData(id) {
    if (confirm('Are you sure you want to delete this record?')) {
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
    document.getElementById('quantity').value = item.quantity || '';
    document.getElementById('grade').value = item.grade || '';
    document.getElementById('rate').value = item.rate || '';
    document.getElementById('vehicle').value = item.vehicle || '';
    document.getElementById('total').value = item.total || '';
    document.getElementById('note').value = item.note || '';
    
    document.getElementById('utrContainer').innerHTML = '';
    (item.utrDetails || []).forEach(u => addUTRRow(u));
    showForm(); // Changes tab back to form
}

function resetForm() {
    editId = null;
    document.querySelectorAll('#formSection input, #formSection textarea').forEach(i => i.value = '');
    document.getElementById('utrContainer').innerHTML = '';
    addUTRRow();
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    // No need to resetForm here if it causes blanking issues on load
    setupGSTListeners();
    setupSearchFilter();
    
    // Safety check for inputs before adding listeners
    const qtyInput = document.getElementById('quantity');
    const rateInput = document.getElementById('rate');
    if(qtyInput) qtyInput.addEventListener('input', calculate);
    if(rateInput) rateInput.addEventListener('input', calculate);
});

function copyBilling() {
    document.getElementById('shipName').value = document.getElementById('billName').value;
    document.getElementById('shipPlace').value = document.getElementById('billPlace').value;
    document.getElementById('shipCity').value = document.getElementById('billCity').value;
    document.getElementById('shipGST').value = document.getElementById('billGST').value;
    
    // Trigger the GST listener manually to capitalize if needed
    const event = new Event('input');
    document.getElementById('shipGST').dispatchEvent(event);
}