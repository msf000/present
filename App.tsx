import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, ClipboardCheck, GraduationCap, Database, Settings as SettingsIcon, Menu, X, FileBarChart } from 'lucide-react';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import AttendanceSheet from './components/AttendanceSheet';
import StudentHistory from './components/StudentHistory';
import MonthlyReport from './components/MonthlyReport';
import Settings from './components/Settings';
import { getStudents, getAttendanceRecords, generateMockData, getSettings } from './services/storageService';
import { Student, AttendanceRecord, AppSettings } from './types';

type View = 'dashboard' | 'students' | 'attendance' | 'reports' | 'student-detail' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ schoolName: 'مدرستي', attendanceThreshold: 75 });
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadData = () => {
    setStudents(getStudents());
    setRecords(getAttendanceRecords());
    setSettings(getSettings());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setCurrentView('student-detail');
    setIsSidebarOpen(false);
  };

  const handleBackToStudents = () => {
    setSelectedStudent(null);
    setCurrentView('students');
  };

  const handleNavClick = (view: View) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-tajawal">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-20 shadow-md print:hidden">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-500 p-1.5 rounded-lg">
            <GraduationCap size={20} className="text-white" />
          </div>
          <h1 className="font-bold">{settings.schoolName}</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden print:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-40 w-64 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen print:hidden
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-700 flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <GraduationCap size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold truncate">{settings.schoolName}</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => handleNavClick('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'dashboard' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard size={20} />
            <span>لوحة التحكم</span>
          </button>
          
          <button
            onClick={() => handleNavClick('attendance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'attendance' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ClipboardCheck size={20} />
            <span>تسجيل الحضور</span>
          </button>

          <button
            onClick={() => handleNavClick('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'reports' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileBarChart size={20} />
            <span>التقارير الشهرية</span>
          </button>

          <button
            onClick={() => handleNavClick('students')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              (currentView === 'students' || currentView === 'student-detail')
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users size={20} />
            <span>الطلاب</span>
          </button>

          <div className="pt-4 mt-4 border-t border-slate-700">
             <button
              onClick={() => handleNavClick('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'settings' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <SettingsIcon size={20} />
              <span>الإعدادات والبيانات</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-700">
           <button 
             onClick={() => { generateMockData(); setIsSidebarOpen(false); window.location.reload(); }}
             className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-300 py-2 border border-slate-700 rounded hover:bg-slate-800 transition-colors"
           >
             <Database size={14} />
             توليد بيانات تجريبية
           </button>
           <p className="text-center text-xs text-slate-600 mt-2">© 2024 نظام الحضور</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-64px)] md:h-screen w-full print:p-0 print:h-auto print:overflow-visible">
        <header className="mb-8 hidden md:flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
          <h2 className="text-2xl font-bold text-slate-800">
            {currentView === 'dashboard' && 'نظرة عامة'}
            {currentView === 'students' && 'إدارة الطلاب'}
            {currentView === 'student-detail' && 'ملف الطالب'}
            {currentView === 'attendance' && 'سجل الحضور اليومي'}
            {currentView === 'reports' && 'تقارير الحضور الشهرية'}
            {currentView === 'settings' && 'الإعدادات'}
          </h2>
          <div className="flex items-center gap-4">
             <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 text-sm text-slate-600">
               {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </div>
          </div>
        </header>

        {currentView === 'dashboard' && (
          <Dashboard 
            students={students} 
            records={records} 
            settings={settings} 
            onNavigate={handleNavClick}
          />
        )}
        
        {currentView === 'students' && (
          <StudentList 
            students={students} 
            records={records}
            attendanceThreshold={settings.attendanceThreshold}
            onUpdate={loadData} 
            onSelectStudent={handleSelectStudent} 
          />
        )}
        
        {currentView === 'student-detail' && selectedStudent && (
          <StudentHistory 
            student={selectedStudent} 
            allRecords={records} 
            onBack={handleBackToStudents}
            onUpdate={loadData}
          />
        )}
        
        {currentView === 'attendance' && <AttendanceSheet students={students} onUpdate={loadData} />}
        
        {currentView === 'reports' && <MonthlyReport students={students} records={records} />}

        {currentView === 'settings' && <Settings settings={settings} onUpdate={loadData} />}
      </main>
    </div>
  );
}

export default App;