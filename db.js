/**
 * EduTech IMS - Database Layer
 * Uses IndexedDB for persistent local storage
 * All tables with proper indexes and relationships
 */

const DB_NAME = 'EduTechIMS';
const DB_VERSION = 1;

let db = null;

function openDB() {
    return new Promise((resolve, reject) => {
        if (db) { resolve(db); return; }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => { db = request.result; resolve(db); };
        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Users & Auth
            const users = database.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
            users.createIndex('username', 'username', { unique: true });
            users.createIndex('email', 'email', { unique: false });
            users.createIndex('role', 'role', { unique: false });

            // Students
            const students = database.createObjectStore('students', { keyPath: 'id', autoIncrement: true });
            students.createIndex('studentId', 'studentId', { unique: true });
            students.createIndex('name', 'name', { unique: false });
            students.createIndex('cnic', 'cnic', { unique: false });
            students.createIndex('mobile', 'mobile', { unique: false });
            students.createIndex('status', 'status', { unique: false });
            students.createIndex('email', 'email', { unique: false });

            // Teachers
            const teachers = database.createObjectStore('teachers', { keyPath: 'id', autoIncrement: true });
            teachers.createIndex('teacherId', 'teacherId', { unique: true });
            teachers.createIndex('name', 'name', { unique: false });
            teachers.createIndex('cnic', 'cnic', { unique: false });
            teachers.createIndex('mobile', 'mobile', { unique: false });
            teachers.createIndex('status', 'status', { unique: false });

            // Course Categories
            const courseCategories = database.createObjectStore('courseCategories', { keyPath: 'id', autoIncrement: true });
            courseCategories.createIndex('name', 'name', { unique: true });

            // Courses
            const courses = database.createObjectStore('courses', { keyPath: 'id', autoIncrement: true });
            courses.createIndex('courseCode', 'courseCode', { unique: true });
            courses.createIndex('categoryId', 'categoryId', { unique: false });
            courses.createIndex('name', 'name', { unique: false });
            courses.createIndex('status', 'status', { unique: false });

            // Batches
            const batches = database.createObjectStore('batches', { keyPath: 'id', autoIncrement: true });
            batches.createIndex('batchId', 'batchId', { unique: true });
            batches.createIndex('courseId', 'courseId', { unique: false });
            batches.createIndex('teacherId', 'teacherId', { unique: false });
            batches.createIndex('status', 'status', { unique: false });

            // Enrollments
            const enrollments = database.createObjectStore('enrollments', { keyPath: 'id', autoIncrement: true });
            enrollments.createIndex('studentId', 'studentId', { unique: false });
            enrollments.createIndex('courseId', 'courseId', { unique: false });
            enrollments.createIndex('batchId', 'batchId', { unique: false });
            enrollments.createIndex('status', 'status', { unique: false });

            // Admissions
            const admissions = database.createObjectStore('admissions', { keyPath: 'id', autoIncrement: true });
            admissions.createIndex('admissionNo', 'admissionNo', { unique: true });
            admissions.createIndex('studentId', 'studentId', { unique: false });
            admissions.createIndex('courseId', 'courseId', { unique: false });
            admissions.createIndex('batchId', 'batchId', { unique: false });
            admissions.createIndex('date', 'date', { unique: false });

            // Fee Structures
            const feeStructures = database.createObjectStore('feeStructures', { keyPath: 'id', autoIncrement: true });
            feeStructures.createIndex('courseId', 'courseId', { unique: false });

            // Fee Payments
            const feePayments = database.createObjectStore('feePayments', { keyPath: 'id', autoIncrement: true });
            feePayments.createIndex('receiptNo', 'receiptNo', { unique: true });
            feePayments.createIndex('studentId', 'studentId', { unique: false });
            feePayments.createIndex('admissionId', 'admissionId', { unique: false });
            feePayments.createIndex('date', 'date', { unique: false });
            feePayments.createIndex('paymentMethod', 'paymentMethod', { unique: false });

            // Expenses
            const expenses = database.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
            expenses.createIndex('category', 'category', { unique: false });
            expenses.createIndex('date', 'date', { unique: false });

            // Income (non-fee)
            const income = database.createObjectStore('income', { keyPath: 'id', autoIncrement: true });
            income.createIndex('category', 'category', { unique: false });
            income.createIndex('date', 'date', { unique: false });

            // Attendance
            const attendance = database.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
            attendance.createIndex('studentId', 'studentId', { unique: false });
            attendance.createIndex('batchId', 'batchId', { unique: false });
            attendance.createIndex('date', 'date', { unique: false });
            attendance.createIndex('date_batch', ['date', 'batchId'], { unique: false });

            // Exams
            const exams = database.createObjectStore('exams', { keyPath: 'id', autoIncrement: true });
            exams.createIndex('courseId', 'courseId', { unique: false });
            exams.createIndex('batchId', 'batchId', { unique: false });
            exams.createIndex('date', 'date', { unique: false });
            exams.createIndex('type', 'type', { unique: false });

            // Exam Results
            const examResults = database.createObjectStore('examResults', { keyPath: 'id', autoIncrement: true });
            examResults.createIndex('examId', 'examId', { unique: false });
            examResults.createIndex('studentId', 'studentId', { unique: false });

            // Certificates
            const certificates = database.createObjectStore('certificates', { keyPath: 'id', autoIncrement: true });
            certificates.createIndex('certificateId', 'certificateId', { unique: true });
            certificates.createIndex('studentId', 'studentId', { unique: false });
            certificates.createIndex('courseId', 'courseId', { unique: false });

            // Timetable
            const timetable = database.createObjectStore('timetable', { keyPath: 'id', autoIncrement: true });
            timetable.createIndex('batchId', 'batchId', { unique: false });
            timetable.createIndex('teacherId', 'teacherId', { unique: false });
            timetable.createIndex('day', 'day', { unique: false });

            // Rooms
            const rooms = database.createObjectStore('rooms', { keyPath: 'id', autoIncrement: true });
            rooms.createIndex('name', 'name', { unique: true });

            // Announcements
            const announcements = database.createObjectStore('announcements', { keyPath: 'id', autoIncrement: true });
            announcements.createIndex('date', 'date', { unique: false });
            announcements.createIndex('type', 'type', { unique: false });
            announcements.createIndex('status', 'status', { unique: false });

            // Notifications
            const notifications = database.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
            notifications.createIndex('userId', 'userId', { unique: false });
            notifications.createIndex('type', 'type', { unique: false });
            notifications.createIndex('read', 'read', { unique: false });

            // Settings
            database.createObjectStore('settings', { keyPath: 'key' });

            // Audit Logs
            const auditLogs = database.createObjectStore('auditLogs', { keyPath: 'id', autoIncrement: true });
            auditLogs.createIndex('userId', 'userId', { unique: false });
            auditLogs.createIndex('action', 'action', { unique: false });
            auditLogs.createIndex('timestamp', 'timestamp', { unique: false });
            auditLogs.createIndex('entity', 'entity', { unique: false });

            // Parents/Guardians
            const parents = database.createObjectStore('parents', { keyPath: 'id', autoIncrement: true });
            parents.createIndex('studentId', 'studentId', { unique: false });
            parents.createIndex('mobile', 'mobile', { unique: false });

            // Assignments
            const assignments = database.createObjectStore('assignments', { keyPath: 'id', autoIncrement: true });
            assignments.createIndex('courseId', 'courseId', { unique: false });
            assignments.createIndex('batchId', 'batchId', { unique: false });
            assignments.createIndex('teacherId', 'teacherId', { unique: false });

            // Grading Rules
            database.createObjectStore('gradingRules', { keyPath: 'id', autoIncrement: true });
        };
    });
}

