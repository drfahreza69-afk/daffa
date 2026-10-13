import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../public/palace.js',import.meta.url),'utf8');
function load(extra={}){const context={window:{addEventListener(){}},cancelAnimationFrame(){},...extra};vm.runInNewContext(source,context);return context.window.BTPalace;}

test('door geometry rotates about the two outer hinges without changing leaf size',()=>{
 const {math}=load();
 for(const side of [-1,1]){
  const mesh=math.leafMesh(side);assert.equal(mesh.vertices.length,36*8);
  assert.equal(mesh.hinge,((side<0?math.scene.left:math.scene.right)-math.scene.width/2)*math.scene.units);
  const model=math.multiply(math.translate(mesh.hinge,0,0),math.rotateY(side*118*Math.PI/180));
  const transform=(x,y,z)=>[model[0]*x+model[4]*y+model[8]*z+model[12],model[1]*x+model[5]*y+model[9]*z+model[13],model[2]*x+model[6]*y+model[10]*z+model[14]];
  const hinge=transform(0,0,0),edge=transform(-side*1.9,0,0);
  assert(Math.abs(hinge[0]-mesh.hinge)<1e-6);assert(Math.abs(hinge[2])<1e-6);
  assert(Math.abs(Math.hypot(edge[0]-hinge[0],edge[2]-hinge[2])-1.9)<1e-6);
  assert(Math.abs(edge[0])>Math.abs(hinge[0]));
  const textureU=Array.from(mesh.vertices).filter((_,index)=>index<48&&index%8===6);
  assert(textureU.every(u=>u>=650/1672-1e-6&&u<=1036/1672+1e-6));
 }
});

test('unavailable or blocked WebGL falls back without breaking the invitation',()=>{
 for(const getContext of [()=>null,()=>{throw Error('GPU blocked');}]){
  const classes=new Set(),style={};
  const stage={getBoundingClientRect:()=>({width:1319,height:617}),style:{setProperty:(key,value)=>style[key]=value}};
  const root={querySelector:selector=>selector==='#bt-gate-canvas'?{getContext}:stage,classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},style:{setProperty:(key,value)=>style[key]=value}};
  assert.equal(load().attach(root),null);assert(classes.has('bt-css-fallback'));assert.equal(style['--palace-zoom'],'1');
 }
});


test('WebGL front corners match the CSS doorway at seven desktop and phone ratios',()=>{
 const {math}=load();const resolutions=[[1319,617],[1920,1080],[3440,720],[1024,768],[390,844],[320,568],[320,1000]];
 for(const [width,height]of resolutions){
  const placement=math.scenePlacement(width,height),projection=math.projectionFor(width,height),view=math.translate(0,0,-9);
  assert(placement.left>=8);assert(placement.left+placement.width<=width-8);
  const offsetX=(width-placement.imageWidth)/2,offsetY=(height-placement.imageHeight)/2;
  for(const side of [-1,1]){
   const mesh=math.leafMesh(side),matrix=math.multiply(projection,math.multiply(view,math.translate(mesh.hinge,0,0)));
   for(let index=0;index<48;index+=8){
    const v=mesh.vertices,x=v[index],y=v[index+1],z=v[index+2],u=v[index+6],t=v[index+7];
    const w=matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15];
    const screenX=((matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12])/w+1)*width/2;
    const screenY=(1-(matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13])/w)*height/2;
    assert(Math.abs(screenX-(offsetX+u*math.scene.width*placement.scale))<.01,`X misalignment at ${width}x${height}`);
    assert(Math.abs(screenY-(offsetY+t*math.scene.height*placement.scale))<.01,`Y misalignment at ${width}x${height}`);
   }
  }
 }
});

test('CSS fallback keeps following the stage dimensions after WebGL is denied',()=>{
 let width=1319,height=617,onResize;const styles={};
 const stage={getBoundingClientRect:()=>({width,height}),style:{setProperty:(key,value)=>styles[key]=value}};
 const root={querySelector:selector=>selector==='#bt-gate-canvas'?{getContext:()=>null}:stage,classList:{add(){},remove(){}},style:{setProperty(){}}};
 const palace=load({ResizeObserver:class{constructor(callback){onResize=callback;}observe(){}}});
 assert.equal(palace.attach(root),null);const initial=styles['--scene-left'];
 width=390;height=844;onResize();assert.notEqual(styles['--scene-left'],initial);
 const expected=palace.math.scenePlacement(width,height);assert.equal(styles['--scene-width'],expected.width+'px');assert.equal(styles['--scene-left'],expected.left+'px');
});

test('base styles load first and no later inline stylesheet can restore the old layout',()=>{
 const index=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const links=Array.from(index.matchAll(/<link[^>]+href="([^"]+\.css[^"]*)"/g),match=>match[1]);
 assert.deepEqual(links,['/base.css?v=2.1.0','/royal.css?v=2.1.0']);assert(!index.includes('<style'));
 assert(index.includes('class="bt-cover-copy"'));assert(index.includes('/palace.js?v=2.1.0'));
});
