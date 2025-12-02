import React, { useState, useMemo } from 'react';
import { Plus, Trash2, User, Search, Eye, Edit2, AlertTriangle, CheckCircle2, Upload, Filter, X, ArrowDownWideNarrow } from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import { saveStudent, saveStudents, deleteStudent, updateStudent } from '../services/storageService';

interface StudentListProps {
  students: Student[];
  records: AttendanceRecord[];
  attendanceThreshold: number;
  currentSchoolId?: string;
  onUpdate: () => void;
  onSelectStudent: (student: Student) => void;
}

const StudentList: React.FC<StudentListProps> = ({ 
  students, 
  records, 
  attendanceThreshold, 
  currentSchoolId,
  onUpdate, 
  onSelectStudent 
}) => {
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, risk, excellent, warning
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  const uniqueGrades = useMemo(() => {
    const grades = new Set(students.map(s => s.grade));
    return Array.from(grades).sort();
  }, [students]);

  const handleOpenAddModal = () => {
    setEditingStudentId(null);
    setNewStudentName('');
    setNewStudentGrade('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStudentId(student.id);
    setNewStudentName(student.name);
    setNewStudentGrade(student.grade);
    setIsModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentGrade.trim()) return;

    if (editingStudentId) {
      const originalStudent = students.find(s => s.id === editingStudentId);
      if (originalStudent) {
        updateStudent({
          id: editingStudentId,
          name: newStudentName,
          grade: newStudentGrade,
          schoolId: originalStudent.schoolId,
        });
      }
    } else {
      if (currentSchoolId) {
        const newStudent: Student = {
          id: crypto.randomUUID(),
          name: newStudentName,
          grade: newStudentGrade,
          schoolId: currentSchoolId,
        };
        saveStudent(newStudent);
      } else {
        alert("خطأ: لم يتم تحديد المدرسة");
        return;
      }
    }

    setNewStudentName('');
    setNewStudentGrade('');
    setEditingStudentId(null);
    setIsModalOpen(false);
    onUpdate();
  };

  const handleBulkImport = () => {
    if (!importText.trim()) return;
    if (!currentSchoolId) {
       alert("خطأ: لم يتم تحديد المدرسة");
       return;
    }

    const lines = importText.split('\n');
    const newStudents: Student[] = [];

    lines.forEach(line => {
      // Support comma or hyphen separated
      const parts = line.split(/[,-]/);
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const grade = parts[1].trim();
        if (name && grade) {
          newStudents.push({
            id: crypto.randomUUID(),
            name,
            grade,
            schoolId: currentSchoolId
          });
        }
      }
    });

    if (newStudents.length > 0) {
      saveStudents(newStudents);
      onUpdate();
      setImportText('');
      setIsImportModalOpen(false);
      alert(`تم إضافة ${newStudents.length} طالب بنجاح.`);
    } else {
      alert('لم يتم العثور على بيانات صالحة. تأكد من التنسيق: الاسم - الصف');
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      deleteStudent(id);
      onUpdate();
    }
  };

  const getAttendanceStats = (studentId: string) => {
    const studentRecords = records.filter(r => r.studentId === studentId);
    if (studentRecords.length === 0) return { rate: 100, label: 'جديد' };
    
    const present = studentRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const late = studentRecords.filter(r => r.status === AttendanceStatus.LATE).length;
    const excused = studentRecords.filter(r => r.status === AttendanceStatus.EXCUSED).length;
    const total = studentRecords.length;

    // Rate calculation consistent with dashboard: Excused is not a penalty.
    const rate = Math.round(((present + excused + (late * 0.5)) / total) * 100);
    return { rate, label: `${rate}%` };
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // 1. Text Search
      const matchesSearch = student.name.includes(searchTerm) || student.grade.includes(searchTerm);
      if (!matchesSearch) return false;

      // 2. Grade Filter
      const matchesGrade = selectedGrade === 'all' || student.grade === selectedGrade;
      if (!matchesGrade) return false;

      // 3. Status Filter (Risk/Excellent)
      if (statusFilter !== 'all') {
        const stats = getAttendanceStats(student.id);
        if (statusFilter === 'risk') {
           return stats.rate < attendanceThreshold;
        } else if (statusFilter === 'excellent') {
           return stats.rate >= 95;
        }
      }

      return true;
    });
  }, [students, searchTerm, selectedGrade, statusFilter, attendanceThreshold, records]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">قائمة الطلاب</h2>
        
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
          {/* Status Filter */}
          <div className="relative">
            <ArrowDownWideNarrow className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-40 pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white cursor-pointer"
            >
              <option value="all">كل الحالات</option>
              <option value="risk">⚠️ معرض للخطر</option>
              <option value="excellent">⭐ متميز</option>
            </select>
          </div>

          {/* Grade Filter */}
          <div className="relative">
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full md:w-48 pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white cursor-pointer"
            >
              <option value="all">كل الصفوف</option>
              {uniqueGrades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث بالاسم..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              <Upload size={20} />
              <span className="hidden md:inline">استيراد</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus size={20} />
              <span className="hidden md:inline">إضافة طالب</span>
              <span className="md:hidden">إضافة</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {students.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
            <User size={48} className="mb-4 opacity-20" />
            <p className="mb-4">لا يوجد طلاب مضافين حتى الآن.</p>
            <button
              onClick={handleOpenAddModal}
              className="text-indigo-600 font-medium hover:underline"
            >
              إضافة طالب جديد
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            لا يوجد نتائج تطابق بحثك أو الفلتر المختار.
          </div>
        ) : (
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-slate-600 font-medium">الاسم</th>
                <th className="p-4 text-slate-600 font-medium">الصف/المرحلة</th>
                <th className="p-4 text-slate-600 font-medium">نسبة الحضور</th>
                <th className="p-4 text-slate-600 font-medium w-40">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => {
                const stats = getAttendanceStats(student.id);
                const isLowAttendance = stats.rate < attendanceThreshold;
                
                return (
                  <tr 
                    key={student.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => onSelectStudent(student)}
                  >
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors flex items-center justify-center text-slate-500">
                        <User size={20} />
                      </div>
                      <span className="font-medium text-slate-800 group-hover:text-indigo-700 transition-colors">{student.name}</span>
                    </td>
                    <td className="p-4 text-slate-600">{student.grade}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {isLowAttendance ? (
                          <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-sm font-medium">
                            <AlertTriangle size={14} />
                            {stats.label}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-sm font-medium">
                            <CheckCircle2 size={14} />
                            {stats.label}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                         <button
                          onClick={(e) => handleOpenEditModal(student, e)}
                          className="p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-full transition-colors"
                          title="تعديل"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectStudent(student); }}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(student.id, e)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
            <h3 className="text-xl font-bold mb-4 text-slate-800">
              {editingStudentId ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
            </h3>
            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم الطالب</label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="مثال: أحمد محمد"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الصف / المرحلة</label>
                <input
                  type="text"
                  value={newStudentGrade}
                  onChange={(e) => setNewStudentGrade(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="مثال: العاشر أ"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-fade-in flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">استيراد مجموعة طلاب</h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-2">
              أدخل بيانات الطلاب، كل طالب في سطر جديد بالتنسيق التالي:
              <br />
              <span className="font-mono bg-slate-100 px-1 rounded">الاسم - الصف</span>
            </p>
            
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="flex-1 w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm min-h-[200px]"
              placeholder={"أحمد محمد - العاشر أ\nسارة علي - الحادي عشر\n..."}
            />
            
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleBulkImport}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                <span>استيراد الأسماء</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;