(()=>{
'use strict';
const API=window.NovaAPI;
const SETTINGS_KEY='novaApiSettings';
const defaults={provider:'local',supabaseUrl:'',supabaseAnonKey:'',autoSync:true};
const readSettings=()=>{try{return {...defaults,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}}catch{return {...defaults}}};
const saveSettings=s=>{const next={...readSettings(),...s};localStorage.setItem(SETTINGS_KEY,JSON.stringify(next));return next};
const configured=()=>{const s=readSettings();return s.provider==='supabase'&&/^https:\/\//.test(s.supabaseUrl)&&s.supabaseAnonKey.length>20};
function base(){const s=readSettings();return s.supabaseUrl.replace(/\/$/,'')+'/rest/v1'}
function headers(extra={}){const key=readSettings().supabaseAnonKey;return {'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json',...extra}}
async function request(path,options={}){const res=await fetch(base()+path,{...options,headers:headers(options.headers||{})});if(!res.ok){const text=await res.text();throw new Error(text||`Supabase ${res.status}`)}if(res.status===204)return null;const text=await res.text();return text?JSON.parse(text):null}
const fromChannel=r=>({id:r.id,name:r.name,shortName:r.short_name||'',category:r.category||'عام',url:r.stream_url||'',logoUrl:r.logo_url||'',backgroundUrl:r.background_url||'',accent:r.accent||'#168cff',description:r.description||'',sortOrder:Number(r.sort_order||0),enabled:r.enabled!==false,featured:r.featured===true});
const toChannel=c=>({id:c.id,name:c.name,short_name:c.shortName||'',category:c.category||'عام',stream_url:c.url||'',logo_url:c.logoUrl||'',background_url:c.backgroundUrl||'',accent:c.accent||'#168cff',description:c.description||'',sort_order:Number(c.sortOrder||0),enabled:c.enabled!==false,featured:c.featured===true});
const fromCode=(r,devices=[])=>({code:r.code,enabled:r.enabled!==false,expiresAt:r.expires_at||'',maxDevices:Number(r.max_devices||1),devices});
const toCode=c=>({code:c.code,enabled:c.enabled!==false,expires_at:c.expiresAt||null,max_devices:Number(c.maxDevices||1)});
async function testConnection(){if(!configured())throw new Error('أدخلي رابط Supabase والمفتاح العام أولًا.');await request('/channels?select=id&limit=1');return true}
async function pull(){if(!configured())throw new Error('Supabase غير مهيأ.');const [channelRows,codeRows,deviceRows]=await Promise.all([request('/channels?select=*&order=sort_order.asc'),request('/activation_codes?select=*'),request('/devices?select=activation_code,device_id')]);const deviceMap={};(deviceRows||[]).forEach(d=>(deviceMap[d.activation_code]??=[]).push(d.device_id));API.saveChannels((channelRows||[]).map(fromChannel));API.saveActivationCodes((codeRows||[]).map(r=>fromCode(r,deviceMap[r.code]||[])));return {channels:channelRows?.length||0,codes:codeRows?.length||0,devices:deviceRows?.length||0}}
async function push(){if(!configured())throw new Error('Supabase غير مهيأ.');const channels=API.getChannels(),codes=API.getActivationCodes();await request('/channels?on_conflict=id',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(channels.map(toChannel))});await request('/activation_codes?on_conflict=code',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(codes.map(toCode))});await request('/devices?id=not.is.null',{method:'DELETE',headers:{'Prefer':'return=minimal'}}).catch(()=>{});const devices=codes.flatMap(c=>(c.devices||[]).map(id=>({activation_code:c.code,device_id:id})));if(devices.length)await request('/devices?on_conflict=activation_code,device_id',{method:'POST',headers:{'Prefer':'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(devices)});return {channels:channels.length,codes:codes.length,devices:devices.length}}
async function removeRemote(table,filter){if(!configured())return;await request(`/${table}?${filter}`,{method:'DELETE',headers:{'Prefer':'return=minimal'}})}
function wrapMutations(){if(API.__cloudWrapped)return;API.__cloudWrapped=true;const upsertChannel=API.upsertChannel.bind(API),removeChannel=API.removeChannel.bind(API),upsertCode=API.upsertActivationCode.bind(API),removeCode=API.removeActivationCode.bind(API),releaseDevice=API.releaseDevice.bind(API);
API.upsertChannel=item=>{const result=upsertChannel(item);if(configured())request('/channels?on_conflict=id',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(toChannel(result))}).catch(console.error);return result};
API.removeChannel=id=>{const result=removeChannel(id);removeRemote('channels','id=eq.'+encodeURIComponent(id)).catch(console.error);return result};
API.upsertActivationCode=item=>{const result=upsertCode(item);if(configured()){request('/activation_codes?on_conflict=code',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(toCode(result))}).then(()=>push()).catch(console.error)}return result};
API.removeActivationCode=code=>{const result=removeCode(code);removeRemote('activation_codes','code=eq.'+encodeURIComponent(code)).catch(console.error);return result};
API.releaseDevice=(code,id)=>{const result=releaseDevice(code,id);removeRemote('devices','activation_code=eq.'+encodeURIComponent(code)+'&device_id=eq.'+encodeURIComponent(id)).catch(console.error);return result};
}
async function bootstrap(){wrapMutations();if(!configured()||readSettings().autoSync===false)return;if(sessionStorage.getItem('novaCloudHydrated')==='1')return;try{await pull();sessionStorage.setItem('novaCloudHydrated','1');location.reload()}catch(err){console.warn('Nova cloud fallback:',err.message)}}
const cloud={readSettings,saveSettings,configured,testConnection,pull,push,bootstrap,get mode(){return configured()?'supabase':'local'}};
window.NovaCloud=cloud;
bootstrap();
})();