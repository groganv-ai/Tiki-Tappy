// Club identity belongs to the current matchday, never a reusable public profile.
const renderBeforeClubProfile=render;
render=function(){renderBeforeClubProfile();const tag=$('.tag');if(tag)tag.textContent=day()?.clubName||'SMALL MOMENTS. BIG MEMORIES.'};
const textBeforeClubProfile=reportText;
reportText=function(all=true){return (day()?.clubName?day().clubName+'\n':'')+textBeforeClubProfile(all)};
const modelBeforeClubProfile=makeReplayModel;
makeReplayModel=function(){return {...modelBeforeClubProfile(),clubName:day()?.clubName||''}};
// Retire roster-sharing URLs; names must not be carried in setup links.
if(typeof location!=='undefined'&&location.hash.startsWith('#setup='))history.replaceState(null,'',location.pathname+location.search);
render();
