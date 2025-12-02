
export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

export interface Student {
  id: string;
  name: string;
  grade: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note?: string;
}

export interface DailyStat {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export interface AppSettings {
  schoolName: string;
  attendanceThreshold: number;
}