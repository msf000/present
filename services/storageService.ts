import { Student, AttendanceRecord, AttendanceStatus, AppSettings } from '../types';

const STORAGE_KEYS = {
  STUDENTS: 'attendance_app_students',
  RECORDS: 'attendance_app_records',
  SETTINGS: 'attendance_app_settings',
};

// Mock data generator
export const generateMockData = () => {
  const students: Student[] = [
    { id: '1', name: 'أحمد محمد', grade: 'العاشر' },
    { id: '2', name: 'سارة علي', grade: 'العاشر' },
    { id: '3', name: 'خالد عمر', grade: 'الحادي عشر' },
    { id: '4', name: 'ليلى حسن', grade: 'الثاني عشر' },
    { id: '5', name: 'عمر يوسف', grade: 'العاشر' },
  ];

  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  // Generate records for the last 14 days
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Skip weekends (Friday/Saturday approximation)
    const day = date.getDay();
    if (day === 5 || day === 6) continue;

    students.forEach(student => {
      const rand = Math.random();
      let status = AttendanceStatus.PRESENT;
      // Make some students have bad attendance for testing
      if (student.id === '3' && rand > 0.4) status = AttendanceStatus.ABSENT;
      else if (rand > 0.85) status = AttendanceStatus.ABSENT;
      else if (rand > 0.75) status = AttendanceStatus.LATE;

      records.push({
        id: `${dateStr}-${student.id}`,
        studentId: student.id,
        date: dateStr,
        status,
      });
    });
  }

  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  window.location.reload();
};

export const getStudents = (): Student[] => {
  const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  return data ? JSON.parse(data) : [];
};

export const saveStudent = (student: Student) => {
  const students = getStudents();
  students.push(student);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
};

export const saveStudents = (newStudents: Student[]) => {
  const students = getStudents();
  const allStudents = [...students, ...newStudents];
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(allStudents));
};

export const updateStudent = (updatedStudent: Student) => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === updatedStudent.id);
  if (index !== -1) {
    students[index] = updatedStudent;
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }
};

export const deleteStudent = (id: string) => {
  const students = getStudents().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
};

export const getAttendanceRecords = (): AttendanceRecord[] => {
  const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
  return data ? JSON.parse(data) : [];
};

export const saveAttendance = (newRecords: AttendanceRecord[]) => {
  const records = getAttendanceRecords();
  // Remove existing records for the same student on the same day to avoid duplicates
  const filteredRecords = records.filter(
    r => !newRecords.some(nr => nr.studentId === r.studentId && nr.date === r.date)
  );
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify([...filteredRecords, ...newRecords]));
};

export const getRecordsByDate = (date: string): AttendanceRecord[] => {
  return getAttendanceRecords().filter(r => r.date === date);
};

export const exportToCSV = (students: Student[], records: AttendanceRecord[]) => {
  // Create CSV header
  const headers = ['اسم الطالب', 'الصف', 'التاريخ', 'الحالة'];
  
  // Create CSV rows
  const rows = records.map(record => {
    const student = students.find(s => s.id === record.studentId);
    let statusAr = '';
    switch(record.status) {
      case AttendanceStatus.PRESENT: statusAr = 'حاضر'; break;
      case AttendanceStatus.ABSENT: statusAr = 'غائب'; break;
      case AttendanceStatus.LATE: statusAr = 'متأخر'; break;
    }
    
    return [
      student ? student.name : 'طالب محذوف',
      student ? student.grade : '-',
      record.date,
      statusAr
    ].join(',');
  });

  // Add BOM for Excel Arabic support
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `تقرير_الحضور_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Settings & Backup
export const getSettings = (): AppSettings => {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return data ? JSON.parse(data) : { schoolName: 'مدرستي', attendanceThreshold: 75 };
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

export const createBackup = () => {
  const data = {
    students: getStudents(),
    records: getAttendanceRecords(),
    settings: getSettings(),
    backupDate: new Date().toISOString(),
    version: '1.0'
  };
  return JSON.stringify(data);
};

export const restoreBackup = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.students) localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(data.students));
    if (data.records) localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(data.records));
    if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    return true;
  } catch (e) {
    console.error('Failed to restore backup', e);
    return false;
  }
};

export const clearAllData = () => {
  localStorage.removeItem(STORAGE_KEYS.STUDENTS);
  localStorage.removeItem(STORAGE_KEYS.RECORDS);
  // Optional: keep settings or clear them too
  // localStorage.removeItem(STORAGE_KEYS.SETTINGS);
};