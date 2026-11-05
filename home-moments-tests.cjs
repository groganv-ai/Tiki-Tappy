const fs=require('fs'),assert=require('assert');
const boot=Function('require',fs.readFileSync('free-matchday-tests.cjs','utf8').split('const {c,el,run}=boot();')[0]+';return boot')(require);
const {run}=boot();
// The showcase must not inherit report timeline columns or require match data.
run('compactTimelineHTML=function(){throw Error("Home must have its own layout")};view="home";render()');
const html=run('homeMomentsHTML()');assert.equal((html.match(/class="home-moment-event"/g)||[]).length,5);
assert(!html.includes('compact-timeline'));assert(html.includes('Osian · Great goal'));assert(html.includes('Ava · Great save'));assert(html.includes('Leo · Brilliant tackle'));assert(html.includes('Mia · Trick or turn'));assert(html.includes('Sam · Supporting run'));
assert.equal((html.match(/<time>/g)||[]).length,5);assert.equal((html.match(/<svg /g)||[]).length,5);
console.log('PASS: all five homepage examples have independent time/icon/text rows, shared approved icons and complete player/action labels without report-layout coupling.');
