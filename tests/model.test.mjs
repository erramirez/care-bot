import test from 'node:test';
import assert from 'node:assert/strict';
import {sleepMetrics,validateRating,revise,medicationAt,duplicateDose,seed,shiftDay,overlappingSleep,scheduledRoutines} from '../dist/model.mjs';
test('overnight sleep uses both dates and subtracts awake minutes', () => {
  assert.deepEqual(sleepMetrics('2026-10-01T22:00','2026-10-02T06:30',30),{intervalMinutes:510,asleepMinutes:480,awakeMinutes:30});
});
test('sleep rejects backwards dates, impossible awake time, and multi-day periods', () => {
  assert.throws(() => sleepMetrics('2026-10-02T22:00','2026-10-02T06:30',0));
  assert.throws(() => sleepMetrics('2026-10-01T22:00','2026-10-02T06:30',511));
  assert.throws(() => sleepMetrics('2026-10-01T22:00','2026-10-03T06:30',0));
  assert.throws(() => sleepMetrics('','',0));
});
test('unselected or out-of-range ratings cannot turn into observations', () => {
  for (const value of ['',0,6,2.5,'bad']) assert.throws(() => validateRating(value));
  assert.equal(validateRating('4'),4);
});
test('corrections retain original and subsequent changes with reasons', () => {
  const original={id:'a',rating:2,author:'Mom',history:[]};
  const first=revise(original,{rating:3},'You','Wrong selection');
  const second=revise(first,{rating:4},'Mom','Reviewed observation');
  assert.equal(second.history[0].previous.rating,2);
  assert.equal(second.history[1].previous.rating,3);
  assert.equal(original.rating,2);
  assert.throws(() => revise(original,{rating:4},'Mom',''));
});
test('effective-date medication versions preserve historical plans', () => {
  const med={versions:[{effectiveDate:'2026-10-01',created:'a',dose:'old'},{effectiveDate:'2026-10-04',created:'b',dose:'new'}]};
  assert.equal(medicationAt(med,'2026-10-02').dose,'old');
  assert.equal(medicationAt(med,'2026-10-04').dose,'new');
  assert.equal(medicationAt(med,'2026-09-30'),undefined);
});
test('dose uniqueness covers skipped and held outcomes, with correction exclusion', () => {
  const record={id:'1',medId:'a',scheduledDay:'2026-10-01',scheduledTime:'08:00',status:'Held'};
  assert.equal(duplicateDose([record],'a','2026-10-01','08:00'),record);
  assert.equal(duplicateDose([record],'a','2026-10-01','08:00','1'),undefined);
  assert.equal(duplicateDose([record],'a','2026-10-02','08:00'),undefined);
});
test('demo sleep samples remain valid and calendar shifts cross months', () => {
  seed().sleeps.forEach(s => assert.ok(sleepMetrics(s.start,s.end,s.awakeMinutes).asleepMinutes >= 0));
  assert.equal(shiftDay('2026-10-01',-1),'2026-09-30');
});
test('sleep overlap detects partial and enclosed periods but allows adjacent periods and self correction', () => {
  const existing={id:'a',start:'2026-10-01T22:00',end:'2026-10-02T06:30'};
  assert.equal(overlappingSleep([existing],'2026-10-02T06:00','2026-10-02T07:00'),existing);
  assert.equal(overlappingSleep([existing],'2026-10-02T02:00','2026-10-02T03:00'),existing);
  assert.equal(overlappingSleep([existing],'2026-10-01T21:00','2026-10-02T07:00'),existing);
  assert.equal(overlappingSleep([existing],'2026-10-02T06:30','2026-10-02T07:00'),undefined);
  assert.equal(overlappingSleep([existing],existing.start,existing.end,'a'),undefined);
});
test('one-time activities do not recur and daily activities start on their effective date', () => {
  const routines=[{id:'once',repeat:'once',effectiveDate:'2026-10-04'},{id:'daily',repeat:'daily',effectiveDate:'2026-10-04'},{id:'legacy',effectiveDate:'2026-10-01'}];
  assert.deepEqual(scheduledRoutines(routines,'2026-10-03').map(r=>r.id),['legacy']);
  assert.deepEqual(scheduledRoutines(routines,'2026-10-04').map(r=>r.id),['once','daily','legacy']);
  assert.deepEqual(scheduledRoutines(routines,'2026-10-05').map(r=>r.id),['daily','legacy']);
});
