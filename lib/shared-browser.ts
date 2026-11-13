import {safeUrl} from './model';

export function sharedBrowserUrl(value: string, taskId?: string): string | undefined {
 const url=safeUrl(value);
 if(!url)return undefined;
 const parsed=new URL(url);
 if(parsed.protocol!=='https:'||parsed.username||parsed.password)return undefined;
 return 'career-browser:open?url='+encodeURIComponent(url)+(taskId&&/^[a-f0-9-]{36}$/i.test(taskId)?'&task='+taskId:'');
}
