import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultPreferences,validatePreferences,buildSampleSummary} from '../dist/summaries.mjs';
import {seed,dayKey,shiftDay} from '../dist/model.mjs';
test('enabled delivery requires correct destination and schedule settings',()=>{
 const p={...defaultPreferences(),enabled:true,destination:'mom@example.com'};
 assert.equal(validatePreferences(p).channel,'email');
 assert.throws(()=>validatePreferences({...p,destination:''}));
 assert.throws(()=>validatePreferences({...p,channel:'text',destination:'123'}));
 assert.equal(validatePreferences({...p,channel:'text',destination:'+12025550123'}).channel,'text');
 assert.throws(()=>validatePreferences({...p,frequency:'weekly',weekdays:['1','3']}));
 assert.throws(()=>validatePreferences({...p,frequency:'selected',weekdays:[]}));
 assert.throws(()=>validatePreferences({...p,timeZone:'Not/AZone'}));
 assert.throws(()=>validatePreferences({...p,topics:[]}));
});
test('paused preferences can be saved without contact details',()=>{
 assert.equal(validatePreferences(defaultPreferences()).enabled,false);
});
test('sample uses previous complete day, excludes today, and preserves missing dose language',()=>{
 const state=seed(),p=defaultPreferences(),today=dayKey(),yesterday=shiftDay(today,-1);
 state.doses.push({id:'yesterday-dose',medId:'med-a',scheduledDay:yesterday,scheduledTime:'08:00',status:'Given',name:'Medication A'});
 const sample=buildSampleSummary(state,p,today);
 assert.equal(sample.start,yesterday);assert.equal(sample.end,yesterday);
 assert.match(sample.sections[0].items[0],/^1 scheduled doses/);
 assert.match(sample.sections[0].items[1],/^1 scheduled doses have no record/);
 assert.ok(!sample.sections[0].sources.some(s=>s.id==='dose-first'));
});
test('topic exclusion keeps unselected source data out of previews',()=>{
 const sample=buildSampleSummary(seed(),{...defaultPreferences(),topics:['Sleep'],coverage:'week'});
 assert.equal(sample.sections.length,1);assert.equal(sample.sections[0].title,'Sleep');
 assert.equal(sample.sections[0].sources.every(s=>s.kind==='sleep'),true);
});
