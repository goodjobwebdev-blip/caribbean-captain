import { canSave, normalizeGame, type Game } from './game';
export type Profile = { id:string; name:string; game:Game; updated:number };
export type Checkpoint = { id:string; profileId:string; name:string; created:number; game:Game };
let connection:Promise<IDBDatabase>|undefined;
function db(){return connection??=new Promise((resolve,reject)=>{const r=indexedDB.open('caribbean-captain',1);r.onupgradeneeded=()=>{r.result.createObjectStore('profiles',{keyPath:'id'});const s=r.result.createObjectStore('checkpoints',{keyPath:'id'});s.createIndex('profileId','profileId');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>{connection=undefined;reject(new Error('Local storage is unavailable. Please allow browser storage.'));};});}
async function write(store:string,value:unknown){const d=await db();return new Promise<void>((resolve,reject)=>{const t=d.transaction(store,'readwrite');t.objectStore(store).put(value);t.oncomplete=()=>resolve();t.onerror=()=>reject(new Error('Could not save. Browser storage may be full.'));t.onabort=()=>reject(new Error('Save was interrupted.'));});}
export async function profiles():Promise<Profile[]>{const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction('profiles').objectStore('profiles').getAll();r.onsuccess=()=>{try{resolve(r.result.map((p:Profile)=>({...p,game:normalizeGame(p.game)})).sort((a:Profile,b:Profile)=>b.updated-a.updated));}catch(e){reject(e);}};r.onerror=()=>reject(r.error);});}
export const saveProfile=(p:Profile)=>write('profiles',p);
export async function checkpoints(profileId:string):Promise<Checkpoint[]>{const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction('checkpoints').objectStore('checkpoints').index('profileId').getAll(profileId);r.onsuccess=()=>resolve(r.result.sort((a:Checkpoint,b:Checkpoint)=>b.created-a.created));r.onerror=()=>reject(r.error);});}
export async function saveCheckpoint(profile:Profile,name:string,location:string){if(location!=='Church'||!canSave(profile.game))throw new Error('Checkpoints can only be created in a town church.');const c:Checkpoint={id:crypto.randomUUID(),profileId:profile.id,name:name.trim().slice(0,60)||'Church checkpoint',created:Date.now(),game:structuredClone(profile.game)};await write('checkpoints',c);return c;}
export function restoreCheckpoint(profile:Profile,checkpoint:Checkpoint):Profile {if(checkpoint.profileId!==profile.id||![1,2].includes(checkpoint.game.version))throw new Error('This checkpoint does not belong to this profile or uses an unsupported version.');return {...profile,game:normalizeGame(checkpoint.game),updated:Date.now()};}
/** Check ownership and delete in one transaction; never modify the captain's current state. */
export async function deleteCheckpoint(profileId:string,checkpointId:string):Promise<void>{
 const d=await db();
 return new Promise((resolve,reject)=>{
  const transaction=d.transaction('checkpoints','readwrite'),store=transaction.objectStore('checkpoints');
  let failure:Error|undefined;
  transaction.oncomplete=()=>resolve();
  transaction.onerror=()=>reject(failure??new Error('Could not delete the checkpoint. Please try again.'));
  transaction.onabort=()=>reject(failure??new Error('Checkpoint deletion was interrupted. Please try again.'));
  const request=store.get(checkpointId);
  request.onsuccess=()=>{
   const checkpoint=request.result as Checkpoint|undefined;
   if(!checkpoint)return; // Already removed in another tab.
   if(checkpoint.profileId!==profileId){failure=new Error('This checkpoint does not belong to this captain.');transaction.abort();return;}
   store.delete(checkpointId);
  };
 });
}
