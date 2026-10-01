-- ==============================================================
-- Djéli Pro : base de données Supabase (projet SÉPARÉ de Djéli)
-- Supabase > SQL Editor > New query > coller TOUT ce fichier > Run
-- Vous pouvez le relancer sans risque : il ne supprime aucune donnée.
-- ==============================================================

-- 1. Tables ------------------------------------------------------
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null unique references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  cat text not null,
  commune text not null,
  verified boolean not null default false,
  delivery boolean not null default false,
  open_hour int not null default 8,
  close_hour int not null default 20,
  description text default '',
  whatsapp text not null,
  phone text default '',
  plan text not null default 'free' check (plan in ('free','pro','premium')),
  lat double precision, lng double precision,
  kind text not null default 'cabinet' check (kind in ('cabinet','freelance')),
  headline text default '', years int default 0, team_size int default 1, languages text default 'FR',
  remote boolean not null default true, available boolean not null default true,
  certifications text[] not null default '{}', clients text[] not null default '{}',
  online_payment boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  owner uuid not null references auth.users(id) on delete cascade,
  cat text not null, sub text,
  title text not null check (char_length(title) between 2 and 80),
  description text default '',
  price bigint not null default 0 check (price >= 0),
  unit text default 'forfait', condition text default '', tags text default '',
  delay text default '', deliverables text default '',
  photos text[] not null default '{}',
  status text not null default 'active' check (status in ('active','sold','deleted')),
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author text not null,
  rating int not null check (rating between 1 and 5),
  text text not null check (char_length(text) <= 400),
  created_at timestamptz not null default now(),
  unique (shop_id, user_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  product_id text,
  created_at timestamptz not null default now()
);

create index if not exists products_shop_idx on public.products (shop_id);
create index if not exists reviews_shop_idx on public.reviews (shop_id);

-- 2. Accès par l'API (obligatoire depuis mai 2026) ---------------
grant usage on schema public to anon, authenticated;
grant select on public.shops, public.products, public.reviews to anon, authenticated;
grant insert, update on public.shops, public.products to authenticated;
grant insert on public.reviews to authenticated;
grant insert on public.reports to anon, authenticated;

-- 3. Règles de sécurité ------------------------------------------
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;

drop policy if exists "shops lisibles" on public.shops;
drop policy if exists "créer sa boutique" on public.shops;
drop policy if exists "modifier sa boutique" on public.shops;
create policy "shops lisibles" on public.shops for select using (true);
create policy "créer sa boutique" on public.shops for insert with check (auth.uid() = owner and verified = false and plan = 'free' and online_payment = false);
create policy "modifier sa boutique" on public.shops for update using (auth.uid() = owner) with check (auth.uid() = owner);

drop policy if exists "annonces lisibles" on public.products;
drop policy if exists "publier" on public.products;
drop policy if exists "modifier ses annonces" on public.products;
create policy "annonces lisibles" on public.products for select using (status <> 'deleted' or auth.uid() = owner);
create policy "publier" on public.products for insert with check (auth.uid() = owner and exists (select 1 from public.shops s where s.id = shop_id and s.owner = auth.uid()));
create policy "modifier ses annonces" on public.products for update using (auth.uid() = owner) with check (auth.uid() = owner);

drop policy if exists "avis lisibles" on public.reviews;
drop policy if exists "laisser un avis" on public.reviews;
create policy "avis lisibles" on public.reviews for select using (true);
create policy "laisser un avis" on public.reviews for insert with check (auth.uid() = user_id and not exists (select 1 from public.shops s where s.id = shop_id and s.owner = auth.uid()));

drop policy if exists "signaler" on public.reports;
create policy "signaler" on public.reports for insert with check (true);

-- Un vendeur ne peut pas s'attribuer lui-même le badge « Vérifié » ni une offre payante.
create or replace function public.protect_shop_fields() returns trigger language plpgsql set search_path = public as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and current_user <> 'postgres' then
    new.verified := old.verified; new.plan := old.plan; new.owner := old.owner; new.online_payment := old.online_payment;
  end if;
  return new;
