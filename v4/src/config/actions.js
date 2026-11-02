// One canonical registry for Coach, Player, capture and reporting.
export const QUALITY_LEVELS=Object.freeze(['basic',1,2,3]);
export const ACTIONS=Object.freeze({
 goal:{label:'Goal',location:true,assist:true,labels:['Great Goal','Amazing Goal','Worldie Goal']},
 shot:{label:'Shot',location:true,outcome:true,labels:['Good Shot','Great Effort','Fantastic Effort']},
 pass:{label:'Pass',labels:['Great Pass','Amazing Pass','Incredible Pass']},
 tackle:{label:'Tackle',labels:['Great Tackle','Big Tackle','Crunching Tackle']},
 block:{label:'Block',labels:['Important Block','Brilliant Block','Outstanding Block']},
 clearance:{label:'Clearance',labels:['Important Clearance','Great Clearance','Outstanding Clearance']},
 save:{label:'Save',labels:['Good Save','Great Save','Incredible Save']},
 skill:{label:'Skill',labels:['Great Skill','Brilliant Dribble','Amazing First Touch']},
 teamwork:{label:'Teamwork',labels:['Great Teamwork','Brilliant Support','Great Sportsmanship']},
 'team-values':{label:'Team Values',labels:['Great Sportsmanship','Fantastic Improvement','Showed fair play']},
 'set-piece':{label:'Set piece',special:true},
 substitution:{label:'Substitution',special:true}
});
export const REPORT_CATEGORIES=Object.freeze(['goal','assist','shot','save','tackle','block','clearance','pass','skill','teamwork','team-values','set-piece']);
export const DEFAULT_QUALITY=1; // Good: first positive level; Basic remains an explicit Coach quick-entry option.
export function qualityFor(action,level){if(!ACTIONS[action])throw Error('Unknown action: '+action);if(!QUALITY_LEVELS.includes(level))throw Error('Invalid quality');return {level,label:level==='basic'?'Basic':ACTIONS[action].labels?.[level-1]||'Good'};}
