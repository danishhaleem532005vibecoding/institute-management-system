/**
 * EduTech IMS - Authentication & Session Management
 */

const AUTH_KEY = 'edutech_ims_session';

// Current user session
let currentUser = null;

function getSession() {
    try {
        const session = localStorage.getItem(AUTH_KEY);
        if (session) {
            currentUser = JSON.parse(session);
            return currentUser;
        }
    } catch (e) {
        localStorage.removeItem(AUTH_KEY);
    }
    return null;
}

function setSession(user) {
    currentUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        photo: user.photo || null,
        loginTime: new Date().toISOString()
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
}

function clearSession() {
    currentUser = null;
    localStorage.removeItem(AUTH_KEY);
}

async function login(username, password) {
    const hashedPwd = await hashPassword(password);
    const users = await dbGetAll('users');
    const user = users.find(u => u.username === username && u.password === hashedPwd && u.status === 'active');
    if (user) {
        setSession(user);
        await addAuditLog(user.id, user.name, 'Login', 'users', user.id, 'User logged in');
        return { success: true, user: currentUser };
    }
    return { success: false, message: 'Invalid username or password' };
}

async function logout() {
    if (currentUser) {
        await addAuditLog(currentUser.id, currentUser.name, 'Logout', 'users', currentUser.id, 'User logged out');
    }
    clearSession();
    window.location.reload();
}

function isAuthenticated() {
    return getSession() !== null;
}

function hasRole(role) {
    const user = getSession();
    if (!user) return false;
    return user.role === role;
}

function hasAnyRole(...roles) {
    const user = getSession();
    if (!user) return false;
    return roles.includes(user.role);
}

// Permission matrix
const PERMISSIONS = {
    admin: {
        dashboard: true, students: true, teachers: true, courses: true, batches: true,
        admissions: true, fees: true, accounting: true, attendance: true, exams: true,
        results: true, certificates: true, timetable: true, reports: true,
        announcements: true, users: true, settings: true, backup: true, auditLogs: true
    },
    receptionist: {
        dashboard: true, students: true, teachers: false, courses: true, batches: true,
        admissions: true, fees: true, accounting: false, attendance: false, exams: false,
        results: false, certificates: false, timetable: true, reports: true,
        announcements: false, users: false, settings: false, backup: false, auditLogs: false
    },
    accountant: {
        dashboard: true, students: true, teachers: false, courses: true, batches: false,
        admissions: false, fees: true, accounting: true, attendance: false, exams: false,
        results: false, certificates: false, timetable: false, reports: true,
        announcements: false, users: false, settings: false, backup: false, auditLogs: false
    },
    teacher: {
        dashboard: true, students: true, teachers: false, courses: true, batches: true,
        admissions: false, fees: false, accounting: false, attendance: true, exams: true,
        results: true, certificates: false, timetable: true, reports: false,
        announcements: false, users: false, settings: false, backup: false, auditLogs: false
    },
    student: {
        dashboard: true, students: false, teachers: false, courses: true, batches: false,
        admissions: false, fees: true, accounting: false, attendance: true, exams: false,
        results: true, certificates: true, timetable: true, reports: false,
        announcements: true, users: false, settings: false, backup: false, auditLogs: false
    },
    parent: {
        dashboard: true, students: false, teachers: false, courses: false, batches: false,
        admissions: false, fees: true, accounting: false, attendance: true, exams: false,
        results: true, certificates: false, timetable: false, reports: false,
        announcements: true, users: false, settings: false, backup: false, auditLogs: false
    }
};

function canAccess(module) {
    const user = getSession();
    if (!user) return false;
    const perms = PERMISSIONS[user.role];
    return perms ? perms[module] === true : false;
}
