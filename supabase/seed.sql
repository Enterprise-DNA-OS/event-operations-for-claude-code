insert into events.events(id,code,name,starts_on,ends_on,venue,capacity,owner,privacy_notice,security_review_on) values
('10000000-0000-0000-0000-000000000001','HARBOUR','Harbour Operations Forum',current_date+14,current_date+14,'Wellington Harbour Rooms',3,'Mere','Fictional notice v1',current_date-110),
('10000000-0000-0000-0000-000000000002','SPRING','Spring Partner Briefing',current_date-30,current_date-30,'Auckland Studio',20,'Arun',null,current_date) on conflict do nothing;
insert into events.registrants(id,event_id,name,email,company,status,retention_review_on) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Aroha King','aroha@example.test','Harbour Advisory','confirmed',current_date+90),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Ben Ng','ben@example.test','Harbour Advisory','confirmed',current_date+90),
('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','Casey Brown','casey@example.test','Coastal Partners','waitlisted',current_date+90),
('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000002','Dev Patel','dev@example.test','Coastal Partners','confirmed',current_date-1) on conflict do nothing;
insert into events.speakers(id,event_id,name,owner,brief_due,brief_received) values
('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Leah Chen','Mere',current_date-2,false),
('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Noah West','Arun',current_date+3,true) on conflict do nothing;
insert into events.sessions(id,event_id,name,room,starts_at,ends_at,capacity,speaker_id) values
('40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Operations Clinic','Harbour A',(current_date+14)+time '01:00',(current_date+14)+time '02:00',1,'30000000-0000-0000-0000-000000000001'),
('40000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Partner Roundtable','Harbour B',(current_date+14)+time '01:00',(current_date+14)+time '02:00',4,'30000000-0000-0000-0000-000000000002') on conflict do nothing;
insert into events.bookings(event_id,registrant_id,session_id) values ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001') on conflict do nothing;
insert into events.deliverables(id,event_id,sponsor,item,owner,due_on) values
('50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Koru Partners','Approved logo for programme','Mere',current_date-3),
('50000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Southern Group','Workshop briefing','Arun',current_date+4) on conflict do nothing;
