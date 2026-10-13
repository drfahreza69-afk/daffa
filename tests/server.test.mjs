import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'bt-invitation-test-'));
let child,base;
const password='test-password-for-suite-only';
async function start(){child=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,PORT:'0',DATA_DIR:directory,ADMIN_PASSWORD:password},stdio:['ignore','pipe','pipe']});let output='';await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Startup timeout')),10000);child.stdout.on('data',buffer=>{output+=buffer;const m=/port (\d+)/.exec(output);if(m){base='http://127.0.0.1:'+m[1];clearTimeout(timeout);resolve();}});child.on('error',reject);child.on('exit',code=>{if(!base)reject(new Error('Server exited '+code));});});}
async function stop(){if(!child)return;const current=child;child=null;await new Promise(resolve=>{current.once('exit',resolve);current.kill('SIGTERM');});}
function request(url,method='GET',data=null,headers={}){return fetch(base+url,{method,headers:{Origin:base,...(data?{'Content-Type':'application/json'}:{}),...headers},body:data?JSON.stringify(data):undefined});}
test('editor persists safely and RSVP works across restarts',async()=>{
 try{
  await start();
  assert.equal((await request('/health')).status,200);
  for(const file of ['/base.css?v=2.1.0','/royal.css?v=2.1.0','/palace.js?v=2.1.0','/assets/palace-v2.webp','/assets/couple-room.webp','/assets/door-atlas.webp'])assert.equal((await request(file)).status,200);
  assert.equal((await request('/api/admin/state')).status,401);
  assert.equal((await request('/api/login','POST',{password:'wrong-password'})).status,401);
  const login=await request('/api/login','POST',{password});assert.equal(login.status,200);
  const cookie=login.headers.get('set-cookie').split(';')[0];assert(cookie.includes('bt_admin='));assert(login.headers.get('set-cookie').includes('HttpOnly'));
  let admin=await (await request('/api/admin/state','GET',null,{Cookie:cookie})).json();assert.equal(admin.revision,0);
  assert.equal((await request('/api/admin/config','PUT',{revision:0,config:admin.config},{Cookie:cookie})).status,403);
  const config=structuredClone(admin.config);const nameKey=Object.keys(config.content).find(k=>config.content[k]==='Briand');assert(nameKey);
  config.content[nameKey]='Raka <script>alert(1)</script>';config.stories[0].text='Cerita baru tersimpan.';config.messages.saved='Konfirmasi baru tersimpan.';
  let result=await request('/api/admin/config','PUT',{revision:0,config},{Cookie:cookie,'X-CSRF-Token':admin.csrf});assert.equal(result.status,200);
  assert.equal((await request('/api/admin/config','PUT',{revision:0,config},{Cookie:cookie,'X-CSRF-Token':admin.csrf})).status,409);
  const page=await (await request('/')).text();assert(page.includes('\\u003cscript\\u003e'));assert(!page.includes('Raka <script>'));
  assert.equal((await request('/api/rsvp','POST',{name:'Tamu A',attendance:'Hadir',guests:2,wish:'Selamat!'})).status,201);
  assert.equal((await request('/api/rsvp','POST',{name:'Tamu B',attendance:'Tidak Hadir',guests:0,wish:'Doa terbaik.'})).status,201);
  assert.equal((await request('/api/rsvp','POST',{name:'',attendance:'Hadir',guests:2,wish:''})).status,400);
  let guests=await (await request('/api/guestbook')).json();assert.equal(guests.entries.length,2);assert.equal(guests.entries[0].name,'Tamu B');
  const range=await request('/assets/music.mp3','GET',null,{Range:'bytes=0-99'});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,100);
  assert.equal((await request('/assets/music.mp3','GET',null,{Range:'bytes=9999999-'})).status,416);
  const csv=await request('/api/admin/rsvp.csv','GET',null,{Cookie:cookie});assert.equal(csv.status,200);assert((await csv.text()).includes('Tamu A'));
  const backup=await request('/api/admin/backup','GET',null,{Cookie:cookie});assert.equal(backup.status,200);assert.equal((await backup.json()).revision,1);
  assert.equal((await request('/api/logout','POST',{}, {Cookie:cookie,'X-CSRF-Token':admin.csrf})).status,200);
  await stop();
  const statePath=path.join(directory,'state.json'),old=JSON.parse(fs.readFileSync(statePath,'utf8'));
  const defaults=JSON.parse(fs.readFileSync(path.join(root,'defaults.json'),'utf8')),missingKey=Object.keys(defaults.content).at(-1);
  delete old.config.content[missingKey];delete old.config.messages.audioError;old.config.fields=[];old.config.assets.palace='/obsolete-palace.webp';
  fs.writeFileSync(statePath,JSON.stringify(old));base=null;await start();
  guests=await (await request('/api/guestbook')).json();assert.equal(guests.entries.length,2);
  const relogin=await request('/api/login','POST',{password});const cookie2=relogin.headers.get('set-cookie').split(';')[0];admin=await (await request('/api/admin/state','GET',null,{Cookie:cookie2})).json();assert.equal(admin.config.content[nameKey],config.content[nameKey]);assert.equal(admin.config.stories[0].text,'Cerita baru tersimpan.');assert.equal(admin.revision,1);assert.equal(admin.config.content[missingKey],defaults.content[missingKey]);assert.equal(admin.config.messages.audioError,defaults.messages.audioError);assert.equal(admin.config.assets.palace,defaults.assets.palace);assert(admin.config.fields.length>80);
  const cross=await fetch(base+'/api/rsvp',{method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:JSON.stringify({name:'Tamu',attendance:'Hadir',guests:1,wish:''})});assert.equal(cross.status,403);
 }finally{await stop();fs.rmSync(directory,{recursive:true,force:true});}
});
