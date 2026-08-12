-- 1. Create profiles table in the public schema
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null check (role in ('superadmin', 'admin', 'staff')),
  full_name text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. Create RLS Policies
-- Profiles are readable by all authenticated users
create policy "Profiles are viewable by authenticated users" on public.profiles
  for select using (auth.role() = 'authenticated');

-- Users can update their own profiles
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Superadmins can insert/update/delete any profile
create policy "Superadmins can do all actions on profiles" on public.profiles
  for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'
  );

-- 4. Create trigger to automatically create a profile on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'staff'),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Helper function for Superadmin to delete users from auth.users (since standard anon key can't do this)
create or replace function public.delete_user_by_admin(target_user_id uuid)
returns void as $$
declare
  caller_role text;
begin
  -- Get the role of the caller
  select role into caller_role from public.profiles where id = auth.uid();
  
  -- Check if caller is superadmin
  if caller_role = 'superadmin' then
    -- Delete from auth.users (which cascades to public.profiles)
    delete from auth.users where id = target_user_id;
  else
    raise exception 'Akses ditolak: Hanya Superadmin yang dapat menghapus user.';
  end if;
end;
$$ language plpgsql security definer;
