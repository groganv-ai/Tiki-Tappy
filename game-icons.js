// Add icons to the final summary renderer after set-piece and substitution sections.
const iconSummaryBefore=v2SummaryHTML;
v2SummaryHTML=function(m){let html=iconSummaryBefore(m);const headings={Goals:'Goal',Assists:'Assist',Shots:'Shot',Saves:'Save',Tackle:'Tackle',Block:'Block',Clearance:'Clearance',Passes:'Pass',Skill:'Skill',Teamwork:'Teamwork','Team Values':'Team Values','Set pieces':'Set piece',Substitutions:'Substitution'};for(const [label,key]of Object.entries(headings))html=html.replaceAll('<h3>'+label+'</h3>','<h3>'+v2Icon(key)+'<span>'+label+'</span></h3>');return html};
render();
