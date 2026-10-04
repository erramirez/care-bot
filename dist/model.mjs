export const QUALITY = ['Very poor', 'Poor', 'Fair', 'Good', 'Very good'];
export const DEMEANOR = ['Very unsettled', 'Unsettled', 'Mixed / in between', 'Comfortable', 'Calm & content'];
export function dayKey(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function shiftDay(day, amount) {
  const d = new Date(`${day}T12:00:00`); d.setDate(d.getDate() + amount); return dayKey(d);
}
export function localStamp(value = new Date()) {
  return `${dayKey(value)}T${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}
export function sleepMetrics(start, end, awakeMinutes = 0) {
  const startTime = new Date(start).getTime(), endTime = new Date(end).getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) throw new Error('Enter both sleep times.');
  const intervalMinutes = Math.round((endTime - startTime) / 60000);
  if (intervalMinutes <= 0) throw new Error('The end time must be after the start time. Check the dates for overnight sleep.');
  if (intervalMinutes > 24 * 60) throw new Error('Please record one sleep period of 24 hours or less.');
  const awake = Number(awakeMinutes);
  if (!Number.isInteger(awake) || awake < 0 || awake > intervalMinutes) throw new Error('Awake time must be between zero and the full sleep period.');
  return { intervalMinutes, asleepMinutes: intervalMinutes - awake, awakeMinutes: awake };
}
export function validateRating(value) {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Choose a rating from 1 to 5.');
  return rating;
}
export function overlappingSleep(records, start, end, excludeId) {
  const begin = new Date(start).getTime(), finish = new Date(end).getTime();
  return records.find(record => record.id !== excludeId && new Date(record.start).getTime() < finish && new Date(record.end).getTime() > begin);
}
export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60), m = Math.round(minutes % 60);
  return `${h ? `${h}h` : ''}${h && m ? ' ' : ''}${m ? `${m}m` : ''}` || '0m';
}
export function medicationAt(med, day) {
  return [...med.versions].sort((a,b) => b.effectiveDate.localeCompare(a.effectiveDate) || b.created.localeCompare(a.created)).find(v => v.effectiveDate <= day);
}
export function doseKey(medId, day, time) { return `${medId}|${day}|${time}`; }
export function scheduledRoutines(routines, day) {
  return routines.filter(routine => routine.effectiveDate <= day && (routine.repeat !== 'once' || routine.effectiveDate === day));
}
export function duplicateDose(records, medId, scheduledDay, scheduledTime, excludeId) {
  return records.find(r => r.id !== excludeId && r.medId === medId && r.scheduledDay === scheduledDay && r.scheduledTime === scheduledTime);
}
export function revise(record, changes, author, reason, now = new Date().toISOString()) {
  if (!String(reason || '').trim()) throw new Error('Add a reason for the correction.');
  const { history, ...previous } = record;
  return {...record, ...changes, editedBy:author, editedAt:now, history:[...(history || []), {previous, reason:reason.trim(), author, at:now}]};
}
export function seed() {
  const today = dayKey(), yesterday = shiftDay(today, -1), tomorrow = shiftDay(today, 1);
  const created = new Date().toISOString(), oldDay = shiftDay(today, -14);
  const meds = [
    {id:'med-a', versions:[{name:'Medication A', strength:'Demo strength', dose:'1 demo tablet', route:'By mouth', instructions:'Fictional plan for the walkthrough. Replace only after reviewing the real instructions.', times:['08:00'], effectiveDate:oldDay, author:'Mom', source:'Fictional visit summary', reviewed:today, created}]},
    {id:'med-b', versions:[{name:'Medication B', strength:'Demo strength', dose:'1 demo tablet', route:'By mouth', instructions:'Fictional evening medication. This is sample information, not a prescription.', times:['20:00'], effectiveDate:oldDay, author:'Mom', source:'Fictional visit summary', reviewed:today, created}]}
  ];
  const sleeps = Array.from({length:6}, (_,i) => {
    const day = shiftDay(today, i - 5), minutes = [25,40,15,50,20,30][i];
    return {id:`sleep-${i}`, type:'Overnight', start:`${shiftDay(day,-1)}T22:00`, end:`${day}T06:30`, awakeMinutes:minutes, quality:[3,3,4,2,4,4][i], notes:i === 5 ? 'Woke briefly once, then settled again.' : '', author:'Mom', created};
  });
  const demeanor = Array.from({length:6}, (_,i) => ({id:`demeanor-${i}`, observed:`${shiftDay(today,i-5)}T09:00`, rating:[3,4,4,2,3,4][i], context:'Morning', notes:i === 5 ? 'Comfortable after breakfast. Enjoyed a little time outside.' : '', author:'Mom', created}));
  return {version:2, meds, doses:[{id:'dose-first', medId:'med-a', name:'Medication A', dose:'1 demo tablet', scheduledDay:today, scheduledTime:'08:00', actual:`${today}T08:05`, status:'Given', reason:'', author:'Mom', created, history:[]}],
    routines:[{id:'breakfast',name:'Breakfast',period:'Morning',details:'Start the day with a familiar meal.', effectiveDate:oldDay}, {id:'fresh-air',name:'A little fresh air',period:'Morning',details:'A short walk or time outside, if comfortable.', effectiveDate:oldDay}, {id:'lunch',name:'Lunch & a glass of water',period:'Afternoon',details:'A familiar routine.', effectiveDate:oldDay}, {id:'wind-down',name:'Quiet time together',period:'Evening',details:'Keep the evening relaxed.', effectiveDate:oldDay}],
    routineRecords:[{id:'routine-first',routineId:'breakfast',day:today,status:'Done',author:'Mom',notes:'',created}],
    appointments:[{id:'visit-first', title:'Follow-up visit', provider:'Demo care team', date:tomorrow, time:'14:00', location:'Demo clinic · Building A', transport:'Unassigned', preparation:'Bring the current medication list and our questions.', questions:[{text:'What should we keep track of between visits?',author:'Mom',created}], outcome:'', author:'Mom', created}],
    notes:[{id:'note-first',text:'Ate most of breakfast and enjoyed sitting outside.', category:'Appetite', observed:`${today}T09:15`, author:'Mom',followup:false,created,history:[]},{id:'note-second',text:'I can help with transportation for the next visit.', category:'Other', observed:`${yesterday}T17:30`,author:'You',followup:true,created,history:[]}], sleeps,demeanor,help:[], actor:'Mom',lastSaved:created};
}
