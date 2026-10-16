// Event `at` is elapsed playing time for chronological ordering. Display time
// is derived from immutable half metadata, so first-half stoppage time cannot
// move a second-half kickoff beyond its scheduled starting minute.
function durationFor(m){return Number(m?.durationMinutes)||30}
function usesHalves(m){return m.twoHalves!==false}
function halfLengthMs(m){return durationFor(m)*(usesHalves(m)?30000:60000)}
function captureEventTime(m,periodAt){
  const period=m.period===2?2:1,halfMs=halfLengthMs(m);
  return {period,periodAt,halfLengthMs:halfMs,twoHalves:usesHalves(m),at:(period===2?(m.firstHalfElapsed??halfMs):0)+periodAt};
}
function formatPeriodTime(period,periodAt,halfMs,precise=false){
  const base=(period-1)*halfMs,limit=period*halfMs;
  if(periodAt>halfMs){const extra=periodAt-halfMs;return precise?`${fmt(limit)} +${fmt(extra)}`:`${limit/60000}+${Math.max(1,Math.ceil(extra/60000))}′`}
  return fmt(base+periodAt);
}
function eventTimeLabel(e,precise=false){return e.period&&Number.isFinite(e.periodAt)?`${e.twoHalves===false?'':e.period+'H · '}${formatPeriodTime(e.period,e.periodAt,e.halfLengthMs||900000,precise)}`:fmt(e.at)}
function clockText(m){return formatPeriodTime(m.period===2?2:1,elapsed(m),halfLengthMs(m),true)}
