import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, ClipboardCheck, GraduationCap, Database, Settings as SettingsIcon, Menu, X, FileBarChart, LogOut, UserCircle } from 'lucide-react';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import AttendanceSheet from './components/AttendanceSheet';
import StudentHistory from './components/StudentHistory';
import MonthlyReport from './components/MonthlyReport';
import Settings from './components/Settings';
import Login from './components/Login';
import SystemAdminDashboard from './components/SystemAdminDashboard';
import { getStudents, getAttendanceRecords, generateMockData, getSettings, getCurrentUser, logoutUser, getSchoolById } from './services/storageService';
import { Student, AttendanceRecord, AppSettings, User } from './types';

type View = 'dashboard' | 'students' | 'attendance' | 'reports' | 'student-detail' | 'settings';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ attendanceThreshold: 75 });
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentSchoolName, setCurrentSchoolName] = useState<string>('مدرستي');

  useEffect(() => {
    // Check for logged in user
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const loadData = () => {
    // Load data specific to the user's school context
    // If System Admin (general_manager), they might see nothing here or we could handle it differently, 
    // but the SystemAdminDashboard component handles its own data loading.
    
    // For Principals/Teachers:
    if (currentUser && currentUser.role !== 'general_manager') {
       const schoolId = currentUser.schoolId;
       
       if (schoolId) {
         setStudents(getStudents(schoolId));
         setRecords(getAttendanceRecords(schoolId));
         
         const school = getSchoolById(schoolId);
         setCurrentSchoolName(school ? school.name : 'مدرستي');
       }
    }
    
    setSettings(getSettings());
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
      
      // Role-based initial view
      if (currentUser.role === 'parent' || currentUser.role === 'student') {
        const student = getStudents(currentUser.schoolId).find(s => s.id === currentUser.relatedStudentId);
        if (student) {
          setSelectedStudent(student);
          setCurrentView('student-detail');
        } else {
          setCurrentView('dashboard');
        }
      } else {
        setCurrentView('dashboard');
      }
    }
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setCurrentView('dashboard');
    setSelectedStudent(null);
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setCurrentView('student-detail');
    setIsSidebarOpen(false);
  };

  const handleBackToStudents = () => {
    if (currentUser?.role === 'parent' || currentUser?.role === 'student') {
      return; 
    }
    setSelectedStudent(null);
    setCurrentView('students');
  };

  const handleNavClick = (view: View) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  // Permission Logic
  const canViewDashboard = ['admin', 'principal', 'vice_principal', 'teacher', 'staff'].includes(currentUser?.role || '');
  const canTakeAttendance = ['admin', 'principal', 'vice_principal', 'teacher'].includes(currentUser?.role || '');
  const canViewReports = ['admin', 'principal', 'vice_principal', 'staff'].includes(currentUser?.role || '');
  const canManageStudents = ['admin', 'principal', 'vice_principal', 'staff', 'teacher'].includes(currentUser?.role || '');
  const canManageSettings = ['admin', 'principal'].includes(currentUser?.role || '');

  // 1. Render Login if not authenticated
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // 2. Render System Admin Dashboard if role is 'general_manager'
  if (currentUser.role === 'general_manager') {
    return <SystemAdminDashboard onLogout={handleLogout} />;
  }

  // 3. Render Standard School Dashboard for Principals/Teachers/etc.
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-tajawal">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-20 shadow-md print:hidden">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-500 p-1.5 rounded-lg">
            <GraduationCap size={20} className="text-white" />
          </div>
          <h1 className="font-bold truncate max-w-[150px]">{currentSchoolName}</h1>
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
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold truncate">{currentSchoolName}</h1>
            <div className="flex flex-col">
              <p className="text-xs text-slate-400 truncate font-bold">{currentUser.name}</p>
              <p className="text-[10px] text-indigo-400 truncate uppercase tracking-wider">{currentUser.role === 'principal' ? 'مدير المدرسة' : currentUser.role}</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Dashboard Link */}
          {canViewDashboard && (
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
          )}
          
          {/* Attendance Link */}
          {canTakeAttendance && (
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
          )}

          {/* Reports Link */}
          {canViewReports && (
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
          )}

          {/* Students Link */}
          {canManageStudents && (
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
          )}

           {/* Parent/Student Specific Link */}
           {(currentUser.role === 'parent' || currentUser.role === 'student') && (
            <button
              onClick={() => setCurrentView('student-detail')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'student-detail'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <UserCircle size={20} />
              <span>{currentUser.role === 'student' ? 'سجلي الشخصي' : 'سجل ابني'}</span>
            </button>
          )}

          {/* Settings Link */}
          {canManageSettings && (
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
          )}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-2">
           {canManageSettings && (
             <button 
               onClick={() => { generateMockData(); window.location.reload(); }}
               className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-300 py-2 border border-slate-700 rounded hover:bg-slate-800 transition-colors"
             >
               <Database size={14} />
               إعادة تعيين البيانات
             </button>
           )}
           
           <button 
             onClick={handleLogout}
             className="w-full flex items-center justify-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 py-2 border border-slate-700 rounded hover:bg-slate-800 transition-colors"
           >
             <LogOut size={16} />
             تسجيل الخروج
           </button>
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
             <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200">
                <UserCircle size={16} className="text-indigo-600" />
                <span className="font-medium">{currentUser.name}</span>
             </div>
             <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 text-sm text-slate-600">
               {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </div>
          </div>
        </header>

        {currentView === 'dashboard' && canViewDashboard && (
          <Dashboard 
            students={students} 
            records={records} 
            settings={{...settings, schoolName: currentSchoolName}} // Override school name from settings with actual school object name
            onNavigate={handleNavClick}
          />
        )}
        
        {currentView === 'students' && canManageStudents && (
          <StudentList 
            students={students} 
            records={records}
            attendanceThreshold={settings.attendanceThreshold}
            currentSchoolId={currentUser?.schoolId}
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
        
        {currentView === 'attendance' && canTakeAttendance && <AttendanceSheet students={students} onUpdate={loadData} />}
        
        {currentView === 'reports' && canViewReports && <MonthlyReport students={students} records={records} />}

        {currentView === 'settings' && canManageSettings && <Settings settings={{...settings, schoolName: currentSchoolName}} onUpdate={loadData} />}
      </main>
    </div>
  );
}

export default App;