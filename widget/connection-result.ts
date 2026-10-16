export type ProtocolObservation = {protocol:'IPv4'|'IPv6';requestMs:number};
const errorCodes = new Set(['networkError','rateLimit','probeMissing','probeUnknown','probeTimeout','probeHttp','probeNetwork']);

// Only this allowlisted projection may cross the widget-to-conversation bridge.
// Never forward API objects, exception messages, or precise location metadata.
export function connectionResult(input:{
 region:unknown;
 observations:Iterable<ProtocolObservation>;
 probePerformed:boolean;
 probeStatus:string;
 errorCode:string;
 measuredAt?:string;
}) {
 const region=typeof input.region==='string'&&/^[A-Z]{2}$/.test(input.region)?input.region:'XX';
 const protocols=[...input.observations]
  .filter(o=>(o.protocol==='IPv4'||o.protocol==='IPv6')&&Number.isFinite(o.requestMs)&&o.requestMs>=0&&o.requestMs<=60000)
  .map(o=>({protocol:o.protocol,requestMs:Math.round(o.requestMs)}));
 return {
  kind:'browser_network_measurement',status:'completed',
  measuredAt:input.measuredAt??new Date().toISOString(),
  region,regionSource:'browser_request_country',protocols,
  ipv6ProbeStatus:!input.probePerformed?'not_tested':input.probeStatus==='supported'?'supported':'unknown',
  errorCode:errorCodes.has(input.errorCode)?input.errorCode:null,
  note:'Protocols are observed HTTP transports; requestMs includes HTTPS and server processing, not ping. The IPv6 status describes the dedicated IPv6-only probe. Failed probes remain unverified. Country attribution can reflect VPN/proxy routing. No IP, ASN, ISP, or city is included; do not infer them from other context.'
 };
}
