let editId = null;

const businessConfigs = {
    ankit: { name: "ANKIT BROKERS", subtitle: "SUGAR BROKER & COMMISSION AGENT", address: "SIYAGANJ, INDORE, 452001 (MP)", mobile1: "9425951212", mobile2: "9424052922", jurisdiction: "INDORE" },
    pawan: { name: "PAWAN SUGAR BROKERS", subtitle: "SUGAR BROKER & COMMISSION AGENT", address: "34 - GANJ BAZAR, KHANDWA (M.P.)", mobile1: "9425928529", mobile2: "9425085229", jurisdiction: "KHANDWA" }
};

let knownPartyNames = [];

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

function addGradeRow(data = {
    season: '2025-26',
    grade: '',
    rate: '',
    quantity: ''
}) {

    const container = document.getElementById('gradeContainer');

    const div = document.createElement('div');

    div.className = 'dynamic-row grade-row';

    const currentQuantity =
        data.quantity !== undefined
            ? data.quantity
            : (data.qty || '');

    const selectedGrade = data.grade || 'S/30';

    div.innerHTML = `

        <div class="row-inputs">

            <div class="label-group">
                <label>Season</label>
                <input class="row-season" value="${data.season || '2025-26'}">
            </div>

            <div class="label-group">
                <label>Grade</label>

                <select class="row-grade">

                    <option value="S/30" ${selectedGrade === 'S/30' ? 'selected' : ''}>S/30</option>

                    <option value="SS/30" ${selectedGrade === 'SS/30' ? 'selected' : ''}>SS/30</option>

                    <option value="M/30" ${selectedGrade === 'M/30' ? 'selected' : ''}>M/30</option>

                    <option value="L/30" ${selectedGrade === 'L/30' ? 'selected' : ''}>L/30</option>

                </select>
            </div>

            <div class="label-group">
                <label>Rate</label>
                <input
                    class="row-rate"
                    type="number"
                    value="${data.rate || ''}"
                    oninput="calculate()"
                >
            </div>

            <div class="label-group">
                <label>Qty</label>
                <input
                    class="row-qty"
                    type="number"
                    value="${currentQuantity}"
                    oninput="calculate()"
                >
            </div>

        </div>

        <button
            class="remove-btn"
            type="button"
            onclick="removeDynamicRow(this, true)"
        >
            Remove Row
        </button>

    `;

    container.appendChild(div);
}

function addUTRRow(data = {
    utrNumber: '',
    amount: '',
    date: ''
}) {

    const container = document.getElementById('utrContainer');

    const div = document.createElement('div');

    div.className = 'dynamic-row utr-row';

    div.innerHTML = `

        <div class="row-inputs">

            <div class="label-group">
                <label>UTR No</label>
                <input class="utr-num" value="${data.utrNumber || ''}">
            </div>

            <div class="label-group">
                <label>Amount</label>
                <input
                    class="utr-amt"
                    type="number"
                    value="${data.amount || ''}"
                >
            </div>

            <div class="label-group">
                <label>Date</label>
                <input
                    class="utr-date"
                    type="date"
                    value="${data.date || ''}"
                >
            </div>

        </div>

        <button
            class="remove-btn"
            type="button"
            onclick="removeDynamicRow(this)"
        >
            Remove Row
        </button>

    `;

    container.appendChild(div);
}

// ✅ Fetch party details from server and fill the form
async function autofillPartyDetails(type, name) {

    name = (name || '').trim();

  
    if (!name) {

        clearPartyFields(type);
        return;
    }

    try {

        const url = `/party?name=${encodeURIComponent(name)}`;

        const response = await fetch(url);

        const data = await response.json();

        if (!data || (!data.place && !data.city && !data.gst)) {

            clearPartyFields(type);
            return;
        }


        if (type === 'bill') {

            document.getElementById('billPlace').value = data.place || '';
            document.getElementById('billCity').value = data.city || '';
            document.getElementById('billGST').value = data.gst || '';

        } else {

            document.getElementById('shipPlace').value = data.place || '';
            document.getElementById('shipCity').value = data.city || '';
            document.getElementById('shipGST').value = data.gst || '';
        }

    } catch (e) {

        clearPartyFields(type);
    }
}

function clearPartyFields(type) {

    if (type === 'bill') {

        document.getElementById('billPlace').value = '';
        document.getElementById('billCity').value = '';
        document.getElementById('billGST').value = '';

    } else {

        document.getElementById('shipPlace').value = '';
        document.getElementById('shipCity').value = '';
        document.getElementById('shipGST').value = '';
    }
}

