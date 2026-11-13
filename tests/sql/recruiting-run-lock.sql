do $test$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid();
begin
 if exists(select 1 from private.recruiting_run_lock) then raise exception 'Skip: recruiting lock is in use'; end if;
 if not private.recruiting_lock(a) then raise exception 'Acquire failed'; end if;
 if private.recruiting_lock(b) then raise exception 'Two owners allowed'; end if;
 if private.recruiting_lock(b,'renew') or private.recruiting_lock(b,'release') then raise exception 'Wrong owner allowed'; end if;
 if not private.recruiting_lock(a,'renew') then raise exception 'Renew failed'; end if;
 update private.recruiting_run_lock set expires_at=clock_timestamp()-interval '1 second' where run_id=a;
 if private.recruiting_lock(a,'renew') then raise exception 'Expired owner renewed'; end if;
 if not private.recruiting_lock(b) then raise exception 'Expired lease not recoverable'; end if;
 if private.recruiting_lock(a,'release') then raise exception 'Stale owner released new lock'; end if;
 if not private.recruiting_lock(b,'release') then raise exception 'Release failed'; end if;
 if has_function_privilege('anon','private.recruiting_lock(uuid,text)','EXECUTE')
 or has_function_privilege('authenticated','private.recruiting_lock(uuid,text)','EXECUTE')
 or has_table_privilege('authenticated','private.recruiting_run_lock','UPDATE') then
  raise exception 'Client access unexpectedly allowed';
 end if;
end $test$;
select 'lease lifecycle and client isolation passed' as result;