// Generic CRUD operations
async function dbAdd(storeName, data) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        data.createdAt = new Date().toISOString();
        data.updatedAt = new Date().toISOString();
        const request = store.add(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function dbPut(storeName, data) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        data.updatedAt = new Date().toISOString();
        const request = store.put(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function dbGet(storeName, id) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function dbGetAll(storeName) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function dbDelete(storeName, id) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function dbGetByIndex(storeName, indexName, value) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function dbCount(storeName) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function dbClear(storeName) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Settings helpers
async function getSetting(key) {
    const result = await dbGet('settings', key);
    return result ? result.value : null;
}

async function setSetting(key, value) {
    return dbPut('settings', { key, value, updatedAt: new Date().toISOString() });
}

// Unique ID generators
function generateStudentId(count) {
    const year = new Date().getFullYear();
    return `IMS-${year}-${String(count + 1).padStart(4, '0')}`;
}

function generateTeacherId(count) {
    const year = new Date().getFullYear();
    return `TCH-${year}-${String(count + 1).padStart(4, '0')}`;
}

function generateBatchId(courseCode, count) {
    return `${courseCode}-B${String(count + 1).padStart(2, '0')}`;
}

function generateAdmissionNo(count) {
    const year = new Date().getFullYear();
    return `ADM-${year}-${String(count + 1).padStart(5, '0')}`;
}

function generateReceiptNo(count) {
    const year = new Date().getFullYear();
    return `RCP-${year}-${String(count + 1).padStart(5, '0')}`;
}

function generateCertificateId(category, count) {
    const year = new Date().getFullYear();
    const cat = category === 'English Courses' ? 'ENG' : 'IT';
    return `CERT-${cat}-${year}-${String(count + 1).padStart(5, '0')}`;
}

// Currency formatter for PKR
function formatPKR(amount) {
    if (amount === null || amount === undefined) return 'Rs. 0';
    return 'Rs. ' + Number(amount).toLocaleString('en-PK');
}

// Password hashing (SHA-256)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'EduTechIMS_Salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Audit logging
async function addAuditLog(userId, userName, action, entity, entityId, details) {
    await dbAdd('auditLogs', {
        userId,
        userName,
        action,
        entity,
        entityId,
        details,
        timestamp: new Date().toISOString(),
        ip: 'localhost'
    });
}

// Export database
async function exportDatabase() {
    const storeNames = [
        'users', 'students', 'teachers', 'courseCategories', 'courses', 'batches',
        'enrollments', 'admissions', 'feeStructures', 'feePayments', 'expenses',
        'income', 'attendance', 'exams', 'examResults', 'certificates', 'timetable',
        'rooms', 'announcements', 'notifications', 'settings', 'auditLogs',
        'parents', 'assignments', 'gradingRules'
    ];
    const backup = {};
    for (const name of storeNames) {
        backup[name] = await dbGetAll(name);
    }
    return JSON.stringify(backup, null, 2);
}

// Import database
async function importDatabase(jsonString) {
    const data = JSON.parse(jsonString);
    for (const [storeName, records] of Object.entries(data)) {
        await dbClear(storeName);
        for (const record of records) {
            await dbAdd(storeName, record);
        }
    }
}