end $$;
drop trigger if exists protect_shop on public.shops;
create trigger protect_shop before update on public.shops for each row execute function public.protect_shop_fields();

-- 4. Photos ------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "photos lisibles" on storage.objects;
drop policy if exists "envoyer ses photos" on storage.objects;
drop policy if exists "supprimer ses photos" on storage.objects;
create policy "photos lisibles" on storage.objects for select using (bucket_id = 'photos');
create policy "envoyer ses photos" on storage.objects for insert to authenticated with check (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "supprimer ses photos" on storage.objects for delete to authenticated using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);




-- ==============================================================
-- 5. Besoins, propositions, missions et paiement sécurisé
-- ==============================================================
-- Administrateurs : ajoutez votre e-mail à la fin de ce fichier.
create table if not exists public.admins (email text primary key);
alter table public.admins enable row level security;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- Réglages : commission Djéli en pourcentage.
create table if not exists public.settings (key text primary key, value text not null);
insert into public.settings (key, value) values ('commission_percent', '8') on conflict (key) do nothing;
grant select on public.settings to anon, authenticated;
alter table public.settings enable row level security;
drop policy if exists "réglages lisibles" on public.settings;
create policy "réglages lisibles" on public.settings for select using (true);

-- Numéro de reversement du vendeur : visible par lui et par les administrateurs.
create table if not exists public.shop_payouts (
  shop_id uuid primary key references public.shops(id) on delete cascade,
  owner uuid not null references auth.users(id) on delete cascade,
  method text not null check (method in ('wave-ci','orange-money-ci','mtn-ci','moov-ci','virement')),
  number text not null check ((method = 'virement' and char_length(number) between 10 and 60) or number ~ '^[0-9]{10}$'),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.shop_payouts to authenticated;
alter table public.shop_payouts enable row level security;
drop policy if exists "voir son reversement" on public.shop_payouts;
drop policy if exists "créer son reversement" on public.shop_payouts;
drop policy if exists "modifier son reversement" on public.shop_payouts;
create policy "voir son reversement" on public.shop_payouts for select using (auth.uid() = owner or public.is_admin());
create policy "créer son reversement" on public.shop_payouts for insert with check (auth.uid() = owner and exists (select 1 from public.shops s where s.id = shop_id and s.owner = auth.uid()));
create policy "modifier son reversement" on public.shop_payouts for update using (auth.uid() = owner) with check (auth.uid() = owner);

create or replace function public.sync_online_payment() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.shops set online_payment = exists (select 1 from public.shop_payouts p where p.shop_id = coalesce(new.shop_id, old.shop_id))
  where id = coalesce(new.shop_id, old.shop_id);
  return null;
end $$;
drop trigger if exists sync_online_payment on public.shop_payouts;
create trigger sync_online_payment after insert or update or delete on public.shop_payouts for each row execute function public.sync_online_payment();


-- Besoins publiés par les entreprises
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  client_label text, title text not null check (char_length(title) between 4 and 120),
  cat text not null, sub text, budget_min bigint default 0, budget_max bigint default 0, duration_days int default 30,
  commune text, remote boolean not null default true, description text not null default '',
  invited_shop uuid references public.shops(id) on delete set null,
  status text not null default 'open' check (status in ('open','assigned','closed')),
  proposals_count int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.projects to anon, authenticated;
grant insert, update on public.projects to authenticated;
alter table public.projects enable row level security;
drop policy if exists "besoins visibles" on public.projects;
drop policy if exists "publier un besoin" on public.projects;
drop policy if exists "modifier son besoin" on public.projects;
create policy "besoins visibles" on public.projects for select using (
  invited_shop is null or owner = auth.uid() or public.is_admin()
  or exists (select 1 from public.shops s where s.id = invited_shop and s.owner = auth.uid()));
create policy "publier un besoin" on public.projects for insert with check (owner = auth.uid() and status = 'open' and proposals_count = 0);
create policy "modifier son besoin" on public.projects for update using (owner = auth.uid()) with check (owner = auth.uid());

create or replace function public.protect_project_fields() returns trigger language plpgsql set search_path = public as $$
begin
  if current_user <> 'postgres' and coalesce(auth.role(), '') <> 'service_role' then
    new.owner := old.owner; new.proposals_count := old.proposals_count; new.invited_shop := old.invited_shop;
    if new.status = 'assigned' and old.status <> 'assigned' then new.status := old.status; end if;
  end if;
  return new;
end $$;
drop trigger if exists protect_project on public.projects;
create trigger protect_project before update on public.projects for each row execute function public.protect_project_fields();

-- Propositions des experts (visibles par l'expert, le client et les administrateurs)
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  amount bigint not null default 0 check (amount >= 0),
  delay text, message text not null default '',
  status text not null default 'sent' check (status in ('sent','accepted','declined')),
  created_at timestamptz not null default now(),
  unique (project_id, shop_id)
);
grant select on public.proposals to authenticated;
alter table public.proposals enable row level security;
drop policy if exists "voir les propositions" on public.proposals;
create policy "voir les propositions" on public.proposals for select using (
  public.is_admin()
  or exists (select 1 from public.shops s where s.id = shop_id and s.owner = auth.uid())
  or exists (select 1 from public.projects p where p.id = project_id and p.owner = auth.uid()));

create or replace function public.send_proposal(p_project uuid, p_shop uuid, p_amount bigint, p_delay text, p_message text) returns public.proposals
language plpgsql security definer set search_path = public as $$
declare v_p public.projects; v_out public.proposals;
begin
  if auth.uid() is null then raise exception 'Connectez-vous pour continuer.'; end if;
  if not exists (select 1 from public.shops where id = p_shop and owner = auth.uid()) then raise exception 'Créez d''abord votre profil d''expert.'; end if;
  select * into v_p from public.projects where id = p_project;
  if not found or v_p.status <> 'open' then raise exception 'Ce besoin n''accepte plus de propositions.'; end if;
  if v_p.owner = auth.uid() then raise exception 'Vous ne pouvez pas répondre à votre propre besoin.'; end if;
  if v_p.invited_shop is not null and v_p.invited_shop <> p_shop then raise exception 'Cette demande est adressée à un autre expert.'; end if;
  if char_length(coalesce(trim(p_message), '')) < 10 then raise exception 'Détaillez votre proposition (10 caractères minimum).'; end if;
  if exists (select 1 from public.proposals where project_id = p_project and shop_id = p_shop) then raise exception 'Vous avez déjà envoyé une proposition pour ce besoin.'; end if;
  insert into public.proposals (project_id, shop_id, amount, delay, message) values (p_project, p_shop, greatest(coalesce(p_amount, 0), 0), left(coalesce(p_delay, ''), 40), left(p_message, 1500))
  returning * into v_out;
  update public.projects set proposals_count = proposals_count + 1 where id = p_project;
  return v_out;
end $$;

create or replace function public.decline_proposal(p_proposal uuid) returns public.proposals
language plpgsql security definer set search_path = public as $$
declare v_out public.proposals;
begin
  update public.proposals pr set status = 'declined' from public.projects p
  where pr.id = p_proposal and p.id = pr.project_id and p.owner = auth.uid() and pr.status = 'sent' returning pr.* into v_out;
  if not found then raise exception 'Action impossible.'; end if;
  return v_out;
end $$;

-- Missions (séquestre)
create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  ref text unique,
  project_id uuid references public.projects(id) on delete set null,
  proposal_id uuid references public.proposals(id) on delete set null,
  shop_id uuid not null references public.shops(id) on delete restrict,
  client uuid references auth.users(id) on delete set null,
  title text not null, description text, delay text,
  total bigint not null, commission bigint not null default 0, expert_amount bigint not null,
  status text not null default 'awaiting_payment' check (status in ('awaiting_payment','payment_declared','paid','delivered','completed','disputed','cancelled','refunded')),
  client_name text, client_phone text,
  pay_method text, payer_phone text, payer_tx text, declared_at timestamptz, admin_note text,
  paid_at timestamptz, delivered_at timestamptz, delivery_note text, completed_at timestamptz, dispute_reason text,
  payout_status text not null default 'none' check (payout_status in ('none','paid')), payout_ref text, payout_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists missions_client_idx on public.missions (client);
create index if not exists missions_shop_idx on public.missions (shop_id);
grant select on public.missions to authenticated;
alter table public.missions enable row level security;
drop policy if exists "voir ses missions" on public.missions;
create policy "voir ses missions" on public.missions for select using (
  auth.uid() = client or public.is_admin() or exists (select 1 from public.shops s where s.id = shop_id and s.owner = auth.uid()));

-- Le client choisit une proposition : la mission est créée au prix proposé par l'expert.
create or replace function public.accept_proposal(p_proposal uuid) returns public.missions
language plpgsql security definer set search_path = public as $$
declare v_pr public.proposals; v_p public.projects; v_s public.shops; v_m public.missions; v_pct numeric; v_com bigint; v_meta jsonb; v_email text;
begin
  select * into v_pr from public.proposals where id = p_proposal;
  if not found then raise exception 'Proposition introuvable.'; end if;
  select * into v_p from public.projects where id = v_pr.project_id;
  if v_p.owner is distinct from auth.uid() then raise exception 'Seul l''auteur du besoin peut choisir un expert.'; end if;
  if v_p.status <> 'open' or v_pr.status <> 'sent' then raise exception 'Ce besoin a déjà un expert ou est fermé.'; end if;
  update public.proposals set status = 'accepted' where id = p_proposal;
  update public.proposals set status = 'declined' where project_id = v_p.id and id <> p_proposal and status = 'sent';
  update public.projects set status = 'assigned' where id = v_p.id;
  -- Pas de paiement sécurisé si le prix est à définir ou si l'expert n'a pas activé ses reversements.
  if v_pr.amount < 1000 or not exists (select 1 from public.shop_payouts where shop_id = v_pr.shop_id) then return null; end if;
  select * into v_s from public.shops where id = v_pr.shop_id;
  select raw_user_meta_data, email into v_meta, v_email from auth.users where id = auth.uid();
  v_pct := coalesce((select value::numeric from public.settings where key = 'commission_percent'), 8);
  v_com := round(v_pr.amount * v_pct / 100);
  insert into public.missions (ref, project_id, proposal_id, shop_id, client, title, description, delay, total, commission, expert_amount, client_name, client_phone)
  values ('DP-' || upper(substr(md5(gen_random_uuid()::text), 1, 6)), v_p.id, v_pr.id, v_pr.shop_id, auth.uid(), v_p.title, v_pr.message, v_pr.delay,
    v_pr.amount, v_com, v_pr.amount - v_com, coalesce(v_meta ->> 'name', v_p.client_label, v_email), coalesce(v_meta ->> 'phone', ''))
  returning * into v_m;
  return v_m;
end $$;

create or replace function public.declare_payment(p_mission uuid, p_method text, p_phone text, p_tx text) returns public.missions
language plpgsql security definer set search_path = public as $$
declare v_m public.missions;
begin
  if p_method not in ('wave','orange','mtn','moov','virement') then raise exception 'Moyen de paiement inconnu.'; end if;
  if char_length(trim(coalesce(p_phone, ''))) < 6 then raise exception 'Indiquez le numéro ou le compte qui a payé.'; end if;
  update public.missions set status = 'payment_declared', pay_method = p_method, payer_phone = left(trim(p_phone), 60),
    payer_tx = left(trim(coalesce(p_tx, '')), 60), declared_at = now(), updated_at = now()
  where id = p_mission and client = auth.uid() and status = 'awaiting_payment' returning * into v_m;
  if not found then raise exception 'Cette mission ne peut plus être déclarée payée.'; end if;
  return v_m;
end $$;

create or replace function public.mission_op(p_mission uuid, p_op text, p_note text default null) returns public.missions
language plpgsql security definer set search_path = public as $$
declare v_m public.missions; v_owner uuid; v_admin boolean := public.is_admin(); v_client boolean; v_expert boolean;
begin
  select * into v_m from public.missions where id = p_mission;
  if not found then raise exception 'Mission introuvable.'; end if;
  select owner into v_owner from public.shops where id = v_m.shop_id;
  v_client := v_m.client = auth.uid(); v_expert := v_owner = auth.uid();
  if p_op = 'deliver' and v_expert and v_m.status = 'paid' then
    update public.missions set status = 'delivered', delivered_at = now(), delivery_note = left(coalesce(p_note, ''), 500) where id = p_mission;
  elsif p_op = 'validate' and v_client and v_m.status in ('paid','delivered') then
    update public.missions set status = 'completed', completed_at = now() where id = p_mission;
  elsif p_op = 'dispute' and v_client and v_m.status in ('paid','delivered') then
    update public.missions set status = 'disputed', dispute_reason = left(coalesce(p_note, ''), 500) where id = p_mission;
  elsif p_op = 'cancel' and ((v_client and v_m.status = 'awaiting_payment') or (v_admin and v_m.status in ('awaiting_payment','payment_declared'))) then
    update public.missions set status = 'cancelled' where id = p_mission;
  elsif p_op = 'verify' and v_admin and v_m.status in ('awaiting_payment','payment_declared') then
    update public.missions set status = 'paid', paid_at = now(), admin_note = null where id = p_mission;
  elsif p_op = 'reject' and v_admin and v_m.status = 'payment_declared' then
    update public.missions set status = 'awaiting_payment', admin_note = left(coalesce(p_note, 'Paiement non retrouvé.'), 300) where id = p_mission;
  elsif p_op = 'release' and v_admin and v_m.status in ('paid','delivered','disputed') then
    update public.missions set status = 'completed', completed_at = coalesce(completed_at, now()) where id = p_mission;
  elsif p_op = 'refunded' and v_admin and v_m.status in ('paid','delivered','disputed') then
    update public.missions set status = 'refunded', admin_note = left(coalesce(p_note, ''), 300) where id = p_mission;
  elsif p_op = 'payout_done' and v_admin and v_m.status = 'completed' and v_m.payout_status <> 'paid' then
    update public.missions set payout_status = 'paid', payout_ref = left(coalesce(p_note, ''), 80), payout_at = now() where id = p_mission;
  else
    raise exception 'Action impossible pour cette mission.';
  end if;
  update public.missions set updated_at = now() where id = p_mission returning * into v_m;
  return v_m;
end $$;

revoke execute on function public.send_proposal(uuid, uuid, bigint, text, text) from public, anon;
revoke execute on function public.decline_proposal(uuid) from public, anon;
revoke execute on function public.accept_proposal(uuid) from public, anon;
revoke execute on function public.declare_payment(uuid, text, text, text) from public, anon;
revoke execute on function public.mission_op(uuid, text, text) from public, anon;
grant execute on function public.send_proposal(uuid, uuid, bigint, text, text) to authenticated;
grant execute on function public.decline_proposal(uuid) to authenticated;
grant execute on function public.accept_proposal(uuid) to authenticated;
grant execute on function public.declare_payment(uuid, text, text, text) to authenticated;
grant execute on function public.mission_op(uuid, text, text) to authenticated;

-- ==============================================================
-- À PERSONNALISER : votre e-mail d'administrateur et votre commission
-- ==============================================================
insert into public.admins (email) values ('VOTRE-EMAIL@exemple.com') on conflict do nothing;
update public.settings set value = '8' where key = 'commission_percent';

select 'Installation de Djéli Pro terminée' as resultat;
