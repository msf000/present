import { Student, AttendanceRecord, AttendanceStatus, AppSettings, User, School } from '../types';

const STORAGE_KEYS = {
  SCHOOLS: 'attendance_app_schools',
  STUDENTS: 'attendance_app_students',
  RECORDS: 'attendance_app_records',
  SETTINGS: 'attendance_app_settings',
  USERS: 'attendance_app_users',
  CURRENT_USER: 'attendance_app_current_user',
};

// Mock data generator
export const generateMockData = () => {
  // 1. Create Schools
  const schools: School[] = [
    { 
      id: 's1', 
      name: 'مدرسة المستقبل النموذجية', 
      isActive: true, 
      principalId: 'u2', 
      subscriptionEndDate: '2025-12-31',
      studentCount: 3
    },
    { 
      id: 's2', 
      name: 'مدرسة الرواد الأهلية', 
      isActive: false, // Inactive subscription
      principalId: 'u8', 
      subscriptionEndDate: '2023-01-01',
      studentCount: 2
    }
  ];

  // 2. Create Users
  const users: User[] = [
    // System Level
    { id: 'u0', username: 'sysadmin', name: 'مدير النظام (Super Admin)', role: 'general_manager' },
    
    // School 1 Users
    { id: 'u2', username: 'principal1', name: 'أ. خالد (مدير المستقبل)', role: 'principal', schoolId: 's1', managedSchoolIds: ['s1'] },
    { id: 'u4', username: 'teacher1', name: 'أ. محمد (معلم)', role: 'teacher', schoolId: 's1' },
    
    // School 2 Users
    { id: 'u8', username: 'principal2', name: 'أ. فهد (مدير الرواد)', role: 'principal', schoolId: 's2', managedSchoolIds: ['s2'] },

    // Parents/Students
    { id: 'u6', username: 'parent', name: 'ولي أمر أحمد', role: 'parent', schoolId: 's1', relatedStudentId: '1' },
  ];

  // 3. Create Students
  const students: Student[] = [
    // School 1 Students
    { id: '1', schoolId: 's1', name: 'أحمد محمد', grade: 'العاشر' },
    { id: '2', schoolId: 's1', name: 'سارة علي', grade: 'العاشر' },
    { id: '3', schoolId: 's1', name: 'خالد عمر', grade: 'الحادي عشر' },
    
    // School 2 Students
    { id: '4', schoolId: 's2', name: 'ليلى حسن', grade: 'الثاني عشر' },
    { id: '5', schoolId: 's2', name: 'عمر يوسف', grade: 'العاشر' },
  ];

  // 4. Create Records
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const day = date.getDay();
    if (day === 5 || day === 6) continue;

    students.forEach(student => {
      records.push({
        id: `${dateStr}-${student.id}`,
        studentId: student.id,
        schoolId: student.schoolId,
        date: dateStr,
        status: Math.random() > 0.8 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT,
        note: ''
      });
    });
  }

  localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(schools));
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ attendanceThreshold: 75 }));
};

// --- School Management (For System Admin) ---
export const getSchools = (): School[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SCHOOLS);
  return data ? JSON.parse(data) : [];
};

export const saveSchool = (school: School) => {
  const schools = getSchools();
  const index = schools.findIndex(s => s.id === school.id);
  if (index >= 0) {
    schools[index] = school;
  } else {
    schools.push(school);
  }
  localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(schools));
};

export const toggleSchoolSubscription = (schoolId: string) => {
  const schools = getSchools();
  const school = schools.find(s => s.id === schoolId);
  if (school) {
    school.isActive = !school.isActive;
    localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(schools));
  }
};

export const getSchoolById = (id: string): School | undefined => {
  return getSchools().find(s => s.id === id);
};

// --- Student Management (Filtered by School) ---

export const getStudents = (schoolId?: string): Student[] => {
  const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  let allStudents: Student[] = data ? JSON.parse(data) : [];
  
  if (schoolId) {
    return allStudents.filter(s => s.schoolId === schoolId);
  }
  return allStudents;
};

