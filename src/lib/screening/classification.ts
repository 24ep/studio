import type { ScreeningIdentity, ScreeningSourceResult } from './types';

const CATEGORIES: Array<[string, RegExp]> = [
  ['harassment', /harass|abuse|bully|คุกคาม|ล่วงละเมิด|กลั่นแกล้ง/i],
  ['threat', /threat|intimidat|ข่มขู่|คุกคามชีวิต/i],
  ['violence', /assault|violence|attack|ทำร้าย|ความรุนแรง/i],
  ['fraud', /fraud|scam|embezz|corrupt|ฉ้อโกง|โกง|ทุจริต/i],
  ['professional_misconduct', /misconduct|disciplin|suspend|เพิกถอน|ลงโทษ/i],
  ['legal_record', /convict|judgment|charged|sanction|พิพากษา|ดำเนินคดี/i],
  ['ordinary_complaint', /complaint|alleg|ร้องเรียน|กล่าวหา/i],
];

export function classifyScreeningText(text: string) {
  return CATEGORIES.find(([, pattern]) => pattern.test(text))?.[0] || 'irrelevant';
}

export function scoreIdentityMatch(identity: ScreeningIdentity, result: ScreeningSourceResult) {
  const text = `${result.title} ${result.snippet || ''}`.toLowerCase();
  const signals: string[] = [];
  if (identity.name && text.includes(identity.name.toLowerCase())) signals.push('name');
  if (identity.employers.some(value => value.length > 2 && text.includes(value.toLowerCase()))) signals.push('employer');
  if (identity.location && text.includes(identity.location.toLowerCase())) signals.push('location');
  if (identity.jobTitle && text.includes(identity.jobTitle.toLowerCase())) signals.push('job_title');
  if (identity.education.some(value => value.length > 2 && text.includes(value.toLowerCase()))) signals.push('education');
  const confidence = Math.min(1, (signals.includes('name') ? 0.35 : 0) + (signals.includes('employer') ? 0.3 : 0) + (signals.includes('location') ? 0.15 : 0) + (signals.includes('job_title') ? 0.1 : 0) + (signals.includes('education') ? 0.1 : 0));
  return { confidence, signals };
}

export function isPotentialFinding(result: ScreeningSourceResult) {
  return classifyScreeningText(`${result.title} ${result.snippet || ''}`) !== 'irrelevant';
}
