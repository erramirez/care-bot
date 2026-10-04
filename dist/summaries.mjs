import {dayKey,shiftDay,medicationAt,sleepMetrics,formatDuration,DEMEANOR} from './model.mjs';
export const TOPICS = ['Medications','Sleep','Behavior','Notes','Appointments'];
export function defaultPreferences() {
  return {enabled:false,channel:'email',destination:'',frequency:'daily',weekdays:['1'],time:'18:00',timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone||'America/Los_Angeles',coverage:'day',topics:[...TOPICS]};
}
export function validatePreferences(input) {
  const enabled=input.enabled===true, channel=input.channel, frequency=input.frequency;
  if(!['email','text'].includes(channel))throw new Error('Choose email or text.');
  if(!['daily','weekly','selected'].includes(frequency))throw new Error('Choose a delivery schedule.');
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time))throw new Error('Choose a delivery time.');
  try{new Intl.DateTimeFormat('en',{timeZone:input.timeZone});}catch{throw new Error('Choose a valid time zone.');}
  const weekdays=[...new Set(input.weekdays||[])].filter(d=>/^[0-6]$/.test(d));
  if(frequency!=='daily'&&!weekdays.length)throw new Error('Choose at least one delivery day.');
  if(frequency==='weekly'&&weekdays.length!==1)throw new Error('Choose one day for a weekly summary.');
  const topics=[...new Set(input.topics||[])].filter(t=>TOPICS.includes(t));
  if(!topics.length)throw new Error('Choose at least one topic.');
  if(!['day','week'].includes(input.coverage))throw new Error('Choose the period to summarize.');
  const destination=String(input.destination||'').trim();
  if(enabled&&channel==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination))throw new Error('Enter an email address. Use a fictional address for this demo.');
  if(enabled&&channel==='text'&&!/^\+[1-9]\d{7,14}$/.test(destination))throw new Error('Enter a phone number with country code, such as +12025550123.');
  return {enabled,channel,destination,frequency,weekdays,time:input.time,timeZone:input.timeZone,coverage:input.coverage,topics};
}
export function buildSampleSummary(state,prefs,today=dayKey()) {
  const end=shiftDay(today,-1),start=shiftDay(end,prefs.coverage==='week'?-6:0);
  const days=Array.from({length:prefs.coverage==='week'?7:1},(_,i)=>shiftDay(start,i));
  const inPeriod=stamp=>days.includes(stamp.slice(0,10));
  const sections=[],missing=[];
  if(prefs.topics.includes('Medications')) {
    const counts={Given:0,Skipped:0,Held:0,unrecorded:0};
    for(const day of days)for(const med of state.meds){const v=medicationAt(med,day);if(!v)continue;for(const time of v.times){const dose=state.doses.find(d=>d.medId===med.id&&d.scheduledDay===day&&d.scheduledTime===time);if(dose)counts[dose.status]++;else counts.unrecorded++;}}
    sections.push({title:'Medications',items:[`${counts.Given} scheduled doses recorded as given; ${counts.Skipped} skipped; ${counts.Held} held.`,`${counts.unrecorded} scheduled doses have no record. This does not mean they were missed.`],sources:state.doses.filter(d=>days.includes(d.scheduledDay)).map(d=>({kind:'dose-history',id:d.id,label:`${d.name} · ${d.scheduledDay} · ${d.status}`}))});
    if(counts.unrecorded)missing.push(`${counts.unrecorded} scheduled doses without a record.`);
  }
  if(prefs.topics.includes('Sleep')) {
    const records=state.sleeps.filter(s=>inPeriod(s.end)),total=records.reduce((sum,s)=>sum+sleepMetrics(s.start,s.end,s.awakeMinutes).asleepMinutes,0);
    const absent=days.filter(day=>!records.some(s=>s.end.startsWith(day))).length;
    sections.push({title:'Sleep',items:records.length?[`${records.length} sleep periods recorded, totaling ${formatDuration(total)} estimated asleep.`,...(records.length>1?['This total includes all recorded periods and naps.']:[]),...records.map(s=>`${s.end.slice(0,10)}: ${formatDuration(sleepMetrics(s.start,s.end,s.awakeMinutes).asleepMinutes)} estimated asleep${s.notes?` — ${s.notes}`:''}.`)]:['No sleep entries for this period.'],sources:records.map(s=>({kind:'sleep',id:s.id,label:`Sleep ending ${s.end.slice(0,10)}`}))});
    if(absent)missing.push(`No sleep entry on ${absent} ${absent===1?'day':'days'}.`);
  }
  if(prefs.topics.includes('Behavior')) {
    const records=state.demeanor.filter(d=>inPeriod(d.observed));
    sections.push({title:'Behavior',items:records.length?records.map(d=>`${d.observed.slice(0,10)}: ${d.rating}/5 — ${DEMEANOR[d.rating-1]} (${d.author})${d.notes?`. ${d.notes}`:''}`):['No behavior observations for this period.'],sources:records.map(d=>({kind:'demeanor',id:d.id,label:`${d.observed.slice(0,10)} · ${d.author}`}))});
    const absent=days.filter(day=>!records.some(d=>d.observed.startsWith(day))).length;
    if(absent)missing.push(`No behavior entry on ${absent} ${absent===1?'day':'days'}.`);
  }
  if(prefs.topics.includes('Notes')) {
    const records=state.notes.filter(n=>inPeriod(n.observed));
    sections.push({title:'Family notes',items:records.length?records.map(n=>`${n.author}: ${n.text}${n.followup?' (Family follow-up requested.)':''}`):['No family notes for this period.'],sources:records.map(n=>({kind:'edit-note',id:n.id,label:`${n.author} · ${n.observed.slice(0,10)}`}))});
  }
  if(prefs.topics.includes('Appointments')) {
    const records=state.appointments.filter(a=>a.date>=today&&a.date<=shiftDay(today,6)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    sections.push({title:'Coming up · next 7 days',items:records.length?records.map(a=>`${a.date} at ${a.time}: ${a.title}. Ride: ${a.transport}.`):['No appointments entered for the next seven days.'],sources:records.map(a=>({kind:'appointment',id:a.id,label:`${a.title} · ${a.date}`}))});
  }
  return {start,end,sections,missing};
}
