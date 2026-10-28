import {describe,it,expect} from 'vitest';
import {connectionResult} from '../widget/connection-result';

describe('Browser measurement shared with the conversation',()=>{
 it('projects only country, observed transport and valid HTTP duration',()=>{
  const result=connectionResult({region:'KR',probePerformed:true,probeStatus:'supported',errorCode:'',
   observations:[{protocol:'IPv4',requestMs:10.4,ip:'192.0.2.7',asn:'AS64500',city:'Ipswich'} as any,{protocol:'IPv6',requestMs:20.7}]});
  expect(result.protocols).toEqual([{protocol:'IPv4',requestMs:10},{protocol:'IPv6',requestMs:21}]);
  expect(result.region).toBe('KR');expect(result.ipv6ProbeStatus).toBe('supported');
  for(const sensitive of ['192.0.2.7','AS64500','Ipswich'])expect(JSON.stringify(result)).not.toContain(sensitive);
 });
 it('does not turn a failed probe or invalid location into a confident result',()=>{
  const result=connectionResult({region:'192.0.2.7',probePerformed:true,probeStatus:'unsupported',errorCode:'TypeError: 192.0.2.7',
   observations:[{protocol:'IPv4',requestMs:NaN},{protocol:'IPv6',requestMs:-1},{protocol:'other',requestMs:10} as any]});
  expect(result.region).toBe('XX');expect(result.ipv6ProbeStatus).toBe('unknown');
  expect(result.errorCode).toBeNull();expect(result.protocols).toEqual([]);
 });
 it('distinguishes an unrun probe from a failed or completed probe',()=>{
  const result=connectionResult({region:'XX',probePerformed:false,probeStatus:'unknown',errorCode:'networkError',observations:[]});
  expect(result.ipv6ProbeStatus).toBe('not_tested');expect(result.errorCode).toBe('networkError');
  expect(Date.parse(result.measuredAt)).not.toBeNaN();
 });
});
