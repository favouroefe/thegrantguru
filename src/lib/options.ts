export const COLLEGES = [
  "Dublin City University (DCU)", "Trinity College Dublin (TCD)", "University College Dublin (UCD)", "Technological University Dublin (TU Dublin)",
  "Maynooth University", "University College Cork (UCC)", "University of Galway", "University of Limerick (UL)",
  "Atlantic Technological University (ATU)", "Munster Technological University (MTU)", "South East Technological University (SETU)",
  "Technological University of the Shannon (TUS)", "National College of Art and Design (NCAD)", "Dundalk Institute of Technology (DkIT)",
  "IADT Dún Laoghaire", "National College of Ireland (NCI)", "Griffith College", "Royal College of Surgeons (RCSI)",
  "Marino Institute of Education", "Mary Immaculate College", "Other",
];
/** Maps a fund's college name to the option above. */
export const collegeMatches = (fundCollege: string, userCollege?: string) =>
  !!userCollege && (userCollege === fundCollege || userCollege.startsWith(fundCollege));

export const COUNTIES = [
  "Antrim","Armagh","Carlow","Cavan","Clare","Cork","Derry","Donegal","Down","Dublin","Fermanagh","Galway","Kerry","Kildare","Kilkenny","Laois",
  "Leitrim","Limerick","Longford","Louth","Mayo","Meath","Monaghan","Offaly","Roscommon","Sligo","Tipperary","Tyrone","Waterford","Westmeath","Wexford","Wicklow",
];

const STEM = ["Computer Science","Software Engineering","Data Science","Engineering","Civil Engineering","Mechanical Engineering","Electronic Engineering","Biomedical Engineering","Chemical Engineering","Science","Biology","Chemistry","Physics","Mathematics","Applied Maths","Actuarial Science","Biotechnology","Pharmacy","Medicine","Nursing","Midwifery","Dentistry","Veterinary Medicine","Physiotherapy","Radiography","Biomedical Science","Environmental Science","Agricultural Science","Food Science","Genetics","Neuroscience","Architecture","Cybersecurity","Games Development","Information Technology","Statistics","Geology","Sport Science","Nutrition","Psychology"];
const OTHER = ["Arts","Business","Commerce","Accounting & Finance","Economics","Marketing","Law","Business & Law","Education","Primary Teaching","Journalism","Media Studies","Communications","English","History","Geography","Philosophy","Politics","Sociology","Social Care","Social Science","Social Work","Music","Drama","Film","Fine Art","Design","Fashion","Languages","Irish","French","Spanish","German","Hospitality","Tourism","Culinary Arts","Early Childhood Education","Human Resources","Theology"];
export const COURSES = [...STEM, ...OTHER].sort();
const STEM_SET = new Set(STEM.map((c) => c.toLowerCase()));
export const isStemCourse = (c?: string) =>
  !!c && (STEM_SET.has(c.toLowerCase()) || /engineer|science|comput|math|tech|software|data|physic|chemist|biolog|medic|nurs|pharm/i.test(c));

export const COUNTRIES = ["Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czechia","Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guyana","Haiti","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Mauritania","Mauritius","Mexico","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saudi Arabia","Senegal","Serbia","Sierra Leone","Singapore","Slovakia","Slovenia","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Togo","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"];
export const EU_EEA_CH = new Set(["Austria","Belgium","Bulgaria","Croatia","Cyprus","Czechia","Denmark","Estonia","Finland","France","Germany","Greece","Hungary","Italy","Latvia","Lithuania","Luxembourg","Malta","Netherlands","Poland","Portugal","Romania","Slovakia","Slovenia","Spain","Sweden","Iceland","Liechtenstein","Norway","Switzerland"]);

export const IDENTITIES = [
  { value: "irish", label: "Irish citizen" },
  { value: "uk", label: "UK citizen" },
  { value: "eu", label: "EU / EEA / Swiss citizen" },
  { value: "refugee", label: "Refugee, or have international protection / leave to remain" },
  { value: "asylum", label: "Asylum seeker (still in the international protection process)" },
  { value: "international", label: "International student (from outside the EU/EEA/UK)" },
  { value: "pnts", label: "Prefer not to say" },
] as const;
export type Identity = (typeof IDENTITIES)[number]["value"];
export const pathFor = (id?: string): "A" | "B" | null =>
  id === "irish" || id === "uk" || id === "eu" || id === "refugee" ? "A" : id === "international" || id === "asylum" ? "B" : null;

