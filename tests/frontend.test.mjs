import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import harness from './frontend-harness.cjs';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('invitation uses editable content and server-backed RSVP',async()=>{
 const config=JSON.parse(read('defaults.json'));const key=Object.keys(config.content).find(k=>config.content[k]==='Briand');config.content[key]='Raka';config.stories[0].text='Cerita yang telah diedit';
 const e=harness.create(JSON.parse(read('tests/invitation-dom.json')),read('public/app.js'),config);await settle();
 assert.equal(e.root.querySelector(`[data-copy="${key}"]`).textContent,'Raka');assert.equal(e.$('bt-story-text').textContent,'Cerita yang telah diedit');
 e.api.openGate();e.$('bt-skip').emit('click');e.flush();await settle();assert.equal(e.api.getState().opened,true);assert.equal(e.api.getState().audioOn,true);
 for(let i=0;i<8;i++){e.api.go(i);assert.equal(e.root.querySelectorAll('[data-chamber]').filter(x=>!x.hidden).length,1);}
 e.$('bt-name').value='Tamu A';e.$('bt-attendance').value='Hadir';e.$('bt-guests').value='2';e.$('bt-wish').value='Semoga bahagia';e.$('bt-form').emit('submit');await settle();await settle();assert.equal(e.api.getState().guests,1);assert.equal(e.$('bt-form-status').textContent,config.messages.saved);
 e.root.querySelectorAll('[data-photo]')[1].emit('click');assert(e.$('bt-lightbox-caption').textContent.includes('Kisah Kami'));e.$('bt-lightbox-close').emit('click');
 e.api.closeGate();e.flush();assert.equal(e.api.getState().opened,false);
});
test('admin renders editors, applies changes, and saves draft',async()=>{
 const config=JSON.parse(read('defaults.json'));const e=harness.create(JSON.parse(read('tests/admin-dom.json')),read('public/admin.js'),config);await settle();await settle();assert.equal(e.$('app').hidden,false);
 const fields=e.$('fields').querySelectorAll('textarea,input');assert(fields.length>100);
 fields[0].value='Monogram Baru';fields[0].emit('input');e.$('save').emit('click');await settle();await settle();assert.equal(e.getSavedConfig().content[config.fields[0].key],'Monogram Baru');assert.equal(e.$('status').textContent,'Perubahan tersimpan.');assert(e.$('preview').src.startsWith('/?preview='));
});
