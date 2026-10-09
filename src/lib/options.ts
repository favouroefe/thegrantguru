export const COLLEGES = [
  "Trinity College Dublin", "University College Dublin", "University College Cork", "University of Galway",
  "Maynooth University", "University of Limerick", "Dublin City University", "Technological University Dublin",
  "Munster Technological University", "Atlantic Technological University", "South East Technological University",
  "Technological University of the Shannon", "Dundalk Institute of Technology", "IADT Dún Laoghaire",
  "National College of Art and Design", "Mary Immaculate College", "Royal College of Surgeons (RCSI)",
  "Marino Institute of Education", "St Angela's College", "National College of Ireland", "Griffith College", "Other",
];
export const COUNTIES = [
  "Carlow","Cavan","Clare","Cork","Donegal","Dublin","Galway","Kerry","Kildare","Kilkenny","Laois","Leitrim","Limerick",
  "Longford","Louth","Mayo","Meath","Monaghan","Offaly","Roscommon","Sligo","Tipperary","Waterford","Westmeath","Wexford","Wicklow","Outside Ireland",
];
export const FEE_STATUS = ["EU", "international non-EU", "refugee or international protection", "other leave to remain"];
export const INCOME_BANDS = ["under €28.6k", "€28.6k–€45k", "€45k–€62k", "€62k–€120k", "over €120k"];
export const SITUATIONS = [
  "carer", "lone or teen parent", "disability", "care-experienced", "experienced homelessness",
  "Irish Traveller or Roma", "mature student (23+)", "returning after a break", "came through further education (PLC/QQI)",
];

export interface Answers {
  age?: string | undefined; college?: string | undefined; course?: string | undefined; year?: string | undefined; study?: string | undefined; level?: string | undefined; first_time?: string | undefined;
  nationality?: string | undefined; fee_status?: string | undefined; residency_years?: string | undefined; county?: string | undefined; distance_km?: string | undefined;
  lives_with_parents?: string | undefined; income_band?: string | undefined; dependants?: string | undefined; others_in_college?: string | undefined; social_welfare?: string | undefined;
  situation?: string[] | undefined; notes?: string | undefined;
}

export function daysUntil(date: string | null) {
  if (!date) return null;
  const d = new Date(date + "T23:59:59");
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}
export const euro = (n: number) => "€" + Math.round(n).toLocaleString("en-IE");
