import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function policy(duration, error = false) {
  const source = fs.readFileSync(new URL('../src/modules/travel-upload/policy.ts', import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const module = { exports: {} }; let revoked = 0
  const element = { duration, preload: '', load() {}, removeAttribute() {},
    set src(value) { queueMicrotask(() => error ? this.onerror?.() : this.onloadedmetadata?.()) } }
  vm.runInNewContext(compiled, { module, exports:module.exports, setTimeout, clearTimeout, DOMException,
    document:{createElement:()=>element}, URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>revoked++} })
  return { ...module.exports, released:()=>revoked }
}
const video = { name:'clip.mp4', type:'video/mp4', size:1024 }
test('short-video validation accepts under 30 seconds and releases metadata resources', async () => {
  const p=policy(29.999)
  assert.equal(await p.validateTravelMedia(video, 12*1024*1024), undefined)
  assert.equal(p.released(), 1)
})
test('30 seconds, longer, empty and oversized video are rejected before upload', async () => {
  for(const duration of [30,30.001,0,Infinity]) assert.match(await policy(duration).validateTravelMedia(video,1), /30 秒/)
  assert.match(await policy(2).validateTravelMedia({...video,size:0},1), /为空/)
  assert.match(await policy(2).validateTravelMedia({...video,size:60*1024*1024+1},1), /60 MB/)
  assert.match(await policy(2).validateTravelMedia({...video,name:'clip.avi'},1), /MP4/)
})
test('unsupported local decoder falls back to authoritative server validation; old images still work', async () => {
  const p=policy(undefined,true)
  assert.equal(await p.validateTravelMedia({...video,name:'phone.mov'},1), undefined)
  assert.equal(p.released(),1)
  assert.equal(await p.validateTravelMedia({name:'photo.jpg',type:'image/jpeg',size:3},1024),undefined)
})
