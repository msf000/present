import React, { useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Filter, Printer, Calendar, FileDown } from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';

interface MonthlyReportProps {
  students: Student[];
  records: AttendanceRecord[];
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({ students, records }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const uniqueGrades = useMemo(() => {
    const grades = new Set(students.map(s => s.grade));
    return Array.from(grades).sort();
  }, [students]);

  // Generate days for the selected month
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentDate]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => 
      selectedGrade === 'all' || student.grade === selectedGrade
    );
  }, [students, selectedGrade]);

  const getRecordForDay = (studentId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return records.find(r => r.studentId === studentId && r.date === dateStr);
  };

  const getStatusSymbol = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT: return <span className="text-green-500 font-bold">✓</span>;
      case AttendanceStatus.ABSENT: return <span className="text-red-500 font-bold">✕</span>;
      case AttendanceStatus.LATE: return <span className="text-amber-500 font-bold text-xs">ت</span>;
      default: return null;
    }
  };
  
  const getStatusText = (status: AttendanceStatus | undefined) => {
    switch (status) {
      case AttendanceStatus.PRESENT: return 'حاضر';
      case AttendanceStatus.ABSENT: return 'غائب';
      case AttendanceStatus.LATE: return 'متأخر';
      default: return '-';
    }
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const calculateMonthlyStats = (studentId: string) => {
    let present = 0, absent = 0, late = 0;
    daysInMonth.forEach(day => {
      const record = getRecordForDay(studentId, day);
      if (record) {
        if (record.status === AttendanceStatus.PRESENT) present++;
        else if (record.status === AttendanceStatus.ABSENT) absent++;
        else if (record.status === AttendanceStatus.LATE) late++;
      }
    });
    return { present, absent, late };
  };

  const handleExportCSV = () => {
    // 1. Headers
    let csvContent = "اسم الطالب,الصف,";
    daysInMonth.forEach(day => {
      csvContent += `${day.getDate()}/${day.getMonth() + 1},`;
    });
    csvContent += "حضور,تأخير,غياب\n";

    // 2. Rows
    filteredStudents.forEach(student => {
      const stats = calculateMonthlyStats(student.id);
      let row = `${student.name},${student.grade},`;
      
      daysInMonth.forEach(day => {
        const record = getRecordForDay(student.id, day);
        row += `${getStatusText(record?.status)},`;
      });

      row += `${stats.present},${stats.late},${stats.absent}\n`;
      csvContent += row;
    });

    // 3. Download
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `تقرير_شهري_${getMonthName(currentDate)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronRight size={20} />
          </button>
          <div className="flex items-center gap-2 text-lg font-bold text-slate-800 min-w-[200px] justify-center">
            <Calendar size={20} className="text-indigo-600" />
            <span>{getMonthName(currentDate)}</span>
          </div>
          <button 
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-48">
             <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
              >
                <option value="all">كل الصفوف</option>
                {uniqueGrades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white text-green-700 border border-green-200 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors"
          >
            <FileDown size={18} />
            <span className="hidden md:inline">إكسل</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Printer size={18} />
            <span className="hidden md:inline">طباعة</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6 text-sm px-2 print:hidden">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <span className="text-slate-600">حاضر (✓)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="text-slate-600">متأخر (ت)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span className="text-slate-600">غائب (✕)</span>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-0 print:shadow-none">
        <div className="overflow-x-auto" ref={componentRef}>
          <div className="min-w-max p-4 print:p-0">
             <div className="hidden print:block text-center mb-4">
               <h1 className="text-xl font-bold">تقرير الحضور الشهري</h1>
               <p className="text-gray-500">{getMonthName(currentDate)} - {selectedGrade === 'all' ? 'جميع الصفوف' : selectedGrade}</p>
             </div>

             <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 print:bg-slate-100">
                  <th className="p-2 border-l border-slate-200 min-w-[200px] sticky right-0 bg-slate-50 z-10 text-slate-700 font-bold print:static">اسم الطالب</th>
                  {daysInMonth.map(day => (
                    <th key={day.toISOString()} className="p-1 border-l border-slate-100 text-center min-w-[32px] print:border-slate-300">
                      <div className="text-[10px] text-slate-400 print:text-slate-600">{day.toLocaleDateString('ar-EG', { weekday: 'narrow' })}</div>
                      <div className="text-sm font-medium text-slate-700">{day.getDate()}</div>
                    </th>
                  ))}
                  <th className="p-2 text-center text-xs font-bold text-green-600 min-w-[40px] bg-green-50 print:bg-transparent">ح</th>
                  <th className="p-2 text-center text-xs font-bold text-amber-600 min-w-[40px] bg-amber-50 print:bg-transparent">ت</th>
                  <th className="p-2 text-center text-xs font-bold text-red-600 min-w-[40px] bg-red-50 print:bg-transparent">غ</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, idx) => {
                    const stats = calculateMonthlyStats(student.id);
                    return (
                      <tr key={student.id} className={`border-b border-slate-100 hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} print:border-slate-300`}>
                        <td className="p-2 border-l border-slate-200 font-medium text-slate-800 sticky right-0 bg-inherit z-10 flex flex-col justify-center h-full print:static">
                          <span className="truncate">{student.name}</span>
                          <span className="text-[10px] text-slate-400">{student.grade}</span>
                        </td>
                        {daysInMonth.map(day => {
                          const record = getRecordForDay(student.id, day);
                          const isWeekend = day.getDay() === 5 || day.getDay() === 6; // Fri & Sat
                          return (
                            <td 
                              key={day.toISOString()} 
                              className={`p-1 border-l border-slate-100 text-center ${isWeekend ? 'bg-slate-100/50 print:bg-slate-100' : ''} print:border-slate-200`}
                            >
                              {record ? getStatusSymbol(record.status) : ''}
                            </td>
                          );
                        })}
                        <td className="p-2 text-center font-medium bg-green-50/50 print:bg-transparent">{stats.present}</td>
                        <td className="p-2 text-center font-medium bg-amber-50/50 print:bg-transparent">{stats.late}</td>
                        <td className="p-2 text-center font-bold text-red-600 bg-red-50/50 print:bg-transparent">{stats.absent}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={daysInMonth.length + 4} className="p-8 text-center text-slate-400">
                      لا يوجد طلاب للعرض
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;