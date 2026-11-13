import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import KnowledgeField from '../components/knowledge-value';
test('knowledge renders new fields, nested arrays and explicit false, zero and missing values',()=>{
 const html=renderToStaticMarkup(React.createElement(KnowledgeField,{value:{future_field:'Visible future data',nested:[{answer:false,score:0,missing:null}],text:'first\\nsecond',link:'javascript:alert(1)'}}));
 for(const text of ['Future field','Visible future data','No','0','Not provided','first\nsecond'])assert.ok(html.includes(text),text);
 assert.ok(!html.includes('href="javascript:'));
});
