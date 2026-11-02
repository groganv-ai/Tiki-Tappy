export const STORAGE_KEY='tikitapper-v4';
export function load(){try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return null;const value=JSON.parse(raw);return value?.schemaVersion===4?value:null;}catch{return null}}
export function persist(state){if(state.schemaVersion!==4)throw Error('Wrong schema version');localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
