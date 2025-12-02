import { GoogleGenAI } from "@google/genai";
import { Student, AttendanceRecord, AttendanceStatus } from '../types';

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeAttendance = async (students: Student[], records: AttendanceRecord[]) => {
  try {
    const ai = getAiClient();
    
    // Prepare data summary for the AI
    // Map records to include notes clearly
    const recentRecords = records.slice(-50).map(r => ({
      status: r.status,
      note: r.note || '',
      date: r.date
    }));

    const dataSummary = {
      totalStudents: students.length,
      totalRecords: records.length,
      studentList: students.map(s => s.name),
      recentActivity: recentRecords,
    };

    const prompt = `
      أنت مساعد ذكي لمدير مدرسة. 
      لديك ملخص لبيانات الحضور:
      ${JSON.stringify(dataSummary)}

      المطلوب:
      1. تحليل أنماط الغياب العام.
      2. تحليل أسباب "الغياب بعذر" (Excused) بناءً على الملاحظات (Notes) المرفقة في البيانات (مثل: طبي، عائلي..).
      3. هل هناك أعذار متكررة تستدعي الانتباه؟
      4. تقديم نصائح إدارية مختصرة.
      
      اكتب التقرير باللغة العربية بأسلوب احترافي، ولا تذكر كود JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "عذراً، حدث خطأ أثناء تحليل البيانات. تأكد من إعداد مفتاح API بشكل صحيح.";
  }
};

export const analyzeStudentReport = async (student: Student, records: AttendanceRecord[]) => {
  try {
    const ai = getAiClient();
    
    const studentRecords = records.filter(r => r.studentId === student.id);
    const presentCount = studentRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const absentCount = studentRecords.filter(r => r.status === AttendanceStatus.ABSENT).length;
    const lateCount = studentRecords.filter(r => r.status === AttendanceStatus.LATE).length;
    const excusedCount = studentRecords.filter(r => r.status === AttendanceStatus.EXCUSED).length;
    
    // Extract notes for context
    const notes = studentRecords
      .filter(r => r.note && r.note.trim().length > 0)
      .map(r => `${r.date}: ${r.status} - ${r.note}`);

    const summary = {
      name: student.name,
      grade: student.grade,
      stats: { present: presentCount, absent: absentCount, late: lateCount, excused: excusedCount },
      notesHistory: notes
    };

    const prompt = `
      أنت مرشد طلابي. اكتب تقريراً لولي أمر الطالب:
      ${JSON.stringify(summary)}
      
      المطلوب:
      1. تقييم التزام الطالب.
      2. الإشارة إلى الملاحظات المسجلة (Notes) لتبرير الغياب أو شرح أسباب التأخير إن وجدت.
      3. إذا كان الطالب مجتهداً (غياب قليل)، امدحه.
      4. رسالة توجيهية قصيرة.
      
      اكتب باللغة العربية بأسلوب تربوي مهني.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating student report:", error);
    return "لا يمكن توليد التقرير حالياً.";
  }
};

export const analyzeMonthlyReport = async (monthName: string, grade: string, dailyStats: any[]) => {
  try {
    const ai = getAiClient();
    
    const prompt = `
      قم بتحليل تقرير الحضور الشهري التالي لشهر ${monthName} للصف ${grade === 'all' ? 'الكل' : grade}.
      البيانات اليومية (يوم: {حضور, غياب, تأخير}):
      ${JSON.stringify(dailyStats)}

      المطلوب:
      1. تحديد الأيام التي شهدت أعلى نسبة غياب.
      2. تحديد ما إذا كان هناك نمط معين (مثلاً غياب مرتفع في نهاية الأسبوع).
      3. تقديم ملخص عام عن انضباط هذا الشهر.
      
      اكتب التحليل في فقرة واحدة مركزة ومفيدة باللغة العربية.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating monthly report:", error);
    return "لا يمكن تحليل التقرير الشهري حالياً.";
  }
};