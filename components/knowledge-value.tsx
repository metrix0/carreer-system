import React from 'react';
import {knowledgeLabel,type KnowledgeValue} from '@/lib/knowledge';
import {safeUrl} from '@/lib/model';
export default function KnowledgeField({value}:{value:KnowledgeValue}){
 if(value===null)return <span className="knowledge-note">Not provided</span>;
 if(typeof value==='boolean')return <span>{value?'Yes':'No'}</span>;
 if(typeof value==='number')return <span>{value}</span>;
 if(typeof value==='string'){
  const url=safeUrl(value);
  return url?<a href={url} target="_blank" rel="noreferrer">{value}</a>:<span className="knowledge-template">{value.replaceAll('\\n','\n')}</span>;
 }
 if(Array.isArray(value))return value.length?<ul className="knowledge-list">{value.map((item,i)=><li key={i}><KnowledgeField value={item}/></li>)}</ul>:<span className="knowledge-note">None recorded</span>;
 const entries=Object.entries(value);
 return entries.length?<dl className="knowledge-fields">{entries.map(([key,item])=><div key={key}><dt>{knowledgeLabel(key)}</dt><dd><KnowledgeField value={item}/></dd></div>)}</dl>:<span className="knowledge-note">None recorded</span>;
}
