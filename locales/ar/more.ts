import type en from "../en/more";
import type { Translation } from "../types";

const more: Translation<typeof en> = {
  nav: {
    more: "المزيد",
    profile: "الملف الشخصي والإعدادات",
    automation: "الرسائل التلقائية",
    ads: "الإعلانات الممولة",
    premium: "الاشتراك وبريميوم",
    settings: "الإعدادات",
    changePassword: "تغيير كلمة المرور",
    checklist: "خطوات الإعداد",
    savedReplies: "الردود المحفوظة",
    notifications: "الإشعارات",
    notificationPreferences: "تفضيلات الإشعارات",
    team: "الفريق والأدوار",
    invite: "دعوة عضو",
    role: "الدور",
  },
  menu: {
    yourStudio: "الاستوديو الخاص بك",
    sections: {
      studio: "الاستوديو",
      growth: "النمو",
      account: "الحساب",
    },
    profile: {
      label: "الملف الشخصي والإعدادات",
      description: "معلومات النشاط، الفئات، قواعد الحجز، إنستجرام، الباقات",
    },
    automation: {
      label: "الرسائل التلقائية",
      description: "رسالة الترحيب، أسئلة الاستفسار، الرد التلقائي، توزيع العملاء",
    },
    team: {
      label: "الفريق والأدوار",
      description: "ادعُ أعضاء وأدِر الصلاحيات",
    },
    savedReplies: {
      label: "الردود المحفوظة",
      description: "ردود جاهزة للأسئلة المتكررة",
    },
    ads: {
      label: "الإعلانات الممولة",
      description: "اشترِ أماكن إعلانية وأدِر الحملات",
    },
    premium: {
      label: "الاشتراك وبريميوم",
      description: "أدِر خطتك والفواتير",
    },
    notifications: {
      label: "الإشعارات",
      description: "الاستفسارات، المتابعات، الحملات وتحديثات الحساب",
    },
    settings: {
      label: "الإعدادات",
      description: "اللغة، الإشعارات، الأمان",
    },
    signOut: "تسجيل الخروج",
  },
  settings: {
    name: "الاسم",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    editNamePhone: "تعديل الاسم والهاتف",
    changePassword: "تغيير كلمة المرور",
    language: "اللغة",
    languagePreference: "تفضيل اللغة",
    notificationPreferences: "تفضيلات الإشعارات",
    signOut: "تسجيل الخروج",
    deleteAccount: "حذف الحساب",
    deleting: "جارٍ الحذف…",
    deleteBody:
      "سيتم جدولة حذف حسابك وتسجيل خروجك من جميع الأجهزة فوراً. تُحذف كل بياناتك نهائياً بعد 30 يوماً.",
    deletedTitle: "تمت جدولة حذف الحساب",
    deletedBody: "ستُحذف بياناتك نهائياً في {{date}}.",
    couldNotDelete: "تعذّر حذف الحساب",
    yourName: "اسمك",
    phoneOptional: "الهاتف (اختياري)",
  },
  changePassword: {
    intro:
      "سنرسل إلى بريدك رمزاً من 6 أرقام للتأكد من هويتك. تعيين كلمة مرور جديدة يسجّل خروجك من جميع الأجهزة، بما فيها هذا الجهاز.",
    doneTitle: "تم تغيير كلمة المرور",
    doneBody: "سجّل الدخول مرة أخرى بكلمة المرور الجديدة.",
  },
};

export default more;
