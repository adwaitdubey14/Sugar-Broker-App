let editId = null;

function calculate() {
    const quantity = parseFloat(document.getElementById('quantity').value) || 0;
    const rate = parseFloat(document.getElementById('rate').value) || 0;
    document.getElementById('total').value = (quantity * rate).toFixed(2);
}

function getFormData() {
    return {
        date: document.getElementById('date').value,
        md: document.getElementById('md').value,
        billTo: {
            name: document.getElementById('billName').value,
            place: document.getElementById('billPlace').value,
            gst: document.getElementById('billGST').value
        },
        shipTo: {
            name: document.getElementById('shipName').value,
            place: document.getElementById('shipPlace').value,
            gst: document.getElementById('shipGST').value
        },
        utr1: document.getElementById('utr1').value,
        utr1Amount: document.getElementById('utr1Amount').value,
        utr1Date: document.getElementById('utr1Date').value,
        utr2: document.getElementById('utr2').value,
        utr2Amount: document.getElementById('utr2Amount').value,
        utr2Date: document.getElementById('utr2Date').value,
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

    if (!data.date || !data.billTo.name || !data.quantity || !data.rate) {
    alert("Please fill required fields");
    return;
}

    await fetch('/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    editId = null;
    await loadData();
    showTable();
}

async function loadData() {
    const res = await fetch('/data');
    const data = await res.json();
    const table = document.querySelector('#dataTable tbody');
    table.innerHTML = '';

    data.forEach(item => {
        const row = `
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
            </tr>
        `;
        table.innerHTML += row;
    });
}

async function downloadPDF(id) {
    const res = await fetch('/data');
    const data = await res.json();
    const item = data.find(i => String(i.id) === String(id));
    
    if (!item) return console.error('Record not found');
    sendToPDF(item);
}

async function generatePDF() {
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

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        const blob = await response.blob();
        
        // Check if the blob is actually a PDF
        if (blob.type !== "application/pdf") {
            alert("Server returned an invalid file format. Check server logs.");
            return;
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        // Ensure filename is clean for mobile
        a.download = `Receipt_${(itemData.billTo?.name || 'Order').replace(/\s+/g, '_')}.pdf`;
        
        document.body.appendChild(a);
        a.click();
        
        // Cleanup for mobile memory
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 100);
    } catch (err) {
        console.error("Download Error:", err);
        alert("Failed to download PDF: " + err.message);
    }
}

async function deleteData(id) {
    if (!confirm('Delete this record?')) return;
    await fetch('/delete/' + encodeURIComponent(id), { method: 'DELETE' });
    loadData();
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
    document.getElementById('billGST').value = item.billTo?.gst || '';
    document.getElementById('shipName').value = item.shipTo?.name || '';
    document.getElementById('shipPlace').value = item.shipTo?.place || '';
    document.getElementById('shipGST').value = item.shipTo?.gst || '';
    document.getElementById('quantity').value = item.quantity || '';
    document.getElementById('grade').value = item.grade || '';
    document.getElementById('rate').value = item.rate || '';
    document.getElementById('vehicle').value = item.vehicle || '';
    document.getElementById('total').value = item.total || '';
    document.getElementById('utr1').value = item.utr1 || '';
    document.getElementById('utr1Amount').value = item.utr1Amount || '';
    document.getElementById('utr1Date').value = item.utr1Date || '';
    document.getElementById('utr2').value = item.utr2 || '';
    document.getElementById('utr2Amount').value = item.utr2Amount || '';
    document.getElementById('utr2Date').value = item.utr2Date || '';
    document.getElementById('transportId').value = item.transportId || '';
    document.getElementById('note').value = item.note || '';
    showForm();
}

function resetForm() {
    editId = null;
    const inputs = document.querySelectorAll('#formSection input, #formSection textarea');
    inputs.forEach(input => input.value = '');
}

loadData();

document.getElementById('quantity').addEventListener('input', calculate);
document.getElementById('rate').addEventListener('input', calculate);