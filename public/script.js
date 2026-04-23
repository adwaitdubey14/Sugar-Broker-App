let editId = null;

// --- 1. HELPERS: GST VALIDATION & AUTO-CAPS ---

function validateGST(gst) {
    // Optional: returns true if empty, otherwise checks 15-digit structure
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
            e.target.value = e.target.value.toUpperCase(); // Auto-Capitalize
            // Visual feedback
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

// --- 2. SEARCH FILTER LOGIC ---

function setupSearchFilter() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('keyup', function() {
        const filter = this.value.toUpperCase();
        const rows = document.querySelector("#dataTable tbody").rows;

        for (let i = 0; i < rows.length; i++) {
            // Client Name is in the 3rd column (index 2)
            const clientName = rows[i].cells[2].textContent || rows[i].cells[2].innerText;
            
            if (clientName.toUpperCase().indexOf(filter) > -1) {
                rows[i].style.display = "";
            } else {
                rows[i].style.display = "none";
            }
        }
    });
}

// --- 3. CORE LOGIC ---

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
    
    if (!validateGST(data.billTo.gst) || !validateGST(data.shipTo.gst)) {
        alert("❌ Invalid GST Number. Please check the 15-digit format or leave it blank.");
        return;
    }

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
        table.innerHTML += `
            <tr>
                <td>${item.date || ''}</td>
                <td>${item.md || ''}</td>
                <td>${item.billTo?.name || ''}</td>
                <td>${item.quantity || ''}</td>
                <td>${item.rate || ''}</td>
                <td>${item.total || ''}</td>
                <td>
                    <button class="btn-sm" onclick="editData('${item.id}')">Edit</button>
                    <button class="btn-sm btn-danger" onclick="deleteData('${item.id}')">Delete</button>
                    <button class="btn-sm btn-primary" onclick="downloadPDF('${item.id}')">PDF</button>
                </td>
            </tr>`;
    });

    // Re-apply filter if user was already searching
    const searchValue = document.getElementById('searchInput').value;
    if(searchValue) {
        document.getElementById('searchInput').dispatchEvent(new Event('keyup'));
    }
}

// --- 4. PDF GENERATION ---

async function downloadPDF(id) {
    const res = await fetch('/data');
    const data = await res.json();
    const item = data.find(i => String(i.id) === String(id));
    if (item) sendToPDF(item);
}

function generatePDF() { 
    const data = getFormData();
    if (!validateGST(data.billTo.gst) || !validateGST(data.shipTo.gst)) {
        alert("❌ Invalid GST format. Correct it before generating PDF.");
        return;
    }
    sendToPDF(data); 
}

async function sendToPDF(itemData) {
    try {
        const response = await fetch('/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });
        if (!response.ok) throw new Error("Server Error");
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AnkitBrokers_${Date.now()}.pdf`;
        a.click();
    } catch (err) { 
        alert("PDF Error: Is the server sleeping? Try again in 30 seconds."); 
    }
}

// --- 5. DATA MANAGEMENT ---

async function deleteData(id) {
    if (confirm('Are you sure you want to delete this record?')) {
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
}

// --- 6. INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    resetForm();
    setupGSTListeners();
    setupSearchFilter();
    document.getElementById('quantity').addEventListener('input', calculate);
    document.getElementById('rate').addEventListener('input', calculate);
});