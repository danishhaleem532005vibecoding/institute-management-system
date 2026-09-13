/**
 * EduTech IMS - Demo Data Seeder
 * Creates realistic Pakistani demo data for testing
 */

async function seedDemoData() {
    // Check if already seeded
    const existing = await getSetting('demoDataSeeded');
    if (existing) return;

    // ==================== DEFAULT SETTINGS ====================
    const defaultSettings = {
        instituteName: 'EduTech Institute of Technology & Languages',
        instituteShortName: 'EduTech',
        address: 'Main GT Road, Near City Chowk, Peshawar',
        city: 'Peshawar',
        province: 'Khyber Pakhtunkhwa',
        phone: '091-1234567',
        whatsapp: '+92 300 1234567',
        email: 'info@edutechinstitute.pk',
        website: 'www.edutechinstitute.pk',
        facebook: 'facebook.com/edutechinstitute',
        instagram: '@edutechinstitute',
        youtube: 'youtube.com/@edutechinstitute',
        directorName: 'Muhammad Imran Khan',
        principalName: 'Dr. Sarah Ahmed',
        currency: 'PKR',
        language: 'en',
        timezone: 'Asia/Karachi',
        sessionYear: '2026-2027',
        receiptFooter: 'Thank you for choosing EduTech Institute. Fees once paid are non-refundable.',
        certificateFooter: 'This certificate is digitally verifiable at our website.'
    };
    for (const [key, value] of Object.entries(defaultSettings)) {
        await setSetting(key, value);
    }

    // ==================== GRADING RULES ====================
    const gradingRules = [
        { minMarks: 90, maxMarks: 100, grade: 'A+', remarks: 'Exceptional' },
        { minMarks: 80, maxMarks: 89, grade: 'A', remarks: 'Excellent' },
        { minMarks: 70, maxMarks: 79, grade: 'B', remarks: 'Very Good' },
        { minMarks: 60, maxMarks: 69, grade: 'C', remarks: 'Good' },
        { minMarks: 50, maxMarks: 59, grade: 'D', remarks: 'Satisfactory' },
        { minMarks: 0, maxMarks: 49, grade: 'F', remarks: 'Fail' }
    ];
    for (const rule of gradingRules) {
        await dbAdd('gradingRules', rule);
    }

    // ==================== ADMIN USER ====================
    const adminPwd = await hashPassword('admin123');
    await dbAdd('users', {
        username: 'admin',
        password: adminPwd,
        name: 'Muhammad Imran Khan',
        email: 'admin@edutechinstitute.pk',
        role: 'admin',
        status: 'active',
        phone: '+92 300 1234567'
    });

    // ==================== RECEPTIONIST USER ====================
    const receptionistPwd = await hashPassword('reception123');
    await dbAdd('users', {
        username: 'reception',
        password: receptionistPwd,
        name: 'Ayesha Noor',
        email: 'reception@edutechinstitute.pk',
        role: 'receptionist',
        status: 'active',
        phone: '+92 301 2345678'
    });

    // ==================== ACCOUNTANT USER ====================
    const accountantPwd = await hashPassword('accounts123');
    await dbAdd('users', {
        username: 'accounts',
        password: accountantPwd,
        name: 'Bilal Ahmad',
        email: 'accounts@edutechinstitute.pk',
        role: 'accountant',
        status: 'active',
        phone: '+92 302 3456789'
    });

    // ==================== ROOMS ====================
    const roomNames = ['Lab 1', 'Lab 2', 'Lab 3', 'Classroom 1', 'Classroom 2', 'Classroom 3', 'Conference Room', 'Language Lab'];
    for (const name of roomNames) {
        await dbAdd('rooms', { name, capacity: name.includes('Lab') ? 30 : name.includes('Conference') ? 15 : 40, status: 'active' });
    }

    // ==================== COURSE CATEGORIES ====================
    const categories = [
        { name: 'IT Courses', description: 'Information Technology & Computer Courses', icon: '💻' },
        { name: 'English Courses', description: 'English Language & Communication Courses', icon: '📚' }
    ];
    for (const cat of categories) {
        await dbAdd('courseCategories', cat);
    }

    // ==================== COURSES ====================
    const coursesData = [
        { courseCode: 'CB-101', name: 'Computer Basics', categoryId: 1, duration: '2 Months', totalClasses: 24, courseFee: 8000, registrationFee: 500, monthlyFee: 0, admissionFee: 500, certificateFee: 500, status: 'active', description: 'Learn fundamental computer skills including Windows, file management, and internet usage.' },
        { courseCode: 'MSO-101', name: 'MS Office Complete', categoryId: 1, duration: '3 Months', totalClasses: 36, courseFee: 12000, registrationFee: 500, monthlyFee: 0, admissionFee: 1000, certificateFee: 500, status: 'active', description: 'Master Microsoft Word, Excel, PowerPoint, and Access.' },
        { courseCode: 'GD-101', name: 'Graphic Designing', categoryId: 1, duration: '4 Months', totalClasses: 48, courseFee: 25000, registrationFee: 1000, monthlyFee: 0, admissionFee: 2000, certificateFee: 1000, status: 'active', description: 'Learn Photoshop, Illustrator, CorelDraw, and complete graphic design principles.' },
        { courseCode: 'WD-101', name: 'Web Development', categoryId: 1, duration: '6 Months', totalClasses: 72, courseFee: 35000, registrationFee: 1000, monthlyFee: 0, admissionFee: 3000, certificateFee: 1000, status: 'active', description: 'Complete web development with HTML, CSS, JavaScript, React, Node.js and databases.' },
        { courseCode: 'DM-101', name: 'Digital Marketing', categoryId: 1, duration: '3 Months', totalClasses: 36, courseFee: 20000, registrationFee: 1000, monthlyFee: 0, admissionFee: 2000, certificateFee: 500, status: 'active', description: 'Learn SEO, Social Media Marketing, Google Ads, Facebook Ads, Email Marketing.' },
        { courseCode: 'FL-101', name: 'Freelancing', categoryId: 1, duration: '2 Months', totalClasses: 24, courseFee: 15000, registrationFee: 500, monthlyFee: 0, admissionFee: 1000, certificateFee: 500, status: 'active', description: 'Learn freelancing on Upwork, Fiverr, and other platforms.' },
        { courseCode: 'PY-101', name: 'Python Programming', categoryId: 1, duration: '4 Months', totalClasses: 48, courseFee: 30000, registrationFee: 1000, monthlyFee: 0, admissionFee: 2000, certificateFee: 1000, status: 'active', description: 'Complete Python programming from basics to advanced concepts.' },
        { courseCode: 'SP-101', name: 'Shopify E-commerce', categoryId: 1, duration: '2 Months', totalClasses: 24, courseFee: 18000, registrationFee: 1000, monthlyFee: 0, admissionFee: 1500, certificateFee: 500, status: 'active', description: 'Build and manage professional Shopify stores.' },
        { courseCode: 'SE-101', name: 'Spoken English', categoryId: 2, duration: '3 Months', totalClasses: 36, courseFee: 10000, registrationFee: 500, monthlyFee: 0, admissionFee: 1000, certificateFee: 500, status: 'active', description: 'Improve speaking confidence, pronunciation, and daily conversation skills.' },
        { courseCode: 'EG-101', name: 'English Grammar', categoryId: 2, duration: '3 Months', totalClasses: 36, courseFee: 8000, registrationFee: 500, monthlyFee: 0, admissionFee: 500, certificateFee: 500, status: 'active', description: 'Master English grammar from basic to advanced level.' },
        { courseCode: 'IL-101', name: 'IELTS Preparation', categoryId: 2, duration: '3 Months', totalClasses: 36, courseFee: 25000, registrationFee: 1500, monthlyFee: 0, admissionFee: 2000, certificateFee: 1000, status: 'active', description: 'Complete IELTS preparation covering all four modules: Reading, Writing, Listening, Speaking.' },
        { courseCode: 'CS-101', name: 'Communication Skills', categoryId: 2, duration: '2 Months', totalClasses: 24, courseFee: 10000, registrationFee: 500, monthlyFee: 0, admissionFee: 1000, certificateFee: 500, status: 'active', description: 'Professional communication skills for career development.' }
    ];
    for (const course of coursesData) {
        await dbAdd('courses', course);
    }

    // ==================== TEACHERS ====================
    const teachersData = [
        { teacherId: 'TCH-2026-0001', name: 'Muhammad Ali', fatherName: 'Abdul Rahim', cnic: '17301-1234567-1', mobile: '+92 333 1234567', whatsapp: '+92 333 1234567', email: 'mali@edutechinstitute.pk', address: 'University Road, Peshawar', qualification: 'MS Computer Science', specialization: 'Web Development, Python', joiningDate: '2024-01-15', salary: 45000, status: 'active', assignedCourses: [4, 7] },
        { teacherId: 'TCH-2026-0002', name: 'Fatima Zahra', fatherName: 'Muhammad Hassan', cnic: '17301-2345678-2', mobile: '+92 334 2345678', whatsapp: '+92 334 2345678', email: 'fatima@edutechinstitute.pk', address: 'Hayatabad, Peshawar', qualification: 'MA English Literature', specialization: 'Spoken English, IELTS', joiningDate: '2024-03-01', salary: 40000, status: 'active', assignedCourses: [9, 11] },
        { teacherId: 'TCH-2026-0003', name: 'Ahmed Khan', fatherName: 'Zafar Khan', cnic: '17301-3456789-3', mobile: '+92 335 3456789', whatsapp: '+92 335 3456789', email: 'ahmed@edutechinstitute.pk', address: 'Saddar, Peshawar', qualification: 'BCS', specialization: 'Graphic Designing, Video Editing', joiningDate: '2024-06-10', salary: 35000, status: 'active', assignedCourses: [3] },
        { teacherId: 'TCH-2026-0004', name: 'Usman Ghani', fatherName: 'Noor Muhammad', cnic: '17301-4567890-4', mobile: '+92 336 4567890', whatsapp: '+92 336 4567890', email: 'usman@edutechinstitute.pk', address: 'Board Bazaar, Peshawar', qualification: 'BS IT', specialization: 'Digital Marketing, SEO, Freelancing', joiningDate: '2025-01-05', salary: 38000, status: 'active', assignedCourses: [5, 6, 8] },
        { teacherId: 'TCH-2026-0005', name: 'Nadia Bibi', fatherName: 'Sher Muhammad', cnic: '17301-5678901-5', mobile: '+92 337 5678901', whatsapp: '+92 337 5678901', email: 'nadia@edutechinstitute.pk', address: 'Ring Road, Peshawar', qualification: 'MS English', specialization: 'English Grammar, Communication Skills', joiningDate: '2025-04-15', salary: 35000, status: 'active', assignedCourses: [10, 12] }
    ];

    // Create teacher user accounts
    for (const teacher of teachersData) {
        const tid = await dbAdd('teachers', teacher);
        const tPwd = await hashPassword('teacher123');
        await dbAdd('users', {
            username: teacher.email.split('@')[0],
            password: tPwd,
            name: teacher.name,
            email: teacher.email,
            role: 'teacher',
            status: 'active',
            phone: teacher.mobile,
            teacherId: tid
        });
    }

    // ==================== BATCHES ====================
    const batchesData = [
        { batchId: 'WD-B01', courseId: 4, teacherId: 1, roomId: 1, startDate: '2026-07-01', endDate: '2026-12-31', startTime: '16:00', endTime: '18:00', days: ['Monday', 'Wednesday', 'Friday'], maxStudents: 30, currentStudents: 0, status: 'active' },
        { batchId: 'GD-B01', courseId: 3, teacherId: 3, roomId: 2, startDate: '2026-07-15', endDate: '2026-11-15', startTime: '10:00', endTime: '12:00', days: ['Monday', 'Tuesday', 'Thursday'], maxStudents: 25, currentStudents: 0, status: 'active' },
        { batchId: 'SE-B01', courseId: 9, teacherId: 2, roomId: 8, startDate: '2026-08-01', endDate: '2026-10-31', startTime: '14:00', endTime: '16:00', days: ['Monday', 'Wednesday', 'Friday'], maxStudents: 35, currentStudents: 0, status: 'active' },
        { batchId: 'IL-B01', courseId: 11, teacherId: 2, roomId: 4, startDate: '2026-08-01', endDate: '2026-10-31', startTime: '09:00', endTime: '11:00', days: ['Tuesday', 'Thursday', 'Saturday'], maxStudents: 20, currentStudents: 0, status: 'active' },
        { batchId: 'DM-B01', courseId: 5, teacherId: 4, roomId: 3, startDate: '2026-08-15', endDate: '2026-11-15', startTime: '16:00', endTime: '18:00', days: ['Tuesday', 'Thursday'], maxStudents: 25, currentStudents: 0, status: 'active' },
        { batchId: 'PY-B01', courseId: 7, teacherId: 1, roomId: 1, startDate: '2026-09-01', endDate: '2026-12-31', startTime: '10:00', endTime: '12:00', days: ['Tuesday', 'Thursday', 'Saturday'], maxStudents: 30, currentStudents: 0, status: 'active' }
    ];
    for (const batch of batchesData) {
        await dbAdd('batches', batch);
    }

    // ==================== STUDENTS ====================
    const studentsData = [
        { studentId: 'IMS-2026-0001', name: 'Ahmad Shah', fatherName: 'Bahadur Shah', cnic: '17301-6789012-1', dob: '2003-05-15', gender: 'Male', mobile: '+92 340 1234567', whatsapp: '+92 340 1234567', email: 'ahmad@gmail.com', address: 'Gulbahar Colony, Peshawar', city: 'Peshawar', district: 'Peshawar', province: 'Khyber Pakhtunkhwa', emergencyContact: '+92 300 1111111', previousEducation: 'Matric (SSC)', admissionDate: '2026-07-01', status: 'active' },
        { studentId: 'IMS-2026-0002', name: 'Sana Ullah', fatherName: 'Wali Muhammad', cnic: '17301-7890123-2', dob: '2004-08-20', gender: 'Male', mobile: '+92 341 2345678', whatsapp: '+92 341 2345678', email: 'sana.ullah@gmail.com', address: 'Warsak Road, Peshawar', city: 'Peshawar', district: 'Peshawar', province: 'Khyber Pakhtunkhwa', emergencyContact: '+92 300 2222222', previousEducation: 'FA (HSSC)', admissionDate: '2026-07-01', status: 'active' },
        { studentId: 'IMS-2026-0003', name: 'Amina Khan', fatherName: 'Gulzar Khan', cnic: '17301-8901234-3', dob: '2002-12-10', gender: 'Female', mobile: '+92 342 3456789', whatsapp: '+92 342 3456789', email: 'amina.k@gmail.com', address: 'Hayatabad Phase 3, Peshawar', city: 'Peshawar', district: 'Peshawar', province: 'Khyber Pakhtunkhwa', emergencyContact: '+92 300 3333333', previousEducation: 'BA', admissionDate: '2026-07-15', status: 'active' },
        { studentId: 'IMS-2026-0004', name: 'Bilal Ahmed', fatherName: 'Qasim Ahmed', cnic: '17301-9012345-4', dob: '2003-03-25', gender: 'Male', mobile: '+92 343 4567890', whatsapp: '+92 343 4567890', email: 'bilal.a@gmail.com', address: 'Kohat Road, Peshawar', city: 'Peshawar', district: 'Peshawar', province: 'Khyber Pakhtunkhwa', emergencyContact: '+92 300 4444444', previousEducation: 'Matric (SSC)', admissionDate: '2026-07-15', status: 'active' },
        { studentId: 'IMS-2026-0005', name: 'Zainab Bibi', fatherName: 'Saeed Khan', cnic: '17301-0123456-5', dob: '2004-07-30', gender: 'Female', mobile: '+92 344 5678901', whatsapp: '+92 344 5678901', email: 'zainab.b@gmail.com', address: 'Ring Road, Peshawar', city: 'Peshawar', district: 'Peshawar', province: 'Khyber Pakhtunkhwa', emergencyContact: '+92 300 5555555', previousEducation: 'FA (HSSC)', admissionDate: '2026-08-01', status: 'active' },
        { studentId: 'IMS-2026-0006', name: 'Hamza Ali', fatherName: 'Kamran Ali', cnic: '17301-1234560-6', dob: '2001-11-05', gender: 'Male', mobile: '+92 345 6789012', whatsapp: '+92 345 6789012', email: 'hamza.ali@gmail.com', address: 'University Town, Peshawar', city: 'Peshawar', district: 'Peshawar', province: 'Khyber Pakhtunkhwa', emergencyContact: '+92 300 6666666', previousEducation: 'BCS', admissionDate: '2026-08-01', status: 'active' },
        { studentId: 'IMS-2026-0007', name: 'Maryam Noor', fatherName: 'Aftab Khan', cnic: '17301-2345670-7', dob: '2003-09-18', gender: 'Female', mobile: '+92 346 7890123', whatsapp: '+92 346 7890123', email: 'maryam.n@gmail.com', address: 'Saddar, Peshawar', city: 'Peshawar', district: 'Peshawar', province: 'Khyber Pakhtunkhwa', emergencyContact: '+92 300 7777777', previousEducation: 'Matric (SSC)', admissionDate: '2026-08-15', status: 'active' },
        { studentId: 'IMS-2026-0008', name: 'Umar Farooq', fatherName: 'Farooq Shah', cnic: '17301-3456780-8', dob: '2002-06-22', gender: 'Male', mobile: '+92 347 8901234', whatsapp: '+92 347 8901234', email: 'umar.f@gmail.com', address: 'Board Bazaar, Peshawar', city: 'Peshawar', district: 'Peshawar', province: 'Khyber Pakhtunkhwa', emergencyContact: '+92 300 8888888', previousEducation: 'FA (HSSC)', admissionDate: '2026-08-15', status: 'active' },
        { studentId: 'IMS-2026-0009', name: 'Hira Gul', fatherName: 'Gul Badshah', cnic: '17301-4567890-9', dob: '2004-01-12', gender: 'Female', mobile: '+92 348 9012345', whatsapp: '+92 348 9012345', email: 'hira.gul@gmail.com', address: 'GT Road, Peshawar', city: 'Peshawar', district: 'Peshawar', province: 'Khyber Pakhtunkhwa', emergencyContact: '+92 300 9999999', previousEducation: 'Matric (SSC)', admissionDate: '2026-08-20', status: 'active' },
        { studentId: 'IMS-2026-0010', name: 'Waqas Khan', fatherName: 'Nasir Khan', cnic: '17301-5678900-0', dob: '2003-04-08', gender: 'Male', mobile: '+92 349 0123456', whatsapp: '+92 349 0123456', email: 'waqas.k@gmail.com', address: 'Charsadda Road, Peshawar', city: 'Peshawar', district: 'Peshawar', province: 'Khyber Pakhtunkhwa', emergencyContact: '+92 300 0000000', previousEducation: 'BSc', admissionDate: '2026-08-25', status: 'active' }
    ];

    // Create student accounts
    for (const student of studentsData) {
        const sid = await dbAdd('students', student);
        const sPwd = await hashPassword('student123');
        await dbAdd('users', {
            username: student.studentId.toLowerCase(),
            password: sPwd,
            name: student.name,
            email: student.email,
            role: 'student',
            status: 'active',
            phone: student.mobile,
            studentId: sid
        });
    }

    // ==================== ADMISSIONS ====================
    const admissionsData = [
        { admissionNo: 'ADM-2026-00001', studentId: 1, courseId: 4, batchId: 1, date: '2026-07-01', totalFee: 35000, discount: 0, registrationFee: 1000, admissionFee: 3000, paidAmount: 15000, remainingAmount: 24000, status: 'active' },
        { admissionNo: 'ADM-2026-00002', studentId: 2, courseId: 4, batchId: 1, date: '2026-07-01', totalFee: 35000, discount: 5000, registrationFee: 1000, admissionFee: 3000, paidAmount: 10000, remainingAmount: 24000, status: 'active' },
        { admissionNo: 'ADM-2026-00003', studentId: 3, courseId: 3, batchId: 2, date: '2026-07-15', totalFee: 25000, discount: 0, registrationFee: 1000, admissionFee: 2000, paidAmount: 25000, remainingAmount: 3000, status: 'active' },
        { admissionNo: 'ADM-2026-00004', studentId: 4, courseId: 9, batchId: 3, date: '2026-07-15', totalFee: 10000, discount: 0, registrationFee: 500, admissionFee: 1000, paidAmount: 11500, remainingAmount: 0, status: 'active' },
        { admissionNo: 'ADM-2026-00005', studentId: 5, courseId: 11, batchId: 4, date: '2026-08-01', totalFee: 25000, discount: 0, registrationFee: 1500, admissionFee: 2000, paidAmount: 10000, remainingAmount: 18500, status: 'active' },
        { admissionNo: 'ADM-2026-00006', studentId: 6, courseId: 4, batchId: 1, date: '2026-08-01', totalFee: 35000, discount: 3000, registrationFee: 1000, admissionFee: 3000, paidAmount: 20000, remainingAmount: 16000, status: 'active' },
        { admissionNo: 'ADM-2026-00007', studentId: 7, courseId: 5, batchId: 5, date: '2026-08-15', totalFee: 20000, discount: 0, registrationFee: 1000, admissionFee: 2000, paidAmount: 8000, remainingAmount: 15000, status: 'active' },
        { admissionNo: 'ADM-2026-00008', studentId: 8, courseId: 9, batchId: 3, date: '2026-08-15', totalFee: 10000, discount: 0, registrationFee: 500, admissionFee: 1000, paidAmount: 5000, remainingAmount: 6500, status: 'active' },
        { admissionNo: 'ADM-2026-00009', studentId: 9, courseId: 3, batchId: 2, date: '2026-08-20', totalFee: 25000, discount: 2000, registrationFee: 1000, admissionFee: 2000, paidAmount: 10000, remainingAmount: 16000, status: 'active' },
        { admissionNo: 'ADM-2026-00010', studentId: 10, courseId: 7, batchId: 6, date: '2026-08-25', totalFee: 30000, discount: 0, registrationFee: 1000, admissionFee: 2000, paidAmount: 12000, remainingAmount: 21000, status: 'active' }
    ];

    // Update batch student counts
    const batchCounts = {};
    for (const adm of admissionsData) {
        await dbAdd('admissions', adm);
        await dbAdd('enrollments', {
            studentId: adm.studentId,
            courseId: adm.courseId,
            batchId: adm.batchId,
            admissionId: adm.admissionNo,
            enrollmentDate: adm.date,
            status: 'active'
        });
        batchCounts[adm.batchId] = (batchCounts[adm.batchId] || 0) + 1;
    }

    // Update batch currentStudents
    for (const [batchId, count] of Object.entries(batchCounts)) {
        const batch = await dbGet('batches', parseInt(batchId));
        if (batch) {
            batch.currentStudents = count;
            await dbPut('batches', batch);
        }
    }

    // ==================== FEE PAYMENTS ====================
    const feePaymentsData = [
        { receiptNo: 'RCP-2026-00001', studentId: 1, admissionId: 1, courseId: 4, amount: 15000, feeType: 'Course Fee + Admission', paymentMethod: 'Cash', date: '2026-07-01', collectedBy: 'Ayesha Noor', remarks: 'Initial payment' },
        { receiptNo: 'RCP-2026-00002', studentId: 2, admissionId: 2, courseId: 4, amount: 10000, feeType: 'Course Fee + Admission', paymentMethod: 'JazzCash', date: '2026-07-01', collectedBy: 'Ayesha Noor', remarks: 'Initial payment with discount' },
        { receiptNo: 'RCP-2026-00003', studentId: 3, admissionId: 3, courseId: 3, amount: 25000, feeType: 'Full Course Fee', paymentMethod: 'Bank Transfer', date: '2026-07-15', collectedBy: 'Ayesha Noor', remarks: 'Full payment' },
        { receiptNo: 'RCP-2026-00004', studentId: 4, admissionId: 4, courseId: 9, amount: 11500, feeType: 'Full Course Fee', paymentMethod: 'Cash', date: '2026-07-15', collectedBy: 'Ayesha Noor', remarks: 'Full payment' },
        { receiptNo: 'RCP-2026-00005', studentId: 5, admissionId: 5, courseId: 11, amount: 10000, feeType: 'Installment 1', paymentMethod: 'Easypaisa', date: '2026-08-01', collectedBy: 'Ayesha Noor', remarks: 'First installment' },
        { receiptNo: 'RCP-2026-00006', studentId: 6, admissionId: 6, courseId: 4, amount: 20000, feeType: 'Course Fee + Admission', paymentMethod: 'Cash', date: '2026-08-01', collectedBy: 'Bilal Ahmad', remarks: 'Initial payment' },
        { receiptNo: 'RCP-2026-00007', studentId: 7, admissionId: 7, courseId: 5, amount: 8000, feeType: 'Installment 1', paymentMethod: 'Cash', date: '2026-08-15', collectedBy: 'Ayesha Noor', remarks: 'First installment' },
        { receiptNo: 'RCP-2026-00008', studentId: 8, admissionId: 8, courseId: 9, amount: 5000, feeType: 'Installment 1', paymentMethod: 'SadaPay', date: '2026-08-15', collectedBy: 'Bilal Ahmad', remarks: 'First installment' },
        { receiptNo: 'RCP-2026-00009', studentId: 9, admissionId: 9, courseId: 3, amount: 10000, feeType: 'Installment 1', paymentMethod: 'Cash', date: '2026-08-20', collectedBy: 'Ayesha Noor', remarks: 'First installment' },
        { receiptNo: 'RCP-2026-00010', studentId: 10, admissionId: 10, courseId: 7, amount: 12000, feeType: 'Installment 1', paymentMethod: 'NayaPay', date: '2026-08-25', collectedBy: 'Bilal Ahmad', remarks: 'First installment' }
    ];
    for (const payment of feePaymentsData) {
        await dbAdd('feePayments', payment);
    }

    // ==================== EXPENSES ====================
    const expensesData = [
        { category: 'Teacher Salaries', description: 'Muhammad Ali - July Salary', amount: 45000, date: '2026-07-30', paymentMethod: 'Bank Transfer', paidTo: 'Muhammad Ali', remarks: 'Monthly salary' },
        { category: 'Teacher Salaries', description: 'Fatima Zahra - July Salary', amount: 40000, date: '2026-07-30', paymentMethod: 'Bank Transfer', paidTo: 'Fatima Zahra', remarks: 'Monthly salary' },
        { category: 'Teacher Salaries', description: 'Ahmed Khan - July Salary', amount: 35000, date: '2026-07-30', paymentMethod: 'Bank Transfer', paidTo: 'Ahmed Khan', remarks: 'Monthly salary' },
        { category: 'Electricity', description: 'Electricity Bill - July', amount: 15000, date: '2026-07-25', paymentMethod: 'Cash', paidTo: 'PESCO', remarks: 'Monthly bill' },
        { category: 'Internet', description: 'Internet Bill - July', amount: 5000, date: '2026-07-28', paymentMethod: 'Cash', paidTo: 'PTCL', remarks: 'Monthly internet' },
        { category: 'Rent', description: 'Building Rent - August', amount: 50000, date: '2026-08-01', paymentMethod: 'Bank Transfer', paidTo: 'Property Owner', remarks: 'Monthly rent' },
        { category: 'Stationery', description: 'Printer ink, papers, markers', amount: 3000, date: '2026-08-05', paymentMethod: 'Cash', paidTo: 'Ali Stationery', remarks: 'Monthly stationery' },
        { category: 'Equipment', description: '2x Computer Mice, 1x Keyboard', amount: 5500, date: '2026-08-10', paymentMethod: 'Cash', paidTo: 'Tech Market', remarks: 'Replacement equipment' },
        { category: 'Marketing', description: 'Facebook Ads - August', amount: 10000, date: '2026-08-01', paymentMethod: 'JazzCash', paidTo: 'Facebook', remarks: 'Social media advertising' },
        { category: 'Maintenance', description: 'AC Repair - Lab 1', amount: 4000, date: '2026-08-12', paymentMethod: 'Cash', paidTo: 'Cool Repairs', remarks: 'Air conditioner servicing' }
    ];
    for (const expense of expensesData) {
        await dbAdd('expenses', expense);
    }

    // ==================== ATTENDANCE (Last 5 days for batch 1) ====================
    const attendanceStatuses = ['Present', 'Present', 'Present', 'Present', 'Absent', 'Late', 'Present', 'Present'];
    const attendanceDates = ['2026-08-25', '2026-08-27', '2026-08-29'];
    const batch1Students = [1, 2, 6]; // Students in batch 1

    for (const date of attendanceDates) {
        for (const studentId of batch1Students) {
            const statusIndex = Math.floor(Math.random() * attendanceStatuses.length);
            await dbAdd('attendance', {
                studentId,
                batchId: 1,
                courseId: 4,
                date,
                status: attendanceStatuses[statusIndex],
                markedBy: 'Muhammad Ali',
                markedAt: new Date().toISOString()
            });
        }
    }

    // Batch 3 attendance
    const batch3Students = [4, 8];
    for (const date of attendanceDates) {
        for (const studentId of batch3Students) {
            const statusIndex = Math.floor(Math.random() * attendanceStatuses.length);
            await dbAdd('attendance', {
                studentId,
                batchId: 3,
                courseId: 9,
                date,
                status: attendanceStatuses[statusIndex],
                markedBy: 'Fatima Zahra',
                markedAt: new Date().toISOString()
            });
        }
    }

    // ==================== EXAMS ====================
    const examsData = [
        { name: 'Web Development - Monthly Test 1', courseId: 4, batchId: 1, type: 'Monthly Test', totalMarks: 50, passingMarks: 25, date: '2026-08-15', status: 'completed' },
        { name: 'Spoken English - Quiz 1', courseId: 9, batchId: 3, type: 'Quiz', totalMarks: 20, passingMarks: 10, date: '2026-08-20', status: 'completed' },
        { name: 'Graphic Designing - Assignment 1', courseId: 3, batchId: 2, type: 'Assignment', totalMarks: 100, passingMarks: 50, date: '2026-08-25', status: 'pending' }
    ];
    for (const exam of examsData) {
        await dbAdd('exams', exam);
    }

    // ==================== EXAM RESULTS ====================
    const resultsData = [
        { examId: 1, studentId: 1, obtainedMarks: 42, remarks: '' },
        { examId: 1, studentId: 2, obtainedMarks: 38, remarks: '' },
        { examId: 1, studentId: 6, obtainedMarks: 45, remarks: '' },
        { examId: 2, studentId: 4, obtainedMarks: 18, remarks: '' },
        { examId: 2, studentId: 8, obtainedMarks: 14, remarks: '' }
    ];
    for (const result of resultsData) {
        await dbAdd('examResults', result);
    }

    // ==================== CERTIFICATES ====================
    const certificatesData = [
        { certificateId: 'CERT-IT-2026-00001', studentId: 4, courseId: 9, studentName: 'Bilal Ahmed', fatherName: 'Qasim Ahmed', courseName: 'Spoken English', duration: '3 Months', completionDate: '2026-10-31', issueDate: '2026-08-30', status: 'issued' }
    ];
    for (const cert of certificatesData) {
        await dbAdd('certificates', cert);
    }

    // ==================== ANNOUNCEMENTS ====================
    const announcementsData = [
        { title: 'New Batch Starting - Python Programming', message: 'We are pleased to announce that a new batch for Python Programming will start from September 1, 2026. Interested students please contact the reception for registration.', type: 'New Batch', date: '2026-08-25', status: 'active', postedBy: 'Admin' },
        { title: 'Independence Day Holiday', message: 'The institute will remain closed on August 14th, 2026 (Friday) on account of Pakistan Independence Day. Classes will resume on Monday.', type: 'Holiday', date: '2026-08-10', status: 'active', postedBy: 'Admin' },
        { title: 'Fee Deadline Reminder', message: 'All students are requested to clear their pending fees by August 31, 2026. Late fee charges will apply after the deadline.', type: 'Fee Deadline', date: '2026-08-20', status: 'active', postedBy: 'Admin' }
    ];
    for (const ann of announcementsData) {
        await dbAdd('announcements', ann);
    }

    // ==================== TIMETABLE ====================
    const timetableData = [
        { batchId: 1, courseId: 4, teacherId: 1, roomId: 1, day: 'Monday', startTime: '16:00', endTime: '18:00' },
        { batchId: 1, courseId: 4, teacherId: 1, roomId: 1, day: 'Wednesday', startTime: '16:00', endTime: '18:00' },
        { batchId: 1, courseId: 4, teacherId: 1, roomId: 1, day: 'Friday', startTime: '16:00', endTime: '18:00' },
        { batchId: 2, courseId: 3, teacherId: 3, roomId: 2, day: 'Monday', startTime: '10:00', endTime: '12:00' },
        { batchId: 2, courseId: 3, teacherId: 3, roomId: 2, day: 'Tuesday', startTime: '10:00', endTime: '12:00' },
        { batchId: 2, courseId: 3, teacherId: 3, roomId: 2, day: 'Thursday', startTime: '10:00', endTime: '12:00' },
        { batchId: 3, courseId: 9, teacherId: 2, roomId: 8, day: 'Monday', startTime: '14:00', endTime: '16:00' },
        { batchId: 3, courseId: 9, teacherId: 2, roomId: 8, day: 'Wednesday', startTime: '14:00', endTime: '16:00' },
        { batchId: 3, courseId: 9, teacherId: 2, roomId: 8, day: 'Friday', startTime: '14:00', endTime: '16:00' },
        { batchId: 4, courseId: 11, teacherId: 2, roomId: 4, day: 'Tuesday', startTime: '09:00', endTime: '11:00' },
        { batchId: 4, courseId: 11, teacherId: 2, roomId: 4, day: 'Thursday', startTime: '09:00', endTime: '11:00' },
        { batchId: 4, courseId: 11, teacherId: 2, roomId: 4, day: 'Saturday', startTime: '09:00', endTime: '11:00' },
        { batchId: 5, courseId: 5, teacherId: 4, roomId: 3, day: 'Tuesday', startTime: '16:00', endTime: '18:00' },
        { batchId: 5, courseId: 5, teacherId: 4, roomId: 3, day: 'Thursday', startTime: '16:00', endTime: '18:00' },
        { batchId: 6, courseId: 7, teacherId: 1, roomId: 1, day: 'Tuesday', startTime: '10:00', endTime: '12:00' },
        { batchId: 6, courseId: 7, teacherId: 1, roomId: 1, day: 'Thursday', startTime: '10:00', endTime: '12:00' },
        { batchId: 6, courseId: 7, teacherId: 1, roomId: 1, day: 'Saturday', startTime: '10:00', endTime: '12:00' }
    ];
    for (const tt of timetableData) {
        await dbAdd('timetable', tt);
    }

    await setSetting('demoDataSeeded', true);
    console.log('✅ Demo data seeded successfully!');
}
