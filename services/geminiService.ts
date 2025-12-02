import { GoogleGenAI } from "@google/genai";
import { Student, AttendanceRecord, AttendanceStatus } from '../types';

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeAttendance = async (students: Student[], records: AttendanceRecord[]) => {
  try {
    const ai = getAiClient();
    
    // Prepare data summary for the AI
    const dataSummary = {
      totalStudents: students.length,
      totalRecords: records.length,
      studentList: students.map(s => s.name),
      recentRecordsSample: records.slice(-50), // Send last 50 records to keep token usage efficient
    };

    const prompt = `
      أنت مساعد ذكي لمدير مدرسة. 
      لديك البيانات التالية عن حضور الطلاب بتنسيق JSON:
      ${JSON.stringify(dataSummary)}

      المطلوب:
      1. تحليل أنماط الغياب (من يتغيب كثيراً؟).
      2. تقديم نصائح لتحسين الحضور بناءً على البيانات.
      3. كتابة التقرير باللغة العربية بأسلوب احترافي ومختصر.
      
      لا تذكر كود JSON في الإجابة، فقط النص التحليلي.
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

    const summary = {
      name: student.name,
      grade: student.grade,
      stats: { present: presentCount, absent: absentCount, late: lateCount },
      records: studentRecords.slice(-20) // Last 20 records
    };

    const prompt = `
      أنت مرشد طلابي. اكتب تقريراً مختصراً وموجهاً لولي الأمر عن حالة حضور الطالب التالي:
      ${JSON.stringify(summary)}
      
      المطلوب:
      1. تقييم مستوى التزام الطالب.
      2. ملاحظة أي أنماط مقلقة (مثل الغياب المتكرر أو التأخير).
      3. رسالة تشجيعية أو توجيهية قصيرة في النهاية.
      
      اكتب باللغة العربية بأسلوب مهني وودود.
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