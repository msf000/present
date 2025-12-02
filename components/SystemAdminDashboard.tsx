import React, { useState, useEffect } from 'react';
import { School, User } from '../types';
import { getSchools, saveSchool, toggleSchoolSubscription, getUsers } from '../services/storageService';
import { Building2, Power, Users, Plus, Edit2, Search, Calendar, Database } from 'lucide-react';

interface SystemAdminDashboardProps {
  onLogout: () => void;
}

const SystemAdminDashboard: React.FC<SystemAdminDashboardProps> = ({ onLogout }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New School Form State
  const [newSchoolName, setNewSchoolName] = useState('');
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = () => {
    setSchools(getSchools());
  };

  const handleToggleStatus = (id: string) => {
    toggleSchoolSubscription(id);
    loadSchools();
  };

  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    const schoolId = editingSchoolId || `s${Date.now()}`;
    
    saveSchool({
      id: schoolId,
      name: newSchoolName,
      isActive: true,
      principalId: '', // Would assign a principal user ID here in a real app
      studentCount: 0,
      subscriptionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    });

    setNewSchoolName('');
    setEditingSchoolId(null);
    setIsModalOpen(false);
    loadSchools();
  };

  const handleEdit = (school: School) => {
    setNewSchoolName(school.name);
    setEditingSchoolId(school.id);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setNewSchoolName('');
    setEditingSchoolId(null);
    setIsModalOpen(true);
  };

  const filteredSchools = schools.filter(s => s.name.includes(searchTerm));

  const totalStudents = schools.reduce((acc, curr) => acc + (curr.studentCount || 0), 0);
  const activeSchools = schools.filter(s => s.isActive).length;

  return (
    <div className="min-h-screen bg-slate-100 font-tajawal">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <Database size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">لوحة تحكم مدير النظام</h1>
              <p className="text-xs text-slate-400">إدارة المدارس والاشتراكات</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
          >
            تسجيل خروج
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Building2 size={24} />
              </div>
              <span className="text-xs font-bold text-slate-400">الإجمالي</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-800">{schools.length}</h3>
            <p className="text-slate-500">مدرسة مسجلة</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <Power size={24} />
              </div>
              <span className="text-xs font-bold text-slate-400">نشط</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-800">{activeSchools}</h3>
            <p className="text-slate-500">اشتراك فعال</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                <Users size={24} />
              </div>
              <span className="text-xs font-bold text-slate-400">الطلاب</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-800">{totalStudents}</h3>
            <p className="text-slate-500">طالب في جميع المدارس</p>
          </div>
        </div>

        {/* Actions & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="بحث عن مدرسة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            />
          </div>
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-colors w-full md:w-auto justify-center"
          >
            <Plus size={20} />
            <span>إضافة مدرسة جديدة</span>
          </button>
        </div>

        {/* Schools List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-slate-600 font-bold">اسم المدرسة</th>
                <th className="p-4 text-slate-600 font-bold">حالة الاشتراك</th>
                <th className="p-4 text-slate-600 font-bold">تاريخ انتهاء الاشتراك</th>
                <th className="p-4 text-slate-600 font-bold">عدد الطلاب</th>
                <th className="p-4 text-slate-600 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchools.length > 0 ? filteredSchools.map(school => (
                <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{school.name}</div>
                    <div className="text-xs text-slate-400">ID: {school.id}</div>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleToggleStatus(school.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 w-fit cursor-pointer transition-colors ${
                        school.isActive 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      <Power size={12} />
                      {school.isActive ? 'نشط' : 'متوقف'}
                    </button>
                  </td>
                  <td className="p-4 text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                       <Calendar size={16} className="text-slate-400" />
                       {school.subscriptionEndDate}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 font-bold">
                    {school.studentCount || 0}
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <button 
                      onClick={() => handleEdit(school)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="تعديل البيانات"
                    >
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">لا توجد مدارس مسجلة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
            <h3 className="text-xl font-bold mb-4 text-slate-800">
              {editingSchoolId ? 'تعديل بيانات المدرسة' : 'إضافة مدرسة جديدة'}
            </h3>
            <form onSubmit={handleSaveSchool} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم المدرسة</label>
                <input
                  type="text"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="مثال: مدارس النخبة العالمية"
                  required
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 border border-blue-100">
                ملاحظة: عند إضافة مدرسة جديدة، سيتم تفعيل الاشتراك تلقائياً لمدة عام واحد.
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
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemAdminDashboard;
