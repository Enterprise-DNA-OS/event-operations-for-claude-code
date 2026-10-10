create schema events;
revoke all on schema events from public;
create function events.touch() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table events.events (
 id uuid primary key default gen_random_uuid(), code text unique not null, name text not null check(length(trim(name))>0),
 starts_on date not null, ends_on date not null, timezone text not null default 'Pacific/Auckland', venue text not null,
 capacity integer not null check(capacity>0), owner text not null, privacy_notice text,
 security_review_on date, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_on>=starts_on)
);
create table events.registrants (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references events.events, name text not null,
 email text not null check(email like '%_@_%._%'), company text not null default '',
 status text not null check(status in ('confirmed','waitlisted','cancelled','incomplete')),
 collection_source text not null default 'direct' check(collection_source in ('direct','imported')),
 notice_review text, retention_review_on date, checked_in_at timestamptz,
 source_id text, source_data jsonb, source_hash text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(event_id,source_id), unique(event_id,email), unique(event_id,id)
);
create table events.speakers (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references events.events, name text not null,
 owner text not null, brief_due date not null, brief_received boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(event_id,id)
);
create table events.sessions (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references events.events,
 name text not null, room text not null, starts_at timestamptz not null, ends_at timestamptz not null,
 capacity integer not null check(capacity>0), speaker_id uuid,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(ends_at>starts_at), unique(event_id,id), foreign key(event_id,speaker_id) references events.speakers(event_id,id)
);
create table events.bookings (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references events.events,
 registrant_id uuid not null, session_id uuid not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(registrant_id,session_id), foreign key(event_id,registrant_id) references events.registrants(event_id,id),
 foreign key(event_id,session_id) references events.sessions(event_id,id)
);
create table events.deliverables (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references events.events,
 sponsor text not null, item text not null, owner text not null, due_on date not null,
 status text not null default 'open' check(status in ('open','done')), evidence text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status<>'done' or length(trim(evidence))>0)
);
create table events.activity (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references events.events,
 actor text not null, action text not null, detail text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
do $$ declare t text; begin foreach t in array array['events','registrants','speakers','sessions','bookings','deliverables','activity'] loop
 execute format('create trigger touch before update on events.%I for each row execute function events.touch()',t);
 execute format('alter table events.%I enable row level security',t);
 execute format('revoke all on events.%I from public',t);
 end loop; end $$;
create view events.event_summary as
 select e.id,e.code,e.name,e.starts_on,e.venue,e.owner,e.capacity,
 (select count(*) from events.registrants r where r.event_id=e.id and r.status='confirmed') as confirmed,
 (select count(*) from events.registrants r where r.event_id=e.id and r.status='waitlisted') as waiting,
 e.capacity-(select count(*) from events.registrants r where r.event_id=e.id and r.status='confirmed') as spaces
 from events.events e;
create view events.session_capacity as
 select s.id,s.event_id,e.code,s.name,s.room,s.starts_at,s.ends_at,s.capacity,
 count(b.id) as booked,s.capacity-count(b.id) as spaces,sp.name as speaker
 from events.sessions s join events.events e on e.id=s.event_id
 left join events.bookings b on b.session_id=s.id left join events.speakers sp on sp.id=s.speaker_id
 group by s.id,e.code,sp.name;
create view events.attention as
 select e.code,'speaker brief'::text as kind,s.name as item,s.owner,s.brief_due as due_on
 from events.speakers s join events.events e on e.id=s.event_id where not s.brief_received
 union all select e.code,'sponsor delivery',d.sponsor||': '||d.item,d.owner,d.due_on
 from events.deliverables d join events.events e on e.id=d.event_id where d.status='open';
create view events.compliance as
 select e.code,'notice missing'::text as rule,e.name as record,'NZ IPP 3: review notice evidence'::text as action
 from events.events e where nullif(trim(e.privacy_notice),'') is null
 union all select e.code,'security review due',e.name,'NZ IPP 5: record safeguards review; 90 days is local policy'
 from events.events e where e.security_review_on is null or e.security_review_on<current_date-90
 union all select e.code,'retention review',r.name,'NZ IPP 9: decide lawful purpose; do not delete automatically'
 from events.registrants r join events.events e on e.id=r.event_id where r.retention_review_on is null or r.retention_review_on<current_date
 union all select e.code,'import notice review',r.name,'NZ IPP 3A: assess indirect collection applicability and exceptions'
 from events.registrants r join events.events e on e.id=r.event_id where r.collection_source='imported' and nullif(trim(r.notice_review),'') is null;
revoke all on all tables in schema events from public;
