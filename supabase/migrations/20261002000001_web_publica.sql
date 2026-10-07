-- ============================================================================
--  KHC Auto Import · Web pública: publicaciones y contactos de la web
-- ----------------------------------------------------------------------------
--  Esta migración es la frontera entre el ERP (privado) y la web pública.
--
--  Regla de oro: la web NUNCA lee `vehicles`. Lee `publications`, una tabla
--  aparte con los campos que se decide publicar, copiados al publicar.
--  Así, aunque alguien inspeccione el tráfico del navegador, solo puede ver
--  lo que ya es público: ni costes, ni márgenes, ni VIN, ni matrícula.
--
--  · web_sites    → qué empresa hay detrás de cada web (slug «khc» → org).
--  · publications → una fila por coche publicado (borrador/publicado/
--                   reservado/vendido/archivado), con el contenido público
--                   en `data` y columnas generadas para filtrar e indexar.
--  · web_leads    → contactos recibidos por los formularios de la web.
--                   Solo se pueden crear a través de la función
--                   `web_submit_lead` (SECURITY DEFINER); la tabla no es
--                   accesible para el rol anónimo.
--  · Bucket público `public-photos` para las fotos publicadas. El bucket
--    `vehicle-photos` (privado, del ERP) sigue siendo privado.
--
--  Es idempotente: se puede ejecutar varias veces sin errores.
--  Ejecutar en: Supabase → SQL Editor → New query → pegar → Run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Sitios web y publicaciones
-- ----------------------------------------------------------------------------
create table if not exists public.web_sites (
  slug        text primary key,                       -- 'khc'
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null default 'KHC Auto Import',
  config      jsonb not null default '{}'::jsonb,     -- reservado para el futuro (teléfono, dirección…)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.publications (
  org_id        uuid not null references public.organizations(id) on delete cascade,
  id            text not null,
  vehicle_id    text not null,
  site          text not null default 'khc',
  data          jsonb not null default '{}'::jsonb,   -- contenido público (ver contrato más abajo)
  status        text not null default 'borrador'
                check (status in ('borrador','publicado','reservado','vendido','archivado')),
  slug          text generated always as (data->>'slug') stored,
  brand         text generated always as (data->>'brand') stored,
  model         text generated always as (data->>'model') stored,
  price         numeric generated always as (nullif(data->>'price','')::numeric) stored,
  year          integer generated always as (nullif(data->>'year','')::integer) stored,
  km            integer generated always as (nullif(data->>'km','')::integer) stored,
  fuel          text generated always as (data->>'fuel') stored,
  published_at  timestamptz,
  sold_at       timestamptz,
  views         integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    uuid,
  primary key (org_id, id),
  unique (site, slug)
);
create index if not exists publications_public_idx
  on public.publications(site, status, published_at desc);
create index if not exists publications_brand_idx
  on public.publications(site, status, brand, model);
create index if not exists publications_vehicle_idx
  on public.publications(org_id, vehicle_id);

-- ----------------------------------------------------------------------------
-- 2. Contactos recibidos desde la web
-- ----------------------------------------------------------------------------
create table if not exists public.web_leads (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  site          text not null default 'khc',
  kind          text not null default 'contacto'
                check (kind in ('contacto','coche','encargo','compra')),
  name          text not null,
  phone         text,
  email         text,
  message       text,
  vehicle_slug  text,
  source        text,                                  -- de qué página/botón salió
  status        text not null default 'nuevo'
                check (status in ('nuevo','contactado','descartado','ganado')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    uuid
);
create index if not exists web_leads_org_idx
  on public.web_leads(org_id, status, created_at desc);

do $$ declare t text; begin
  foreach t in array array['web_sites','publications','web_leads'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated_at', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 3. Alta de contactos desde la web
--    El rol anónimo no puede escribir en ninguna tabla: solo puede llamar a
--    esta función, que resuelve la empresa a partir del slug del sitio.
-- ----------------------------------------------------------------------------
create or replace function public.web_submit_lead(
  p_site          text,
  p_kind          text,
  p_name          text,
  p_phone         text default null,
  p_email         text default null,
  p_message       text default null,
  p_vehicle_slug  text default null,
  p_source        text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
  v_id  uuid;
begin
  if coalesce(length(btrim(p_name)), 0) < 2 then
    raise exception 'El nombre es obligatorio';
  end if;
  if coalesce(length(btrim(p_phone)), 0) < 6 and coalesce(length(btrim(p_email)), 0) < 5 then
    raise exception 'Hace falta un teléfono o un correo';
  end if;
  select org_id into v_org from public.web_sites where slug = p_site;
  if v_org is null then
    raise exception 'Sitio web no configurado';
  end if;
  insert into public.web_leads (org_id, site, kind, name, phone, email, message, vehicle_slug, source)
  values (
    v_org,
    p_site,
    case when p_kind in ('contacto','coche','encargo','compra') then p_kind else 'contacto' end,
    left(btrim(p_name), 120),
    left(btrim(p_phone), 40),
    left(btrim(p_email), 160),
    left(btrim(p_message), 4000),
    left(btrim(p_vehicle_slug), 160),
    left(btrim(p_source), 80)
  )
  returning id into v_id;
  return v_id;
end $$;

-- ----------------------------------------------------------------------------
-- 4. Seguridad por filas (RLS)
-- ----------------------------------------------------------------------------
alter table public.web_sites    enable row level security;
alter table public.publications enable row level security;
alter table public.web_leads    enable row level security;

-- web_sites: solo los miembros de la empresa lo ven (la web no lo necesita).
drop policy if exists web_sites_select on public.web_sites;
create policy web_sites_select on public.web_sites for select
  using (public.is_member(org_id));
drop policy if exists web_sites_write on public.web_sites;
create policy web_sites_write on public.web_sites for all
  using (public.has_role(org_id, array['owner','manager']::public.app_role[]))
  with check (public.has_role(org_id, array['owner','manager']::public.app_role[]));

-- publications: el equipo ve todo lo de su empresa; publicar es cosa de
-- owner y manager (el rol comercial no publica en la web).
drop policy if exists publications_select on public.publications;
create policy publications_select on public.publications for select
  using (public.is_member(org_id));
drop policy if exists publications_write on public.publications;
create policy publications_write on public.publications for all
  using (public.has_role(org_id, array['owner','manager']::public.app_role[]))
  with check (public.has_role(org_id, array['owner','manager']::public.app_role[]));

-- publications: lectura anónima SOLO de lo publicado (y solo del sitio web).
-- Nunca se expone un borrador ni una fila de otra empresa.
drop policy if exists publications_public_read on public.publications;
create policy publications_public_read on public.publications for select
  to anon
  using (site = 'khc' and status in ('publicado','reservado','vendido'));

-- web_leads: el equipo los ve y los gestiona; el anónimo no toca la tabla.
drop policy if exists web_leads_select on public.web_leads;
create policy web_leads_select on public.web_leads for select
  using (public.is_member(org_id));
drop policy if exists web_leads_write on public.web_leads;
create policy web_leads_write on public.web_leads for update
  using (public.has_role(org_id, array['owner','manager','sales']::public.app_role[]))
  with check (public.has_role(org_id, array['owner','manager','sales']::public.app_role[]));
drop policy if exists web_leads_delete on public.web_leads;
create policy web_leads_delete on public.web_leads for delete
  using (public.has_role(org_id, array['owner','manager']::public.app_role[]));

-- ----------------------------------------------------------------------------
-- 5. Permisos
--    El rol `anon` solo recibe: SELECT en publications (filtrado por RLS) y
--    permiso para ejecutar web_submit_lead. Nada más.
-- ----------------------------------------------------------------------------
grant select, insert, update, delete on public.publications to authenticated;
grant select, insert, update, delete on public.web_sites    to authenticated;
grant select, update, delete on public.web_leads            to authenticated;

grant select on public.publications to anon;
grant execute on function public.web_submit_lead(text, text, text, text, text, text, text, text) to anon, authenticated;

revoke all on public.web_sites from anon;
revoke all on public.web_leads from anon;
revoke insert, update, delete on public.publications from anon;

-- ----------------------------------------------------------------------------
-- 6. Storage: bucket público para las fotos que sí se publican
--    Ruta: {org_id}/{vehicle_id}/{photo_id}.jpg
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('public-photos', 'public-photos', true, 5242880, array['image/jpeg','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists public_photos_read on storage.objects;
create policy public_photos_read on storage.objects for select
  using (bucket_id = 'public-photos' and public.is_member(((storage.foldername(name))[1])::uuid));

drop policy if exists public_photos_write on storage.objects;
create policy public_photos_write on storage.objects for all
  using (bucket_id = 'public-photos'
    and public.has_role(((storage.foldername(name))[1])::uuid, array['owner','manager']::public.app_role[]))
  with check (bucket_id = 'public-photos'
    and public.has_role(((storage.foldername(name))[1])::uuid, array['owner','manager']::public.app_role[]));

-- ============================================================================
--  PASO FINAL (una sola vez, después de tener tu cuenta y tu empresa creadas):
--  registra el sitio «khc» apuntando a tu empresa.
--
--    insert into public.web_sites (slug, org_id, name)
--    select 'khc', id, 'KHC Auto Import'
--    from public.organizations
--    order by created_at
--    limit 1
--    on conflict (slug) do update set org_id = excluded.org_id;
--
--  Comprobar con:
--    select slug, org_id, name from public.web_sites;
-- ============================================================================

-- ============================================================================
--  CONTRATO DE `publications.data` (lo que lee la web pública)
-- ----------------------------------------------------------------------------
--  {
--    "slug": "bmw-320d-touring-2018",
--    "title": "BMW Serie 3 Touring 320d Pack M",
--    "version": "320d 190 CV Steptronic xDrive",
--    "brand": "BMW", "model": "Serie 3 Touring",
--    "year": 2018, "km": 128000, "fuel": "Diésel", "transmission": "Automático",
--    "cv": 190, "cc": 1995, "co2": 128, "badge": "C", "segment": "Familiar",
--    "consumption": 4.9,            -- opcional, l/100 km (también acepta "consumo")
--    "color": "Negro Saphir",      -- opcional
--    "doors": 5,                   -- opcional, número de puertas
--    "traction": "Total xDrive",   -- opcional (Delantera / Trasera / Total …)
--    "previousOwners": 2,          -- opcional, propietarios anteriores
--    "firstRegDate": "2018-06-01", "originCountry": "Alemania",
--    "price": 21900, "priceNote": "Precio al contado, IVA incluido",
--    "description": "…texto comercial…",
--    "features": ["Tracción total xDrive", "Navegador profesional", "…"],
--    "warrantyMonths": 12, "financingText": "Financiación a medida. Consúltanos condiciones.",
--    "location": "A Coruña",
--    "photos": [{"path": "org/veh/1.jpg", "url": "https://…", "alt": "…", "cover": true}],
--    "publishedAt": "2026-10-02T10:00:00.000Z"
--  }
--
--  Todos los campos nuevos (consumption, color, doors, traction,
--  previousOwners) son OPCIONALES: la ficha pública los muestra solo si
--  vienen informados; si faltan, esa casilla no aparece.
--
--  NUNCA: precio de compra, costes, margen, VIN, matrícula, notas internas,
--  documentación ni datos del vendedor anterior.
-- ============================================================================
