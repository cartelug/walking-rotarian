import test from 'node:test';
import assert from 'node:assert/strict';
import {rankSearch} from '../src/assets/platform/experience-model.js';
const documents=[{title:'An afternoon on the road',body:'A welcome in Nairobi on the education walk',place:'Kenya'},{title:'Walk for Education',body:'Learning at Kagando',route:'Nairobi to Kagando'},{title:'A shared finish',body:'Supporters in Kiburara',place:'Kasese'}];
test('quick search combines place and purpose across fields',()=>{assert.equal(rankSearch(documents,'Nairobi education').length,2);assert.deepEqual(rankSearch(documents,'Kasese supporters').map(d=>d.title),['A shared finish']);});
test('quick search puts a matching title ahead of incidental body mentions',()=>{assert.equal(rankSearch(documents,'education')[0].title,'Walk for Education');assert.equal(rankSearch(documents,'unknown').length,0);});
test('quick search handles accents, whitespace and limited suggestions',()=>{assert.equal(rankSearch([{title:'Café conversations'}],' cafe ')[0].title,'Café conversations');assert.equal(rankSearch(documents,'   ',2).length,2);});
