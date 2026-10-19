// An acknowledgement is a safeguarding prompt, not a consent collection system.
let photoPermissionDay=null;
function photoSafetyHTML(){return `<section class="photo-safety" aria-label="Photo permissions"><strong>Check permission before adding a photo</strong><p>Only add a photo if you have the necessary permission for everyone identifiable in it. For children, follow your club’s safeguarding policy and parent/carer permission requirements, and respect the child’s wishes.</p><label><input id="photo-permission" type="checkbox" onchange="confirmPhotoPermission(this.checked)"><span>I confirm this photo is permitted to be added to this device and used in this team’s match report.</span></label><p class="hint">This records your confirmation, not consent itself. Check permission covers the intended audience before sharing. Squad numbers do not hide faces. You can continue without a photo.</p></section>`}
function confirmPhotoPermission(checked){photoPermissionDay=checked?day()?.id:null;const input=$('#reportphoto');if(input){input.disabled=!checked;if(!checked)input.value=''}}
const photoRenderBefore=renderReport;
renderReport=function(){photoRenderBefore();photoPermissionDay=null;const app=$('#app');app.innerHTML=app.innerHTML.replace('<input id="reportphoto" type="file" accept="image/*" onchange="addPhoto(this)">',`${photoSafetyHTML()}<input id="reportphoto" type="file" accept="image/jpeg,image/png,image/webp" disabled aria-describedby="photo-local-note" onchange="addPhoto(this)"><small id="photo-local-note" class="hint">Photos stay in this browser’s temporary matchday draft unless you export or share them.</small>`)};
addPhoto=async function(input){
  const d=day(),f=input.files?.[0];if(!f||!d)return;
  if(photoPermissionDay!==d.id){input.value='';return toast('Confirm the photo permission acknowledgement first.')}
  photoPermissionDay=null;input.disabled=true;
  if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>10*1024*1024){input.value='';render();return toast('Choose a JPEG, PNG or WebP photo up to 10 MB.')}
  let img;
  try{
    img=await createImageBitmap(f);
    if(day()!==d)return; // Never attach a late upload to another matchday or demo.
    const c=document.createElement('canvas'),ratio=Math.min(1,1200/Math.max(img.width,img.height));c.width=Math.max(1,Math.round(img.width*ratio));c.height=Math.max(1,Math.round(img.height*ratio));
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    // Re-encoding pixels avoids carrying the original file’s EXIF/GPS metadata.
    d.photo=c.toDataURL('image/jpeg',.75);d.photoAcknowledgement={wordingVersion:1,confirmedAt:new Date().toISOString()};save();render();toast('Photo added to this matchday draft.');
  }catch{if(day()===d){render();toast('This image could not be opened. Try a JPEG or PNG.')}}finally{img?.close?.()}
};
const photoExportPanelBefore=exportPanel;
exportPanel=function(title,html){if(day()?.photo)html=`<aside class="photo-safety"><strong>Before sharing this photo</strong><p>Check permission covers everyone identifiable and your intended audience. Hiding names does not hide faces. Downloaded or forwarded copies cannot be recalled by TikiTapper.</p></aside>`+html;photoExportPanelBefore(title,html)};
render();
