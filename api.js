(function(){
'use strict';
const KEYS={channels:'novaChannels',codes:'novaActivationCodes',settings:'novaApiSettings'};
const STREAM='https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const DEFAULT_CHANNELS=[
{id:1,name:'Nova News',category:'أخبار',shortName:'NEWS',accent:'#1677ff',url:STREAM,enabled:true,featured:true,description:'تغطية إخبارية متواصلة على مدار الساعة.',logoUrl:'',backgroundUrl:'',sortOrder:1},
{id:2,name:'Nova Sports 1',category:'رياضة',shortName:'SPORT 1',accent:'#00a86b',url:STREAM,enabled:true,featured:true,description:'مباريات وبرامج رياضية مباشرة بجودة عالية.',logoUrl:'',backgroundUrl:'',sortOrder:2},
{id:3,name:'Nova Cinema',category:'أفلام',shortName:'CINEMA',accent:'#7c3aed',url:STREAM,enabled:true,featured:true,description:'أفلام مختارة وتجربة سينمائية مميزة.',logoUrl:'',backgroundUrl:'',sortOrder:3},
{id:4,name:'Nova Kids',category:'أطفال',shortName:'KIDS',accent:'#f59e0b',url:STREAM,enabled:true,featured:false,description:'محتوى عائلي آمن وممتع.',logoUrl:'',backgroundUrl:'',sortOrder:4},
{id:5,name:'Nova Documentary',category:'وثائقي',shortName:'DOCS',accent:'#0891b2',url:STREAM,enabled:true,featured:false,description:'قصص وثائقية من حول العالم.',logoUrl:'',backgroundUrl:'',sortOrder:5},
{id:6,name:'Nova Sports 2',category:'رياضة',shortName:'SPORT 2',accent:'#ef4444',url:STREAM,enabled:true,featured:false,description:'بطولات وتحليلات رياضية على مدار اليوم.',logoUrl:'',backgroundUrl:'',sortOrder:6}
];
const DEFAULT_CODES=[{code:'NOVA-2026',enabled:true,expiresAt:'2027-12-31',maxDevices:3,devices:[]}];
function clone(v){return JSON.parse(JSON.stringify(v));}
function read(key,fallback){try{const value=JSON.parse(localStorage.getItem(key)||'null');return value??clone(fallback);}catch{return clone(fallback);}}
function write(key,value){localStorage.setItem(key,JSON.stringify(value));return clone(value);}
function normalizeChannel(item){return {id:item.id||Date.now(),name:String(item.name||'').trim(),category:String(item.category||'عام').trim(),shortName:String(item.shortName||item.name||'NOVA').trim().slice(0,14),accent:String(item.accent||'#1677ff').trim(),icon:String(item.icon||'').trim(),url:String(item.url||'').trim(),enabled:item.enabled!==false,featured:item.featured===true,description:String(item.description||'').trim(),logoUrl:String(item.logoUrl||'').trim(),backgroundUrl:String(item.backgroundUrl||'').trim(),sortOrder:Number(item.sortOrder||0)};}
function normalizeCode(item){return {code:String(item.code||'').trim().toUpperCase(),enabled:item.enabled!==false,expiresAt:item.expiresAt||'',maxDevices:Math.max(1,Number(item.maxDevices||1)),devices:Array.isArray(item.devices)?[...new Set(item.devices)]:[]};}
const api={
 mode:'local',
 getSettings(){return read(KEYS.settings,{provider:'local',supabaseUrl:'',supabaseAnonKey:''});},
 saveSettings(settings){return write(KEYS.settings,{...this.getSettings(),...settings});},
 getChannels({includeDisabled=true}={}){const stored=read(KEYS.channels,DEFAULT_CHANNELS);const defaultsById=new Map(DEFAULT_CHANNELS.map(x=>[String(x.id),x]));const list=stored.map(item=>normalizeChannel({...defaultsById.get(String(item.id)),...item})).sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0));return includeDisabled?list:list.filter(x=>x.enabled);},
 saveChannels(list){return write(KEYS.channels,list.map(normalizeChannel));},
 upsertChannel(item){const next=normalizeChannel(item);const list=this.getChannels();const index=list.findIndex(x=>String(x.id)===String(next.id));if(index>=0)list[index]={...list[index],...next};else list.push(next);this.saveChannels(list);return next;},
 removeChannel(id){this.saveChannels(this.getChannels().filter(x=>String(x.id)!==String(id)));return true;},
 getActivationCodes(){return read(KEYS.codes,DEFAULT_CODES).map(normalizeCode);},
 saveActivationCodes(list){return write(KEYS.codes,list.map(normalizeCode));},
 upsertActivationCode(item){const next=normalizeCode(item);const list=this.getActivationCodes();const index=list.findIndex(x=>x.code===next.code);if(index>=0)list[index]={...list[index],...next};else list.push(next);this.saveActivationCodes(list);return next;},
 removeActivationCode(code){this.saveActivationCodes(this.getActivationCodes().filter(x=>x.code!==String(code).toUpperCase()));return true;},
 validateActivation(code){const normalized=String(code||'').trim().toUpperCase();const item=this.getActivationCodes().find(x=>x.code===normalized);if(!item)return {ok:false,error:'invalid'};if(!item.enabled)return {ok:false,error:'disabled'};if(item.expiresAt&&new Date(item.expiresAt+'T23:59:59')<new Date())return {ok:false,error:'expired'};return {ok:true,item};},
 claimDevice(code,deviceId){const result=this.validateActivation(code);if(!result.ok)return result;const item=result.item;const devices=item.devices||[];if(!devices.includes(deviceId)&&devices.length>=item.maxDevices)return {ok:false,error:'device_limit',item};if(!devices.includes(deviceId)){item.devices=[...devices,deviceId];this.upsertActivationCode(item);}return {ok:true,item};},
 releaseDevice(code,deviceId){const item=this.getActivationCodes().find(x=>x.code===String(code).toUpperCase());if(!item)return false;item.devices=(item.devices||[]).filter(x=>x!==deviceId);this.upsertActivationCode(item);return true;},
 reset(){this.saveChannels(DEFAULT_CHANNELS);this.saveActivationCodes(DEFAULT_CODES);return true;},
 exportAll(){return {version:2,provider:'local',channels:this.getChannels(),codes:this.getActivationCodes(),exportedAt:new Date().toISOString()};},
 importAll(data){if(!data||!Array.isArray(data.channels)||!Array.isArray(data.codes))throw new Error('INVALID_BACKUP');this.saveChannels(data.channels);this.saveActivationCodes(data.codes);return true;}
};
window.NovaAPI=Object.freeze(api);
})();