/** Suggest the Q1 option that fits a nationality, when it conflicts with the chosen one. */
export function suggestIdentity(identity?: string, nationality?: string): Identity | null {
  if (!nationality || !identity || identity === "refugee" || identity === "asylum" || identity === "pnts") return null;
  const fit: Identity = nationality === "Ireland" ? "irish" : nationality === "United Kingdom" ? "uk" : EU_EEA_CH.has(nationality) ? "eu" : "international";
  return fit === identity ? null : fit;
}

export const INCOME = [
  { value: "under_28600", label: "Under €28,600" },
  { value: "28600_47010", label: "€28,600 – €47,010" },
  { value: "47010_60000", label: "€47,010 – €60,000" },
  { value: "60000_120000", label: "€60,000 – €120,000" },
  { value: "over_120000", label: "Over €120,000" },
  { value: "not_sure", label: "Not sure" },
] as const;

export const TALENTS = [
  { value: "sport", label: "⚽ Sport" },
  { value: "academic", label: "🎓 Strong Leaving Cert / academic results" },
  { value: "stem", label: "🔬 STEM" },
  { value: "arts", label: "🎨 Arts, music, drama or creative" },
  { value: "irish_language", label: "🗣️ Irish language / Gaeltacht" },
  { value: "volunteering", label: "🤝 Volunteering or community work" },
  { value: "entrepreneurship", label: "💼 Entrepreneurship / business" },
  { value: "none", label: "None of these" },
] as const;

export const SITUATIONS = [
  { value: "carer", label: "I care for a family member", help: "e.g. you look after a parent, sibling or relative" },
  { value: "lone_parent", label: "I'm a lone parent" },
  { value: "disability", label: "I have a disability" },
  { value: "neurodivergent", label: "I'm neurodivergent", help: "e.g. ADHD, autism, dyslexia" },
  { value: "care_experienced", label: "I'm care-experienced", help: "spent time in foster or residential care" },
  { value: "traveller_roma", label: "I'm from the Traveller or Roma community" },
  { value: "first_in_family", label: "I'm the first in my family to go to college" },
  { value: "welfare", label: "I get a social welfare payment", help: "e.g. Jobseeker's, Carer's or Disability Allowance" },
  { value: "fe_entrant", label: "I came to college through a PLC / further education course" },
] as const;

/** Saved to the profile (Parts 1–4 and 6). */
export interface Answers {
  identity?: string | undefined; nationality?: string | undefined; residency?: string | undefined;
  college?: string | undefined; course?: string | undefined; year?: string | undefined; study?: string | undefined; first_time?: string | undefined;
  county?: string | undefined; distance_30?: string | undefined; income?: string | undefined; over23?: string | undefined; works?: string | undefined;
  origin_country?: string | undefined; home_scholarship?: string | undefined;
  talents?: string[] | undefined; sport_name?: string | undefined; sport_level?: string | undefined;
  notes?: string | undefined;
}
/** Part 5 — kept in this browser session only, never saved to the database. */
export interface Situation { items: string[]; gender?: string | undefined; gender_self?: string | undefined; pnts?: boolean | undefined }

const SKEY = "gg_situation";
export function loadSituation(): Situation {
  if (typeof window === "undefined") return { items: [] };
  try { return JSON.parse(sessionStorage.getItem(SKEY) ?? "") as Situation; } catch { return { items: [] }; }
}
export function storeSituation(s: Situation) { sessionStorage.setItem(SKEY, JSON.stringify(s)); window.dispatchEvent(new Event("gg-situation")); }

export function daysUntil(date: string | null) {
  if (!date) return null;
  const d = new Date(date + "T00:00:00");
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - t.getTime()) / 86400000);
}
export const euro = (n: number) => "€" + Math.round(n).toLocaleString("en-IE");
