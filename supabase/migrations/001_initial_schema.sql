-- Students table
create table students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  created_at timestamptz default now()
);

-- Sessions table
create table sessions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  type text not null check (type in ('1-on-1', '1-on-2', 'group')),
  student_ids uuid[] not null,
  amount numeric(10,2) not null,
  paid boolean default false,
  payment_method text check (payment_method in ('tng', 'bank')),
  notes text,
  created_at timestamptz default now()
);

-- Disable RLS (single-user app, no auth needed)
alter table students disable row level security;
alter table sessions disable row level security;