export const saveStudent = (student: Student) => {
  const allStudents = getStudents(); // Get all to save properly
  const index = allStudents.findIndex(s => s.id === student.id);
  
  let updatedStudents = [...allStudents];
  if (index >= 0) {
    updatedStudents[index] = student;
  } else {
    updatedStudents.push(student);
  }
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedStudents));
};

export const saveStudents = (newStudents: Student[]) => {
  const allStudents = getStudents();
  const updatedStudents = [...allStudents, ...newStudents];
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedStudents));
};

export const updateStudent = (updatedStudent: Student) => {
  // Same as saveStudent logic in this mock implementation
  saveStudent(updatedStudent);
};

export const deleteStudent = (id: string) => {
  const allStudents = getStudents();
  const filtered = allStudents.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(filtered));
};

// --- Attendance Management (Filtered by School) ---

export const getAttendanceRecords = (schoolId?: string): AttendanceRecord[] => {
  const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
  let allRecords: AttendanceRecord[] = data ? JSON.parse(data) : [];
  
  if (schoolId) {
    return allRecords.filter(r => r.schoolId === schoolId);
  }
  return allRecords;
};

export const saveAttendance = (newRecords: AttendanceRecord[]) => {
  const allRecords = getAttendanceRecords();
  // Filter out records that are being replaced (same student, same date)
  const filteredRecords = allRecords.filter(
    r => !newRecords.some(nr => nr.studentId === r.studentId && nr.date === r.date)
  );
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify([...filteredRecords, ...newRecords]));
};

export const getRecordsByDate = (date: string, schoolId?: string): AttendanceRecord[] => {
  const records = getAttendanceRecords(schoolId);
  return records.filter(r => r.date === date);
};

// --- Settings ---
export const getSettings = (): AppSettings => {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return data ? JSON.parse(data) : { attendanceThreshold: 75 };
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

// --- Backups (Global) ---
export const createBackup = () => {
  const data = {
    schools: getSchools(),
    students: getStudents(),
    records: getAttendanceRecords(),
    settings: getSettings(),
    users: getUsers(),
    backupDate: new Date().toISOString(),
    version: '2.0'
  };
  return JSON.stringify(data);
};

export const restoreBackup = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.schools) localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(data.schools));
    if (data.students) localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(data.students));
    if (data.records) localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(data.records));
    if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
    return true;
  } catch (e) {
    console.error('Failed to restore backup', e);
    return false;
  }
};

export const clearAllData = () => {
  localStorage.clear();
};

export const exportToCSV = (students: Student[], records: AttendanceRecord[]) => {
  // Create CSV content
  const csvRows = [];
  // Add Header
  csvRows.push(['الاسم', 'الصف', 'التاريخ', 'الحالة', 'ملاحظات'].join(','));

  records.forEach(record => {
    const student = students.find(s => s.id === record.studentId);
    if (student) {
      const statusText = 
        record.status === AttendanceStatus.PRESENT ? 'حاضر' :
        record.status === AttendanceStatus.ABSENT ? 'غائب' :
        record.status === AttendanceStatus.LATE ? 'متأخر' : 'بعذر';
        
      csvRows.push([
        `"${student.name}"`,
        `"${student.grade}"`,
        record.date,
        statusText,
        `"${record.note || ''}"`
      ].join(','));
    }
  });

  const csvContent = '\uFEFF' + csvRows.join('\n'); // Add BOM for Excel support
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `attendance_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- User Auth ---
export const getUsers = (): User[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

export const loginUser = (username: string): { user: User | null, error?: string } => {
  const users = getUsers();
  let user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  
  // First run check
  if (!user && users.length === 0) {
    generateMockData();
    const newUsers = getUsers();
    user = newUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  if (user) {
    // Check school subscription status for non-system admins
    if (user.role !== 'general_manager' && user.schoolId) {
      const school = getSchoolById(user.schoolId);
      if (school && !school.isActive) {
        return { user: null, error: 'عذراً، اشتراك هذه المدرسة غير مفعل. يرجى مراجعة إدارة النظام.' };
      }
    }

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return { user };
  }
  return { user: null, error: 'اسم المستخدم غير صحيح' };
};

export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
};