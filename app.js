/**
 * EduTech IMS - Application Core
 * Main application logic, routing, and module rendering
 */

// ==================== APP STATE ====================
let appState = {
    currentPage: 'dashboard',
    sidebarOpen: true,
    language: 'en',
    searchQuery: '',
    modals: {},
    toasts: []
};

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span class="toast-message">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ==================== MODAL SYSTEM ====================
function openModal(id, title, content, size = 'medium') {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = `modal-${id}`;
    overlay.innerHTML = `
        <div class="modal modal-${size}">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="closeModal('${id}')">&times;</button>
            </div>
            <div class="modal-body">${content}</div>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 10);
}

function closeModal(id) {
    const overlay = document.getElementById(`modal-${id}`);
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }
}

// ==================== NAVIGATION ====================
function navigateTo(page) {
    appState.currentPage = page;
    renderPage();
    // Update active sidebar item
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
}

// ==================== SIDEBAR MENU ====================
function getSidebarItems() {
    const user = getSession();
    if (!user) return [];

    const allItems = [
        { id: 'dashboard', icon: '📊', label: 'Dashboard', module: 'dashboard' },
        { id: 'students', icon: '👨‍🎓', label: 'Students', module: 'students' },
        { id: 'admissions', icon: '📝', label: 'Admissions', module: 'admissions' },
        { id: 'courses', icon: '📚', label: 'Courses', module: 'courses' },
        { id: 'batches', icon: '👥', label: 'Batches', module: 'batches' },
        { id: 'teachers', icon: '👨‍🏫', label: 'Teachers', module: 'teachers' },
        { id: 'attendance', icon: '✅', label: 'Attendance', module: 'attendance' },
        { id: 'fees', icon: '💰', label: 'Fees', module: 'fees' },
        { id: 'accounting', icon: '📒', label: 'Accounting', module: 'accounting' },
        { id: 'exams', icon: '📝', label: 'Exams', module: 'exams' },
        { id: 'results', icon: '📊', label: 'Results', module: 'results' },
        { id: 'certificates', icon: '🏆', label: 'Certificates', module: 'certificates' },
        { id: 'timetable', icon: '🕐', label: 'Timetable', module: 'timetable' },
        { id: 'reports', icon: '📈', label: 'Reports', module: 'reports' },
        { id: 'announcements', icon: '📢', label: 'Announcements', module: 'announcements' },
        { id: 'users', icon: '👤', label: 'Users', module: 'users' },
        { id: 'settings', icon: '⚙️', label: 'Settings', module: 'settings' }
    ];

    return allItems.filter(item => canAccess(item.module));
}

// ==================== RENDER FUNCTIONS ====================
async function renderApp() {
    const user = getSession();
    if (!user) {
        renderLogin();
        return;
    }

    const instituteName = await getSetting('instituteShortName') || 'EduTech IMS';
    const sidebarItems = getSidebarItems();

    document.getElementById('app').innerHTML = `
        <div class="app-layout ${appState.sidebarOpen ? '' : 'sidebar-collapsed'}">
            <!-- Sidebar -->
            <aside class="sidebar" id="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo">
                        <div class="logo-icon">🎓</div>
                        <span class="logo-text">${instituteName}</span>
                    </div>
                    <button class="sidebar-toggle" onclick="toggleSidebar()">☰</button>
                </div>
                <nav class="sidebar-nav">
                    ${sidebarItems.map(item => `
                        <div class="sidebar-item ${appState.currentPage === item.id ? 'active' : ''}" 
                             data-page="${item.id}" onclick="navigateTo('${item.id}')">
                            <span class="sidebar-icon">${item.icon}</span>
                            <span class="sidebar-label">${item.label}</span>
                        </div>
                    `).join('')}
                </nav>
                <div class="sidebar-footer">
                    <div class="sidebar-user">
                        <div class="user-avatar">${user.name.charAt(0)}</div>
                        <div class="user-info">
                            <span class="user-name">${user.name}</span>
                            <span class="user-role">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                        </div>
                    </div>
                    <button class="btn-logout" onclick="logout()">🚪 Logout</button>
                </div>
            </aside>

            <!-- Main Content -->
            <main class="main-content">
                <!-- Top Bar -->
                <header class="topbar">
                    <button class="mobile-menu-toggle" onclick="toggleSidebar()">☰</button>
                    <div class="topbar-search">
                        <input type="text" placeholder="Search students, courses, receipts..." 
                               id="global-search" oninput="handleGlobalSearch(this.value)">
                        <span class="search-icon">🔍</span>
                    </div>
                    <div class="topbar-actions">
                        <span class="topbar-date">${new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                </header>

                <!-- Page Content -->
                <div class="page-content" id="page-content">
                    <div class="loading-spinner">Loading...</div>
                </div>
            </main>
        </div>
        <div id="toast-container"></div>
        <div id="search-results-dropdown" class="search-dropdown hidden"></div>
    `;

    renderPage();
}

function toggleSidebar() {
    appState.sidebarOpen = !appState.sidebarOpen;
    document.querySelector('.app-layout')?.classList.toggle('sidebar-collapsed');
    document.querySelector('.sidebar')?.classList.toggle('mobile-open');
}

async function renderPage() {
    const container = document.getElementById('page-content');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading...</p></div>';

    try {
        switch (appState.currentPage) {
            case 'dashboard': await renderDashboard(container); break;
            case 'students': await renderStudents(container); break;
            case 'admissions': await renderAdmissions(container); break;
            case 'courses': await renderCourses(container); break;
            case 'batches': await renderBatches(container); break;
            case 'teachers': await renderTeachers(container); break;
            case 'attendance': await renderAttendance(container); break;
            case 'fees': await renderFees(container); break;
            case 'accounting': await renderAccounting(container); break;
            case 'exams': await renderExams(container); break;
            case 'results': await renderResults(container); break;
            case 'certificates': await renderCertificates(container); break;
            case 'timetable': await renderTimetable(container); break;
            case 'reports': await renderReports(container); break;
            case 'announcements': await renderAnnouncements(container); break;
            case 'users': await renderUsers(container); break;
            case 'settings': await renderSettings(container); break;
            default: container.innerHTML = '<div class="empty-state"><h2>Page Not Found</h2></div>';
        }
    } catch (error) {
        console.error('Page render error:', error);
        container.innerHTML = '<div class="error-state"><h2>Something went wrong</h2><p>Please try again or contact the administrator.</p></div>';
    }
}

// ==================== LOGIN PAGE ====================
function renderLogin() {
    document.getElementById('app').innerHTML = `
        <div class="login-page">
            <div class="login-bg-shapes">
                <div class="shape shape-1"></div>
                <div class="shape shape-2"></div>
                <div class="shape shape-3"></div>
            </div>
            <div class="login-container">
                <div class="login-card">
                    <div class="login-header">
                        <div class="login-logo">🎓</div>
                        <h1>EduTech IMS</h1>
                        <p>Institute Management System</p>
                    </div>
                    <form onsubmit="handleLogin(event)" id="login-form">
                        <div class="form-group">
                            <label for="login-username">Username</label>
                            <div class="input-icon-wrapper">
                                <span class="input-icon">👤</span>
                                <input type="text" id="login-username" placeholder="Enter username" required autocomplete="username">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="login-password">Password</label>
                            <div class="input-icon-wrapper">
                                <span class="input-icon">🔒</span>
                                <input type="password" id="login-password" placeholder="Enter password" required autocomplete="current-password">
                            </div>
                        </div>
                        <div id="login-error" class="login-error hidden"></div>
                        <button type="submit" class="btn btn-primary btn-block" id="login-btn">
                            Sign In
                        </button>
                    </form>
                    <div class="login-footer">
                        <p class="demo-credentials">
                            <strong>Demo Credentials:</strong><br>
                            Admin: <code>admin</code> / <code>admin123</code><br>
                            Reception: <code>reception</code> / <code>reception123</code><br>
                            Accountant: <code>accounts</code> / <code>accounts123</code><br>
                            Teacher: <code>mali</code> / <code>teacher123</code><br>
                            Student: <code>ims-2026-0001</code> / <code>student123</code>
                        </p>
                    </div>
                </div>
            </div>
        </div>
        <div id="toast-container"></div>
    `;
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    const errorDiv = document.getElementById('login-error');

    btn.disabled = true;
    btn.textContent = 'Signing in...';
    errorDiv.classList.add('hidden');

    try {
        const result = await login(username, password);
        if (result.success) {
            showToast(`Welcome back, ${result.user.name}!`);
            await renderApp();
        } else {
            errorDiv.textContent = result.message;
            errorDiv.classList.remove('hidden');
            btn.disabled = false;
            btn.textContent = 'Sign In';
        }
    } catch (err) {
        errorDiv.textContent = 'Something went wrong. Please try again.';
        errorDiv.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'Sign In';
    }
}

// ==================== GLOBAL SEARCH ====================
async function handleGlobalSearch(query) {
    const dropdown = document.getElementById('search-results-dropdown');
    if (!dropdown) return;

    if (!query || query.length < 2) {
        dropdown.classList.add('hidden');
        return;
    }

    const q = query.toLowerCase();
    const results = [];

    // Search students
    const students = await dbGetAll('students');
    students.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        (s.cnic && s.cnic.includes(q)) ||
        (s.mobile && s.mobile.includes(q))
    ).slice(0, 5).forEach(s => {
        results.push({ type: 'Student', icon: '👨‍🎓', label: `${s.name} (${s.studentId})`, action: `navigateTo('students')` });
    });

    // Search courses
    const courses = await dbGetAll('courses');
    courses.filter(c => c.name.toLowerCase().includes(q) || c.courseCode.toLowerCase().includes(q))
        .slice(0, 5).forEach(c => {
            results.push({ type: 'Course', icon: '📚', label: `${c.name} (${c.courseCode})`, action: `navigateTo('courses')` });
        });

    // Search teachers
    const teachers = await dbGetAll('teachers');
    teachers.filter(t => t.name.toLowerCase().includes(q) || t.teacherId.toLowerCase().includes(q))
        .slice(0, 3).forEach(t => {
            results.push({ type: 'Teacher', icon: '👨‍🏫', label: `${t.name} (${t.teacherId})`, action: `navigateTo('teachers')` });
        });

    // Search fee receipts
    const payments = await dbGetAll('feePayments');
    payments.filter(p => p.receiptNo.toLowerCase().includes(q))
        .slice(0, 3).forEach(p => {
            results.push({ type: 'Receipt', icon: '🧾', label: `${p.receiptNo} - ${formatPKR(p.amount)}`, action: `navigateTo('fees')` });
        });

    // Search certificates
    const certs = await dbGetAll('certificates');
    certs.filter(c => c.certificateId.toLowerCase().includes(q))
        .slice(0, 3).forEach(c => {
            results.push({ type: 'Certificate', icon: '🏆', label: `${c.certificateId} - ${c.studentName}`, action: `navigateTo('certificates')` });
        });

    if (results.length > 0) {
        dropdown.innerHTML = results.map(r => `
            <div class="search-result-item" onclick="${r.action}">
                <span class="search-result-icon">${r.icon}</span>
                <div class="search-result-info">
                    <span class="search-result-label">${r.label}</span>
                    <span class="search-result-type">${r.type}</span>
                </div>
            </div>
        `).join('');
        dropdown.classList.remove('hidden');
    } else {
        dropdown.innerHTML = '<div class="search-no-results">No results found</div>';
        dropdown.classList.remove('hidden');
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#global-search') && !e.target.closest('#search-results-dropdown')) {
            dropdown.classList.add('hidden');
        }
    }, { once: true });
}

// ==================== DASHBOARD ====================
async function renderDashboard(container) {
    const user = getSession();
    const students = await dbGetAll('students');
    const teachers = await dbGetAll('teachers');
    const courses = await dbGetAll('courses');
    const batches = await dbGetAll('batches');
    const admissions = await dbGetAll('admissions');
    const payments = await dbGetAll('feePayments');
    const expenses = await dbGetAll('expenses');
    const attendance = await dbGetAll('attendance');
    const announcements = await dbGetAll('announcements');

    const activeStudents = students.filter(s => s.status === 'active').length;
    const activeCourses = courses.filter(c => c.status === 'active').length;
    const activeBatches = batches.filter(b => b.status === 'active').length;
    const activeTeachers = teachers.filter(t => t.status === 'active').length;

    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);

    const todayPayments = payments.filter(p => p.date === today);
    const todayCollection = todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const monthlyPayments = payments.filter(p => p.date && p.date.startsWith(thisMonth));
    const monthlyIncome = monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const monthlyExpenseTotal = expenses.filter(e => e.date && e.date.startsWith(thisMonth)).reduce((sum, e) => sum + (e.amount || 0), 0);

    const pendingFees = admissions.reduce((sum, a) => sum + (a.remainingAmount || 0), 0);

    const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const timetable = await dbGetAll('timetable');
    const todayClasses = timetable.filter(t => t.day === todayDay);

    const todayAttendance = attendance.filter(a => a.date === today);
    const todayPresent = todayAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;

    // New admissions this month
    const newAdmissions = admissions.filter(a => a.date && a.date.startsWith(thisMonth)).length;

    // Course popularity
    const coursePopularity = {};
    for (const adm of admissions) {
        const course = courses.find(c => c.id === adm.courseId);
        if (course) {
            coursePopularity[course.name] = (coursePopularity[course.name] || 0) + 1;
        }
    }

    // Monthly income data for chart
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthlyIncomeData = monthNames.map((_, i) => {
        const monthStr = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
        return payments.filter(p => p.date && p.date.startsWith(monthStr)).reduce((sum, p) => sum + (p.amount || 0), 0);
    });

    const monthlyExpenseData = monthNames.map((_, i) => {
        const monthStr = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
        return expenses.filter(e => e.date && e.date.startsWith(monthStr)).reduce((sum, e) => sum + (e.amount || 0), 0);
    });

    container.innerHTML = `
        <div class="page-header">
            <h1>Dashboard</h1>
            <p>Welcome back, ${user.name}! Here's your institute overview.</p>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
            <div class="stat-card stat-blue">
                <div class="stat-icon">👨‍🎓</div>
                <div class="stat-info">
                    <span class="stat-value">${students.length}</span>
                    <span class="stat-label">Total Students</span>
                </div>
                <div class="stat-badge">${activeStudents} Active</div>
            </div>
            <div class="stat-card stat-green">
                <div class="stat-icon">📝</div>
                <div class="stat-info">
                    <span class="stat-value">${newAdmissions}</span>
                    <span class="stat-label">New Admissions</span>
                </div>
                <div class="stat-badge">This Month</div>
            </div>
            <div class="stat-card stat-purple">
                <div class="stat-icon">👨‍🏫</div>
                <div class="stat-info">
                    <span class="stat-value">${activeTeachers}</span>
                    <span class="stat-label">Teachers</span>
                </div>
                <div class="stat-badge">${activeCourses} Courses</div>
            </div>
            <div class="stat-card stat-orange">
                <div class="stat-icon">👥</div>
                <div class="stat-info">
                    <span class="stat-value">${activeBatches}</span>
                    <span class="stat-label">Active Batches</span>
                </div>
                <div class="stat-badge">${todayClasses.length} Today</div>
            </div>
            <div class="stat-card stat-teal">
                <div class="stat-icon">💰</div>
                <div class="stat-info">
                    <span class="stat-value">${formatPKR(todayCollection)}</span>
                    <span class="stat-label">Today's Collection</span>
                </div>
                <div class="stat-badge">${todayPayments.length} Receipts</div>
            </div>
            <div class="stat-card stat-red">
                <div class="stat-icon">⏰</div>
                <div class="stat-info">
                    <span class="stat-value">${formatPKR(pendingFees)}</span>
                    <span class="stat-label">Pending Fees</span>
                </div>
                <div class="stat-badge">Outstanding</div>
            </div>
            <div class="stat-card stat-emerald">
                <div class="stat-icon">📈</div>
                <div class="stat-info">
                    <span class="stat-value">${formatPKR(monthlyIncome)}</span>
                    <span class="stat-label">Monthly Income</span>
                </div>
                <div class="stat-badge">${thisMonth}</div>
            </div>
            <div class="stat-card stat-amber">
                <div class="stat-icon">📉</div>
                <div class="stat-info">
                    <span class="stat-value">${formatPKR(monthlyExpenseTotal)}</span>
                    <span class="stat-label">Monthly Expenses</span>
                </div>
                <div class="stat-badge">${thisMonth}</div>
            </div>
        </div>

        ${user.role === 'admin' || user.role === 'receptionist' ? `
        <!-- Quick Actions -->
        <div class="section-card">
            <h2 class="section-title">⚡ Quick Actions</h2>
            <div class="quick-actions">
                <button class="quick-action-btn" onclick="navigateTo('students'); setTimeout(() => document.getElementById('btn-add-student')?.click(), 300)">
                    <span class="qa-icon">👨‍🎓</span>
                    <span>Add Student</span>
                </button>
                <button class="quick-action-btn" onclick="navigateTo('admissions')">
                    <span class="qa-icon">📝</span>
                    <span>New Admission</span>
                </button>
                <button class="quick-action-btn" onclick="navigateTo('fees')">
                    <span class="qa-icon">💰</span>
                    <span>Collect Fee</span>
                </button>
                <button class="quick-action-btn" onclick="navigateTo('attendance')">
                    <span class="qa-icon">✅</span>
                    <span>Mark Attendance</span>
                </button>
                <button class="quick-action-btn" onclick="navigateTo('courses'); setTimeout(() => document.getElementById('btn-add-course')?.click(), 300)">
                    <span class="qa-icon">📚</span>
                    <span>Add Course</span>
                </button>
                <button class="quick-action-btn" onclick="navigateTo('batches')">
                    <span class="qa-icon">👥</span>
                    <span>Create Batch</span>
                </button>
                <button class="quick-action-btn" onclick="navigateTo('teachers')">
                    <span class="qa-icon">👨‍🏫</span>
                    <span>Add Teacher</span>
                </button>
                <button class="quick-action-btn" onclick="navigateTo('certificates')">
                    <span class="qa-icon">🏆</span>
                    <span>Certificate</span>
                </button>
            </div>
        </div>
        ` : ''}

        <!-- Charts Row -->
        <div class="charts-grid">
            <div class="section-card">
                <h2 class="section-title">📈 Income vs Expenses</h2>
                <div class="chart-container">
                    <canvas id="income-expense-chart"></canvas>
                </div>
            </div>
            <div class="section-card">
                <h2 class="section-title">📊 Course Popularity</h2>
                <div class="chart-container">
                    <canvas id="course-popularity-chart"></canvas>
                </div>
            </div>
        </div>

        <!-- Today's Classes & Recent Announcements -->
        <div class="dashboard-bottom-grid">
            <div class="section-card">
                <h2 class="section-title">🕐 Today's Classes</h2>
                ${todayClasses.length > 0 ? `
                <div class="today-classes-list">
                    ${await Promise.all(todayClasses.map(async (tc) => {
                        const course = await dbGet('courses', tc.courseId);
                        const teacher = await dbGet('teachers', tc.teacherId);
                        const room = await dbGet('rooms', tc.roomId);
                        const batch = await dbGet('batches', tc.batchId);
                        return `
                            <div class="today-class-item">
                                <div class="class-time">${tc.startTime} - ${tc.endTime}</div>
                                <div class="class-details">
                                    <strong>${course?.name || 'Unknown'}</strong>
                                    <span>${batch?.batchId || ''} • ${teacher?.name || ''} • ${room?.name || ''}</span>
                                </div>
                            </div>
                        `;
                    })).then(items => items.join(''))}
                </div>
                ` : '<div class="empty-state-small">No classes scheduled for today</div>'}
            </div>
            <div class="section-card">
                <h2 class="section-title">📢 Recent Announcements</h2>
                ${announcements.filter(a => a.status === 'active').slice(0, 5).length > 0 ? `
                <div class="announcements-list">
                    ${announcements.filter(a => a.status === 'active').slice(0, 5).map(ann => `
                        <div class="announcement-item">
                            <div class="ann-type-badge">${ann.type}</div>
                            <strong>${ann.title}</strong>
                            <p>${ann.message.substring(0, 100)}...</p>
                            <span class="ann-date">${ann.date}</span>
                        </div>
                    `).join('')}
                </div>
                ` : '<div class="empty-state-small">No announcements</div>'}
            </div>
        </div>
    `;

    // Render Charts
    renderIncomeExpenseChart(monthNames, monthlyIncomeData, monthlyExpenseData);
    renderCoursePopularityChart(coursePopularity);
}

// Simple Canvas Chart Rendering
function renderIncomeExpenseChart(labels, incomeData, expenseData) {
    const canvas = document.getElementById('income-expense-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 250;

    const w = canvas.width;
    const h = canvas.height;
    const padding = { top: 30, right: 20, bottom: 40, left: 70 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const allValues = [...incomeData, ...expenseData];
    const maxVal = Math.max(...allValues, 1);

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartH * i / 5);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'right';
        const val = Math.round(maxVal * (5 - i) / 5);
        ctx.fillText(val >= 1000 ? `${Math.round(val / 1000)}k` : val.toString(), padding.left - 10, y + 4);
    }

    // Draw bars
    const barGroupWidth = chartW / 12;
    const barWidth = barGroupWidth * 0.3;

    for (let i = 0; i < 12; i++) {
        const x = padding.left + (barGroupWidth * i) + barGroupWidth / 2;

        // Income bar
        const incomeH = (incomeData[i] / maxVal) * chartH;
        ctx.fillStyle = '#10b981';
        ctx.fillRect(x - barWidth, padding.top + chartH - incomeH, barWidth, incomeH);

        // Expense bar
        const expenseH = (expenseData[i] / maxVal) * chartH;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x, padding.top + chartH - expenseH, barWidth, expenseH);

        // Label
        ctx.fillStyle = '#64748b';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], x, h - 10);
    }

    // Legend
    ctx.fillStyle = '#10b981';
    ctx.fillRect(w - 160, 10, 12, 12);
    ctx.fillStyle = '#334155';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Income', w - 144, 20);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(w - 80, 10, 12, 12);
    ctx.fillStyle = '#334155';
    ctx.fillText('Expenses', w - 64, 20);
}

function renderCoursePopularityChart(data) {
    const canvas = document.getElementById('course-popularity-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 250;

    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (entries.length === 0) return;

    const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];
    const total = entries.reduce((sum, [, v]) => sum + v, 0);

    const w = canvas.width;
    const h = canvas.height;
    const centerX = w * 0.35;
    const centerY = h / 2;
    const radius = Math.min(centerX, centerY) - 20;

    let startAngle = -Math.PI / 2;

    entries.forEach(([name, value], i) => {
        const sliceAngle = (value / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        startAngle += sliceAngle;
    });

    // Inner circle (donut)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.55, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    // Center text
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(total.toString(), centerX, centerY + 2);
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Students', centerX, centerY + 18);

    // Legend
    const legendX = w * 0.65;
    entries.forEach(([name, value], i) => {
        const y = 30 + i * 35;
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(legendX, y, 14, 14);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'left';
        const shortName = name.length > 15 ? name.substring(0, 15) + '...' : name;
        ctx.fillText(`${shortName} (${value})`, legendX + 20, y + 12);
    });
}

// ==================== STUDENTS MODULE ====================
async function renderStudents(container) {
    const students = await dbGetAll('students');
    const user = getSession();
    const canEdit = hasAnyRole('admin', 'receptionist');

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1>👨‍🎓 Student Management</h1>
                <p>Manage all student records and profiles</p>
            </div>
            ${canEdit ? `<button class="btn btn-primary" id="btn-add-student" onclick="openStudentForm()">+ Add Student</button>` : ''}
        </div>

        <div class="filter-bar">
            <input type="text" placeholder="Search by name, ID, CNIC, phone..." id="student-search" oninput="filterStudents()">
            <select id="student-status-filter" onchange="filterStudents()">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
                <option value="dropped">Dropped</option>
                <option value="suspended">Suspended</option>
            </select>
            <button class="btn btn-outline" onclick="exportStudentsCSV()">📥 Export CSV</button>
        </div>

        <div class="data-table-container">
            <table class="data-table" id="students-table">
                <thead>
                    <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Father Name</th>
                        <th>Mobile</th>
                        <th>Course</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.length > 0 ? await Promise.all(students.map(async s => {
                        const enrollments = await dbGetByIndex('enrollments', 'studentId', s.id);
                        const courses = [];
                        for (const e of enrollments) {
                            const c = await dbGet('courses', e.courseId);
                            if (c) courses.push(c.name);
                        }
                        return `
                            <tr data-name="${s.name.toLowerCase()}" data-id="${s.studentId.toLowerCase()}" 
                                data-cnic="${(s.cnic || '').toLowerCase()}" data-mobile="${(s.mobile || '').toLowerCase()}"
                                data-status="${s.status}">
                                <td><span class="badge badge-blue">${s.studentId}</span></td>
                                <td>
                                    <div class="cell-with-avatar">
                                        <div class="mini-avatar">${s.name.charAt(0)}</div>
                                        <div>
                                            <strong>${s.name}</strong>
                                            <small>${s.email || ''}</small>
                                        </div>
                                    </div>
                                </td>
                                <td>${s.fatherName}</td>
                                <td>${s.mobile || '-'}</td>
                                <td>${courses.join(', ') || '<em>Not enrolled</em>'}</td>
                                <td><span class="status-badge status-${s.status}">${s.status}</span></td>
                                <td>
                                    <div class="action-btns">
                                        <button class="btn-icon" title="View" onclick="viewStudent(${s.id})">👁️</button>
                                        ${canEdit ? `
                                        <button class="btn-icon" title="Edit" onclick="openStudentForm(${s.id})">✏️</button>
                                        <button class="btn-icon btn-danger" title="Delete" onclick="deleteStudent(${s.id})">🗑️</button>
                                        ` : ''}
                                        <button class="btn-icon" title="ID Card" onclick="generateStudentIdCard(${s.id})">🪪</button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    })).then(rows => rows.join('')) : '<tr><td colspan="7" class="empty-cell">No students found. Click "Add Student" to create one.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

