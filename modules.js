/**
 * EduTech IMS - Extended Modules
 * Admissions, Fees, Attendance, Exams, Results, Certificates,
 * Timetable, Accounting, Reports, Announcements, Users, Settings
 */

// ==================== ADMISSIONS MODULE ====================
async function renderAdmissions(container) {
    const admissions = await dbGetAll('admissions');
    const students = await dbGetAll('students');
    const courses = await dbGetAll('courses');
    const batches = await dbGetAll('batches');
    const canEdit = hasAnyRole('admin', 'receptionist');

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1>📝 Admission Management</h1>
                <p>Process new admissions and manage existing ones</p>
            </div>
            ${canEdit ? `<button class="btn btn-primary" onclick="openAdmissionForm()">+ New Admission</button>` : ''}
        </div>

        <div class="data-table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Admission No</th>
                        <th>Student</th>
                        <th>Course</th>
                        <th>Batch</th>
                        <th>Date</th>
                        <th>Total Fee</th>
                        <th>Paid</th>
                        <th>Remaining</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${admissions.map(a => {
                        const student = students.find(s => s.id === a.studentId);
                        const course = courses.find(c => c.id === a.courseId);
                        const batch = batches.find(b => b.id === a.batchId);
                        const totalWithExtras = (a.totalFee || 0) + (a.registrationFee || 0) + (a.admissionFee || 0) - (a.discount || 0);
                        return `
                            <tr>
                                <td><span class="badge badge-green">${a.admissionNo}</span></td>
                                <td>${student?.name || 'Unknown'}</td>
                                <td>${course?.name || 'Unknown'}</td>
                                <td>${batch?.batchId || '-'}</td>
                                <td>${a.date}</td>
                                <td>${formatPKR(totalWithExtras)}</td>
                                <td class="text-green">${formatPKR(a.paidAmount)}</td>
                                <td class="${a.remainingAmount > 0 ? 'text-red' : 'text-green'}">${formatPKR(a.remainingAmount)}</td>
                                <td>
                                    <div class="action-btns">
                                        <button class="btn-icon" title="Print Receipt" onclick="printAdmissionReceipt(${a.id})">🖨️</button>
                                        ${canEdit ? `<button class="btn-icon" title="Collect Fee" onclick="openFeeCollectionForm(${a.studentId}, ${a.id})">💰</button>` : ''}
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                    ${admissions.length === 0 ? '<tr><td colspan="9" class="empty-cell">No admissions found</td></tr>' : ''}
                </tbody>
            </table>
        </div>
    `;
}

async function openAdmissionForm() {
    const students = await dbGetAll('students');
    const courses = await dbGetAll('courses');
    const batches = await dbGetAll('batches');

    const content = `
        <form id="admission-form" onsubmit="saveAdmission(event)">
            <div class="form-grid">
                <div class="form-group">
                    <label>Student *</label>
                    <select name="studentId" required id="adm-student">
                        <option value="">Select Student</option>
                        ${students.filter(s => s.status === 'active').map(s => `<option value="${s.id}">${s.name} (${s.studentId})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Course *</label>
                    <select name="courseId" required id="adm-course" onchange="updateAdmissionFee()">
                        <option value="">Select Course</option>
                        ${courses.filter(c => c.status === 'active').map(c => `<option value="${c.id}" data-fee="${c.courseFee}" data-reg="${c.registrationFee}" data-adm="${c.admissionFee}">${c.name} (${formatPKR(c.courseFee)})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Batch *</label>
                    <select name="batchId" required id="adm-batch">
                        <option value="">Select Batch</option>
                        ${batches.filter(b => b.status === 'active').map(b => {
                            const course = courses.find(c => c.id === b.courseId);
                            return `<option value="${b.id}" data-course="${b.courseId}">${b.batchId} - ${course?.name || ''} (${b.startTime}-${b.endTime})</option>`;
                        }).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Admission Date</label>
                    <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Course Fee</label>
                    <input type="number" name="totalFee" id="adm-total-fee" value="0" readonly>
                </div>
                <div class="form-group">
                    <label>Registration Fee</label>
                    <input type="number" name="registrationFee" id="adm-reg-fee" value="0" readonly>
                </div>
                <div class="form-group">
                    <label>Admission Fee</label>
                    <input type="number" name="admissionFee" id="adm-adm-fee" value="0" readonly>
                </div>
                <div class="form-group">
                    <label>Discount (PKR)</label>
                    <input type="number" name="discount" id="adm-discount" value="0" min="0" oninput="calculateAdmissionTotal()">
                </div>
                <div class="form-group">
                    <label>Grand Total</label>
                    <input type="text" id="adm-grand-total" value="Rs. 0" readonly class="input-highlight">
                </div>
                <div class="form-group">
                    <label>Initial Payment (PKR) *</label>
                    <input type="number" name="paidAmount" id="adm-paid" value="0" min="0" required oninput="calculateAdmissionTotal()">
                </div>
                <div class="form-group">
                    <label>Remaining Balance</label>
                    <input type="text" id="adm-remaining" value="Rs. 0" readonly class="input-highlight text-red">
                </div>
                <div class="form-group">
                    <label>Payment Method</label>
                    <select name="paymentMethod">
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="JazzCash">JazzCash</option>
                        <option value="Easypaisa">Easypaisa</option>
                        <option value="SadaPay">SadaPay</option>
                        <option value="NayaPay">NayaPay</option>
                    </select>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeModal('admission-form')">Cancel</button>
                <button type="submit" class="btn btn-primary">✅ Process Admission</button>
            </div>
        </form>
    `;

    openModal('admission-form', 'New Admission', content, 'large');
}

function updateAdmissionFee() {
    const sel = document.getElementById('adm-course');
    const opt = sel.options[sel.selectedIndex];
    if (!opt.value) return;
    document.getElementById('adm-total-fee').value = opt.dataset.fee || 0;
    document.getElementById('adm-reg-fee').value = opt.dataset.reg || 0;
    document.getElementById('adm-adm-fee').value = opt.dataset.adm || 0;
    calculateAdmissionTotal();
}

function calculateAdmissionTotal() {
    const courseFee = parseInt(document.getElementById('adm-total-fee')?.value) || 0;
    const regFee = parseInt(document.getElementById('adm-reg-fee')?.value) || 0;
    const admFee = parseInt(document.getElementById('adm-adm-fee')?.value) || 0;
    const discount = parseInt(document.getElementById('adm-discount')?.value) || 0;
    const paid = parseInt(document.getElementById('adm-paid')?.value) || 0;

    const grandTotal = courseFee + regFee + admFee - discount;
    const remaining = grandTotal - paid;

    document.getElementById('adm-grand-total').value = formatPKR(grandTotal);
    document.getElementById('adm-remaining').value = formatPKR(Math.max(0, remaining));
}

async function saveAdmission(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.studentId = parseInt(data.studentId);
    data.courseId = parseInt(data.courseId);
    data.batchId = parseInt(data.batchId);
    data.totalFee = parseInt(data.totalFee) || 0;
    data.registrationFee = parseInt(data.registrationFee) || 0;
    data.admissionFee = parseInt(data.admissionFee) || 0;
    data.discount = parseInt(data.discount) || 0;
    data.paidAmount = parseInt(data.paidAmount) || 0;
    const grandTotal = data.totalFee + data.registrationFee + data.admissionFee - data.discount;
    data.remainingAmount = Math.max(0, grandTotal - data.paidAmount);
    data.status = 'active';

    try {
        const admCount = await dbCount('admissions');
        data.admissionNo = generateAdmissionNo(admCount);

        await dbAdd('admissions', data);

        // Create enrollment
        await dbAdd('enrollments', {
            studentId: data.studentId,
            courseId: data.courseId,
            batchId: data.batchId,
            admissionId: data.admissionNo,
            enrollmentDate: data.date,
            status: 'active'
        });

        // Update batch count
        const batch = await dbGet('batches', data.batchId);
        if (batch) {
            batch.currentStudents = (batch.currentStudents || 0) + 1;
            await dbPut('batches', batch);
        }

        // Record fee payment
        if (data.paidAmount > 0) {
            const payCount = await dbCount('feePayments');
            await dbAdd('feePayments', {
                receiptNo: generateReceiptNo(payCount),
                studentId: data.studentId,
                admissionId: admCount + 1,
                courseId: data.courseId,
                amount: data.paidAmount,
                feeType: 'Admission Payment',
                paymentMethod: data.paymentMethod || 'Cash',
                date: data.date,
                collectedBy: currentUser.name,
                remarks: `Admission ${data.admissionNo}`
            });
        }

        await addAuditLog(currentUser.id, currentUser.name, 'New Admission', 'admissions', data.admissionNo, `Admitted student ID ${data.studentId}`);
        showToast(`Admission processed! No: ${data.admissionNo}`);
        closeModal('admission-form');
        await renderAdmissions(document.getElementById('page-content'));
    } catch (err) {
        console.error(err);
        showToast('Failed to process admission', 'error');
    }
}

async function printAdmissionReceipt(admissionId) {
    const admission = await dbGet('admissions', admissionId);
    if (!admission) return;
    const student = await dbGet('students', admission.studentId);
    const course = await dbGet('courses', admission.courseId);
    const batch = await dbGet('batches', admission.batchId);
    const instituteName = await getSetting('instituteName') || 'EduTech Institute';
    const address = await getSetting('address') || '';
    const phone = await getSetting('phone') || '';
    const grandTotal = (admission.totalFee || 0) + (admission.registrationFee || 0) + (admission.admissionFee || 0) - (admission.discount || 0);

    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Admission Receipt</title>
    <style>
        body{font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px;}
        .header{text-align:center;border-bottom:3px solid #6366f1;padding-bottom:15px;margin-bottom:20px;}
        .header h1{margin:5px 0;color:#6366f1;font-size:22px;}
        .header p{margin:2px 0;font-size:12px;color:#666;}
        .receipt-title{text-align:center;font-size:18px;font-weight:bold;margin:15px 0;color:#333;background:#f1f5f9;padding:8px;border-radius:5px;}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:15px 0;}
        .info-item{font-size:13px;}.info-item label{font-weight:bold;color:#555;}
        table{width:100%;border-collapse:collapse;margin:15px 0;}
        th,td{border:1px solid #ddd;padding:8px;font-size:13px;}
        th{background:#6366f1;color:#fff;}
        .total-row{font-weight:bold;background:#f8fafc;}
        .footer{text-align:center;margin-top:30px;font-size:11px;color:#888;border-top:1px solid #ddd;padding-top:10px;}
        @media print{button{display:none;}}
    </style></head><body>
        <div class="header">
            <h1>🎓 ${instituteName}</h1>
            <p>${address}</p>
            <p>📞 ${phone}</p>
        </div>
        <div class="receipt-title">ADMISSION RECEIPT</div>
        <div class="info-grid">
            <div class="info-item"><label>Admission No:</label> ${admission.admissionNo}</div>
            <div class="info-item"><label>Date:</label> ${admission.date}</div>
            <div class="info-item"><label>Student:</label> ${student?.name || '-'}</div>
            <div class="info-item"><label>Student ID:</label> ${student?.studentId || '-'}</div>
            <div class="info-item"><label>Father Name:</label> ${student?.fatherName || '-'}</div>
            <div class="info-item"><label>Mobile:</label> ${student?.mobile || '-'}</div>
            <div class="info-item"><label>Course:</label> ${course?.name || '-'}</div>
            <div class="info-item"><label>Batch:</label> ${batch?.batchId || '-'}</div>
        </div>
        <table>
            <tr><th>Description</th><th>Amount</th></tr>
            <tr><td>Course Fee</td><td>Rs. ${(admission.totalFee || 0).toLocaleString()}</td></tr>
            <tr><td>Registration Fee</td><td>Rs. ${(admission.registrationFee || 0).toLocaleString()}</td></tr>
            <tr><td>Admission Fee</td><td>Rs. ${(admission.admissionFee || 0).toLocaleString()}</td></tr>
            <tr><td>Discount</td><td>- Rs. ${(admission.discount || 0).toLocaleString()}</td></tr>
            <tr class="total-row"><td>Grand Total</td><td>Rs. ${grandTotal.toLocaleString()}</td></tr>
            <tr style="color:green"><td>Amount Paid</td><td>Rs. ${(admission.paidAmount || 0).toLocaleString()}</td></tr>
            <tr style="color:red"><td>Balance Remaining</td><td>Rs. ${(admission.remainingAmount || 0).toLocaleString()}</td></tr>
        </table>
        <div class="footer">
            <p>This is a computer-generated receipt.</p>
        </div>
        <button onclick="window.print()" style="margin:20px auto;display:block;padding:10px 30px;background:#6366f1;color:#fff;border:none;border-radius:5px;cursor:pointer;">🖨️ Print Receipt</button>
    </body></html>`);
    win.document.close();
}

// ==================== FEES MODULE ====================
async function renderFees(container) {
    const payments = await dbGetAll('feePayments');
    const students = await dbGetAll('students');
    const courses = await dbGetAll('courses');
    const admissions = await dbGetAll('admissions');
    const canCollect = hasAnyRole('admin', 'receptionist', 'accountant');

    const totalCollected = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const totalPending = admissions.reduce((s, a) => s + (a.remainingAmount || 0), 0);

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1>💰 Fee Management</h1>
                <p>Collect fees and manage payments</p>
            </div>
            ${canCollect ? `<button class="btn btn-primary" onclick="openFeeCollectionForm()">+ Collect Fee</button>` : ''}
        </div>

        <div class="stats-grid stats-grid-3">
            <div class="stat-card stat-green">
                <div class="stat-icon">💰</div>
                <div class="stat-info">
                    <span class="stat-value">${formatPKR(totalCollected)}</span>
                    <span class="stat-label">Total Collected</span>
                </div>
            </div>
            <div class="stat-card stat-red">
                <div class="stat-icon">⏰</div>
                <div class="stat-info">
                    <span class="stat-value">${formatPKR(totalPending)}</span>
                    <span class="stat-label">Total Pending</span>
                </div>
            </div>
            <div class="stat-card stat-blue">
                <div class="stat-icon">🧾</div>
                <div class="stat-info">
                    <span class="stat-value">${payments.length}</span>
                    <span class="stat-label">Total Receipts</span>
                </div>
            </div>
        </div>

        <!-- Pending Fees Section -->
        ${canCollect ? `
        <div class="section-card">
            <h2 class="section-title">⚠️ Students with Pending Fees</h2>
            <div class="data-table-container">
                <table class="data-table">
                    <thead><tr><th>Student</th><th>Course</th><th>Total</th><th>Paid</th><th>Remaining</th><th>Action</th></tr></thead>
                    <tbody>
                        ${admissions.filter(a => a.remainingAmount > 0).map(a => {
                            const student = students.find(s => s.id === a.studentId);
                            const course = courses.find(c => c.id === a.courseId);
                            return `<tr>
                                <td>${student?.name || '-'} (${student?.studentId || '-'})</td>
                                <td>${course?.name || '-'}</td>
                                <td>${formatPKR((a.totalFee||0)+(a.registrationFee||0)+(a.admissionFee||0)-(a.discount||0))}</td>
                                <td class="text-green">${formatPKR(a.paidAmount)}</td>
                                <td class="text-red">${formatPKR(a.remainingAmount)}</td>
                                <td><button class="btn btn-sm btn-primary" onclick="openFeeCollectionForm(${a.studentId}, ${a.id})">💰 Collect</button></td>
                            </tr>`;
                        }).join('')}
                        ${admissions.filter(a => a.remainingAmount > 0).length === 0 ? '<tr><td colspan="6" class="empty-cell">No pending fees! 🎉</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>` : ''}

        <!-- Payment History -->
        <div class="section-card">
            <h2 class="section-title">📋 Payment History</h2>
            <div class="filter-bar">
                <input type="text" placeholder="Search by receipt no, student..." id="fee-search" oninput="filterFeeTable()">
                <select id="fee-method-filter" onchange="filterFeeTable()">
                    <option value="">All Methods</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Easypaisa">Easypaisa</option>
                    <option value="SadaPay">SadaPay</option>
                    <option value="NayaPay">NayaPay</option>
                </select>
            </div>
            <div class="data-table-container">
                <table class="data-table" id="fee-table">
                    <thead>
                        <tr>
                            <th>Receipt No</th>
                            <th>Student</th>
                            <th>Fee Type</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Date</th>
                            <th>Collected By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payments.sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(p => {
                            const student = students.find(s => s.id === p.studentId);
                            return `
                                <tr data-receipt="${p.receiptNo.toLowerCase()}" data-student="${(student?.name || '').toLowerCase()}" data-method="${p.paymentMethod}">
                                    <td><span class="badge badge-purple">${p.receiptNo}</span></td>
                                    <td>${student?.name || '-'}</td>
                                    <td>${p.feeType || '-'}</td>
                                    <td class="text-green font-bold">${formatPKR(p.amount)}</td>
                                    <td><span class="badge badge-outline">${p.paymentMethod}</span></td>
                                    <td>${p.date}</td>
                                    <td>${p.collectedBy || '-'}</td>
                                    <td><button class="btn-icon" onclick="printFeeReceipt(${p.id})" title="Print">🖨️</button></td>
                                </tr>
                            `;
                        }).join('')}
                        ${payments.length === 0 ? '<tr><td colspan="8" class="empty-cell">No payments recorded</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function filterFeeTable() {
    const search = document.getElementById('fee-search')?.value.toLowerCase() || '';
    const method = document.getElementById('fee-method-filter')?.value || '';
    document.querySelectorAll('#fee-table tbody tr').forEach(row => {
        const receipt = row.dataset.receipt || '';
        const student = row.dataset.student || '';
        const rowMethod = row.dataset.method || '';
        const matchSearch = !search || receipt.includes(search) || student.includes(search);
        const matchMethod = !method || rowMethod === method;
        row.style.display = matchSearch && matchMethod ? '' : 'none';
    });
}

async function openFeeCollectionForm(studentId = null, admissionId = null) {
    const students = await dbGetAll('students');
    const admissions = await dbGetAll('admissions');
    const courses = await dbGetAll('courses');

    let selectedAdmission = null;
    if (admissionId) {
        selectedAdmission = await dbGet('admissions', admissionId);
    }

    const content = `
        <form id="fee-collection-form" onsubmit="collectFee(event)">
            <div class="form-grid">
                <div class="form-group">
                    <label>Student *</label>
                    <select name="studentId" required onchange="loadStudentAdmissions(this.value)">
                        <option value="">Select Student</option>
                        ${students.filter(s => s.status === 'active').map(s => `<option value="${s.id}" ${s.id === studentId ? 'selected' : ''}>${s.name} (${s.studentId})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Admission / Course *</label>
                    <select name="admissionId" required id="fee-admission-select">
                        <option value="">Select Admission</option>
                        ${admissions.filter(a => !studentId || a.studentId === studentId).map(a => {
                            const course = courses.find(c => c.id === a.courseId);
                            return `<option value="${a.id}" ${a.id === admissionId ? 'selected' : ''} data-remaining="${a.remainingAmount}">${a.admissionNo} - ${course?.name || ''} (Remaining: ${formatPKR(a.remainingAmount)})</option>`;
                        }).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Fee Type *</label>
                    <select name="feeType" required>
                        <option value="Course Fee">Course Fee</option>
                        <option value="Installment">Installment</option>
                        <option value="Registration Fee">Registration Fee</option>
                        <option value="Certificate Fee">Certificate Fee</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Amount (PKR) *</label>
                    <input type="number" name="amount" required min="1" value="${selectedAdmission?.remainingAmount || ''}" placeholder="Enter amount">
                </div>
                <div class="form-group">
                    <label>Payment Method *</label>
                    <select name="paymentMethod" required>
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="JazzCash">JazzCash</option>
                        <option value="Easypaisa">Easypaisa</option>
                        <option value="SadaPay">SadaPay</option>
                        <option value="NayaPay">NayaPay</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group form-group-full">
                    <label>Remarks</label>
                    <input type="text" name="remarks" placeholder="Any additional notes">
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeModal('fee-collection-form')">Cancel</button>
                <button type="submit" class="btn btn-primary">💰 Collect Fee & Generate Receipt</button>
            </div>
        </form>
    `;

    openModal('fee-collection-form', 'Collect Fee', content, 'large');
}

async function loadStudentAdmissions(studentId) {
    const admissions = await dbGetByIndex('admissions', 'studentId', parseInt(studentId));
    const courses = await dbGetAll('courses');
    const select = document.getElementById('fee-admission-select');
    if (!select) return;
    select.innerHTML = '<option value="">Select Admission</option>' + admissions.map(a => {
        const course = courses.find(c => c.id === a.courseId);
        return `<option value="${a.id}" data-remaining="${a.remainingAmount}">${a.admissionNo} - ${course?.name || ''} (Remaining: ${formatPKR(a.remainingAmount)})</option>`;
    }).join('');
}

async function collectFee(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.studentId = parseInt(data.studentId);
    data.admissionId = parseInt(data.admissionId);
    data.amount = parseInt(data.amount);

    if (data.amount <= 0) {
        showToast('Amount must be greater than 0', 'error');
        return;
    }

    try {
        // Get admission to find courseId
        const admission = await dbGet('admissions', data.admissionId);
        data.courseId = admission?.courseId;
        data.collectedBy = currentUser.name;

        const payCount = await dbCount('feePayments');
        data.receiptNo = generateReceiptNo(payCount);

        await dbAdd('feePayments', data);

        // Update admission balances
        if (admission) {
            admission.paidAmount = (admission.paidAmount || 0) + data.amount;
            const grandTotal = (admission.totalFee || 0) + (admission.registrationFee || 0) + (admission.admissionFee || 0) - (admission.discount || 0);
            admission.remainingAmount = Math.max(0, grandTotal - admission.paidAmount);
            await dbPut('admissions', admission);
        }

        await addAuditLog(currentUser.id, currentUser.name, 'Collected Fee', 'feePayments', data.receiptNo, `Collected ${formatPKR(data.amount)} from student ${data.studentId}`);
        showToast(`Fee collected! Receipt: ${data.receiptNo}`);
        closeModal('fee-collection-form');
        await renderFees(document.getElementById('page-content'));
    } catch (err) {
        console.error(err);
        showToast('Failed to collect fee', 'error');
    }
}

async function printFeeReceipt(paymentId) {
    const payment = await dbGet('feePayments', paymentId);
    if (!payment) return;
    const student = await dbGet('students', payment.studentId);
    const course = payment.courseId ? await dbGet('courses', payment.courseId) : null;
    const instituteName = await getSetting('instituteName') || 'EduTech Institute';
    const address = await getSetting('address') || '';
    const phone = await getSetting('phone') || '';
    const receiptFooter = await getSetting('receiptFooter') || '';

    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Fee Receipt - ${payment.receiptNo}</title>
    <style>
        body{font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;}
        .header{text-align:center;border-bottom:3px solid #6366f1;padding-bottom:10px;margin-bottom:15px;}
        .header h1{margin:5px 0;color:#6366f1;font-size:20px;}
        .header p{margin:2px 0;font-size:11px;color:#666;}
        .receipt-no{text-align:center;background:#f1f5f9;padding:8px;font-weight:bold;font-size:16px;border-radius:5px;margin:10px 0;}
        .details{font-size:13px;line-height:1.8;}
        .details .row{display:flex;justify-content:space-between;border-bottom:1px dotted #ddd;padding:4px 0;}
        .amount-box{text-align:center;background:#10b981;color:#fff;padding:15px;border-radius:8px;margin:15px 0;font-size:22px;font-weight:bold;}
        .footer{text-align:center;font-size:10px;color:#888;margin-top:20px;}
        @media print{button{display:none;}}
    </style></head><body>
        <div class="header">
            <h1>🎓 ${instituteName}</h1>
            <p>${address} | ${phone}</p>
        </div>
        <div class="receipt-no">FEE RECEIPT: ${payment.receiptNo}</div>
        <div class="details">
            <div class="row"><span>Date:</span><span>${payment.date}</span></div>
            <div class="row"><span>Student:</span><span>${student?.name || '-'}</span></div>
            <div class="row"><span>Student ID:</span><span>${student?.studentId || '-'}</span></div>
            <div class="row"><span>Course:</span><span>${course?.name || '-'}</span></div>
            <div class="row"><span>Fee Type:</span><span>${payment.feeType}</span></div>
            <div class="row"><span>Payment Method:</span><span>${payment.paymentMethod}</span></div>
            <div class="row"><span>Collected By:</span><span>${payment.collectedBy || '-'}</span></div>
            ${payment.remarks ? `<div class="row"><span>Remarks:</span><span>${payment.remarks}</span></div>` : ''}
        </div>
        <div class="amount-box">Amount Paid: Rs. ${(payment.amount || 0).toLocaleString()}</div>
        <div class="footer"><p>${receiptFooter}</p><p>This is a computer-generated receipt.</p></div>
        <button onclick="window.print()" style="margin:20px auto;display:block;padding:10px 30px;background:#6366f1;color:#fff;border:none;border-radius:5px;cursor:pointer;">🖨️ Print</button>
    </body></html>`);
    win.document.close();
}

// ==================== ATTENDANCE MODULE ====================
async function renderAttendance(container) {
    const batches = await dbGetAll('batches');
    const courses = await dbGetAll('courses');
    const canMark = hasAnyRole('admin', 'teacher');

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1>✅ Attendance Management</h1>
                <p>Mark and view student attendance</p>
            </div>
        </div>

        ${canMark ? `
        <div class="section-card">
            <h2 class="section-title">📝 Mark Attendance</h2>
            <div class="filter-bar">
                <select id="att-batch" onchange="loadAttendanceStudents()">
                    <option value="">Select Batch</option>
                    ${batches.filter(b => b.status === 'active').map(b => {
                        const course = courses.find(c => c.id === b.courseId);
                        return `<option value="${b.id}" data-course="${b.courseId}">${b.batchId} - ${course?.name || ''}</option>`;
                    }).join('')}
                </select>
                <input type="date" id="att-date" value="${new Date().toISOString().split('T')[0]}">
                <button class="btn btn-primary" onclick="loadAttendanceStudents()">Load Students</button>
            </div>
            <div id="attendance-form-container"></div>
        </div>
        ` : ''}

        <div class="section-card">
            <h2 class="section-title">📊 Attendance Records</h2>
            <div class="filter-bar">
                <select id="att-view-batch" onchange="loadAttendanceRecords()">
                    <option value="">Select Batch</option>
                    ${batches.map(b => {
                        const course = courses.find(c => c.id === b.courseId);
                        return `<option value="${b.id}">${b.batchId} - ${course?.name || ''}</option>`;
                    }).join('')}
                </select>
            </div>
            <div id="attendance-records-container"></div>
        </div>
    `;
}

async function loadAttendanceStudents() {
    const batchId = parseInt(document.getElementById('att-batch')?.value);
    const date = document.getElementById('att-date')?.value;
    const containerEl = document.getElementById('attendance-form-container');
    if (!batchId || !date || !containerEl) return;

    const enrollments = await dbGetByIndex('enrollments', 'batchId', batchId);
    const students = await dbGetAll('students');
    const existingAttendance = await dbGetAll('attendance');
    const todayAttendance = existingAttendance.filter(a => a.batchId === batchId && a.date === date);

    const enrolledStudents = enrollments.map(e => {
        const student = students.find(s => s.id === e.studentId);
        const existing = todayAttendance.find(a => a.studentId === e.studentId);
        return { ...student, existingStatus: existing?.status || '' };
    }).filter(Boolean);

    if (enrolledStudents.length === 0) {
        containerEl.innerHTML = '<div class="empty-state-small">No students enrolled in this batch</div>';
        return;
    }

    containerEl.innerHTML = `
        <div class="data-table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Student</th>
                        <th>Student ID</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Late</th>
                        <th>Leave</th>
                    </tr>
                </thead>
                <tbody>
                    ${enrolledStudents.map((s, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td><strong>${s.name}</strong></td>
                            <td>${s.studentId}</td>
                            <td><label class="radio-label"><input type="radio" name="att-${s.id}" value="Present" ${s.existingStatus === 'Present' ? 'checked' : (!s.existingStatus ? 'checked' : '')}> ✅</label></td>
                            <td><label class="radio-label"><input type="radio" name="att-${s.id}" value="Absent" ${s.existingStatus === 'Absent' ? 'checked' : ''}> ❌</label></td>
                            <td><label class="radio-label"><input type="radio" name="att-${s.id}" value="Late" ${s.existingStatus === 'Late' ? 'checked' : ''}> ⏰</label></td>
                            <td><label class="radio-label"><input type="radio" name="att-${s.id}" value="Leave" ${s.existingStatus === 'Leave' ? 'checked' : ''}> 📝</label></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="form-actions">
            <button class="btn btn-primary btn-lg" onclick="saveAttendance(${batchId}, '${date}', [${enrolledStudents.map(s => s.id).join(',')}])">
                💾 Save Attendance
            </button>
        </div>
    `;
}

async function saveAttendance(batchId, date, studentIds) {
    const batch = await dbGet('batches', batchId);
    const courseId = batch?.courseId;

    // Remove existing attendance for this batch+date
    const allAttendance = await dbGetAll('attendance');
    for (const a of allAttendance) {
        if (a.batchId === batchId && a.date === date) {
            await dbDelete('attendance', a.id);
        }
    }

    for (const studentId of studentIds) {
        const radio = document.querySelector(`input[name="att-${studentId}"]:checked`);
        const status = radio ? radio.value : 'Present';
        await dbAdd('attendance', {
            studentId,
            batchId,
            courseId,
            date,
            status,
            markedBy: currentUser.name,
            markedAt: new Date().toISOString()
        });
    }

    await addAuditLog(currentUser.id, currentUser.name, 'Marked Attendance', 'attendance', batchId, `Marked attendance for ${studentIds.length} students on ${date}`);
    showToast(`Attendance saved for ${studentIds.length} students!`);
}

async function loadAttendanceRecords() {
    const batchId = parseInt(document.getElementById('att-view-batch')?.value);
    const containerEl = document.getElementById('attendance-records-container');
    if (!batchId || !containerEl) return;

    const allAttendance = await dbGetAll('attendance');
    const batchAttendance = allAttendance.filter(a => a.batchId === batchId);
    const students = await dbGetAll('students');

    // Group by student
    const studentStats = {};
    for (const a of batchAttendance) {
        if (!studentStats[a.studentId]) {
            studentStats[a.studentId] = { present: 0, absent: 0, late: 0, leave: 0, total: 0 };
        }
        studentStats[a.studentId][a.status.toLowerCase()]++;
        studentStats[a.studentId].total++;
    }

    containerEl.innerHTML = `
        <div class="data-table-container">
            <table class="data-table">
                <thead>
                    <tr><th>Student</th><th>Present</th><th>Absent</th><th>Late</th><th>Leave</th><th>Total</th><th>Percentage</th></tr>
                </thead>
                <tbody>
                    ${Object.entries(studentStats).map(([sid, stats]) => {
                        const student = students.find(s => s.id === parseInt(sid));
                        const percent = stats.total > 0 ? (((stats.present + stats.late) / stats.total) * 100).toFixed(1) : '0.0';
                        return `<tr>
                            <td>${student?.name || 'Unknown'} (${student?.studentId || ''})</td>
                            <td class="text-green">${stats.present}</td>
                            <td class="text-red">${stats.absent}</td>
                            <td class="text-amber">${stats.late}</td>
                            <td>${stats.leave}</td>
                            <td>${stats.total}</td>
                            <td><div class="progress-bar"><div class="progress-fill" style="width:${percent}%"></div><span>${percent}%</span></div></td>
                        </tr>`;
                    }).join('')}
                    ${Object.keys(studentStats).length === 0 ? '<tr><td colspan="7" class="empty-cell">No attendance records found</td></tr>' : ''}
                </tbody>
            </table>
        </div>
    `;
}

// ==================== EXAMS MODULE ====================
async function renderExams(container) {
    const exams = await dbGetAll('exams');
    const courses = await dbGetAll('courses');
    const batches = await dbGetAll('batches');
    const canEdit = hasAnyRole('admin', 'teacher');

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1>📝 Exam Management</h1>
                <p>Create and manage exams, quizzes, and assignments</p>
            </div>
            ${canEdit ? `<button class="btn btn-primary" onclick="openExamForm()">+ Create Exam</button>` : ''}
        </div>

        <div class="data-table-container">
            <table class="data-table">
                <thead>
                    <tr><th>Exam Name</th><th>Type</th><th>Course</th><th>Batch</th><th>Total Marks</th><th>Passing</th><th>Date</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${exams.map(exam => {
                        const course = courses.find(c => c.id === exam.courseId);
                        const batch = batches.find(b => b.id === exam.batchId);
                        return `<tr>
                            <td><strong>${exam.name}</strong></td>
                            <td><span class="badge badge-outline">${exam.type}</span></td>
                            <td>${course?.name || '-'}</td>
                            <td>${batch?.batchId || '-'}</td>
                            <td>${exam.totalMarks}</td>
                            <td>${exam.passingMarks}</td>
                            <td>${exam.date}</td>
                            <td><span class="status-badge status-${exam.status}">${exam.status}</span></td>
                            <td>
                                <div class="action-btns">
                                    ${canEdit ? `
                                    <button class="btn-icon" title="Enter Marks" onclick="openMarksEntry(${exam.id})">📊</button>
                                    <button class="btn-icon" title="Edit" onclick="openExamForm(${exam.id})">✏️</button>
                                    <button class="btn-icon btn-danger" title="Delete" onclick="deleteExam(${exam.id})">🗑️</button>
                                    ` : ''}
                                </div>
                            </td>
                        </tr>`;
                    }).join('')}
                    ${exams.length === 0 ? '<tr><td colspan="9" class="empty-cell">No exams created yet</td></tr>' : ''}
                </tbody>
            </table>
        </div>
    `;
}

async function openExamForm(examId = null) {
    let exam = null;
    if (examId) exam = await dbGet('exams', examId);
    const courses = await dbGetAll('courses');
    const batches = await dbGetAll('batches');
    const examTypes = ['Quiz', 'Assignment', 'Monthly Test', 'Midterm', 'Final Exam', 'Practical Exam'];

    const content = `
        <form id="exam-form" onsubmit="saveExam(event, ${examId || 'null'})">
            <div class="form-grid">
                <div class="form-group form-group-full"><label>Exam Name *</label><input type="text" name="name" value="${exam?.name || ''}" required></div>
                <div class="form-group"><label>Type *</label>
                    <select name="type" required>${examTypes.map(t => `<option value="${t}" ${exam?.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
                </div>
                <div class="form-group"><label>Course *</label>
                    <select name="courseId" required>${courses.map(c => `<option value="${c.id}" ${exam?.courseId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select>
                </div>
                <div class="form-group"><label>Batch *</label>
                    <select name="batchId" required>${batches.map(b => `<option value="${b.id}" ${exam?.batchId === b.id ? 'selected' : ''}>${b.batchId}</option>`).join('')}</select>
                </div>
                <div class="form-group"><label>Total Marks *</label><input type="number" name="totalMarks" value="${exam?.totalMarks || 100}" required min="1"></div>
                <div class="form-group"><label>Passing Marks *</label><input type="number" name="passingMarks" value="${exam?.passingMarks || 50}" required min="1"></div>
                <div class="form-group"><label>Date *</label><input type="date" name="date" value="${exam?.date || ''}" required></div>
                <div class="form-group"><label>Status</label>
                    <select name="status">
                        <option value="pending" ${(exam?.status || 'pending') === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="completed" ${exam?.status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeModal('exam-form')">Cancel</button>
                <button type="submit" class="btn btn-primary">💾 ${exam ? 'Update' : 'Create'} Exam</button>
            </div>
        </form>
    `;
    openModal('exam-form', exam ? 'Edit Exam' : 'Create New Exam', content, 'medium');
}

async function saveExam(e, existingId) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.courseId = parseInt(data.courseId);
    data.batchId = parseInt(data.batchId);
    data.totalMarks = parseInt(data.totalMarks);
    data.passingMarks = parseInt(data.passingMarks);

    try {
        if (existingId) {
            const existing = await dbGet('exams', existingId);
            Object.assign(existing, data);
            await dbPut('exams', existing);
            showToast('Exam updated!');
        } else {
            await dbAdd('exams', data);
            showToast('Exam created!');
        }
        closeModal('exam-form');
        await renderExams(document.getElementById('page-content'));
    } catch (err) {
        showToast('Failed to save exam', 'error');
    }
}

async function deleteExam(id) {
    if (!confirm('Delete this exam?')) return;
    await dbDelete('exams', id);
    showToast('Exam deleted');
    await renderExams(document.getElementById('page-content'));
}

async function openMarksEntry(examId) {
    const exam = await dbGet('exams', examId);
    if (!exam) return;
    const enrollments = await dbGetByIndex('enrollments', 'batchId', exam.batchId);
    const students = await dbGetAll('students');
    const existingResults = await dbGetByIndex('examResults', 'examId', examId);
    const gradingRules = await dbGetAll('gradingRules');

    const enrolledStudents = enrollments.map(e => {
        const student = students.find(s => s.id === e.studentId);
        const result = existingResults.find(r => r.studentId === e.studentId);
        return { ...student, obtainedMarks: result?.obtainedMarks || '' };
    }).filter(Boolean);

    const content = `
        <form id="marks-form" onsubmit="saveMarks(event, ${examId})">
            <div class="info-banner">📝 ${exam.name} | Total Marks: ${exam.totalMarks} | Passing: ${exam.passingMarks}</div>
            <div class="data-table-container">
                <table class="data-table">
                    <thead><tr><th>#</th><th>Student</th><th>Student ID</th><th>Marks (out of ${exam.totalMarks})</th></tr></thead>
                    <tbody>
                        ${enrolledStudents.map((s, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${s.name}</td>
                                <td>${s.studentId}</td>
                                <td><input type="number" name="marks-${s.id}" value="${s.obtainedMarks}" min="0" max="${exam.totalMarks}" class="input-marks" placeholder="0"></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeModal('marks-entry')">Cancel</button>
                <button type="submit" class="btn btn-primary">💾 Save Marks</button>
            </div>
        </form>
    `;

    openModal('marks-entry', 'Enter Marks', content, 'large');
}

async function saveMarks(e, examId) {
    e.preventDefault();
    const formData = new FormData(e.target);

    // Clear existing results for this exam
    const existingResults = await dbGetByIndex('examResults', 'examId', examId);
    for (const r of existingResults) {
        await dbDelete('examResults', r.id);
    }

    for (const [key, value] of formData.entries()) {
        if (key.startsWith('marks-') && value !== '') {
            const studentId = parseInt(key.replace('marks-', ''));
            await dbAdd('examResults', {
                examId,
                studentId,
                obtainedMarks: parseInt(value) || 0,
                remarks: ''
            });
        }
    }

    showToast('Marks saved successfully!');
    closeModal('marks-entry');
}

// ==================== RESULTS MODULE ====================
async function renderResults(container) {
    const exams = await dbGetAll('exams');
    const courses = await dbGetAll('courses');
    const batches = await dbGetAll('batches');

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1>📊 Results</h1>
                <p>View and print exam results and report cards</p>
            </div>
        </div>

        <div class="filter-bar">
            <select id="result-exam" onchange="loadResultsForExam()">
                <option value="">Select Exam</option>
                ${exams.filter(e => e.status === 'completed').map(e => {
                    const course = courses.find(c => c.id === e.courseId);
                    return `<option value="${e.id}">${e.name} - ${course?.name || ''}</option>`;
                }).join('')}
            </select>
        </div>

        <div id="results-container"></div>
    `;
}

async function loadResultsForExam() {
    const examId = parseInt(document.getElementById('result-exam')?.value);
    const containerEl = document.getElementById('results-container');
    if (!examId || !containerEl) return;

    const exam = await dbGet('exams', examId);
    const results = await dbGetByIndex('examResults', 'examId', examId);
    const students = await dbGetAll('students');
    const gradingRules = await dbGetAll('gradingRules');

    function getGrade(percent) {
        for (const rule of gradingRules.sort((a, b) => b.minMarks - a.minMarks)) {
            if (percent >= rule.minMarks && percent <= rule.maxMarks) return rule;
        }
        return { grade: 'F', remarks: 'Fail' };
    }

    containerEl.innerHTML = `
        <div class="section-card">
            <div class="result-header">
                <h2>${exam.name}</h2>
                <span>Total Marks: ${exam.totalMarks} | Passing: ${exam.passingMarks}</span>
                <button class="btn btn-outline" onclick="printResults(${examId})">🖨️ Print Results</button>
            </div>
            <div class="data-table-container">
                <table class="data-table" id="results-table">
                    <thead>
                        <tr><th>#</th><th>Student</th><th>Obtained</th><th>Total</th><th>Percentage</th><th>Grade</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        ${results.map((r, i) => {
                            const student = students.find(s => s.id === r.studentId);
                            const percent = exam.totalMarks > 0 ? ((r.obtainedMarks / exam.totalMarks) * 100).toFixed(1) : 0;
                            const gradeInfo = getGrade(parseFloat(percent));
                            const passed = r.obtainedMarks >= exam.passingMarks;
                            return `<tr>
                                <td>${i + 1}</td>
                                <td>${student?.name || 'Unknown'} (${student?.studentId || ''})</td>
                                <td><strong>${r.obtainedMarks}</strong></td>
                                <td>${exam.totalMarks}</td>
                                <td>${percent}%</td>
                                <td><span class="badge ${passed ? 'badge-green' : 'badge-red'}">${gradeInfo.grade}</span></td>
                                <td><span class="status-badge ${passed ? 'status-active' : 'status-dropped'}">${passed ? 'Pass' : 'Fail'}</span></td>
                            </tr>`;
                        }).join('')}
                        ${results.length === 0 ? '<tr><td colspan="7" class="empty-cell">No results found for this exam</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function printResults(examId) {
    const exam = await dbGet('exams', examId);
    const table = document.getElementById('results-table');
    if (!table || !exam) return;

    const instituteName = await getSetting('instituteName') || 'EduTech Institute';
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Results - ${exam.name}</title>
    <style>body{font-family:Arial;padding:20px;} h1{color:#6366f1;text-align:center;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;text-align:center;font-size:13px;} th{background:#6366f1;color:#fff;} @media print{button{display:none;}}</style>
    </head><body>
        <h1>${instituteName}</h1>
        <h2 style="text-align:center">${exam.name} - Results</h2>
        <p style="text-align:center">Date: ${exam.date} | Total Marks: ${exam.totalMarks} | Passing: ${exam.passingMarks}</p>
        ${table.outerHTML}
        <button onclick="window.print()" style="margin:20px auto;display:block;padding:10px 30px;background:#6366f1;color:#fff;border:none;border-radius:5px;cursor:pointer;">🖨️ Print</button>
    </body></html>`);
    win.document.close();
}

// ==================== CERTIFICATES MODULE ====================
async function renderCertificates(container) {
    const certificates = await dbGetAll('certificates');
    const canGenerate = hasAnyRole('admin');

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1>🏆 Certificate Management</h1>
                <p>Generate and verify certificates</p>
            </div>
            <div class="btn-group">
                ${canGenerate ? `<button class="btn btn-primary" onclick="openCertificateForm()">+ Generate Certificate</button>` : ''}
                <button class="btn btn-outline" onclick="openCertificateVerification()">🔍 Verify Certificate</button>
            </div>
        </div>

        <div class="data-table-container">
            <table class="data-table">
                <thead>
                    <tr><th>Certificate ID</th><th>Student</th><th>Course</th><th>Duration</th><th>Issue Date</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${certificates.map(c => `
                        <tr>
                            <td><span class="badge badge-green">${c.certificateId}</span></td>
                            <td>${c.studentName}</td>
                            <td>${c.courseName}</td>
                            <td>${c.duration}</td>
                            <td>${c.issueDate}</td>
                            <td>
                                <div class="action-btns">
                                    <button class="btn-icon" title="View Certificate" onclick="viewCertificate(${c.id})">👁️</button>
                                    <button class="btn-icon" title="Print" onclick="printCertificate(${c.id})">🖨️</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                    ${certificates.length === 0 ? '<tr><td colspan="6" class="empty-cell">No certificates generated yet</td></tr>' : ''}
                </tbody>
            </table>
        </div>
    `;
}

async function openCertificateForm() {
    const students = await dbGetAll('students');
    const courses = await dbGetAll('courses');

    const content = `
        <form id="cert-form" onsubmit="generateCertificate(event)">
            <div class="form-grid">
                <div class="form-group">
                    <label>Student *</label>
                    <select name="studentId" required onchange="fillCertStudentInfo(this.value)">
                        <option value="">Select Student</option>
                        ${students.map(s => `<option value="${s.id}">${s.name} (${s.studentId})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Course *</label>
                    <select name="courseId" required onchange="fillCertCourseInfo(this.value)">
                        <option value="">Select Course</option>
                        ${courses.map(c => `<option value="${c.id}" data-duration="${c.duration}">${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Student Name</label><input type="text" name="studentName" id="cert-student-name" required></div>
                <div class="form-group"><label>Father Name</label><input type="text" name="fatherName" id="cert-father-name" required></div>
                <div class="form-group"><label>Course Name</label><input type="text" name="courseName" id="cert-course-name" required></div>
                <div class="form-group"><label>Duration</label><input type="text" name="duration" id="cert-duration" required></div>
                <div class="form-group"><label>Completion Date</label><input type="date" name="completionDate" value="${new Date().toISOString().split('T')[0]}" required></div>
                <div class="form-group"><label>Issue Date</label><input type="date" name="issueDate" value="${new Date().toISOString().split('T')[0]}" required></div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeModal('cert-form')">Cancel</button>
                <button type="submit" class="btn btn-primary">🏆 Generate Certificate</button>
            </div>
        </form>
    `;

    openModal('cert-form', 'Generate Certificate', content, 'large');
}

async function fillCertStudentInfo(studentId) {
    const student = await dbGet('students', parseInt(studentId));
    if (student) {
        document.getElementById('cert-student-name').value = student.name;
        document.getElementById('cert-father-name').value = student.fatherName;
    }
}

async function fillCertCourseInfo(courseId) {
    const course = await dbGet('courses', parseInt(courseId));
    if (course) {
        document.getElementById('cert-course-name').value = course.name;
        document.getElementById('cert-duration').value = course.duration;
    }
}

async function generateCertificate(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.studentId = parseInt(data.studentId);
    data.courseId = parseInt(data.courseId);

    const course = await dbGet('courses', data.courseId);
    const categories = await dbGetAll('courseCategories');
    const cat = categories.find(c => c.id === course?.categoryId);
    const certCount = await dbCount('certificates');
    data.certificateId = generateCertificateId(cat?.name || 'IT Courses', certCount);
    data.status = 'issued';

    try {
        await dbAdd('certificates', data);
        await addAuditLog(currentUser.id, currentUser.name, 'Generated Certificate', 'certificates', data.certificateId, `Certificate for ${data.studentName}`);
        showToast(`Certificate generated! ID: ${data.certificateId}`);
        closeModal('cert-form');
        await renderCertificates(document.getElementById('page-content'));
    } catch (err) {
        showToast('Failed to generate certificate', 'error');
    }
}

async function viewCertificate(certId) {
    const cert = await dbGet('certificates', certId);
    if (!cert) return;
    const instituteName = await getSetting('instituteName') || 'EduTech Institute';
    const directorName = await getSetting('directorName') || '';
    const principalName = await getSetting('principalName') || '';

    const content = `
        <div class="certificate-preview">
            <div class="certificate">
                <div class="cert-border">
                    <div class="cert-inner">
                        <div class="cert-logo">🎓</div>
                        <h1 class="cert-institute">${instituteName}</h1>
                        <div class="cert-divider"></div>
                        <h2 class="cert-title">CERTIFICATE OF COMPLETION</h2>
                        <p class="cert-text">This is to certify that</p>
                        <h2 class="cert-name">${cert.studentName}</h2>
                        <p class="cert-text">Son/Daughter of <strong>${cert.fatherName}</strong></p>
                        <p class="cert-text">has successfully completed the course</p>
                        <h3 class="cert-course">${cert.courseName}</h3>
                        <p class="cert-text">Duration: ${cert.duration} | Completed: ${cert.completionDate}</p>
                        <div class="cert-id">Certificate ID: ${cert.certificateId}</div>
                        <div class="cert-signatures">
                            <div class="cert-sig">
                                <div class="sig-line"></div>
                                <p>${directorName || 'Director'}</p>
                            </div>
                            <div class="cert-sig">
                                <div class="sig-line"></div>
                                <p>${principalName || 'Principal'}</p>
                            </div>
                        </div>
                        <div class="cert-footer">Issue Date: ${cert.issueDate}</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    openModal('cert-view', 'Certificate Preview', content, 'large');
}

async function printCertificate(certId) {
    const cert = await dbGet('certificates', certId);
    if (!cert) return;
    const instituteName = await getSetting('instituteName') || 'EduTech Institute';
    const directorName = await getSetting('directorName') || 'Director';
    const principalName = await getSetting('principalName') || 'Principal';

    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Certificate - ${cert.certificateId}</title>
    <style>
        @page{size:landscape;margin:0;}
        body{font-family:'Georgia',serif;margin:0;padding:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f0f0;}
        .certificate{width:900px;height:620px;background:#fff;border:3px solid #6366f1;position:relative;padding:20px;}
        .cert-border{border:2px solid #c4b5fd;height:100%;padding:30px;text-align:center;position:relative;}
        .cert-logo{font-size:48px;margin-bottom:5px;}
        .cert-institute{color:#6366f1;font-size:28px;margin:5px 0;}
        .cert-divider{width:200px;height:3px;background:linear-gradient(90deg,transparent,#6366f1,transparent);margin:10px auto;}
        .cert-title{font-size:24px;color:#333;letter-spacing:3px;margin:15px 0;}
        .cert-text{font-size:14px;color:#555;margin:8px 0;}
        .cert-name{font-size:32px;color:#1e293b;border-bottom:2px solid #6366f1;display:inline-block;padding:5px 40px;margin:10px 0;}
        .cert-course{font-size:22px;color:#6366f1;margin:10px 0;}
        .cert-id{font-size:12px;color:#888;margin:15px 0;}
        .cert-signatures{display:flex;justify-content:space-around;margin-top:30px;}
        .sig-line{width:150px;border-bottom:2px solid #333;margin:0 auto 5px;}
        .cert-sig p{font-size:13px;color:#333;}
        .cert-footer{font-size:11px;color:#888;position:absolute;bottom:10px;width:100%;text-align:center;left:0;}
        @media print{body{background:#fff;} .certificate{border:3px solid #6366f1;} button{display:none;}}
    </style></head><body>
        <div class="certificate">
            <div class="cert-border">
                <div class="cert-logo">🎓</div>
                <h1 class="cert-institute">${instituteName}</h1>
                <div class="cert-divider"></div>
                <h2 class="cert-title">CERTIFICATE OF COMPLETION</h2>
                <p class="cert-text">This is to certify that</p>
                <h2 class="cert-name">${cert.studentName}</h2>
                <p class="cert-text">Son/Daughter of <strong>${cert.fatherName}</strong></p>
                <p class="cert-text">has successfully completed the course</p>
                <h3 class="cert-course">${cert.courseName}</h3>
                <p class="cert-text">Duration: ${cert.duration} | Completed: ${cert.completionDate}</p>
                <div class="cert-id">Certificate ID: ${cert.certificateId}</div>
                <div class="cert-signatures">
                    <div class="cert-sig"><div class="sig-line"></div><p>${directorName}</p></div>
                    <div class="cert-sig"><div class="sig-line"></div><p>${principalName}</p></div>
                </div>
                <div class="cert-footer">Issue Date: ${cert.issueDate}</div>
            </div>
        </div>
        <button onclick="window.print()" style="position:fixed;bottom:20px;right:20px;padding:12px 30px;background:#6366f1;color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:16px;">🖨️ Print Certificate</button>
    </body></html>`);
    win.document.close();
}

function openCertificateVerification() {
    const content = `
        <div class="verification-form">
            <p>Enter Certificate ID to verify:</p>
            <div class="input-icon-wrapper" style="max-width:400px;margin:20px auto;">
                <input type="text" id="verify-cert-id" placeholder="e.g. CERT-IT-2026-00001" style="font-size:16px;text-align:center">
            </div>
            <button class="btn btn-primary" onclick="verifyCertificate()">🔍 Verify</button>
            <div id="verification-result" style="margin-top:20px;"></div>
        </div>
    `;
    openModal('cert-verify', 'Certificate Verification', content, 'medium');
}

async function verifyCertificate() {
    const certId = document.getElementById('verify-cert-id')?.value.trim();
    const resultDiv = document.getElementById('verification-result');
    if (!certId || !resultDiv) return;

    const certificates = await dbGetAll('certificates');
    const cert = certificates.find(c => c.certificateId === certId);

    if (cert) {
        resultDiv.innerHTML = `
            <div class="verification-success">
                <div class="verify-icon">✅</div>
                <h3>Certificate Valid</h3>
                <div class="verify-details">
                    <p><strong>Certificate ID:</strong> ${cert.certificateId}</p>
                    <p><strong>Student Name:</strong> ${cert.studentName}</p>
                    <p><strong>Course:</strong> ${cert.courseName}</p>
                    <p><strong>Duration:</strong> ${cert.duration}</p>
                    <p><strong>Issue Date:</strong> ${cert.issueDate}</p>
                </div>
            </div>
        `;
    } else {
        resultDiv.innerHTML = `
            <div class="verification-failed">
                <div class="verify-icon">❌</div>
                <h3>Certificate Not Found</h3>
                <p>The certificate ID you entered is not valid or does not exist in our records.</p>
            </div>
        `;
    }
}

// ==================== TIMETABLE MODULE ====================
async function renderTimetable(container) {
    const timetable = await dbGetAll('timetable');
    const courses = await dbGetAll('courses');
    const batches = await dbGetAll('batches');
    const teachers = await dbGetAll('teachers');
    const rooms = await dbGetAll('rooms');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const dayGroups = {};
    for (const day of days) {
        dayGroups[day] = timetable.filter(t => t.day === day).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    }

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1>🕐 Timetable</h1>
                <p>Weekly class schedule</p>
            </div>
            ${hasRole('admin') ? `<button class="btn btn-primary" onclick="openTimetableForm()">+ Add Schedule</button>` : ''}
        </div>

        <div class="timetable-grid">
            ${days.map(day => `
                <div class="timetable-day">
                    <h3 class="day-header">${day}</h3>
                    ${dayGroups[day].length > 0 ? dayGroups[day].map(slot => {
                        const course = courses.find(c => c.id === slot.courseId);
                        const teacher = teachers.find(t => t.id === slot.teacherId);
                        const room = rooms.find(r => r.id === slot.roomId);
                        const batch = batches.find(b => b.id === slot.batchId);
                        return `
                            <div class="timetable-slot">
                                <div class="slot-time">${slot.startTime} - ${slot.endTime}</div>
                                <div class="slot-course">${course?.name || 'Unknown'}</div>
                                <div class="slot-details">
                                    <span>👨‍🏫 ${teacher?.name || '-'}</span>
                                    <span>🏫 ${room?.name || '-'}</span>
                                    <span>📦 ${batch?.batchId || '-'}</span>
                                </div>
                                ${hasRole('admin') ? `<button class="btn-icon btn-danger btn-tiny" onclick="deleteTimetableSlot(${slot.id})">✕</button>` : ''}
                            </div>
                        `;
                    }).join('') : '<div class="no-classes">No classes</div>'}
                </div>
            `).join('')}
        </div>
    `;
}

async function openTimetableForm() {
    const batches = await dbGetAll('batches');
    const teachers = await dbGetAll('teachers');
    const rooms = await dbGetAll('rooms');
    const courses = await dbGetAll('courses');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const content = `
        <form id="timetable-form" onsubmit="saveTimetableSlot(event)">
            <div class="form-grid">
                <div class="form-group"><label>Batch *</label>
                    <select name="batchId" required id="tt-batch" onchange="autoFillTimetable()">
                        <option value="">Select Batch</option>
                        ${batches.filter(b => b.status === 'active').map(b => {
                            const course = courses.find(c => c.id === b.courseId);
                            return `<option value="${b.id}" data-course="${b.courseId}" data-teacher="${b.teacherId}" data-room="${b.roomId}">${b.batchId} - ${course?.name || ''}</option>`;
                        }).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Course</label>
                    <select name="courseId" id="tt-course">${courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select>
                </div>
                <div class="form-group"><label>Teacher</label>
                    <select name="teacherId" id="tt-teacher">${teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select>
                </div>
                <div class="form-group"><label>Room</label>
                    <select name="roomId" id="tt-room">${rooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}</select>
                </div>
                <div class="form-group"><label>Day *</label>
                    <select name="day" required>${days.map(d => `<option value="${d}">${d}</option>`).join('')}</select>
                </div>
                <div class="form-group"><label>Start Time *</label><input type="time" name="startTime" required></div>
                <div class="form-group"><label>End Time *</label><input type="time" name="endTime" required></div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeModal('timetable-form')">Cancel</button>
                <button type="submit" class="btn btn-primary">💾 Add Schedule</button>
            </div>
        </form>
    `;
    openModal('timetable-form', 'Add Timetable Schedule', content, 'medium');
}

function autoFillTimetable() {
    const sel = document.getElementById('tt-batch');
    const opt = sel.options[sel.selectedIndex];
    if (opt.dataset.course) document.getElementById('tt-course').value = opt.dataset.course;
    if (opt.dataset.teacher) document.getElementById('tt-teacher').value = opt.dataset.teacher;
    if (opt.dataset.room) document.getElementById('tt-room').value = opt.dataset.room;
}

async function saveTimetableSlot(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.batchId = parseInt(data.batchId);
    data.courseId = parseInt(data.courseId);
    data.teacherId = parseInt(data.teacherId);
    data.roomId = parseInt(data.roomId);

    // Check for conflicts
    const existing = await dbGetAll('timetable');
    const conflict = existing.find(t =>
        t.day === data.day &&
        ((t.teacherId === data.teacherId) || (t.roomId === data.roomId)) &&
        t.startTime < data.endTime && t.endTime > data.startTime
    );

    if (conflict) {
        showToast('Schedule conflict detected! Teacher or room is already booked at this time.', 'warning');
        return;
    }

    await dbAdd('timetable', data);
    showToast('Schedule added!');
    closeModal('timetable-form');
    await renderTimetable(document.getElementById('page-content'));
}

async function deleteTimetableSlot(id) {
    if (!confirm('Remove this schedule?')) return;
    await dbDelete('timetable', id);
    showToast('Schedule removed');
    await renderTimetable(document.getElementById('page-content'));
}

// ==================== ACCOUNTING MODULE ====================
async function renderAccounting(container) {
    const payments = await dbGetAll('feePayments');
    const expenses = await dbGetAll('expenses');
    const incomeRecords = await dbGetAll('income');

    const totalFeeIncome = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const totalOtherIncome = incomeRecords.reduce((s, i) => s + (i.amount || 0), 0);
    const totalIncome = totalFeeIncome + totalOtherIncome;
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const netProfit = totalIncome - totalExpenses;

    // Expense by category
    const expenseByCategory = {};
    for (const exp of expenses) {
        expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + exp.amount;
    }

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1>📒 Accounting</h1>
                <p>Institute financial overview</p>
            </div>
            <button class="btn btn-primary" onclick="openExpenseForm()">+ Add Expense</button>
        </div>

        <div class="stats-grid stats-grid-3">
            <div class="stat-card stat-green">
                <div class="stat-icon">📈</div>
                <div class="stat-info">
                    <span class="stat-value">${formatPKR(totalIncome)}</span>
                    <span class="stat-label">Total Income</span>
                </div>
            </div>
            <div class="stat-card stat-red">
                <div class="stat-icon">📉</div>
                <div class="stat-info">
                    <span class="stat-value">${formatPKR(totalExpenses)}</span>
                    <span class="stat-label">Total Expenses</span>
                </div>
            </div>
            <div class="stat-card ${netProfit >= 0 ? 'stat-emerald' : 'stat-red'}">
                <div class="stat-icon">${netProfit >= 0 ? '💰' : '⚠️'}</div>
                <div class="stat-info">
                    <span class="stat-value">${formatPKR(netProfit)}</span>
                    <span class="stat-label">Net ${netProfit >= 0 ? 'Profit' : 'Loss'}</span>
                </div>
            </div>
        </div>

        <!-- Expense Breakdown -->
        <div class="section-card">
            <h2 class="section-title">📊 Expense Breakdown</h2>
            <div class="expense-breakdown">
                ${Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => `
                    <div class="expense-category-row">
                        <span class="cat-name">${cat}</span>
                        <div class="cat-bar"><div class="cat-bar-fill" style="width:${totalExpenses > 0 ? (amount / totalExpenses * 100) : 0}%"></div></div>
                        <span class="cat-amount">${formatPKR(amount)}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Expenses Table -->
        <div class="section-card">
            <h2 class="section-title">📋 Expense Records</h2>
            <div class="data-table-container">
                <table class="data-table">
                    <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Paid To</th><th>Method</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${expenses.sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(exp => `
                            <tr>
                                <td>${exp.date}</td>
                                <td><span class="badge badge-outline">${exp.category}</span></td>
                                <td>${exp.description || '-'}</td>
                                <td class="text-red font-bold">${formatPKR(exp.amount)}</td>
                                <td>${exp.paidTo || '-'}</td>
                                <td>${exp.paymentMethod || '-'}</td>
                                <td><button class="btn-icon btn-danger" onclick="deleteExpense(${exp.id})">🗑️</button></td>
                            </tr>
                        `).join('')}
                        ${expenses.length === 0 ? '<tr><td colspan="7" class="empty-cell">No expenses recorded</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function openExpenseForm() {
    const categories = ['Teacher Salaries', 'Staff Salaries', 'Electricity', 'Internet', 'Rent', 'Equipment', 'Stationery', 'Marketing', 'Maintenance', 'Other'];
    const content = `
        <form id="expense-form" onsubmit="saveExpense(event)">
            <div class="form-grid">
                <div class="form-group"><label>Category *</label>
                    <select name="category" required>${categories.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
                </div>
                <div class="form-group"><label>Amount (PKR) *</label><input type="number" name="amount" required min="1"></div>
                <div class="form-group form-group-full"><label>Description *</label><input type="text" name="description" required></div>
                <div class="form-group"><label>Date</label><input type="date" name="date" value="${new Date().toISOString().split('T')[0]}"></div>
                <div class="form-group"><label>Paid To</label><input type="text" name="paidTo"></div>
                <div class="form-group"><label>Payment Method</label>
                    <select name="paymentMethod">
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="JazzCash">JazzCash</option>
                        <option value="Easypaisa">Easypaisa</option>
                    </select>
                </div>
                <div class="form-group form-group-full"><label>Remarks</label><input type="text" name="remarks"></div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeModal('expense-form')">Cancel</button>
                <button type="submit" class="btn btn-primary">💾 Save Expense</button>
            </div>
        </form>
    `;
    openModal('expense-form', 'Add Expense', content, 'medium');
}

async function saveExpense(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.amount = parseInt(data.amount);
    await dbAdd('expenses', data);
    await addAuditLog(currentUser.id, currentUser.name, 'Added Expense', 'expenses', '', `${data.category}: ${formatPKR(data.amount)}`);
    showToast('Expense recorded!');
    closeModal('expense-form');
    await renderAccounting(document.getElementById('page-content'));
}

async function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;
    await dbDelete('expenses', id);
    showToast('Expense deleted');
    await renderAccounting(document.getElementById('page-content'));
}

// ==================== REPORTS MODULE ====================
async function renderReports(container) {
    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1>📈 Reports</h1>
                <p>Generate and export various reports</p>
            </div>
        </div>

        <div class="reports-grid">
            <div class="report-card" onclick="generateReport('all-students')">
                <span class="report-icon">👨‍🎓</span>
                <h3>All Students</h3>
                <p>Complete student list with details</p>
            </div>
            <div class="report-card" onclick="generateReport('active-students')">
                <span class="report-icon">✅</span>
                <h3>Active Students</h3>
                <p>Currently enrolled students</p>
            </div>
            <div class="report-card" onclick="generateReport('course-wise')">
                <span class="report-icon">📚</span>
                <h3>Course-wise Students</h3>
                <p>Students grouped by course</p>
            </div>
            <div class="report-card" onclick="generateReport('fee-collection')">
                <span class="report-icon">💰</span>
                <h3>Fee Collection</h3>
                <p>All fee payments and receipts</p>
            </div>
            <div class="report-card" onclick="generateReport('outstanding-fees')">
                <span class="report-icon">⏰</span>
                <h3>Outstanding Fees</h3>
                <p>Students with pending fees</p>
            </div>
            <div class="report-card" onclick="generateReport('expenses')">
                <span class="report-icon">📉</span>
                <h3>Expenses</h3>
                <p>All institute expenses</p>
            </div>
            <div class="report-card" onclick="generateReport('profit-loss')">
                <span class="report-icon">📊</span>
                <h3>Profit & Loss</h3>
                <p>Income vs expenses summary</p>
            </div>
            <div class="report-card" onclick="generateReport('attendance')">
                <span class="report-icon">📋</span>
                <h3>Attendance Report</h3>
                <p>Student attendance summary</p>
            </div>
        </div>

        <div id="report-output" class="section-card" style="display:none;"></div>
    `;
}

async function generateReport(type) {
    const output = document.getElementById('report-output');
    if (!output) return;
    output.style.display = 'block';

    const instituteName = await getSetting('instituteName') || 'EduTech Institute';
    let title = '', tableHtml = '';

    switch (type) {
        case 'all-students': {
            title = 'All Students Report';
            const students = await dbGetAll('students');
            tableHtml = `<table class="data-table"><thead><tr><th>ID</th><th>Name</th><th>Father</th><th>Mobile</th><th>City</th><th>Status</th></tr></thead><tbody>
                ${students.map(s => `<tr><td>${s.studentId}</td><td>${s.name}</td><td>${s.fatherName}</td><td>${s.mobile}</td><td>${s.city || '-'}</td><td>${s.status}</td></tr>`).join('')}
            </tbody></table>`;
            break;
        }
        case 'active-students': {
            title = 'Active Students Report';
            const students = (await dbGetAll('students')).filter(s => s.status === 'active');
            tableHtml = `<table class="data-table"><thead><tr><th>ID</th><th>Name</th><th>Father</th><th>Mobile</th><th>Admission Date</th></tr></thead><tbody>
                ${students.map(s => `<tr><td>${s.studentId}</td><td>${s.name}</td><td>${s.fatherName}</td><td>${s.mobile}</td><td>${s.admissionDate}</td></tr>`).join('')}
            </tbody></table>`;
            break;
        }
        case 'fee-collection': {
            title = 'Fee Collection Report';
            const payments = await dbGetAll('feePayments');
            const students = await dbGetAll('students');
            const total = payments.reduce((s, p) => s + (p.amount || 0), 0);
            tableHtml = `<p class="report-summary">Total Collected: <strong>${formatPKR(total)}</strong> | Total Receipts: <strong>${payments.length}</strong></p>
            <table class="data-table"><thead><tr><th>Receipt</th><th>Student</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead><tbody>
                ${payments.map(p => {
                    const student = students.find(s => s.id === p.studentId);
                    return `<tr><td>${p.receiptNo}</td><td>${student?.name || '-'}</td><td>${formatPKR(p.amount)}</td><td>${p.paymentMethod}</td><td>${p.date}</td></tr>`;
                }).join('')}
            </tbody></table>`;
            break;
        }
        case 'outstanding-fees': {
            title = 'Outstanding Fees Report';
            const admissions = (await dbGetAll('admissions')).filter(a => a.remainingAmount > 0);
            const students = await dbGetAll('students');
            const courses = await dbGetAll('courses');
            const totalOutstanding = admissions.reduce((s, a) => s + (a.remainingAmount || 0), 0);
            tableHtml = `<p class="report-summary">Total Outstanding: <strong class="text-red">${formatPKR(totalOutstanding)}</strong></p>
            <table class="data-table"><thead><tr><th>Student</th><th>Course</th><th>Total Fee</th><th>Paid</th><th>Remaining</th></tr></thead><tbody>
                ${admissions.map(a => {
                    const student = students.find(s => s.id === a.studentId);
                    const course = courses.find(c => c.id === a.courseId);
                    return `<tr><td>${student?.name || '-'}</td><td>${course?.name || '-'}</td><td>${formatPKR(a.totalFee)}</td><td class="text-green">${formatPKR(a.paidAmount)}</td><td class="text-red">${formatPKR(a.remainingAmount)}</td></tr>`;
                }).join('')}
            </tbody></table>`;
            break;
        }
        case 'expenses': {
            title = 'Expenses Report';
            const expenses = await dbGetAll('expenses');
            const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
            tableHtml = `<p class="report-summary">Total Expenses: <strong class="text-red">${formatPKR(total)}</strong></p>
            <table class="data-table"><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Paid To</th></tr></thead><tbody>
                ${expenses.map(e => `<tr><td>${e.date}</td><td>${e.category}</td><td>${e.description}</td><td>${formatPKR(e.amount)}</td><td>${e.paidTo || '-'}</td></tr>`).join('')}
            </tbody></table>`;
            break;
        }
        case 'profit-loss': {
            title = 'Profit & Loss Report';
            const payments = await dbGetAll('feePayments');
            const expenses = await dbGetAll('expenses');
            const totalIncome = payments.reduce((s, p) => s + (p.amount || 0), 0);
            const totalExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0);
            const net = totalIncome - totalExpense;
            tableHtml = `
                <div class="profit-loss-summary">
                    <div class="pl-row"><span>Total Fee Income</span><span class="text-green">${formatPKR(totalIncome)}</span></div>
                    <div class="pl-row"><span>Total Expenses</span><span class="text-red">${formatPKR(totalExpense)}</span></div>
                    <div class="pl-row pl-total"><span>Net ${net >= 0 ? 'Profit' : 'Loss'}</span><span class="${net >= 0 ? 'text-green' : 'text-red'}">${formatPKR(net)}</span></div>
                </div>
            `;
            break;
        }
        case 'course-wise': {
            title = 'Course-wise Student Report';
            const courses = await dbGetAll('courses');
            const enrollments = await dbGetAll('enrollments');
            const students = await dbGetAll('students');
            tableHtml = courses.map(c => {
                const courseEnrollments = enrollments.filter(e => e.courseId === c.id);
                return `<h3 style="margin:15px 0 5px;">${c.name} (${c.courseCode}) - ${courseEnrollments.length} students</h3>
                <table class="data-table"><thead><tr><th>#</th><th>Student ID</th><th>Name</th><th>Status</th></tr></thead><tbody>
                    ${courseEnrollments.map((e, i) => {
                        const student = students.find(s => s.id === e.studentId);
                        return `<tr><td>${i + 1}</td><td>${student?.studentId || '-'}</td><td>${student?.name || '-'}</td><td>${e.status}</td></tr>`;
                    }).join('')}
                    ${courseEnrollments.length === 0 ? '<tr><td colspan="4" class="empty-cell">No students enrolled</td></tr>' : ''}
                </tbody></table>`;
            }).join('');
            break;
        }
        case 'attendance': {
            title = 'Attendance Summary Report';
            const attendance = await dbGetAll('attendance');
            const students = await dbGetAll('students');
            const studentStats = {};
            for (const a of attendance) {
                if (!studentStats[a.studentId]) studentStats[a.studentId] = { present: 0, absent: 0, late: 0, leave: 0, total: 0 };
                studentStats[a.studentId][a.status.toLowerCase()]++;
                studentStats[a.studentId].total++;
            }
            tableHtml = `<table class="data-table"><thead><tr><th>Student</th><th>Present</th><th>Absent</th><th>Late</th><th>Leave</th><th>Total</th><th>%</th></tr></thead><tbody>
                ${Object.entries(studentStats).map(([sid, stats]) => {
                    const student = students.find(s => s.id === parseInt(sid));
                    const pct = stats.total > 0 ? (((stats.present + stats.late) / stats.total) * 100).toFixed(1) : '0.0';
                    return `<tr><td>${student?.name || 'Unknown'}</td><td>${stats.present}</td><td>${stats.absent}</td><td>${stats.late}</td><td>${stats.leave}</td><td>${stats.total}</td><td>${pct}%</td></tr>`;
                }).join('')}
            </tbody></table>`;
            break;
        }
    }

    output.innerHTML = `
        <div class="report-output-header">
            <h2>${title}</h2>
            <div class="btn-group">
                <button class="btn btn-outline" onclick="printReport()">🖨️ Print</button>
                <button class="btn btn-outline" onclick="exportReportCSV()">📥 Export CSV</button>
            </div>
        </div>
        <div id="report-content">${tableHtml}</div>
    `;
    output.scrollIntoView({ behavior: 'smooth' });
}

function printReport() {
    const content = document.getElementById('report-content');
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Report</title><style>body{font-family:Arial;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:6px;font-size:12px;}th{background:#6366f1;color:#fff;} @media print{button{display:none;}}</style></head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    win.print();
}

function exportReportCSV() {
    const table = document.querySelector('#report-content table');
    if (!table) { showToast('No table data to export', 'warning'); return; }
    const rows = Array.from(table.querySelectorAll('tr'));
    const csv = rows.map(row => Array.from(row.querySelectorAll('th,td')).map(cell => `"${cell.textContent.trim()}"`).join(',')).join('\n');
    downloadFile(csv, 'report_export.csv', 'text/csv');
    showToast('Report exported as CSV');
}

// ==================== ANNOUNCEMENTS MODULE ====================
async function renderAnnouncements(container) {
    const announcements = await dbGetAll('announcements');
    const canEdit = hasAnyRole('admin');

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1>📢 Announcements</h1>
                <p>Publish and manage institute announcements</p>
            </div>
            ${canEdit ? `<button class="btn btn-primary" onclick="openAnnouncementForm()">+ New Announcement</button>` : ''}
        </div>

        <div class="announcements-grid">
            ${announcements.sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(ann => `
                <div class="announcement-card">
                    <div class="ann-card-header">
                        <span class="ann-type-badge">${ann.type}</span>
                        <span class="status-badge status-${ann.status}">${ann.status}</span>
                    </div>
                    <h3>${ann.title}</h3>
                    <p>${ann.message}</p>
                    <div class="ann-card-footer">
                        <span>📅 ${ann.date}</span>
                        <span>👤 ${ann.postedBy || 'Admin'}</span>
                        ${canEdit ? `<button class="btn-icon btn-danger" onclick="deleteAnnouncement(${ann.id})">🗑️</button>` : ''}
                    </div>
                </div>
            `).join('')}
            ${announcements.length === 0 ? '<div class="empty-state"><h2>No announcements</h2></div>' : ''}
        </div>
    `;
}

async function openAnnouncementForm() {
    const types = ['General', 'New Batch', 'Holiday', 'Exam Schedule', 'Fee Deadline', 'Class Cancellation', 'Result Announcement', 'Important'];
    const content = `
        <form id="ann-form" onsubmit="saveAnnouncement(event)">
            <div class="form-grid">
                <div class="form-group form-group-full"><label>Title *</label><input type="text" name="title" required></div>
                <div class="form-group"><label>Type</label>
                    <select name="type">${types.map(t => `<option value="${t}">${t}</option>`).join('')}</select>
                </div>
                <div class="form-group"><label>Date</label><input type="date" name="date" value="${new Date().toISOString().split('T')[0]}"></div>
                <div class="form-group form-group-full"><label>Message *</label><textarea name="message" rows="4" required></textarea></div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeModal('ann-form')">Cancel</button>
                <button type="submit" class="btn btn-primary">📢 Publish</button>
            </div>
        </form>
    `;
    openModal('ann-form', 'New Announcement', content, 'medium');
}

async function saveAnnouncement(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.status = 'active';
    data.postedBy = currentUser.name;
    await dbAdd('announcements', data);
    showToast('Announcement published!');
    closeModal('ann-form');
    await renderAnnouncements(document.getElementById('page-content'));
}

async function deleteAnnouncement(id) {
    if (!confirm('Delete this announcement?')) return;
    await dbDelete('announcements', id);
    showToast('Announcement deleted');
    await renderAnnouncements(document.getElementById('page-content'));
}

// ==================== USERS MODULE ====================
async function renderUsers(container) {
    const users = await dbGetAll('users');

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1>👤 User Management</h1>
                <p>Manage user accounts and access</p>
            </div>
            <button class="btn btn-primary" onclick="openUserForm()">+ Add User</button>
        </div>

        <div class="data-table-container">
            <table class="data-table">
                <thead><tr><th>Username</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                    ${users.map(u => `
                        <tr>
                            <td><code>${u.username}</code></td>
                            <td>${u.name}</td>
                            <td>${u.email || '-'}</td>
                            <td><span class="badge badge-purple">${u.role}</span></td>
                            <td><span class="status-badge status-${u.status}">${u.status}</span></td>
                            <td>
                                <div class="action-btns">
                                    <button class="btn-icon" title="Edit" onclick="openUserForm(${u.id})">✏️</button>
                                    ${u.role !== 'admin' ? `<button class="btn-icon btn-danger" title="Delete" onclick="deleteUser(${u.id})">🗑️</button>` : ''}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Audit Logs -->
        <div class="section-card">
            <h2 class="section-title">📋 Recent Audit Logs</h2>
            <div id="audit-logs-container"></div>
        </div>
    `;

    // Load audit logs
    const logs = await dbGetAll('auditLogs');
    const logsContainer = document.getElementById('audit-logs-container');
    if (logsContainer) {
        logsContainer.innerHTML = `
            <div class="data-table-container">
                <table class="data-table">
                    <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
                    <tbody>
                        ${logs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')).slice(0, 50).map(log => `
                            <tr>
                                <td><small>${new Date(log.timestamp).toLocaleString('en-PK')}</small></td>
                                <td>${log.userName}</td>
                                <td><span class="badge badge-outline">${log.action}</span></td>
                                <td>${log.entity}</td>
                                <td><small>${log.details || '-'}</small></td>
                            </tr>
                        `).join('')}
                        ${logs.length === 0 ? '<tr><td colspan="5" class="empty-cell">No audit logs yet</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        `;
    }
}

async function openUserForm(userId = null) {
    let user = null;
    if (userId) user = await dbGet('users', userId);
    const roles = ['admin', 'receptionist', 'accountant', 'teacher', 'student', 'parent'];

    const content = `
        <form id="user-form" onsubmit="saveUser(event, ${userId || 'null'})">
            <div class="form-grid">
                <div class="form-group"><label>Username *</label><input type="text" name="username" value="${user?.username || ''}" required ${userId ? 'readonly' : ''}></div>
                <div class="form-group"><label>Full Name *</label><input type="text" name="name" value="${user?.name || ''}" required></div>
                <div class="form-group"><label>Email</label><input type="email" name="email" value="${user?.email || ''}"></div>
                <div class="form-group"><label>Phone</label><input type="tel" name="phone" value="${user?.phone || ''}"></div>
                <div class="form-group"><label>Role *</label>
                    <select name="role" required>${roles.map(r => `<option value="${r}" ${user?.role === r ? 'selected' : ''}>${r.charAt(0).toUpperCase() + r.slice(1)}</option>`).join('')}</select>
                </div>
                <div class="form-group"><label>${userId ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                    <input type="password" name="password" ${userId ? '' : 'required'} minlength="6">
                </div>
                <div class="form-group"><label>Status</label>
                    <select name="status">
                        <option value="active" ${(user?.status || 'active') === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${user?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeModal('user-form')">Cancel</button>
                <button type="submit" class="btn btn-primary">💾 ${userId ? 'Update' : 'Create'} User</button>
            </div>
        </form>
    `;
    openModal('user-form', userId ? 'Edit User' : 'Add New User', content, 'medium');
}

async function saveUser(e, existingId) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));

    try {
        if (existingId) {
            const existing = await dbGet('users', existingId);
            existing.name = data.name;
            existing.email = data.email;
            existing.phone = data.phone;
            existing.role = data.role;
            existing.status = data.status;
            if (data.password) existing.password = await hashPassword(data.password);
            await dbPut('users', existing);
            showToast('User updated!');
        } else {
            if (!data.password) { showToast('Password is required', 'error'); return; }
            data.password = await hashPassword(data.password);
            await dbAdd('users', data);
            showToast('User created!');
        }
        closeModal('user-form');
        await renderUsers(document.getElementById('page-content'));
    } catch (err) {
        showToast('Failed to save user. Username might already exist.', 'error');
    }
}

async function deleteUser(id) {
    if (!confirm('Delete this user?')) return;
    await dbDelete('users', id);
    showToast('User deleted');
    await renderUsers(document.getElementById('page-content'));
}

// ==================== SETTINGS MODULE ====================
async function renderSettings(container) {
    const settings = {};
    const allSettings = await dbGetAll('settings');
    allSettings.forEach(s => { settings[s.key] = s.value; });

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1>⚙️ Institute Settings</h1>
                <p>Configure institute information and preferences</p>
            </div>
        </div>

        <form id="settings-form" onsubmit="saveSettings(event)">
            <div class="section-card">
                <h2 class="section-title">🏫 Institute Information</h2>
                <div class="form-grid">
                    <div class="form-group form-group-full"><label>Institute Name *</label><input type="text" name="instituteName" value="${settings.instituteName || ''}" required></div>
                    <div class="form-group"><label>Short Name</label><input type="text" name="instituteShortName" value="${settings.instituteShortName || ''}"></div>
                    <div class="form-group form-group-full"><label>Address</label><input type="text" name="address" value="${settings.address || ''}"></div>
                    <div class="form-group"><label>City</label><input type="text" name="city" value="${settings.city || ''}"></div>
                    <div class="form-group"><label>Province</label>
                        <select name="province">
                            ${getProvinceOptions().map(p => `<option value="${p}" ${settings.province === p ? 'selected' : ''}>${p}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>

            <div class="section-card">
                <h2 class="section-title">📞 Contact Information</h2>
                <div class="form-grid">
                    <div class="form-group"><label>Phone</label><input type="tel" name="phone" value="${settings.phone || ''}"></div>
                    <div class="form-group"><label>WhatsApp</label><input type="tel" name="whatsapp" value="${settings.whatsapp || ''}"></div>
                    <div class="form-group"><label>Email</label><input type="email" name="email" value="${settings.email || ''}"></div>
                    <div class="form-group"><label>Website</label><input type="url" name="website" value="${settings.website || ''}"></div>
                    <div class="form-group"><label>Facebook</label><input type="text" name="facebook" value="${settings.facebook || ''}"></div>
                    <div class="form-group"><label>Instagram</label><input type="text" name="instagram" value="${settings.instagram || ''}"></div>
                    <div class="form-group"><label>YouTube</label><input type="text" name="youtube" value="${settings.youtube || ''}"></div>
                </div>
            </div>

            <div class="section-card">
                <h2 class="section-title">👨‍💼 Administration</h2>
                <div class="form-grid">
                    <div class="form-group"><label>Director/Principal Name</label><input type="text" name="directorName" value="${settings.directorName || ''}"></div>
                    <div class="form-group"><label>Principal Name</label><input type="text" name="principalName" value="${settings.principalName || ''}"></div>
                    <div class="form-group"><label>Session Year</label><input type="text" name="sessionYear" value="${settings.sessionYear || ''}"></div>
                    <div class="form-group"><label>Currency</label><input type="text" name="currency" value="${settings.currency || 'PKR'}" readonly></div>
                </div>
            </div>

            <div class="section-card">
                <h2 class="section-title">📝 Print Settings</h2>
                <div class="form-grid">
                    <div class="form-group form-group-full"><label>Receipt Footer</label><textarea name="receiptFooter" rows="2">${settings.receiptFooter || ''}</textarea></div>
                    <div class="form-group form-group-full"><label>Certificate Footer</label><textarea name="certificateFooter" rows="2">${settings.certificateFooter || ''}</textarea></div>
                </div>
            </div>

            <div class="form-actions">
                <button type="submit" class="btn btn-primary btn-lg">💾 Save Settings</button>
            </div>
        </form>

        <!-- Backup Section -->
        <div class="section-card">
            <h2 class="section-title">💾 Backup & Restore</h2>
            <div class="backup-actions">
                <button class="btn btn-outline" onclick="backupDatabase()">📥 Download Backup</button>
                <label class="btn btn-outline" style="cursor:pointer">
                    📤 Restore Backup
                    <input type="file" accept=".json" style="display:none" onchange="restoreDatabase(this)">
                </label>
                <button class="btn btn-danger" onclick="resetDatabase()">⚠️ Reset All Data</button>
            </div>
        </div>
    `;
}

async function saveSettings(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    for (const [key, value] of Object.entries(data)) {
        await setSetting(key, value);
    }
    await addAuditLog(currentUser.id, currentUser.name, 'Updated Settings', 'settings', '', 'Institute settings updated');
    showToast('Settings saved successfully!');
}

async function backupDatabase() {
    try {
        const json = await exportDatabase();
        downloadFile(json, `edutech_backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
        showToast('Backup downloaded!');
    } catch (err) {
        showToast('Backup failed', 'error');
    }
}

async function restoreDatabase(input) {
    if (!confirm('This will replace all existing data. Are you sure?')) return;
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            await importDatabase(e.target.result);
            showToast('Database restored! Refreshing...');
            setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
            showToast('Restore failed. Invalid backup file.', 'error');
        }
    };
    reader.readAsText(file);
}

async function resetDatabase() {
    if (!confirm('⚠️ WARNING: This will DELETE ALL DATA permanently. Are you absolutely sure?')) return;
    if (!confirm('This is your LAST chance. All students, fees, and records will be lost. Continue?')) return;

    try {
        const database = await openDB();
        const storeNames = Array.from(database.objectStoreNames);
        for (const name of storeNames) {
            await dbClear(name);
        }
        localStorage.clear();
        showToast('All data cleared. Refreshing...');
        setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
        showToast('Reset failed', 'error');
    }
}
