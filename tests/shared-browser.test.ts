import test from 'node:test';
import assert from 'node:assert/strict';
import {sharedBrowserUrl} from '../lib/shared-browser';

test('shared browser preserves query and fragments through one URI decode',()=>{
 const url='https://example.com/apply?a=1&return=https%3A%2F%2Fexample.com%2Fstep#assessment';
 const link=sharedBrowserUrl(url)!;
 assert.equal(decodeURIComponent(link.split('?url=')[1]),url);
});
test('shared browser rejects executable and non-HTTPS destinations',()=>{
 for(const url of ['javascript:alert(1)','file:///C:/Windows','data:text/html,test','http://example.com'])assert.equal(sharedBrowserUrl(url),undefined);
});
test('task identity lets the launcher preserve a redirected assessment tab',()=>{
 const id='00000000-0000-4000-8000-000000000001';
 assert.equal(sharedBrowserUrl('https://example.com/',id),'career-browser:open?url=https%3A%2F%2Fexample.com%2F&task='+id);
 assert.equal(sharedBrowserUrl('https://example.com/','bad&task=other'),'career-browser:open?url=https%3A%2F%2Fexample.com%2F');
});
