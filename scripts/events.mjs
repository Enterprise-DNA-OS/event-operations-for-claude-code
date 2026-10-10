#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table as formatTable} from './lib/format.mjs';

export const reads={
 events:'select code,name,starts_on,venue,capacity,confirmed,waiting,spaces from events.event_summary order by starts_on,code',
 registrations:'select e.code,r.id,r.name,r.email,r.company,r.status,r.checked_in_at from events.registrants r join events.events e on e.id=r.event_id order by e.code,r.name',
 sessions:'select code,name,room,starts_at,ends_at,capacity,booked,spaces,speaker from events.session_capacity order by starts_at,name',
 waitlist:"select e.code,r.name,r.company,r.created_at from events.registrants r join events.events e on e.id=r.event_id where r.status='waitlisted' order by r.created_at,r.name",
 'speaker-chase':'select e.code,s.id,s.name,s.owner,s.brief_due,current_date-s.brief_due as days_overdue from events.speakers s join events.events e on e.id=s.event_id where not s.brief_received order by s.brief_due,s.name',
 'sponsor-chase':"select e.code,d.id,d.sponsor,d.item,d.owner,d.due_on,current_date-d.due_on as days_overdue from events.deliverables d join events.events e on e.id=d.event_id where d.status='open' order by d.due_on,d.sponsor",
 'run-sheet':'select code,name,room,starts_at,ends_at,speaker,booked from events.session_capacity order by starts_at,room',
 attention:'select * from events.attention order by due_on,code,item',
 compliance:'select * from events.compliance order by code,rule,record',
 retention:'select e.code,r.id,r.name,r.status,r.retention_review_on from events.registrants r join events.events e on e.id=r.event_id where r.retention_review_on is null or r.retention_review_on<current_date order by e.code,r.name',
 attendance:"select e.code,count(r.id) filter(where r.status='confirmed') as confirmed,count(r.id) filter(where r.checked_in_at is not null and r.status='confirmed') as arrived from events.events e left join events.registrants r on r.event_id=e.id group by e.code order by e.code",
 organisations:"select r.company,count(distinct r.event_id) as events,count(*) as confirmed_registrations from events.registrants r where r.status='confirmed' group by r.company order by confirmed_registrations desc,r.company",
 activity:'select e.code,a.actor,a.action,a.detail,a.created_at from events.activity a join events.events e on e.id=a.event_id order by a.created_at desc,a.id'
};
export const jobs=['event','weekly-review','add-event','add-session','add-speaker','register','confirm','cancel','allocate','unallocate','check-in','receive-brief','add-deliverable','complete-deliverable','privacy-review','event-review','log','draft-brief','import','export','help'];
export const commands=[...Object.keys(reads),...jobs];
function opts(argv){const out={_:[]};for(const x of argv){if(x.startsWith('--')){const at=x.indexOf('=');const k=x.slice(2,at<0?undefined:at);if(k in out)throw Error(`Duplicate flag ${k}`);out[k]=at<0?true:x.slice(at+1);}else out._.push(x);}return out;}
const required=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`Required --${k}=value`);return o[k].trim();};
const positive=(v)=>{if(!/^\d+$/.test(String(v))||Number(v)<1||Number(v)>1000000)throw Error('Capacity must be a positive integer at most 1000000');return Number(v);};
function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(`Invalid date: ${v}`);return v;}
function instant(v){if(!/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v)||!Number.isFinite(Date.parse(v)))throw Error('Timestamp needs an explicit UTC offset');return new Date(v).toISOString();}
function email(v){v=v.toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))throw Error('Invalid email');return v;}
export async function match(db,table,value,eventId=null){
 if(!['events','registrants','sessions','speakers','deliverables'].includes(table))throw Error('Invalid record type');
 const label=table==='deliverables'?"sponsor||': '||item":'name';
 const extra=table==='events'?' or lower(code)=lower($1)':table==='registrants'?' or lower(email)=lower($1)':'';
 const rows=await db.query(`select *,${label} as label from events.${table} where (left(id::text,length($1))=lower($1) or lower(${label})=lower($1)${extra})${eventId?' and event_id=$2':''} order by id`,eventId?[value,eventId]:[value]);
 if(rows.length!==1)throw Error(rows.length?`Ambiguous ${table}: ${rows.map(r=>`${r.id} ${r.label}`).join('; ')}`:`No ${table} matched ${value}`);
 return rows[0];
}
async function audit(db,event,actor,action,detail){await db.query('insert into events.activity(event_id,actor,action,detail) values($1,$2,$3,$4)',[event,actor,action,detail]);}
async function room(db,e){const [r]=await db.query("select count(*)::int as n from events.registrants where event_id=$1 and status='confirmed'",[e.id]);if(r.n>=e.capacity)throw Error('Event is full; register on the waitlist');}
async function lockedEvent(db,o){const e=await match(db,'events',required(o,'event'));await db.query('select id from events.events where id=$1 for update',[e.id]);return e;}
export async function run(db,argv){
 const [cmd='help',...rest]=argv,o=opts(rest);
 if(!commands.includes(cmd))throw Error(`Unknown command ${cmd}; run help`);
 const common=['json'];
 const spec={event:['event'],'weekly-review':[], 'add-event':['code','name','start','end','venue','capacity','owner','timezone','actor'],'add-session':['event','name','room','start','end','capacity','speaker','actor'],'add-speaker':['event','name','owner','due','actor'],register:['event','name','email','company','status','actor'],confirm:['event','person','actor'],cancel:['event','person','actor'],allocate:['event','person','session','actor'],unallocate:['event','person','session','actor'],'check-in':['event','person','actor'],'receive-brief':['event','speaker','actor'],'add-deliverable':['event','sponsor','item','owner','due','actor'],'complete-deliverable':['event','deliverable','evidence','actor'],'privacy-review':['event','person','notice','retention','actor'],'event-review':['event','notice','security-date','actor'],log:['event','note','actor'],'draft-brief':['event'],import:['event','file','mapping','dry-run','actor'],export:['out'],help:[]};
 for(const k of Object.keys(o).filter(k=>k!=='_'))if(!common.includes(k)&&!(spec[cmd]||[]).includes(k))throw Error(`Unknown --${k} for ${cmd}`);
 if(o._.length && !(cmd==='import'&&o._.length===1&&o._[0]==='swoogo'))throw Error('Unexpected positional argument');
 if(cmd==='help')return commands.map(command=>({command,flags:(spec[command]||[]).map(k=>`--${k}`).join(' ')}));
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='weekly-review'){const out={};for(const k of ['events','sessions','attention','compliance'])out[k]=await db.query(reads[k]);return out;}
 if(cmd==='event'||cmd==='draft-brief'){
  const e=await match(db,'events',required(o,'event'));
  const out={event:e,sessions:await db.query('select * from events.session_capacity where event_id=$1 order by starts_at,name',[e.id]),attention:await db.query('select * from events.attention where code=$1 order by due_on,item',[e.code])};
  if(cmd==='event')return out;
  const dir=path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,`brief-${e.id}-${Date.now()}.md`);
  fs.writeFileSync(file,`# ${e.name}: internal event brief\n\nDRAFT. Review before sharing.\n\n${JSON.stringify(out,null,2)}\n`);return {file};
 }
 if(cmd==='export'){
  const out={format:'event-operations-v1',exported_at:new Date().toISOString()};for(const t of ['events','registrants','sessions','speakers','bookings','deliverables','activity'])out[t]=await db.query(`select * from events.${t} order by id`);
  if(o.out){const file=path.resolve(required(o,'out'));fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(out,null,2));return {file,records:Object.values(out).filter(Array.isArray).reduce((n,a)=>n+a.length,0)};}return out;
 }
 const actor=required(o,'actor');
 await db.exec('BEGIN');
 try{
  let result;
  if(cmd==='add-event'){
   const start=date(required(o,'start')),end=date(required(o,'end'));const timezone=o.timezone||'Pacific/Auckland';try{new Intl.DateTimeFormat('en',{timeZone:timezone});}catch{throw Error('Unknown timezone');}
   const [e]=await db.query('insert into events.events(code,name,starts_on,ends_on,venue,capacity,owner,timezone) values($1,$2,$3,$4,$5,$6,$7,$8) returning *',[required(o,'code'),required(o,'name'),start,end,required(o,'venue'),positive(required(o,'capacity')),required(o,'owner'),timezone]);await audit(db,e.id,actor,cmd,e.name);result=e;
  }else{
   const e=await lockedEvent(db,o);
   const person=()=>match(db,'registrants',required(o,'person'),e.id);
   if(cmd==='import')result=await importSwoogo(db,e,o);
   else if(cmd==='register'){
    const status=o.status||'confirmed';if(!['confirmed','waitlisted','incomplete'].includes(status))throw Error('Invalid new registration status');if(status==='confirmed')await room(db,e);
    [result]=await db.query('insert into events.registrants(event_id,name,email,company,status) values($1,$2,$3,$4,$5) returning *',[e.id,required(o,'name'),email(required(o,'email')),o.company||'',status]);
   }else if(['confirm','cancel','check-in','privacy-review'].includes(cmd)){
    const p=await person();
    if(cmd==='confirm'){if(p.status==='cancelled')throw Error('Cancelled registrations cannot be reconfirmed; reconcile explicitly');if(p.status!=='confirmed')await room(db,e);[result]=await db.query("update events.registrants set status='confirmed' where id=$1 returning *",[p.id]);}
    if(cmd==='cancel'){await db.query('delete from events.bookings where registrant_id=$1',[p.id]);[result]=await db.query("update events.registrants set status='cancelled',checked_in_at=null where id=$1 returning *",[p.id]);}
    if(cmd==='check-in'){if(p.status!=='confirmed')throw Error('Only confirmed registrations can check in');[result]=await db.query('update events.registrants set checked_in_at=coalesce(checked_in_at,now()) where id=$1 returning *',[p.id]);}
    if(cmd==='privacy-review'){[result]=await db.query('update events.registrants set notice_review=$2,retention_review_on=$3 where id=$1 returning *',[p.id,required(o,'notice'),date(required(o,'retention'))]);}
   }else if(cmd==='add-speaker'){
    [result]=await db.query('insert into events.speakers(event_id,name,owner,brief_due) values($1,$2,$3,$4) returning *',[e.id,required(o,'name'),required(o,'owner'),date(required(o,'due'))]);
   }else if(cmd==='receive-brief'){
    const s=await match(db,'speakers',required(o,'speaker'),e.id);[result]=await db.query('update events.speakers set brief_received=true where id=$1 returning *',[s.id]);
   }else if(cmd==='add-session'){
    const start=instant(required(o,'start')),end=instant(required(o,'end'));if(start>=end)throw Error('Session end must follow start');
    const [bounds]=await db.query('select ($1::timestamptz at time zone $3)::date >= $4::date and ($2::timestamptz at time zone $3)::date <= $5::date as ok',[start,end,e.timezone,e.starts_on,e.ends_on]);if(!bounds.ok)throw Error('Session lies outside event dates in its timezone');
    const speaker=o.speaker?await match(db,'speakers',o.speaker,e.id):null;
    const conflicts=await db.query('select name from events.sessions where event_id=$1 and starts_at<$3 and ends_at>$2 and (lower(room)=lower($4) or speaker_id=$5)',[e.id,start,end,required(o,'room'),speaker?.id||null]);if(conflicts.length)throw Error('Room or speaker schedule conflict');
    [result]=await db.query('insert into events.sessions(event_id,name,room,starts_at,ends_at,capacity,speaker_id) values($1,$2,$3,$4,$5,$6,$7) returning *',[e.id,required(o,'name'),o.room,start,end,positive(required(o,'capacity')),speaker?.id||null]);
   }else if(cmd==='allocate'||cmd==='unallocate'){
    const p=await person(),s=await match(db,'sessions',required(o,'session'),e.id);
    if(cmd==='unallocate'){result=await db.query('delete from events.bookings where registrant_id=$1 and session_id=$2 returning *',[p.id,s.id]);}
    else{
     if(p.status!=='confirmed')throw Error('Only confirmed registrations can book sessions');
     const existing=await db.query('select * from events.bookings where registrant_id=$1 and session_id=$2',[p.id,s.id]);
     if(existing.length)result=existing[0];else{
      const [cap]=await db.query('select spaces from events.session_capacity where id=$1',[s.id]);if(Number(cap.spaces)<=0)throw Error('Session is full');
      const clash=await db.query('select s.name from events.bookings b join events.sessions s on s.id=b.session_id where b.registrant_id=$1 and s.starts_at<$3 and s.ends_at>$2',[p.id,s.starts_at,s.ends_at]);if(clash.length)throw Error('Attendee schedule conflict');
      [result]=await db.query('insert into events.bookings(event_id,registrant_id,session_id) values($1,$2,$3) returning *',[e.id,p.id,s.id]);
     }
    }
   }else if(cmd==='add-deliverable'){
    [result]=await db.query('insert into events.deliverables(event_id,sponsor,item,owner,due_on) values($1,$2,$3,$4,$5) returning *',[e.id,required(o,'sponsor'),required(o,'item'),required(o,'owner'),date(required(o,'due'))]);
   }else if(cmd==='complete-deliverable'){
    const d=await match(db,'deliverables',required(o,'deliverable'),e.id);[result]=await db.query("update events.deliverables set status='done',evidence=$2 where id=$1 returning *",[d.id,required(o,'evidence')]);
   }else if(cmd==='event-review'){
    const review=date(required(o,'security-date'));const [today]=await db.query('select current_date::text as day');if(review>today.day)throw Error('Security review cannot be future dated');
    [result]=await db.query('update events.events set privacy_notice=$2,security_review_on=$3 where id=$1 returning *',[e.id,required(o,'notice'),review]);
   }else if(cmd==='log')result={note:required(o,'note')};
   await audit(db,e.id,actor,cmd,cmd==='log'?o.note:JSON.stringify({id:result?.id||null,import:cmd==='import'?result:undefined}));
  }
  if(o['dry-run'])await db.exec('ROLLBACK');else await db.exec('COMMIT');
  return result;
 }catch(err){await db.exec('ROLLBACK');throw err;}
}
async function importSwoogo(db,e,o){
 if(o._[0]!=='swoogo')throw Error('Use import swoogo --file=... --event=...');
 const rows=parseCsv(fs.readFileSync(required(o,'file'),'utf8'));if(!rows.length)throw Error('CSV has no records');
 const mapping=o.mapping?JSON.parse(fs.readFileSync(required(o,'mapping'),'utf8')):{};
 const cols={id:['id','Registrant ID','Registration ID'],first:['first_name','First Name'],last:['last_name','Last Name'],email:['email','Email','Email Address'],company:['company','Company'],status:['registration_status','Registration Status'],event:['event_id','Event ID']};
 for(const k of Object.keys(mapping))if(!(k in cols)||typeof mapping[k]!=='string')throw Error(`Invalid mapping ${k}`);
 const get=(row,k)=>pick(row,...(mapping[k]?[mapping[k]]:cols[k]));
 const ids=new Set(),emails=new Set(),eventIds=new Set();let inserted=0,skipped=0;
 for(const [i,row] of rows.entries()){
  const id=get(row,'id').trim(),name=[get(row,'first').trim(),get(row,'last').trim()].filter(Boolean).join(' '),mail=email(get(row,'email').trim());
  if(!id||!name)throw Error(`Row ${i+2} needs source ID and name`);if(ids.has(id)||emails.has(mail))throw Error('Duplicate source ID or email in import');ids.add(id);emails.add(mail);
  const sourceEvent=get(row,'event').trim();
  if(sourceEvent){
   eventIds.add(sourceEvent);
   if(eventIds.size>1)throw Error('Export one event at a time');
   if(e.source_event_id&&e.source_event_id!==sourceEvent)throw Error('Source event does not match the destination binding');
   if(!e.source_event_id){await db.query('update events.events set source_event_id=$2 where id=$1',[e.id,sourceEvent]);e.source_event_id=sourceEvent;}
  }
  const sourceStatus=get(row,'status').trim().toLowerCase();const status=({confirmed:'confirmed',complete:'confirmed',cancelled:'cancelled',canceled:'cancelled',waitlisted:'waitlisted',waitlist:'waitlisted',incomplete:'incomplete'})[sourceStatus];if(!status)throw Error(`Unknown registration status: ${sourceStatus||'(missing)'}`);
  const hash=createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(row).sort(([a],[b])=>a.localeCompare(b))))).digest('hex');
  const previous=await db.query('select source_hash from events.registrants where event_id=$1 and source_id=$2',[e.id,id]);
  if(previous.length){if(previous[0].source_hash!==hash)throw Error(`Source ${id} changed; reconcile before reimport`);skipped++;continue;}
  if(status==='confirmed')await room(db,e);
  await db.query('insert into events.registrants(event_id,name,email,company,status,collection_source,source_id,source_data,source_hash) values($1,$2,$3,$4,$5,$6,$7,$8,$9)',[e.id,name,mail,get(row,'company'),status,'imported',id,JSON.stringify(row),hash]);inserted++;
 }
 return {inserted,skipped,dry_run:Boolean(o['dry-run']),notice:'Source fields preserved; review privacy and retention. Session allocations are reconciled separately.'};
}
export function display(value){
 if(Array.isArray(value)){
  if(!value.length)return 'No records.';const cols=Object.keys(value[0]);const str=v=>v===null?'':v instanceof Date?v.toISOString():typeof v==='object'?JSON.stringify(v):String(v);
  return formatTable(value,cols.map(key=>({key,label:key.replaceAll('_',' '),width:70,format:str})));
 }
 if(value&&typeof value==='object')return Object.entries(value).map(([k,v])=>`${k}:\n${Array.isArray(v)?display(v):typeof v==='object'?JSON.stringify(v,null,2):String(v)}`).join('\n\n');
 return String(value);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();const out=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(out,null,2):display(out));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