// ✅ Attach both 'input' and 'change' listeners with dedup guard
function attachPartyAutofill(inputEl, type) {

    let timeout;

    async function handle(eventType) {

        clearTimeout(timeout);

        timeout = setTimeout(async () => {

            const value = inputEl.value.trim();

            if (!value) {


                clearPartyFields(type);
                return;
            }

            await autofillPartyDetails(type, value);

        }, 250);
    }

    inputEl.addEventListener('input', () => handle('input'));
    inputEl.addEventListener('change', () => handle('change'));
    inputEl.addEventListener('blur', () => handle('blur'));
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

function removeDynamicRow(button, shouldRecalculate = false) {

    const row = button.closest('.dynamic-row');

    if (!row) return;

    row.remove();

    if (shouldRecalculate) {
        calculate();
    }
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
    searchInput.addEventListener('keyup', function () {
        const filter = this.value.toUpperCase();
        const rows = document.querySelector("#dataTable tbody").rows;
        for (let i = 0; i < rows.length; i++) {
            const clientName = rows[i].cells[2].textContent || rows[i].cells[2].innerText;
            rows[i].style.display = clientName.toUpperCase().includes(filter) ? "" : "none";
        }
    });
}

async function handleBusinessChange() {
    const type = document.getElementById('businessType').value;
    const customFields = document.getElementById('customBusinessFields');
    if (type === 'other') { customFields.classList.remove('hidden'); }
    else { customFields.classList.add('hidden'); }
    if (!editId) await loadNextDONumber();
}

async function loadNextDONumber() {
    const businessType = document.getElementById('businessType').value;
    const doInput = document.getElementById('doNumber');
    doInput.readOnly = false;
    try {
        const res = await fetch(`/next-do/${businessType}`);
        const data = await res.json();
        doInput.value = data.next;
    } catch (e) { console.log('DO Number Failed'); }
}

function getFormData() {
    const currentBusiness = document.getElementById('businessType').value;
    return {
        businessType: currentBusiness,
        businessDetails: currentBusiness === 'other'
            ? {
                name: document.getElementById('businessName').value,
                subtitle: "SUGAR BROKER & COMMISSION AGENT",
                address: document.getElementById('businessAddress').value,
                mobile1: document.getElementById('businessMobile1').value,
                mobile2: document.getElementById('businessMobile2').value,
                jurisdiction: document.getElementById('businessJurisdiction').value
            }
            : businessConfigs[currentBusiness],
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
        const response = await fetch('/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            alert("✅ Record Saved Successfully");
            await loadData();
            await resetForm();
            showTable();
        }
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
                <td class="sticky-col">
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
    document.getElementById('businessType').value = item.businessType || 'ankit';

    const customFields = document.getElementById('customBusinessFields');
    if (item.businessType === 'other') {
        customFields.classList.remove('hidden');
        if (item.businessDetails) {
            document.getElementById('businessName').value = item.businessDetails.name || '';
            document.getElementById('businessAddress').value = item.businessDetails.address || '';
            document.getElementById('businessMobile1').value = item.businessDetails.mobile1 || '';
            document.getElementById('businessMobile2').value = item.businessDetails.mobile2 || '';
            document.getElementById('businessJurisdiction').value = item.businessDetails.jurisdiction || '';
        }
    } else {
        customFields.classList.add('hidden');
    }

    document.getElementById('gradeContainer').innerHTML = '';
    if (item.orderItems && item.orderItems.length > 0) {
        item.orderItems.forEach(g => addGradeRow(g));
    } else { addGradeRow(); }

    document.getElementById('utrContainer').innerHTML = '';
    if (item.utrDetails && item.utrDetails.length > 0) {
        item.utrDetails.forEach(u => addUTRRow(u));
    } else { addUTRRow(); }

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
    a.download = `DO_${itemData.doNumber || 'Draft'}.pdf`;
    a.click();
}

async function resetForm() {

    editId = null;

    document
        .querySelectorAll('#formSection input:not([readonly])')
        .forEach(i => i.value = '');

    document.getElementById('gradeContainer').innerHTML = '';
    document.getElementById('utrContainer').innerHTML = '';

    document.getElementById('businessType').value = 'ankit';

    document
        .getElementById('customBusinessFields')
        .classList.add('hidden');

    document.getElementById('businessName').value = '';
    document.getElementById('businessAddress').value = '';
    document.getElementById('businessMobile1').value = '';
    document.getElementById('businessMobile2').value = '';
    document.getElementById('businessJurisdiction').value = '';

    // ✅ RENDER IMMEDIATELY
    addGradeRow();

    addUTRRow();

    // ✅ LOAD DO NUMBER AFTER UI RENDER
    loadNextDONumber();
}

async function wakeServer() {
    try { await fetch('/ping'); } catch (e) {}
    const loader = document.getElementById('loadingScreen');
    if (!loader) return;
    loader.style.opacity = '0';
    setTimeout(() => { loader.style.display = 'none'; }, 400);
}

async function loadSuggestions() {
    try {
        const mills = await fetch('/suggest/mills').then(r => r.json());
        const parties = await fetch('/suggest/parties').then(r => r.json());

        knownPartyNames = parties;

        document.getElementById('millSuggestions').innerHTML =
            mills.map(m => `<option value="${m}">`).join('');
        document.getElementById('partySuggestions').innerHTML =
            parties.map(p => `<option value="${p}">`).join('');
    } catch (e) {
        console.log('Suggestions Failed', e);
    }
}

function setupAutoCaps() {
    const ids = ['businessName', 'businessAddress', 'businessJurisdiction', 'billName', 'billPlace', 'billCity', 'shipName', 'shipPlace', 'shipCity', 'md', 'vehicle'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase(); });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await wakeServer();
    loadData();
    setupSearchFilter();
    setupAutoCaps();

    // ✅ Load suggestions FIRST so knownPartyNames is populated before attaching listeners
    loadSuggestions();

    // ✅ Now attach autofill — both bill and ship
    attachPartyAutofill(document.getElementById('billName'), 'bill');
    attachPartyAutofill(document.getElementById('shipName'), 'ship');

    await resetForm();
});

/* if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
     navigator.serviceWorker.register('/service-worker.js').catch(err => console.log('SW Error:', err));
    });
} */