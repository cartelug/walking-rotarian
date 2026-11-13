import test from 'node:test';
import assert from 'node:assert/strict';
import {donationDetails,donationMessage} from '../src/assets/platform/donation-model.js';
test('education pledges derive the amount from whole steps and always use UGX',()=>{
 const d=donationDetails({purpose:'education',steps:'20',currency:'USD',amount:'1',name:'A supporter'});
 assert.equal(d.amount,100000);assert.equal(d.currency,'UGX');assert.equal(d.steps,20);
 for(const steps of [0,4,5.1,1000001,'not a number',Infinity])assert.throws(()=>donationDetails({purpose:'education',steps,name:'A supporter'}));
 assert.equal(donationDetails({purpose:'education',steps:5,name:'A supporter'}).amount,25000);
 assert.equal(donationDetails({purpose:'education',steps:1000000,name:'A supporter'}).amount,5000000000);
});
test('personal gifts reject non-finite values and invalid currency precision',()=>{
 for(const amount of [0,-1,'',Infinity,NaN,1000000001,1.5])assert.throws(()=>donationDetails({purpose:'personal',amount,name:'A supporter',currency:'UGX'}));
 assert.equal(donationDetails({amount:'12.50',name:'A supporter',currency:'USD'}).amount,12.5);
 assert.throws(()=>donationDetails({amount:'12.555',name:'A supporter',currency:'USD'}));
 assert.throws(()=>donationDetails({amount:50000,name:'   '}));
});
test('reviewed requests keep purpose, currency and Unicode while avoiding payment claims',()=>{
 const d=donationDetails({purpose:'education',steps:7,name:'  Café\nWalker  ',note:'With love & hope — Uganda.'});
 const msg=donationMessage(d);
 assert.equal(d.name,'Café Walker');assert.match(msg,/Walk for Education/);assert.match(msg,/UGX 35,000/);assert.match(msg,/Symbolic steps:\* 7/);assert.match(msg,/authorised recipient/);assert.match(msg,/not made payment/);assert.match(msg,/With love & hope — Uganda/);
});
