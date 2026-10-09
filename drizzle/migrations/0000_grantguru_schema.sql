create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  answers jsonb,
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.grants (
  id text primary key,
  name text not null,
  provider text not null,
  type text not null check (type in ('grant','bursary','scholarship','fund')),
  amount_text text not null,
  amount_max_eur integer not null default 0,
  deadline date,
  description text not null default '',
  criteria jsonb not null default '{}'::jsonb,
  apply_url text not null,
  documents_needed text[] not null default '{}',
  audience_tags text[] not null default '{}'
);
grant select on public.grants to authenticated;
grant all on public.grants to service_role;
alter table public.grants enable row level security;
create policy "grants readable" on public.grants for select to authenticated using (true);

create table public.matches (
  user_id uuid primary key,
  results jsonb not null default '[]'::jsonb,
  web_results jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.matches to authenticated;
grant all on public.matches to service_role;
alter table public.matches enable row level security;
create policy "own matches" on public.matches for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.user_grants (
  user_id uuid not null,
  grant_id text not null references public.grants(id) on delete cascade,
  saved boolean not null default false,
  status text check (status in ('applied','awarded','rejected','waiting')),
  updated_at timestamptz not null default now(),
  primary key (user_id, grant_id)
);
grant select, insert, update, delete on public.user_grants to authenticated;
grant all on public.user_grants to service_role;
alter table public.user_grants enable row level security;
create policy "own user_grants" on public.user_grants for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.grants (id,name,provider,type,amount_text,amount_max_eur,deadline,description,criteria,apply_url,documents_needed,audience_tags) values
('susi-maintenance','SUSI Maintenance Grant','SUSI','grant','€1,615 – €7,336 per year',7336,'2026-11-05','Annual maintenance grant towards the cost of living while studying full-time. Rate depends on household income and distance from college.','{"study":"full-time","fee_status":["EU"],"residency_years_min":3,"income_max_eur":62000,"note":"Higher (non-adjacent) rate if 30km+ from college. Placeholder criteria."}','https://susi.ie','{"Household income evidence (P21/Employment Detail Summary)","Proof of address","Passport or birth cert","Course acceptance"}','{"undergrad","postgrad","EU"}'),
('susi-fee','SUSI Fee Grant / Student Contribution','SUSI','grant','Up to €3,000 student contribution',3000,'2026-11-05','Covers all or part of the student contribution charge, and for postgrads, part of tuition fees.','{"study":"full-time","fee_status":["EU"],"residency_years_min":3,"income_max_eur":120000,"note":"Partial contribution grants up to ~€120k income bands. Placeholder."}','https://susi.ie','{"Household income evidence","Proof of address","Course acceptance"}','{"undergrad","postgrad","EU"}'),
('free-fees','Free Fees Initiative','Department of Further and Higher Education','grant','Tuition fees covered (~€6,000+)',6000,null,'The State pays tuition fees for eligible first-time, full-time undergraduates. Applied automatically by your college.','{"level":"undergrad","study":"full-time","first_time":true,"fee_status":["EU"],"residency_years_min":3}','https://www.gov.ie/en/service/free-fees-initiative','{"Proof of EU/EEA nationality","Proof of 3 years residency"}','{"undergrad","EU"}'),
('saf','Student Assistance Fund','Your college access office','fund','€200 – €1,500 typical',1500,'2026-12-01','Emergency and ongoing financial help for students in difficulty — rent, food, travel, books, childcare.','{"study":["full-time","part-time"],"need":"financial hardship","note":"Means-tested by college. Placeholder."}','https://hea.ie/funding-governance-performance/funding/student-finance/financial-supports/student-assistance-fund','{"Bank statements","Proof of expenses (rent, travel)","Student ID"}','{"undergrad","postgrad","hardship"}'),
('bursary-1916','1916 Bursary','HEA / regional college clusters','bursary','€5,000 per year',5000,'2026-10-20','Bursary for students from groups under-represented in higher education who are experiencing socio-economic disadvantage.','{"level":"undergrad","first_time":true,"income_max_eur":28600,"target_groups":["Irish Traveller or Roma","lone or teen parent","disability","care-experienced","mature student","carer","further education"]}','https://www.1916bursary.ie','{"SUSI letter or income evidence","Personal statement","Supporting documents for priority group"}','{"undergrad","access","traveller","parent","disability","care-experienced","mature"}'),
('fsd','Fund for Students with Disabilities','HEA via college disability office','fund','Assistive tech, supports — varies',2000,null,'Funds supports and services for students with a disability, such as assistive technology, note-takers and transport.','{"disability":true,"study":["full-time","part-time"],"note":"Apply through your college disability service."}','https://hea.ie/funding-governance-performance/funding/student-finance/fund-for-students-with-disabilities','{"Evidence of disability from a professional","Needs assessment with disability office"}','{"disability"}'),
('bta','Back to Education Allowance','Department of Social Protection','grant','~€244 per week',12700,null,'Weekly allowance for people on certain social welfare payments returning to full-time education.','{"social_welfare":true,"age_min":21,"note":"Must be on a qualifying payment beforehand. Placeholder."}','https://www.gov.ie/en/service/back-to-education-allowance','{"Proof of social welfare payment","Course acceptance","Form BTE1"}','{"mature","welfare","returning"}'),
('sanctuary','Universities of Sanctuary Scholarships','Participating Irish universities','scholarship','Fees + up to €5,000 stipend',5000,'2026-06-30','Scholarships for people seeking international protection, refugees, and those with other leave to remain.','{"fee_status":["refugee or international protection","other leave to remain"],"note":"Each university runs its own scheme. Placeholder."}','https://www.universitiesofsanctuary.ie','{"Immigration/IPO documentation","Personal statement","Academic transcripts"}','{"refugee","international protection"}'),
('college-hardship','College Access / Hardship Funds','Your college','fund','€250 – €2,000',2000,null,'Most Irish colleges run their own access bursaries, hardship funds and accommodation supports alongside SAF.','{"study":["full-time","part-time"],"need":"financial hardship","note":"Varies by college; open to most students incl. international."}','https://hea.ie','{"Bank statements","Proof of expenses"}','{"hardship","international"}'),
('intl-merit','University International Merit Scholarships','Irish universities','scholarship','€2,000 – €10,000 fee reduction',10000,'2027-03-01','Merit-based scholarships for non-EU international students offered by most Irish universities.','{"fee_status":["international non-EU"],"note":"Based on academic results. Placeholder."}','https://www.educationinireland.com','{"Academic transcripts","Offer letter","Personal statement"}','{"international"}');

-- Demo account
do $$
declare uid uuid := '11111111-1111-4111-8111-111111111111';
begin
  insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change,email_change_token_new)
  values ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','demo@grantguru.ie',extensions.crypt('demo1234',extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"name":"Aoife"}',now(),now(),'','','','');
  insert into auth.identities (provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
  values (uid::text,uid,jsonb_build_object('sub',uid::text,'email','demo@grantguru.ie','email_verified',true),'email',now(),now(),now());
  update public.profiles set answers = '{"age":"19","college":"University of Galway","course":"Arts","year":"2","study":"full-time","level":"undergrad","first_time":"yes","nationality":"Irish","fee_status":"EU","residency_years":"5","county":"Mayo","distance_km":"75","lives_with_parents":"yes","income_band":"under €28.6k","dependants":"4","others_in_college":"1","social_welfare":"no","situation":["carer"],"notes":"I help care for my younger brother at weekends."}'::jsonb where id = uid;
  insert into public.user_grants (user_id,grant_id,status) values (uid,'susi-maintenance','waiting'),(uid,'free-fees','applied');
  insert into public.matches (user_id,results) values (uid,'[
   {"grant_id":"susi-maintenance","status":"likely","reason":"Household income under €28.6k and you live 75km from college, so you may get the higher rate.","confidence":"high"},
   {"grant_id":"susi-fee","status":"likely","reason":"Your household income is well within the fee grant limits.","confidence":"high"},
   {"grant_id":"free-fees","status":"likely","reason":"You are a first-time, full-time EU undergraduate.","confidence":"high"},
   {"grant_id":"bursary-1916","status":"likely","reason":"Low household income and caring responsibilities match the priority groups.","confidence":"medium"},
   {"grant_id":"saf","status":"worth checking","reason":"Open to students in financial difficulty — your college decides.","confidence":"medium"},
   {"grant_id":"college-hardship","status":"worth checking","reason":"Your college may offer extra support for carers.","confidence":"low"},
   {"grant_id":"fsd","status":"not eligible","reason":"Only for students with a disability.","confidence":"high"},
   {"grant_id":"bta","status":"not eligible","reason":"Requires a qualifying social welfare payment.","confidence":"high"},
   {"grant_id":"sanctuary","status":"not eligible","reason":"For refugees and people seeking international protection.","confidence":"high"},
   {"grant_id":"intl-merit","status":"not eligible","reason":"For non-EU international students.","confidence":"high"}]'::jsonb);
end $$;