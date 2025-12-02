import React, { useState, useRef, useEffect } from 'react';
import { Save, Download, Upload, Trash2, AlertTriangle, ShieldCheck, BrainCircuit, Check, X } from 'lucide-react';
import { AppSettings } from '../types';
import { saveSettings, createBackup, restoreBackup, clearAllData } from '../services/storageService';

interface SettingsProps {
  settings: AppSettings;
  onUpdate: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [saveMessage, setSaveMessage] = useState('');
  const [isAiReady, setIsAiReady] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if API key is present in environment
    const checkAiStatus = () => {
      let hasKey = false;
      try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
          hasKey = true;
        }
      } catch(e) {}
      
      if (!hasKey && typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        hasKey = true;
      }
      setIsAiReady(hasKey);
    };
    checkAiStatus();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(localSettings);
    onUpdate();
    setSaveMessage('تم حفظ الإعدادات بنجاح');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleDownloadBackup = () => {
    const jsonString = createBackup();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (confirm('هل أنت متأكد؟ سيتم استبدال البيانات الحالية بالبيانات الموجودة في الملف.')) {
          const success = restoreBackup(content);
          if (success) {
            alert('تم استعادة النسخة الاحتياطية بنجاح.');
            onUpdate();
            window.location.reload(); // Reload to refresh all states
          } else {
            alert('فشل في استعادة الملف. تأكد من أن الملف صالح.');
          }
        }
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearData = () => {
    if (confirm('تحذير: هذا الإجراء سيحذف جميع بيانات الطلاب وسجلات الحضور نهائياً. هل أنت متأكد؟')) {
      if (confirm('تأكيد نهائي: هل قمت بأخذ نسخة احتياطية؟ سيتم حذف كل شيء.')) {
        clearAllData();
        onUpdate();
        alert('تم حذف البيانات بنجاح.');
        window.location.reload();
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* General Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <ShieldCheck className="text-indigo-600" />
          إعدادات النظام
        </h3>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">اسم المدرسة / المؤسسة</label>
              <input
                type="text"
                value={localSettings.schoolName}
                onChange={(e) => setLocalSettings({...localSettings, schoolName: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="أدخل الاسم..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                حد التحذير لنسبة الحضور (%)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={localSettings.attendanceThreshold}
                  onChange={(e) => setLocalSettings({...localSettings, attendanceThreshold: Number(e.target.value)})}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg font-bold min-w-[3rem] text-center">
                  {localSettings.attendanceThreshold}%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                سيظهر تنبيه بجانب الطالب الذي تقل نسبة حضوره عن هذا الرقم.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
            >
              <Save size={18} />
              حفظ الإعدادات
            </button>
            {saveMessage && (
              <span className="text-green-600 font-medium animate-pulse">{saveMessage}</span>
            )}
          </div>
        </form>
      </div>

      {/* AI Status Check */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BrainCircuit className="text-purple-600" />
          حالة الذكاء الاصطناعي (Gemini AI)
        </h3>
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${isAiReady ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          {isAiReady ? (
            <Check className="text-green-600" size={24} />
          ) : (
            <X className="text-amber-600" size={24} />
          )}
          <div>
            <p className="font-bold">
              {isAiReady ? 'الخدمة جاهزة ومتصلة' : 'لم يتم العثور على مفتاح API'}
            </p>
            <p className="text-sm opacity-80 mt-1">
              {isAiReady 
                ? 'يمكنك استخدام ميزات التحليل الذكي في لوحة التحكم وتقارير الطلاب.' 
                : 'تأكد من إضافة VITE_API_KEY في إعدادات البيئة (Environment Variables) في Vercel لتفعيل ميزات الذكاء الاصطناعي.'}
            </p>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Upload className="text-blue-600" />
          النسخ الاحتياطي والبيانات
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Export */}
          <div className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors">
            <h4 className="font-bold text-slate-800 mb-2">تصدير نسخة احتياطية</h4>
            <p className="text-sm text-slate-500 mb-4 h-12">
              تحميل جميع البيانات (الطلاب، الحضور، الإعدادات) في ملف واحد.
            </p>
            <button
              onClick={handleDownloadBackup}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 py-2 rounded-lg transition-colors border border-slate-300 hover:border-blue-300"
            >
              <Download size={18} />
              تحميل الملف
            </button>
          </div>

          {/* Import */}
          <div className="border border-slate-200 rounded-xl p-5 hover:border-green-300 transition-colors">
            <h4 className="font-bold text-slate-800 mb-2">استعادة نسخة احتياطية</h4>
            <p className="text-sm text-slate-500 mb-4 h-12">
              استرجاع البيانات من ملف سابق. <span className="text-red-500">سيتم استبدال البيانات الحالية.</span>
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleRestoreBackup}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-green-50 text-slate-700 hover:text-green-700 py-2 rounded-lg transition-colors border border-slate-300 hover:border-green-300"
            >
              <Upload size={18} />
              رفع الملف
            </button>
          </div>

          {/* Clear */}
          <div className="border border-red-100 rounded-xl p-5 hover:border-red-300 transition-colors bg-red-50/30">
            <h4 className="font-bold text-red-700 mb-2 flex items-center gap-2">
              <AlertTriangle size={16} />
              منطقة الخطر
            </h4>
            <p className="text-sm text-slate-500 mb-4 h-12">
              حذف جميع البيانات لبدء نظام جديد. لا يمكن التراجع عن هذا الإجراء.
            </p>
            <button
              onClick={handleClearData}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-red-600 text-red-600 hover:text-white py-2 rounded-lg transition-colors border border-red-200 hover:border-red-600"
            >
              <Trash2 size={18} />
              مسح كل البيانات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;