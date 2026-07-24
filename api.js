(function(){
'use strict';
const KEYS={channels:'novaChannels',codes:'novaActivationCodes',settings:'novaApiSettings',publicSync:'novaPublicIptvSync',customSources:'novaCustomM3uSources'};
const STREAM='https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const DEFAULT_CHANNELS=[
{id:1,name:'Nova News',category:'أخبار',shortName:'NEWS',accent:'#1677ff',url:STREAM,enabled:true,featured:true,description:'قناة تجريبية تظهر فقط حتى يكتمل تحميل القنوات العامة.',logoUrl:'',backgroundUrl:'',sortOrder:1}
];
const PUBLIC_SOURCES=[
{id:'arab',name:'العالم العربي',country:'ARAB',url:'https://iptv-org.github.io/iptv/regions/arab.m3u'},
{id:'mena',name:'الشرق الأوسط وشمال أفريقيا',country:'MENA',url:'https://iptv-org.github.io/iptv/regions/mena.m3u'},
{id:'sa',name:'السعودية',country:'SA',url:'https://iptv-org.github.io/iptv/countries/sa.m3u'},
{id:'ae',name:'الإمارات',country:'AE',url:'https://iptv-org.github.io/iptv/countries/ae.m3u'},
{id:'kw',name:'الكويت',country:'KW',url:'https://iptv-org.github.io/iptv/countries/kw.m3u'},
{id:'bh',name:'البحرين',country:'BH',url:'https://iptv-org.github.io/iptv/countries/bh.m3u'},
{id:'qa',name:'قطر',country:'QA',url:'https://iptv-org.github.io/iptv/countries/qa.m3u'},
{id:'om',name:'عُمان',country:'OM',url:'https://iptv-org.github.io/iptv/countries/om.m3u'},
{id:'eg',name:'مصر',country:'EG',url:'https://iptv-org.github.io/iptv/countries/eg.m3u'},
{id:'iq',name:'العراق',country:'IQ',url:'https://iptv-org.github.io/iptv/countries/iq.m3u'},
{id:'ps',name:'فلسطين',country:'PS',url:'https://iptv-org.github.io/iptv/countries/ps.m3u'},
{id:'jo',name:'الأردن',country:'JO',url:'https://iptv-org.github.io/iptv/countries/jo.m3u'},
{id:'lb',name:'لبنان',country:'LB',url:'https://iptv-org.github.io/iptv/countries/lb.m3u'},
{id:'sy',name:'سوريا',country:'SY',url:'https://iptv-org.github.io/iptv/countries/sy.m3u'},
{id:'ye',name:'اليمن',country:'YE',url:'https://iptv-org.github.io/iptv/countries/ye.m3u'},
{id:'ma',name:'المغرب',country:'MA',url:'https://iptv-org.github.io/iptv/countries/ma.m3u'},
{id:'dz',name:'الجزائر',country:'DZ',url:'https://iptv-org.github.io/iptv/countries/dz.m3u'},
{id:'tn',name:'تونس',country:'TN',url:'https://iptv-org.github.io/iptv/countries/tn.m3u'},
{id:'ly',name:'ليبيا',country:'LY',url:'https://iptv-org.github.io/iptv/countries/ly.m3u'},
{id:'sd',name:'السودان',country:'SD',url:'https://iptv-org.github.io/iptv/countries/sd.m3u'},
{id:'mr',name:'موريتانيا',country:'MR',url:'https://iptv-org.github.io/iptv/countries/mr.m3u'}
];
const DEFAULT_CODES=[{code:'NOVA-2026',enabled:true,expiresAt:'2027-12-31',maxDevices:3,devices:[]}];
function clone(v){return JSON.parse(JSON.stringify(v));}
function read(key,fallback){try{const value=JSON.parse(localStorage.getItem(key)||'null');return value??clone(fallback);}catch{return clone(fallback);}}
function write(key,value){localStorage.setItem(key,JSON.stringify(value));return clone(value);}
function normalizeChannel(item){return {id:item.id||Date.now(),name:String(item.name||'').trim(),category:String(item.category||'عام').trim(),shortName:String(item.shortName||item.name||'NOVA').trim().slice(0,14),accent:String(item.accent||'#1677ff').trim(),icon:String(item.icon||'').trim(),url:String(item.url||'').trim(),enabled:item.enabled!==false,featured:item.featured===true,description:String(item.description||'').trim(),logoUrl:String(item.logoUrl||'').trim(),backgroundUrl:String(item.backgroundUrl||'').trim(),sortOrder:Number(item.sortOrder||0),country:String(item.country||'').trim(),language:String(item.language||'').trim(),sourceId:String(item.sourceId||'').trim()};}
function normalizeCode(item){return {code:String(item.code||'').trim().toUpperCase(),enabled:item.enabled!==false,expiresAt:item.expiresAt||'',maxDevices:Math.max(1,Number(item.maxDevices||1)),devices:Array.isArray(item.devices)?[...new Set(item.devices)]:[]};}
function normalizeSource(item){return {id:String(item.id||('custom-'+Date.now())),name:String(item.name||'قائمة خاصة').trim(),country:String(item.country||'CUSTOM').trim(),url:String(item.url||'').trim(),custom:item.custom===true,enabled:item.enabled!==false};}
function hash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return Math.abs(h>>>0);}
function attrs(header){const out={};for(const match of header.matchAll(/([\w-]+)="([^"]*)"/g))out[match[1]]=match[2];return out;}
function parseM3u(text,source){const lines=String(text||'').split(/\r?\n/).map(x=>x.trim());const list=[];let meta=null;for(const line of lines){if(line.startsWith('#EXTINF:')){const comma=line.indexOf(',');const a=attrs(comma>=0?line.slice(0,comma):line);const display=(comma>=0?line.slice(comma+1):a['tvg-name']||'قناة').trim();meta={name:a['tvg-name']||display,display,logo:a['tvg-logo']||'',category:a['group-title']||source.name,country:a['tvg-country']||source.country,language:a['tvg-language']||''};continue;}if(meta&&line&&!line.startsWith('#')){const key=(meta.name+'|'+line);list.push(normalizeChannel({id:hash(key),name:meta.display||meta.name,category:meta.category||source.name,shortName:(meta.display||meta.name).slice(0,14),url:line,enabled:true,featured:false,description:`بث عام من ${source.name}${meta.language?' · '+meta.language:''}`,logoUrl:meta.logo,sortOrder:list.length+1,country:meta.country,language:meta.language,sourceId:source.id}));meta=null;}}return list;}
async function fetchText(url,timeoutMs=18000){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);try{const response=await fetch(url,{cache:'no-store',signal:controller.signal,headers:{Accept:'application/x-mpegURL,text/plain,*/*'}});if(!response.ok)throw new Error(String(response.status));return await response.text();}finally{clearTimeout(timer);}}
function getAllSources(){return [...PUBLIC_SOURCES,...read(KEYS.customSources,[]).map(normalizeSource)].filter(x=>x.enabled!==false&&x.url);}
async function refreshPublicChannels(force=false){const sync=read(KEYS.publicSync,{at:0});const age=Date.now()-Number(sync.at||0);if(!force&&age<6*60*60*1000&&read(KEYS.channels,[]).length>1)return {ok:true,cached:true,count:read(KEYS.channels,[]).length};const sources=getAllSources();const settled=await Promise.allSettled(sources.map(async source=>parseM3u(await fetchText(source.url),source)));const merged=[];const seen=new Set();settled.forEach(result=>{if(result.status!=='fulfilled')return;result.value.forEach(channel=>{const key=channel.url;if(!channel.url||seen.has(key))return;seen.add(key);merged.push(channel);});});if(!merged.length)return {ok:false,count:0,failed:settled.length};merged.forEach((channel,index)=>{channel.sortOrder=index+1;channel.featured=index<12;});write(KEYS.channels,merged);write(KEYS.publicSync,{at:Date.now(),count:merged.length,sources:sources.length});window.dispatchEvent(new CustomEvent('nova:channels-updated',{detail:{count:merged.length}}));return {ok:true,count:merged.length,sources:sources.length};}
const api={
 mode:'public-iptv-and-user-m3u',
 getSettings(){return read(KEYS.settings,{provider:'local',supabaseUrl:'',supabaseAnonKey:''});},
 saveSettings(settings){return write(KEYS.settings,{...this.getSettings(),...settings});},
 getChannels({includeDisabled=true}={}){const stored=read(KEYS.channels,DEFAULT_CHANNELS);const list=stored.map(normalizeChannel).sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0));return includeDisabled?list:list.filter(x=>x.enabled);},
 saveChannels(list){return write(KEYS.channels,list.map(normalizeChannel));},
 upsertChannel(item){const next=normalizeChannel(item);const list=this.getChannels();const index=list.findIndex(x=>String(x.id)===String(next.id));if(index>=0)list[index]={...list[index],...next};else list.push(next);this.saveChannels(list);return next;},
 removeChannel(id){this.saveChannels(this.getChannels().filter(x=>String(x.id)!==String(id)));return true;},
 refreshPublicChannels,
 getPublicSources(){return clone(PUBLIC_SOURCES);},
 getCustomSources(){return read(KEYS.customSources,[]).map(normalizeSource);},
 addCustomSource(name,url){const clean=String(url||'').trim();if(!/^https?:\/\//i.test(clean))throw new Error('INVALID_URL');const list=this.getCustomSources();const item=normalizeSource({id:'custom-'+hash(clean),name:name||'قائمة خاصة',url:clean,country:'CUSTOM',custom:true,enabled:true});const index=list.findIndex(x=>x.id===item.id);if(index>=0)list[index]=item;else list.push(item);write(KEYS.customSources,list);localStorage.removeItem(KEYS.publicSync);return item;},
 removeCustomSource(id){write(KEYS.customSources,this.getCustomSources().filter(x=>x.id!==String(id)));localStorage.removeItem(KEYS.publicSync);return true;},
 async importM3uText(name,text){const source=normalizeSource({id:'upload-'+Date.now(),name:name||'قائمة مستوردة',country:'CUSTOM',custom:true});const incoming=parseM3u(text,source);const current=this.getChannels();const seen=new Set(current.map(x=>x.url));incoming.forEach(x=>{if(!seen.has(x.url)){seen.add(x.url);current.push(x);}});this.saveChannels(current);return {ok:true,count:incoming.length};},
 getActivationCodes(){return read(KEYS.codes,DEFAULT_CODES).map(normalizeCode);},
 saveActivationCodes(list){return write(KEYS.codes,list.map(normalizeCode));},
 upsertActivationCode(item){const next=normalizeCode(item);const list=this.getActivationCodes();const index=list.findIndex(x=>x.code===next.code);if(index>=0)list[index]={...list[index],...next};else list.push(next);this.saveActivationCodes(list);return next;},
 removeActivationCode(code){this.saveActivationCodes(this.getActivationCodes().filter(x=>x.code!==String(code).toUpperCase()));return true;},
 validateActivation(code){const normalized=String(code||'').trim().toUpperCase();const item=this.getActivationCodes().find(x=>x.code===normalized);if(!item)return {ok:false,error:'invalid'};if(!item.enabled)return {ok:false,error:'disabled'};if(item.expiresAt&&new Date(item.expiresAt+'T23:59:59')<new Date())return {ok:false,error:'expired'};return {ok:true,item};},
 claimDevice(code,deviceId){const result=this.validateActivation(code);if(!result.ok)return result;const item=result.item;const devices=item.devices||[];if(!devices.includes(deviceId)&&devices.length>=item.maxDevices)return {ok:false,error:'device_limit',item};if(!devices.includes(deviceId)){item.devices=[...devices,deviceId];this.upsertActivationCode(item);}return {ok:true,item};},
 releaseDevice(code,deviceId){const item=this.getActivationCodes().find(x=>x.code===String(code).toUpperCase());if(!item)return false;item.devices=(item.devices||[]).filter(x=>x!==deviceId);this.upsertActivationCode(item);return true;},
 reset(){this.saveChannels(DEFAULT_CHANNELS);this.saveActivationCodes(DEFAULT_CODES);localStorage.removeItem(KEYS.publicSync);refreshPublicChannels(true);return true;},
 exportAll(){return {version:4,provider:this.mode,channels:this.getChannels(),codes:this.getActivationCodes(),customSources:this.getCustomSources(),exportedAt:new Date().toISOString()};},
 importAll(data){if(!data||!Array.isArray(data.channels)||!Array.isArray(data.codes))throw new Error('INVALID_BACKUP');this.saveChannels(data.channels);this.saveActivationCodes(data.codes);if(Array.isArray(data.customSources))write(KEYS.customSources,data.customSources.map(normalizeSource));return true;}
};
window.NovaAPI=Object.freeze(api);
setTimeout(()=>refreshPublicChannels(false).then(result=>{if(result.ok&&!result.cached&&!sessionStorage.getItem('novaPublicReloaded')){sessionStorage.setItem('novaPublicReloaded','1');location.reload();}}).catch(()=>{}),250);
})();