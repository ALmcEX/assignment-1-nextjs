import { describe, expect, it } from 'vitest';
import { validateRant, validateComment, validateRantPhoto } from './validation';
const input = { title: '  Laundry  ', location: ' Butler ', body: ' A real rant ' };
describe('publication boundaries', () => {
 it('trims text and accepts a manual post without a photo', () => {
  expect(validateRant(input)).toEqual({ title:'Laundry', location:'Butler', body:'A real rant', imagePath:null, generationId:null });
 });
 it('rejects blank, oversized and non-string fields', () => {
  for (const value of [{...input,title:' '},{...input,body:'a'.repeat(3001)},{...input,location:'a'.repeat(121)},null,{...input,title:42}]) expect(() => validateRant(value)).toThrow();
  expect(validateRant({...input,title:'a'.repeat(120),body:'a'.repeat(3000)}).body).toHaveLength(3000);
 });
 it('rejects malformed generation references', () => {
  expect(() => validateRant({...input,generationId:'someone-elses-id'})).toThrow();
 });
 it('validates comments independently', () => {
  expect(validateComment(' hello ')).toBe('hello');
  expect(() => validateComment(' ')).toThrow();
  expect(() => validateComment('x'.repeat(1001))).toThrow();
 });
 it('accepts one optional valid photo and rejects oversized or active files', () => {
  expect(() => validateRantPhoto(null)).not.toThrow();
  expect(() => validateRantPhoto(new File(['ok'],'a.jpg',{type:'image/jpeg'}))).not.toThrow();
  expect(() => validateRantPhoto(new File(['<svg/>'],'a.svg',{type:'image/svg+xml'}))).toThrow();
  expect(() => validateRantPhoto(new File([new Uint8Array(5242881)],'big.png',{type:'image/png'}))).toThrow();
 });
});
