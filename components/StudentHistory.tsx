import React, { useState, useMemo } from 'react';
import { ArrowRight, Calendar, User, BrainCircuit, FileText, Edit2, Save, X, Star, Medal, Clock, ShieldCheck } from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import { analyzeStudentReport } from '../services/geminiService';
import { saveAttendance } from '../services/storageService';

interface StudentHistoryProps {
  student: Student;
  allRecords: AttendanceRecord[];
  onBack: () => void;
  onUpdate: () => void;
}

const StudentHistory: React.FC<StudentHistoryProps> = ({ student, allRecords, onBack, onUpdate }) => {
  const [report, setReport] = useState<string>('');
  const [loadingReport, setLoadingReport] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>(AttendanceStatus.PRESENT);

  const studentRecords = useMemo(() => {
    return allRecords
      .filter(r => r.studentId === student.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allRecords, student.id]);

  const stats = useMemo(() => {
    return {
      present: studentRecords.filter(r => r.status === AttendanceStatus.PRESENT).length,
      absent: studentRecords.filter(r => r.status === AttendanceStatus.ABSENT).length,
      late: studentRecords.filter(r => r.status === AttendanceStatus.LATE).length,
      total: studentRecords.length
    };
  }, [studentRecords]);

  const attendanceRate = stats.total > 0 
    ? Math.round(((stats.present + (stats.late * 0.5)) / stats.total) * 100) 
    : 0;
  
  // Calculate Badges
  const badges = useMemo(() => {
    const list = [];
    if (attendanceRate === 100 && stats.total > 5) {
        list.push({ icon: <Medal size={16} />, label: 'مثالي', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' });
    }
    if (attendanceRate >= 90 && attendanceRate < 100) {
        list.push({ icon: <Star size={16} />, label: 'متميز', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' });
    }
    if (stats.late === 0 && stats.total > 5) {
        list.push({ icon: <Clock size={16} />, label: 'منضبط', color: 'bg-green-100 text-green-700 border-green-200' });
    }
    if (stats.total > 20 && attendanceRate > 85) {
         list.push({ icon: <ShieldCheck size={16} />, label: 'مواظب', color: 'bg-blue-100 text-blue-700 border-blue-200' });
    }
    return list;
  }, [attendanceRate, stats]);

  const handleGenerateReport = async () => {
    setLoadingReport(true);
    const result = await analyzeStudentReport(student, allRecords);
    setReport(result);
    setLoadingReport(false);
  };

  const handleEditClick = (record: AttendanceRecord) => {
    setEditingRecordId(record.id);
    setEditStatus(record.status);
  };

  const handleCancelEdit = () => {
    setEditingRecordId(null);
  };

  const handleSaveEdit = (record: AttendanceRecord) => {
    // Create new record with updated status
    const updatedRecord: AttendanceRecord = {
      ...record,
      status: editStatus
    };
    
    // Save (this updates existing because ID matches logic in saveAttendance isn't solely ID based but date+student, 
    // however our saveAttendance filters by student+date. So it works perfect.)
    saveAttendance([updatedRecord]);
    
    setEditingRecordId(null);
    onUpdate(); // Refresh parent data
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch(status) {
      case AttendanceStatus.PRESENT: return 'bg-green-100 text-green-700 border-green-200';
      case AttendanceStatus.ABSENT: return 'bg-red-100 text-red-700 border-red-200';
      case AttendanceStatus.LATE: return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: AttendanceStatus) => {
    switch(status) {
      case AttendanceStatus.PRESENT: return 'حاضر';
      case AttendanceStatus.ABSENT: return 'غائب';
      case AttendanceStatus.LATE: return 'متأخر';
      default: return '-';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-4"
      >
        <ArrowRight size={20} />
        <span>العودة للقائمة</span>
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  {student.name}
                  <div className="flex gap-1">
                      {badges.map((b, i) => (
                          <span key={i} title={b.label} className={`p-1 rounded-full text-[10px] ${b.color} border`}>
                              {b.icon}
                          </span>
                      ))}
                  </div>
              </h2>
              <p className="text-slate-500">{student.grade}</p>
            </div>
          </div>
          
          <div className="flex gap-4 text-center">
            <div className="px-6 py-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">نسبة الحضور</p>
              <p className={`text-2xl font-bold ${attendanceRate >= 90 ? 'text-green-600' : attendanceRate >= 75 ? 'text-amber-500' : 'text-red-600'}`}>
                {attendanceRate}%
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex justify-between items-center">
            <span className="text-green-700 font-medium">أيام الحضور</span>
            <span className="text-2xl font-bold text-green-700">{stats.present}</span>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex justify-between items-center">
            <span className="text-amber-700 font-medium">أيام التأخير</span>
            <span className="text-2xl font-bold text-amber-700">{stats.late}</span>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex justify-between items-center">
            <span className="text-red-700 font-medium">أيام الغياب</span>
            <span className="text-2xl font-bold text-red-700">{stats.absent}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Calendar size={20} className="text-slate-400" />
               سجل الحضور التفصيلي
             </h3>
             <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden max-h-[400px] overflow-y-auto">
               <table className="w-full text-right">
                 <thead className="bg-slate-100 text-slate-600 text-sm">
                   <tr>
                     <th className="p-3 font-medium">التاريخ</th>
                     <th className="p-3 font-medium">الحالة</th>
                     <th className="p-3 font-medium w-20"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200">
                   {studentRecords.length > 0 ? studentRecords.map(record => (
                     <tr key={record.id} className="bg-white hover:bg-slate-50">
                       <td className="p-3 text-slate-800 font-medium dir-ltr text-right">
                         {record.date}
                       </td>
                       <td className="p-3">
                         {editingRecordId === record.id ? (
                           <select 
                             value={editStatus} 
                             onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                             className="w-full p-1 border border-indigo-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                           >
                             <option value={AttendanceStatus.PRESENT}>حاضر</option>
                             <option value={AttendanceStatus.LATE}>متأخر</option>
                             <option value={AttendanceStatus.ABSENT}>غائب</option>
                           </select>
                         ) : (
                           <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(record.status)}`}>
                             {getStatusText(record.status)}
                           </span>
                         )}
                       </td>
                       <td className="p-3 text-left">
                         {editingRecordId === record.id ? (
                           <div className="flex items-center gap-1 justify-end">
                             <button onClick={() => handleSaveEdit(record)} className="p-1 text-green-600 hover:bg-green-100 rounded">
                               <Save size={16} />
                             </button>
                             <button onClick={handleCancelEdit} className="p-1 text-red-600 hover:bg-red-100 rounded">
                               <X size={16} />
                             </button>
                           </div>
                         ) : (
                           <button onClick={() => handleEditClick(record)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                             <Edit2 size={16} />
                           </button>
                         )}
                       </td>
                     </tr>
                   )) : (
                     <tr>
                       <td colSpan={3} className="p-4 text-center text-slate-400">لا يوجد سجلات حتى الآن</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>

          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
               <BrainCircuit size={20} className="text-indigo-500" />
               التقرير الذكي
             </h3>
             
             <div className="flex-1 bg-gradient-to-br from-white to-indigo-50 rounded-xl border border-indigo-100 p-6 flex flex-col">
               {loadingReport ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-indigo-500 min-h-[200px]">
                   <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
                   <p>جاري إنشاء التقرير...</p>
                 </div>
               ) : report ? (
                 <div className="flex-1 overflow-y-auto mb-4 prose prose-indigo max-w-none">
                   <div className="whitespace-pre-line text-slate-700 leading-relaxed text-sm">
                     {report}
                   </div>
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[200px] text-center p-4">
                   <FileText size={48} className="mb-4 opacity-20" />
                   <p>اضغط أدناه لتوليد تقرير أداء وسلوك للطالب باستخدام الذكاء الاصطناعي</p>
                 </div>
               )}
               
               <button 
                 onClick={handleGenerateReport}
                 disabled={loadingReport}
                 className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-md"
               >
                 {report ? 'تحديث التقرير' : 'إنشاء تقرير الطالب'}
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHistory;