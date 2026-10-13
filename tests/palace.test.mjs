import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../public/palace.js',import.meta.url),'utf8');
function load(extra={}){const context={window:{},cancelAnimationFrame(){},...extra};vm.runInNewContext(source,context);return context.window.BTPalace;}

test('door geometry rotates about the two outer hinges without changing leaf size',()=>{
 const {math}=load();
 for(const side of [-1,1]){
  const mesh=math.leafMesh(side);assert.equal(mesh.vertices.length,36*8);
  assert.equal(mesh.hinge,side*1.34);
  const model=math.multiply(math.translate(mesh.hinge,0,0),math.rotateY(side*118*Math.PI/180));
  const transform=(x,y,z)=>[model[0]*x+model[4]*y+model[8]*z+model[12],model[1]*x+model[5]*y+model[9]*z+model[13],model[2]*x+model[6]*y+model[10]*z+model[14]];
  const hinge=transform(0,0,0),edge=transform(-side*1.34,0,0);
  assert(Math.abs(hinge[0]-mesh.hinge)<1e-6);assert(Math.abs(hinge[2])<1e-6);
  assert(Math.abs(Math.hypot(edge[0]-hinge[0],edge[2]-hinge[2])-1.34)<1e-6);
  assert(Math.abs(edge[0])>Math.abs(hinge[0]));
  const textureU=Array.from(mesh.vertices).filter((_,index)=>index<48&&index%8===6);
  assert(textureU.every(u=>u>=650/1672-1e-6&&u<=1036/1672+1e-6));
 }
});

test('unavailable or blocked WebGL falls back without breaking the invitation',()=>{
 for(const getContext of [()=>null,()=>{throw Error('GPU blocked');}]){
  const classes=new Set(),style={};
  const root={querySelector:()=>({getContext}),classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},style:{setProperty:(key,value)=>style[key]=value}};
  assert.equal(load().attach(root),null);assert(classes.has('bt-css-fallback'));assert.equal(style['--palace-zoom'],'1');
 }
});