function filterStudents() {
    const search = document.getElementById('student-search')?.value.toLowerCase() || '';
    const status = document.getElementById('student-status-filter')?.value || '';
    const rows = document.querySelectorAll('#students-table tbody tr');

    rows.forEach(row => {
        const name = row.dataset.name || '';
        const id = row.dataset.id || '';
        const cnic = row.dataset.cnic || '';
        const mobile = row.dataset.mobile || '';
        const rowStatus = row.dataset.status || '';

        const matchesSearch = !search || name.includes(search) || id.includes(search) || cnic.includes(search) || mobile.includes(search);
        const matchesStatus = !status || rowStatus === status;

        row.style.display = matchesSearch && matchesStatus ? '' : 'none';
    });
}

function getProvinceOptions() {
    return ['Khyber Pakhtunkhwa', 'Punjab', 'Sindh', 'Balochistan', 'Islamabad Capital Territory', 'Gilgit-Baltistan', 'Azad Jammu & Kashmir'];
}

async function openStudentForm(studentId = null) {
    let student = null;
    if (studentId) {
        student = await dbGet('students', studentId);
    }

    const provinces = getProvinceOptions();
    const title = student ? 'Edit Student' : 'Add New Student';

    const content = `
        <form id="student-form" onsubmit="saveStudent(event, ${studentId || 'null'})">
            <div class="form-grid">
                <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="name" value="${student?.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Father/Guardian Name *</label>
                    <input type="text" name="fatherName" value="${student?.fatherName || ''}" required>
                </div>
                <div class="form-group">
                    <label>CNIC / B-Form</label>
                    <input type="text" name="cnic" value="${student?.cnic || ''}" placeholder="XXXXX-XXXXXXX-X">
                </div>
                <div class="form-group">
                    <label>Date of Birth</label>
                    <input type="date" name="dob" value="${student?.dob || ''}">
                </div>
                <div class="form-group">
                    <label>Gender *</label>
                    <select name="gender" required>
                        <option value="">Select Gender</option>
                        <option value="Male" ${student?.gender === 'Male' ? 'selected' : ''}>Male</option>
                        <option value="Female" ${student?.gender === 'Female' ? 'selected' : ''}>Female</option>
                        <option value="Other" ${student?.gender === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Mobile Number *</label>
                    <input type="tel" name="mobile" value="${student?.mobile || ''}" required placeholder="+92 3XX XXXXXXX">
                </div>
                <div class="form-group">
                    <label>WhatsApp Number</label>
                    <input type="tel" name="whatsapp" value="${student?.whatsapp || ''}" placeholder="+92 3XX XXXXXXX">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value="${student?.email || ''}">
                </div>
                <div class="form-group form-group-full">
                    <label>Address *</label>
                    <input type="text" name="address" value="${student?.address || ''}" required>
                </div>
                <div class="form-group">
                    <label>City</label>
                    <input type="text" name="city" value="${student?.city || ''}">
                </div>
                <div class="form-group">
                    <label>District</label>
                    <input type="text" name="district" value="${student?.district || ''}">
                </div>
                <div class="form-group">
                    <label>Province</label>
                    <select name="province">
                        <option value="">Select Province</option>
                        ${provinces.map(p => `<option value="${p}" ${student?.province === p ? 'selected' : ''}>${p}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Emergency Contact</label>
                    <input type="tel" name="emergencyContact" value="${student?.emergencyContact || ''}">
                </div>
                <div class="form-group">
                    <label>Previous Education</label>
                    <select name="previousEducation">
                        <option value="">Select</option>
                        ${['Matric (SSC)', 'FA (HSSC)', 'FSc (HSSC)', 'ICS', 'BA', 'BSc', 'BCS', 'BS IT', 'MBA', 'Other'].map(e => 
                            `<option value="${e}" ${student?.previousEducation === e ? 'selected' : ''}>${e}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select name="status">
                        ${['active', 'inactive', 'completed', 'dropped', 'suspended'].map(s => 
                            `<option value="${s}" ${(student?.status || 'active') === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Profile Photo (Base64 URL)</label>
                    <input type="text" name="photo" value="${student?.photo || ''}" placeholder="Optional photo URL">
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeModal('student-form')">Cancel</button>
                <button type="submit" class="btn btn-primary">💾 ${student ? 'Update' : 'Save'} Student</button>
            </div>
        </form>
    `;

    openModal('student-form', title, content, 'large');
}

async function saveStudent(e, existingId) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));

    if (!data.name || !data.fatherName || !data.mobile || !data.gender || !data.address) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    try {
        if (existingId) {
            const existing = await dbGet('students', existingId);
            Object.assign(existing, data);
            await dbPut('students', existing);
            await addAuditLog(currentUser.id, currentUser.name, 'Updated Student', 'students', existingId, `Updated ${data.name}`);
            showToast('Student updated successfully!');
        } else {
            const count = await dbCount('students');
            data.studentId = generateStudentId(count);
            data.admissionDate = new Date().toISOString().split('T')[0];
            if (!data.status) data.status = 'active';
            const newId = await dbAdd('students', data);

            // Create student user account
            const pwd = await hashPassword('student123');
            await dbAdd('users', {
                username: data.studentId.toLowerCase(),
                password: pwd,
                name: data.name,
                email: data.email || '',
                role: 'student',
                status: 'active',
                phone: data.mobile,
                studentId: newId
            });

            await addAuditLog(currentUser.id, currentUser.name, 'Added Student', 'students', newId, `Added ${data.name} (${data.studentId})`);
            showToast(`Student added! ID: ${data.studentId}`);
        }

        closeModal('student-form');
        await renderStudents(document.getElementById('page-content'));
    } catch (err) {
        console.error(err);
        showToast('Something went wrong. Please try again.', 'error');
    }
}

async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;
    try {
        const student = await dbGet('students', id);
        await dbDelete('students', id);
        await addAuditLog(currentUser.id, currentUser.name, 'Deleted Student', 'students', id, `Deleted ${student?.name}`);
        showToast('Student deleted');
        await renderStudents(document.getElementById('page-content'));
    } catch (err) {
        showToast('Failed to delete student', 'error');
    }
}

async function viewStudent(id) {
    const student = await dbGet('students', id);
    if (!student) { showToast('Student not found', 'error'); return; }

    const enrollments = await dbGetByIndex('enrollments', 'studentId', id);
    const payments = await dbGetByIndex('feePayments', 'studentId', id);
    const attendanceRecords = await dbGetByIndex('attendance', 'studentId', id);
    const totalPresent = attendanceRecords.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const attendancePercent = attendanceRecords.length > 0 ? ((totalPresent / attendanceRecords.length) * 100).toFixed(1) : '0.0';
    const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);

    let coursesList = '';
    for (const e of enrollments) {
        const course = await dbGet('courses', e.courseId);
        const batch = await dbGet('batches', e.batchId);
        coursesList += `<div class="info-chip">${course?.name || 'Unknown'} (${batch?.batchId || ''})</div>`;
    }

    const content = `
        <div class="student-profile">
            <div class="profile-header">
                <div class="profile-avatar large">${student.name.charAt(0)}</div>
                <div>
                    <h2>${student.name}</h2>
                    <span class="badge badge-blue">${student.studentId}</span>
                    <span class="status-badge status-${student.status}">${student.status}</span>
                </div>
            </div>
            <div class="profile-stats">
                <div class="profile-stat">
                    <span class="stat-val">${enrollments.length}</span>
                    <span class="stat-lbl">Courses</span>
                </div>
                <div class="profile-stat">
                    <span class="stat-val">${attendancePercent}%</span>
                    <span class="stat-lbl">Attendance</span>
                </div>
                <div class="profile-stat">
                    <span class="stat-val">${formatPKR(totalPaid)}</span>
                    <span class="stat-lbl">Total Paid</span>
                </div>
            </div>
            <div class="profile-details">
                <div class="detail-group">
                    <h3>Personal Information</h3>
                    <div class="detail-grid">
                        <div><label>Father Name</label><span>${student.fatherName}</span></div>
                        <div><label>CNIC</label><span>${student.cnic || '-'}</span></div>
                        <div><label>Date of Birth</label><span>${student.dob || '-'}</span></div>
                        <div><label>Gender</label><span>${student.gender}</span></div>
                        <div><label>Mobile</label><span>${student.mobile}</span></div>
                        <div><label>WhatsApp</label><span>${student.whatsapp || '-'}</span></div>
                        <div><label>Email</label><span>${student.email || '-'}</span></div>
                        <div><label>Address</label><span>${student.address}</span></div>
                        <div><label>City</label><span>${student.city || '-'}</span></div>
                        <div><label>Province</label><span>${student.province || '-'}</span></div>
                        <div><label>Education</label><span>${student.previousEducation || '-'}</span></div>
                        <div><label>Admission Date</label><span>${student.admissionDate}</span></div>
                    </div>
                </div>
                <div class="detail-group">
                    <h3>Enrolled Courses</h3>
                    <div class="chips-container">${coursesList || '<em>No courses enrolled</em>'}</div>
                </div>
            </div>
            <div class="form-actions">
                <button class="btn btn-outline" onclick="printStudentProfile(${id})">🖨️ Print Profile</button>
                <button class="btn btn-primary" onclick="generateStudentIdCard(${id})">🪪 Generate ID Card</button>
            </div>
        </div>
    `;

    openModal('student-profile', 'Student Profile', content, 'large');
}

function printStudentProfile(id) {
    const content = document.querySelector('.student-profile');
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Student Profile</title>
        <style>body{font-family:Arial,sans-serif;padding:20px;}h2,h3{margin:10px 0;}.profile-stats{display:flex;gap:20px;margin:15px 0;}.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}label{font-weight:bold;display:block;font-size:12px;color:#666;}span{display:block;margin-bottom:5px;}</style>
    </head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    win.print();
}

async function generateStudentIdCard(id) {
    const student = await dbGet('students', id);
    if (!student) return;

    const enrollments = await dbGetByIndex('enrollments', 'studentId', id);
    let courseName = 'N/A', batchId = 'N/A';
    if (enrollments.length > 0) {
        const course = await dbGet('courses', enrollments[0].courseId);
        const batch = await dbGet('batches', enrollments[0].batchId);
        courseName = course?.name || 'N/A';
        batchId = batch?.batchId || 'N/A';
    }

    const instituteName = await getSetting('instituteName') || 'EduTech Institute';
    const institutePhone = await getSetting('phone') || '';

    const content = `
        <div class="id-card">
            <div class="id-card-header">
                <div class="id-card-logo">🎓</div>
                <div class="id-card-institute">
                    <h3>${instituteName}</h3>
                </div>
            </div>
            <div class="id-card-body">
                <div class="id-card-photo">${student.name.charAt(0)}</div>
                <div class="id-card-info">
                    <h2>${student.name}</h2>
                    <p><strong>ID:</strong> ${student.studentId}</p>
                    <p><strong>Father:</strong> ${student.fatherName}</p>
                    <p><strong>Course:</strong> ${courseName}</p>
                    <p><strong>Batch:</strong> ${batchId}</p>
                    <p><strong>Contact:</strong> ${student.mobile}</p>
                </div>
            </div>
            <div class="id-card-footer">
                <small>Admission: ${student.admissionDate} | ${institutePhone}</small>
            </div>
        </div>
        <div class="form-actions" style="margin-top:20px">
            <button class="btn btn-primary" onclick="printIdCard()">🖨️ Print ID Card</button>
        </div>
    `;

    openModal('id-card', 'Student ID Card', content, 'small');
}

function printIdCard() {
    const card = document.querySelector('.id-card');
    if (!card) return;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Student ID Card</title>
        <style>
            body{font-family:Arial;display:flex;justify-content:center;padding:20px;}
            .id-card{width:350px;border:2px solid #6366f1;border-radius:12px;overflow:hidden;background:#fff;}
            .id-card-header{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:12px;text-align:center;}
            .id-card-header h3{margin:5px 0;font-size:14px;}
            .id-card-body{display:flex;padding:15px;gap:15px;align-items:center;}
            .id-card-photo{width:70px;height:70px;border-radius:50%;background:#6366f1;color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:bold;}
            .id-card-info h2{margin:0 0 5px;font-size:16px;}
            .id-card-info p{margin:2px 0;font-size:12px;}
            .id-card-footer{background:#f1f5f9;padding:8px;text-align:center;font-size:11px;}
            .id-card-logo{font-size:28px;}
        </style>
    </head><body>${card.outerHTML}</body></html>`);
    win.document.close();
    win.print();
}

function exportStudentsCSV() {
    dbGetAll('students').then(students => {
        const headers = ['Student ID', 'Name', 'Father Name', 'CNIC', 'DOB', 'Gender', 'Mobile', 'Email', 'City', 'Province', 'Status'];
        const rows = students.map(s => [s.studentId, s.name, s.fatherName, s.cnic || '', s.dob || '', s.gender, s.mobile, s.email || '', s.city || '', s.province || '', s.status]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        downloadFile(csv, 'students_export.csv', 'text/csv');
    });
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ==================== COURSES MODULE ====================
async function renderCourses(container) {
    const courses = await dbGetAll('courses');
    const categories = await dbGetAll('courseCategories');
    const canEdit = hasAnyRole('admin');

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1>📚 Course Management</h1>
                <p>Manage institute courses and programs</p>
            </div>
            ${canEdit ? `<button class="btn btn-primary" id="btn-add-course" onclick="openCourseForm()">+ Add Course</button>` : ''}
        </div>

        <div class="filter-bar">
            <input type="text" placeholder="Search courses..." id="course-search" oninput="filterCourses()">
            <select id="course-cat-filter" onchange="filterCourses()">
                <option value="">All Categories</option>
                ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
        </div>

        <div class="courses-grid">
            ${courses.map(c => {
                const cat = categories.find(cat => cat.id === c.categoryId);
                return `
                    <div class="course-card" data-name="${c.name.toLowerCase()}" data-cat="${c.categoryId}">
                        <div class="course-card-header">
                            <span class="course-code">${c.courseCode}</span>
                            <span class="status-badge status-${c.status}">${c.status}</span>
                        </div>
                        <h3>${c.name}</h3>
                        <p class="course-desc">${(c.description || '').substring(0, 80)}...</p>
                        <div class="course-meta">
                            <span>📁 ${cat?.name || 'Unknown'}</span>
                            <span>⏱️ ${c.duration}</span>
                            <span>📖 ${c.totalClasses} Classes</span>
                        </div>
                        <div class="course-fee">
                            <span class="fee-label">Course Fee</span>
                            <span class="fee-amount">${formatPKR(c.courseFee)}</span>
                        </div>
                        ${canEdit ? `
                        <div class="course-actions">
                            <button class="btn btn-sm btn-outline" onclick="openCourseForm(${c.id})">✏️ Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteCourse(${c.id})">🗑️ Delete</button>
                        </div>` : ''}
                    </div>
                `;
            }).join('')}
            ${courses.length === 0 ? '<div class="empty-state"><h2>No courses found</h2><p>Create your first course to get started.</p></div>' : ''}
        </div>
    `;
}

function filterCourses() {
    const search = document.getElementById('course-search')?.value.toLowerCase() || '';
    const cat = document.getElementById('course-cat-filter')?.value || '';
    document.querySelectorAll('.course-card').forEach(card => {
        const name = card.dataset.name || '';
        const cardCat = card.dataset.cat || '';
        const matchesSearch = !search || name.includes(search);
        const matchesCat = !cat || cardCat === cat;
        card.style.display = matchesSearch && matchesCat ? '' : 'none';
    });
}

async function openCourseForm(courseId = null) {
    let course = null;
    if (courseId) course = await dbGet('courses', courseId);
    const categories = await dbGetAll('courseCategories');

    const content = `
        <form id="course-form" onsubmit="saveCourse(event, ${courseId || 'null'})">
            <div class="form-grid">
                <div class="form-group">
                    <label>Course Name *</label>
                    <input type="text" name="name" value="${course?.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Course Code *</label>
                    <input type="text" name="courseCode" value="${course?.courseCode || ''}" required placeholder="e.g. WD-101">
                </div>
                <div class="form-group">
                    <label>Category *</label>
                    <select name="categoryId" required>
                        <option value="">Select Category</option>
                        ${categories.map(c => `<option value="${c.id}" ${course?.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Duration *</label>
                    <input type="text" name="duration" value="${course?.duration || ''}" required placeholder="e.g. 3 Months">
                </div>
                <div class="form-group">
                    <label>Total Classes</label>
                    <input type="number" name="totalClasses" value="${course?.totalClasses || ''}" min="1">
                </div>
                <div class="form-group">
                    <label>Course Fee (PKR) *</label>
                    <input type="number" name="courseFee" value="${course?.courseFee || ''}" required min="0">
                </div>
                <div class="form-group">
                    <label>Registration Fee</label>
                    <input type="number" name="registrationFee" value="${course?.registrationFee || '0'}" min="0">
                </div>
                <div class="form-group">
                    <label>Admission Fee</label>
                    <input type="number" name="admissionFee" value="${course?.admissionFee || '0'}" min="0">
                </div>
                <div class="form-group">
                    <label>Certificate Fee</label>
                    <input type="number" name="certificateFee" value="${course?.certificateFee || '0'}" min="0">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select name="status">
                        <option value="active" ${(course?.status || 'active') === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${course?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <div class="form-group form-group-full">
                    <label>Description</label>
                    <textarea name="description" rows="3">${course?.description || ''}</textarea>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeModal('course-form')">Cancel</button>
                <button type="submit" class="btn btn-primary">💾 ${course ? 'Update' : 'Save'} Course</button>
            </div>
        </form>
    `;

    openModal('course-form', course ? 'Edit Course' : 'Add New Course', content, 'large');
}

async function saveCourse(e, existingId) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.categoryId = parseInt(data.categoryId);
    data.totalClasses = parseInt(data.totalClasses) || 0;
    data.courseFee = parseInt(data.courseFee) || 0;
    data.registrationFee = parseInt(data.registrationFee) || 0;
    data.admissionFee = parseInt(data.admissionFee) || 0;
    data.certificateFee = parseInt(data.certificateFee) || 0;

    try {
        if (existingId) {
            const existing = await dbGet('courses', existingId);
            Object.assign(existing, data);
            await dbPut('courses', existing);
            showToast('Course updated!');
        } else {
            await dbAdd('courses', data);
            showToast('Course added!');
        }
        closeModal('course-form');
        await renderCourses(document.getElementById('page-content'));
    } catch (err) {
        showToast('Failed to save course. Check if course code is unique.', 'error');
    }
}

async function deleteCourse(id) {
    if (!confirm('Delete this course?')) return;
    await dbDelete('courses', id);
    showToast('Course deleted');
    await renderCourses(document.getElementById('page-content'));
}

// ==================== TEACHERS MODULE ====================
async function renderTeachers(container) {
    const teachers = await dbGetAll('teachers');
    const courses = await dbGetAll('courses');
    const canEdit = hasAnyRole('admin');

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1>👨‍🏫 Teacher Management</h1>
                <p>Manage teacher profiles and assignments</p>
            </div>
            ${canEdit ? `<button class="btn btn-primary" onclick="openTeacherForm()">+ Add Teacher</button>` : ''}
        </div>

        <div class="teacher-grid">
            ${teachers.map(t => {
                const assignedCourses = (t.assignedCourses || []).map(cid => {
                    const c = courses.find(course => course.id === cid);
                    return c ? c.name : '';
                }).filter(Boolean);
                return `
                    <div class="teacher-card">
                        <div class="teacher-card-header">
                            <div class="teacher-avatar">${t.name.charAt(0)}</div>
                            <span class="status-badge status-${t.status}">${t.status}</span>
                        </div>
                        <h3>${t.name}</h3>
                        <p class="teacher-id">${t.teacherId}</p>
                        <div class="teacher-details">
                            <p>📱 ${t.mobile}</p>
                            <p>🎓 ${t.qualification}</p>
                            <p>💼 ${t.specialization || '-'}</p>
                            <p>💰 ${formatPKR(t.salary)}/month</p>
                        </div>
                        <div class="teacher-courses">
                            ${assignedCourses.map(c => `<span class="info-chip">${c}</span>`).join('')}
                        </div>
                        ${canEdit ? `
                        <div class="course-actions">
                            <button class="btn btn-sm btn-outline" onclick="openTeacherForm(${t.id})">✏️ Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteTeacher(${t.id})">🗑️ Delete</button>
                        </div>` : ''}
                    </div>
                `;
            }).join('')}
            ${teachers.length === 0 ? '<div class="empty-state"><h2>No teachers found</h2></div>' : ''}
        </div>
    `;
}

async function openTeacherForm(teacherId = null) {
    let teacher = null;
    if (teacherId) teacher = await dbGet('teachers', teacherId);
    const courses = await dbGetAll('courses');

    const content = `
        <form id="teacher-form" onsubmit="saveTeacher(event, ${teacherId || 'null'})">
            <div class="form-grid">
                <div class="form-group"><label>Full Name *</label><input type="text" name="name" value="${teacher?.name || ''}" required></div>
                <div class="form-group"><label>Father Name</label><input type="text" name="fatherName" value="${teacher?.fatherName || ''}"></div>
                <div class="form-group"><label>CNIC</label><input type="text" name="cnic" value="${teacher?.cnic || ''}" placeholder="XXXXX-XXXXXXX-X"></div>
                <div class="form-group"><label>Mobile *</label><input type="tel" name="mobile" value="${teacher?.mobile || ''}" required></div>
                <div class="form-group"><label>WhatsApp</label><input type="tel" name="whatsapp" value="${teacher?.whatsapp || ''}"></div>
                <div class="form-group"><label>Email</label><input type="email" name="email" value="${teacher?.email || ''}"></div>
                <div class="form-group form-group-full"><label>Address</label><input type="text" name="address" value="${teacher?.address || ''}"></div>
                <div class="form-group"><label>Qualification</label><input type="text" name="qualification" value="${teacher?.qualification || ''}"></div>
                <div class="form-group"><label>Specialization</label><input type="text" name="specialization" value="${teacher?.specialization || ''}"></div>
                <div class="form-group"><label>Joining Date</label><input type="date" name="joiningDate" value="${teacher?.joiningDate || ''}"></div>
                <div class="form-group"><label>Salary (PKR)</label><input type="number" name="salary" value="${teacher?.salary || ''}" min="0"></div>
                <div class="form-group"><label>Status</label>
                    <select name="status">
                        <option value="active" ${(teacher?.status || 'active') === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${teacher?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <div class="form-group form-group-full">
                    <label>Assigned Courses</label>
                    <div class="checkbox-group">
                        ${courses.filter(c => c.status === 'active').map(c => `
                            <label class="checkbox-label">
                                <input type="checkbox" name="assignedCourses" value="${c.id}" ${(teacher?.assignedCourses || []).includes(c.id) ? 'checked' : ''}>
                                ${c.name}
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeModal('teacher-form')">Cancel</button>
                <button type="submit" class="btn btn-primary">💾 ${teacher ? 'Update' : 'Save'} Teacher</button>
            </div>
        </form>
    `;

    openModal('teacher-form', teacher ? 'Edit Teacher' : 'Add New Teacher', content, 'large');
}

async function saveTeacher(e, existingId) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    for (const [key, value] of formData.entries()) {
        if (key === 'assignedCourses') {
            if (!data.assignedCourses) data.assignedCourses = [];
            data.assignedCourses.push(parseInt(value));
        } else {
            data[key] = value;
        }
    }
    if (!data.assignedCourses) data.assignedCourses = [];
    data.salary = parseInt(data.salary) || 0;

    try {
        if (existingId) {
            const existing = await dbGet('teachers', existingId);
            Object.assign(existing, data);
            await dbPut('teachers', existing);
            showToast('Teacher updated!');
        } else {
            const count = await dbCount('teachers');
            data.teacherId = generateTeacherId(count);
            const newId = await dbAdd('teachers', data);
            const pwd = await hashPassword('teacher123');
            await dbAdd('users', {
                username: (data.email || data.teacherId).split('@')[0],
                password: pwd,
                name: data.name,
                email: data.email || '',
                role: 'teacher',
                status: 'active',
                phone: data.mobile,
                teacherId: newId
            });
            showToast(`Teacher added! ID: ${data.teacherId}`);
        }
        closeModal('teacher-form');
        await renderTeachers(document.getElementById('page-content'));
    } catch (err) {
        showToast('Failed to save teacher', 'error');
    }
}

async function deleteTeacher(id) {
    if (!confirm('Delete this teacher?')) return;
    await dbDelete('teachers', id);
    showToast('Teacher deleted');
    await renderTeachers(document.getElementById('page-content'));
}

// ==================== BATCHES MODULE ====================
async function renderBatches(container) {
    const batches = await dbGetAll('batches');
    const courses = await dbGetAll('courses');
    const teachers = await dbGetAll('teachers');
    const rooms = await dbGetAll('rooms');
    const canEdit = hasAnyRole('admin');

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1>👥 Batch Management</h1>
                <p>Manage course batches and enrollments</p>
            </div>
            ${canEdit ? `<button class="btn btn-primary" onclick="openBatchForm()">+ Create Batch</button>` : ''}
        </div>

        <div class="batches-grid">
            ${batches.map(b => {
                const course = courses.find(c => c.id === b.courseId);
                const teacher = teachers.find(t => t.id === b.teacherId);
                const room = rooms.find(r => r.id === b.roomId);
                const capacityPercent = b.maxStudents > 0 ? Math.round((b.currentStudents / b.maxStudents) * 100) : 0;
                return `
                    <div class="batch-card">
                        <div class="batch-header">
                            <span class="batch-id">${b.batchId}</span>
                            <span class="status-badge status-${b.status}">${b.status}</span>
                        </div>
                        <h3>${course?.name || 'Unknown Course'}</h3>
                        <div class="batch-info">
                            <p>👨‍🏫 ${teacher?.name || 'Not Assigned'}</p>
                            <p>🏫 ${room?.name || 'No Room'}</p>
                            <p>📅 ${b.startDate} to ${b.endDate}</p>
                            <p>🕐 ${b.startTime} - ${b.endTime}</p>
                            <p>📆 ${(b.days || []).join(', ')}</p>
                        </div>
                        <div class="batch-capacity">
                            <div class="capacity-bar">
                                <div class="capacity-fill" style="width: ${capacityPercent}%"></div>
                            </div>
                            <span>${b.currentStudents} / ${b.maxStudents} Students</span>
                        </div>
                        ${canEdit ? `
                        <div class="course-actions">
                            <button class="btn btn-sm btn-outline" onclick="openBatchForm(${b.id})">✏️ Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteBatch(${b.id})">🗑️</button>
                        </div>` : ''}
                    </div>
                `;
            }).join('')}
            ${batches.length === 0 ? '<div class="empty-state"><h2>No batches found</h2></div>' : ''}
        </div>
    `;
}

async function openBatchForm(batchId = null) {
    let batch = null;
    if (batchId) batch = await dbGet('batches', batchId);
    const courses = await dbGetAll('courses');
    const teachers = await dbGetAll('teachers');
    const rooms = await dbGetAll('rooms');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const content = `
        <form id="batch-form" onsubmit="saveBatch(event, ${batchId || 'null'})">
            <div class="form-grid">
                <div class="form-group"><label>Course *</label>
                    <select name="courseId" required>
                        <option value="">Select Course</option>
                        ${courses.filter(c => c.status === 'active').map(c => `<option value="${c.id}" ${batch?.courseId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Teacher</label>
                    <select name="teacherId">
                        <option value="">Select Teacher</option>
                        ${teachers.filter(t => t.status === 'active').map(t => `<option value="${t.id}" ${batch?.teacherId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Room</label>
                    <select name="roomId">
                        <option value="">Select Room</option>
                        ${rooms.map(r => `<option value="${r.id}" ${batch?.roomId === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Max Students</label><input type="number" name="maxStudents" value="${batch?.maxStudents || 30}" min="1"></div>
                <div class="form-group"><label>Start Date *</label><input type="date" name="startDate" value="${batch?.startDate || ''}" required></div>
                <div class="form-group"><label>End Date *</label><input type="date" name="endDate" value="${batch?.endDate || ''}" required></div>
                <div class="form-group"><label>Start Time *</label><input type="time" name="startTime" value="${batch?.startTime || ''}" required></div>
                <div class="form-group"><label>End Time *</label><input type="time" name="endTime" value="${batch?.endTime || ''}" required></div>
                <div class="form-group form-group-full">
                    <label>Days *</label>
                    <div class="checkbox-group">
                        ${days.map(d => `<label class="checkbox-label"><input type="checkbox" name="days" value="${d}" ${(batch?.days || []).includes(d) ? 'checked' : ''}> ${d}</label>`).join('')}
                    </div>
                </div>
                <div class="form-group"><label>Status</label>
                    <select name="status">
                        <option value="active" ${(batch?.status || 'active') === 'active' ? 'selected' : ''}>Active</option>
                        <option value="completed" ${batch?.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${batch?.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeModal('batch-form')">Cancel</button>
                <button type="submit" class="btn btn-primary">💾 ${batch ? 'Update' : 'Create'} Batch</button>
            </div>
        </form>
    `;

    openModal('batch-form', batch ? 'Edit Batch' : 'Create New Batch', content, 'large');
}

async function saveBatch(e, existingId) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    const daysArr = [];
    for (const [key, value] of formData.entries()) {
        if (key === 'days') daysArr.push(value);
        else data[key] = value;
    }
    data.days = daysArr;
    data.courseId = parseInt(data.courseId);
    data.teacherId = parseInt(data.teacherId) || null;
    data.roomId = parseInt(data.roomId) || null;
    data.maxStudents = parseInt(data.maxStudents) || 30;

    try {
        if (existingId) {
            const existing = await dbGet('batches', existingId);
            data.currentStudents = existing.currentStudents;
            Object.assign(existing, data);
            await dbPut('batches', existing);
            showToast('Batch updated!');
        } else {
            const course = await dbGet('courses', data.courseId);
            const count = await dbCount('batches');
            data.batchId = generateBatchId(course?.courseCode || 'BATCH', count);
            data.currentStudents = 0;
            await dbAdd('batches', data);
            showToast(`Batch created! ID: ${data.batchId}`);
        }
        closeModal('batch-form');
        await renderBatches(document.getElementById('page-content'));
    } catch (err) {
        showToast('Failed to save batch', 'error');
    }
}

async function deleteBatch(id) {
    if (!confirm('Delete this batch?')) return;
    await dbDelete('batches', id);
    showToast('Batch deleted');
    await renderBatches(document.getElementById('page-content'));
}

// ==================== APP INITIALIZATION ====================
async function initApp() {
    try {
        await openDB();
        await seedDemoData();
        await renderApp();
    } catch (error) {
        console.error('Failed to initialize application:', error);
        document.getElementById('app').innerHTML = `
            <div class="error-state">
                <h2>Initialization Error</h2>
                <p>Unable to initialize database. Please refresh or check browser settings.</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', initApp);

