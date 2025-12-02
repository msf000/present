import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, CheckCircle, XCircle, Clock, BrainCircuit, FileDown, AlertTriangle, Star, PieChart as PieChartIcon } from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus, DailyStat, AppSettings } from '../types';
import { analyzeAttendance } from '../services/geminiService';
import { exportToCSV } from '../services/storageService';

interface DashboardProps {
  students: Student[];
  records: AttendanceRecord[];
  settings: AppSettings;
}

const COLORS = ['#22c55e', '#ef4444', '#f59e0b']; // Green, Red, Amber

const Dashboard: React.FC<DashboardProps> = ({ students, records, settings }) => {
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    // Calculate last 7 days stats
    const last7Days: DailyStat[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayRecords = records.filter(r => r.date === dateStr);
      last7Days.push({
        date: dateStr,
        present: dayRecords.filter(r => r.status === AttendanceStatus.PRESENT).length,
        absent: dayRecords.filter(r => r.status === AttendanceStatus.ABSENT).length,
        late: dayRecords.filter(r => r.status === AttendanceStatus.LATE).length,
      });
    }
    setStats(last7Days);
  }, [records]);

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const result = await analyzeAttendance(students, records);
    setAiAnalysis(result);
    setLoadingAi(false);
  };
  
  const handleExport = () => {
    exportToCSV(students, records);
  };

  const today = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.date === today);
  const presentCount = todayRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
  const absentCount = todayRecords.filter(r => r.status === AttendanceStatus.ABSENT).length;
  const lateCount = todayRecords.filter(r => r.status === AttendanceStatus.LATE).length;

  const pieData = [
    { name: 'حاضر', value: presentCount },
    { name: 'غائب', value: absentCount },
    { name: 'متأخر', value: lateCount },
  ];

  // Only show pie if there is data
  const hasTodayData = presentCount + absentCount + lateCount > 0;

  const { riskStudents, topStudents } = useMemo(() => {
    const risk: { student: Student, rate: number }[] = [];
    const top: { student: Student, rate: number }[] = [];

    students.forEach(student => {
        const studentRecords = records.filter(r => r.studentId === student.id);
        if (studentRecords.length === 0) return;

        const present = studentRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
        const late = studentRecords.filter(r => r.status === AttendanceStatus.LATE).length;
        const total = studentRecords.length;
        
        // Simple calculation: Late counts as 0.5 present
        const rate = Math.round(((present + (late * 0.5)) / total) * 100);

        if (rate < settings.attendanceThreshold) {
            risk.push({ student, rate });
        } else if (rate >= 95 && total >= 5) { // Need at least 5 records to be a "top" student
            top.push({ student, rate });
        }
    });

    return { 
        riskStudents: risk.sort((a, b) => a.rate - b.rate).slice(0, 5), // Bottom 5
        topStudents: top.sort((a, b) => b.rate - a.rate).slice(0, 5) // Top 5
    };
  }, [students, records, settings.attendanceThreshold]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-white text-slate-700 hover:text-indigo-600 border border-slate-300 hover:border-indigo-300 px-4 py-2 rounded-lg transition-all shadow-sm"
        >
          <FileDown size={18} />
          <span>تصدير تقرير شامل (CSV)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">إجمالي الطلاب</p>
            <p className="text-2xl font-bold text-slate-800">{students.length}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-full text-blue-600">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">حضور اليوم</p>
            <p className="text-2xl font-bold text-green-600">{presentCount}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-full text-green-600">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">غياب اليوم</p>
            <p className="text-2xl font-bold text-red-600">{absentCount}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-full text-red-600">
            <XCircle size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">تأخير اليوم</p>
            <p className="text-2xl font-bold text-amber-600">{lateCount}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-full text-amber-600">
            <Clock size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Bar Chart */}
                 <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">إحصائيات الأسبوع</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tickFormatter={(val) => val.slice(5)} />
                            <YAxis />
                            <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ fontWeight: 'bold', color: '#334155' }}
                            />
                            <Legend />
                            <Bar name="حضور" dataKey="present" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            <Bar name="تأخير" dataKey="late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            <Bar name="غياب" dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </div>

                 {/* Pie Chart */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <PieChartIcon size={18} className="text-slate-500"/>
                        توزيع اليوم
                    </h3>
                    <div className="flex-1 min-h-[200px] relative">
                        {hasTodayData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-sm text-center p-4">
                                <Clock size={32} className="mb-2 opacity-20" />
                                <p>لم يتم تسجيل حضور اليوم بعد</p>
                            </div>
                        )}
                        {hasTodayData && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-2xl font-bold text-slate-700">{presentCount + absentCount + lateCount}</span>
                            </div>
                        )}
                    </div>
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Risk Widget */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-red-500" size={20} />
                        تنبيهات انخفاض الحضور
                    </h4>
                    <div className="space-y-3">
                        {riskStudents.length > 0 ? (
                            riskStudents.map(({ student, rate }) => (
                                <div key={student.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                                    <div>
                                        <p className="font-medium text-slate-800 text-sm">{student.name}</p>
                                        <p className="text-xs text-slate-500">{student.grade}</p>
                                    </div>
                                    <span className="font-bold text-red-600 bg-white px-2 py-1 rounded shadow-sm text-sm">
                                        {rate}%
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                لا يوجد طلاب أقل من نسبة {settings.attendanceThreshold}%
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Performers Widget */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Star className="text-amber-500" size={20} />
                        نجوم الحضور
                    </h4>
                    <div className="space-y-3">
                        {topStudents.length > 0 ? (
                            topStudents.map(({ student, rate }) => (
                                <div key={student.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                                    <div>
                                        <p className="font-medium text-slate-800 text-sm">{student.name}</p>
                                        <p className="text-xs text-slate-500">{student.grade}</p>
                                    </div>
                                    <span className="font-bold text-amber-600 bg-white px-2 py-1 rounded shadow-sm text-sm">
                                        {rate}%
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                لا يوجد بيانات كافية لعرض النجوم
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* AI Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl shadow-sm border border-indigo-100 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <BrainCircuit className="text-indigo-600" />
            <h3 className="text-lg font-bold text-indigo-900">المحلل الذكي</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto mb-4 text-sm text-slate-700 leading-relaxed bg-white/50 p-4 rounded-lg border border-indigo-50 min-h-[200px]">
            {loadingAi ? (
              <div className="flex items-center justify-center h-full gap-2 text-indigo-500">
                <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                جاري التحليل...
              </div>
            ) : aiAnalysis ? (
              <div className="whitespace-pre-line">{aiAnalysis}</div>
            ) : (
              <p className="text-slate-400 text-center mt-8">اضغط على الزر لتحليل بيانات الحضور وكشف الأنماط.</p>
            )}
          </div>

          <button
            onClick={handleAiAnalysis}
            disabled={loadingAi}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 mt-auto"
          >
            <BrainCircuit size={18} />
            تحليل البيانات الآن
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;