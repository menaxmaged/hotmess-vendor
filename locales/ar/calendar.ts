import type en from "../en/calendar";
import type { Translation } from "../types";

const calendar: Translation<typeof en> = {
  eyebrow: "الجدول",
  title: "التقويم.",
  views: {
    month: "الشهر",
    week: "الأسبوع",
    agenda: "القائمة",
  },
  add: "＋ إضافة",
  types: {
    meeting: "موعد",
    booking: "حجز",
    tentative: "مبدئي",
    blocked: "محجوب",
  },
  reasons: {
    min_notice: "ضمن مهلة الإشعار المسبق",
    blocked_time: "وقت محجوب",
    day_full: "اليوم محجوز بالكامل",
    weekend_full: "عطلة نهاية الأسبوع محجوزة بالكامل",
    in_the_past: "تاريخ مضى",
  },
  reasonSeparator: "، ",
  available: "متاح للحجز",
  unavailable: "غير متاح — {{reasons}}",
  notBookable: "لا يمكن الحجز",
  counts: " · {{booked}} محجوز · {{onHold}} مبدئي",
  noEvents: "لا توجد مواعيد في هذا اليوم.",
  nothingThisMonth: "لا شيء مجدول هذا الشهر.",
  fromConversation: "من محادثة",
  derivedBody: "هذا الموعد مصدره لقاء مؤكد، ويُدار من المحادثة الخاصة به.",
  deleteTitle: "حذف الموعد؟",
  deleteFailed: "تعذّر الحذف",
  saveFailed: "تعذّر الحفظ",
  editTitle: "تعديل الموعد.",
  newTitle: "موعد جديد.",
  titlePlaceholder: "العنوان",
  starts: "يبدأ",
  setEnd: "تحديد وقت الانتهاء",
  endAfterStart: "يجب أن يكون الانتهاء بعد البداية.",
  notesPlaceholder: "ملاحظات (اختياري)",
  saving: "جارٍ الحفظ…",
  saveChanges: "حفظ التغييرات",
  addEvent: "إضافة الموعد",
};

export default calendar;
