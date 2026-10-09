export const NOTIFICATIONS = [
  { id: 1, icon: "⏰", title: "1916 Bursary closes today", time: "2h ago", to: "/grant/bursary-1916" },
  { id: 2, icon: "💸", title: "New match: DCU Access Scholarship", time: "Yesterday", to: "/results" },
  { id: 3, icon: "📬", title: "Your weekly digest is ready", time: "2 days ago", to: "/weekly" },
  { id: 4, icon: "✅", title: "SUSI Maintenance Grant marked Awarded", time: "Last week", to: "/dashboard" },
] as const;

export interface Issue {
  no: number; date: string; title: string;
  deadlines: { name: string; date: string }[];
  claim: number;
  spotlight: { name: string; steps: string[] };
  tip: string; fact: string;
}

export const ISSUES: Issue[] = [
  {
    no: 14, date: "9 Oct 2026", title: "Deadlines are creeping up 🍂",
    deadlines: [{ name: "1916 Bursary", date: "20 Oct" }, { name: "SUSI Maintenance Grant", date: "5 Nov" }, { name: "Student Assistance Fund", date: "1 Dec" }],
    claim: 7500,
    spotlight: { name: "1916 Bursary", steps: ["Check you're in a priority group (e.g. carer, lone parent, mature student).", "Get your SUSI letter or income evidence ready.", "Write a short personal statement and apply via your college cluster."] },
    tip: "Open a separate savings pot for grant payments so they last the whole term.",
    fact: "Thousands of eligible students never apply for the Student Assistance Fund each year.",
  },
  {
    no: 13, date: "2 Oct 2026", title: "Your SUSI checklist ✅",
    deadlines: [{ name: "SUSI Fee Grant", date: "5 Nov" }], claim: 7500,
    spotlight: { name: "SUSI Maintenance Grant", steps: ["Create your SUSI account.", "Upload income documents.", "Track your application online."] },
    tip: "Student Leap Card saves up to 50% on travel.", fact: "Living 30km+ from college can raise your SUSI rate.",
  },
  {
    no: 12, date: "25 Sep 2026", title: "Welcome back to college 🎒",
    deadlines: [{ name: "College Hardship Fund", date: "Rolling" }], claim: 7500,
    spotlight: { name: "Student Assistance Fund", steps: ["Visit your access office.", "Bring bank statements.", "Get a decision in a few weeks."] },
    tip: "Ask your college about free counselling and food banks.", fact: "Part-time students can get SAF too.",
  },
  {
    no: 11, date: "18 Sep 2026", title: "Scholarships for international students 🌍",
    deadlines: [{ name: "International Merit Scholarships", date: "1 Mar" }], claim: 7500,
    spotlight: { name: "Universities of Sanctuary", steps: ["Check your university takes part.", "Gather IPO documents.", "Apply with a personal statement."] },
    tip: "Batch-cook on Sundays to cut food costs.", fact: "Most Irish universities offer merit scholarships to non-EU students.",
  },
];

export const STATEMENT = `I'm Aoife, a second-year Arts student at the University of Galway, and I'm the first person in my family to go to college.

I grew up in a lone-parent household in Co. Mayo. My mum has worked hard to support me and my younger brother, and I help care for him at weekends. Moving 75km from home to study has meant new costs — rent, travel home, and books — that our household income simply can't stretch to cover.

Despite this, I've kept up my grades and I'm involved in my college's peer-mentoring scheme because I want other students from backgrounds like mine to know college is possible.

This funding would let me focus on my studies instead of extra shifts, and help me finish my degree. Thank you for considering my application.`;

export const WINS = [
  "A 1st year in DCU found €5,000",
  "A mature student in TU Dublin found €3,200",
  "A carer in UCC found €7,336",
  "A postgrad in Maynooth found €2,950",
  "A lone parent in ATU found €9,800",
  "A 2nd year in University of Galway found €6,100",
];
