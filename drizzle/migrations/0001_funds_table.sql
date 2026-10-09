create table public.funds (
  id text primary key,
  name text not null,
  provider text not null,
  category text not null check (category in ('Government grant','Bursary','Scholarship','College fund','Other support')),
  subcategory text[] not null default '{}',
  description text not null default '',
  amount_text text not null,
  amount_max_eur integer,
  amount_far_eur integer,
  amount_varies boolean not null default false,
  deadline date,
  open_to_tags text[] not null default '{}',
  requires_tags text[] not null default '{}',
  requires_any_tags text[] not null default '{}',
  colleges text[] not null default '{all}',
  apply_url text not null,
  how_to_apply_steps text[] not null default '{}',
  documents_needed text[] not null default '{}',
  verified boolean not null default true,
  created_at timestamptz not null default now()
);
comment on column public.funds.amount_max_eur is 'Yearly amount (near-home rate when amount_far_eur is set). Null when amount_varies.';
comment on column public.funds.amount_far_eur is 'Higher yearly amount when home is 30km+ from college (SUSI).';
grant select on public.funds to authenticated;
grant all on public.funds to service_role;
alter table public.funds enable row level security;
create policy "funds readable" on public.funds for select to authenticated using (true);

alter table public.user_grants drop constraint if exists user_grants_grant_id_fkey;
comment on table public.grants is 'DEPRECATED: replaced by public.funds';
comment on table public.matches is 'Only web_results is used now; results are computed in the app from public.funds.';