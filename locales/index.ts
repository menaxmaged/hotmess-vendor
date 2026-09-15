import arAuth from "./ar/auth";
import arAutomation from "./ar/automation";
import arCalendar from "./ar/calendar";
import arCommon from "./ar/common";
import arFinance from "./ar/finance";
import arGrowth from "./ar/growth";
import arInbox from "./ar/inbox";
import arInsights from "./ar/insights";
import arStudio from "./ar/studio";
import arMore from "./ar/more";
import enAuth from "./en/auth";
import enAutomation from "./en/automation";
import enCalendar from "./en/calendar";
import enCommon from "./en/common";
import enFinance from "./en/finance";
import enGrowth from "./en/growth";
import enInbox from "./en/inbox";
import enInsights from "./en/insights";
import enStudio from "./en/studio";
import enMore from "./en/more";

export const resources = {
  en: { common: enCommon, auth: enAuth, more: enMore, inbox: enInbox, insights: enInsights, calendar: enCalendar, finance: enFinance, growth: enGrowth, automation: enAutomation, studio: enStudio },
  ar: { common: arCommon, auth: arAuth, more: arMore, inbox: arInbox, insights: arInsights, calendar: arCalendar, finance: arFinance, growth: arGrowth, automation: arAutomation, studio: arStudio },
};
