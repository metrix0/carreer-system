begin;

do $test$
declare
  first_run uuid := gen_random_uuid();
  second_run uuid := gen_random_uuid();
  first_application text := 'application:' || gen_random_uuid();
  second_application text := 'application:' || gen_random_uuid();
begin
  if not private.recruiting_claim(first_application, first_run) then
    raise exception 'First application claim failed';
  end if;
  if private.recruiting_claim(first_application, second_run) then
    raise exception 'Two runs claimed the same application';
  end if;
  if not private.recruiting_claim(second_application, second_run) then
    raise exception 'A claim blocked work on a different application';
  end if;
  if private.recruiting_claim(first_application, second_run, 'renew')
     or private.recruiting_claim(first_application, second_run, 'release') then
    raise exception 'Another run changed an active claim';
  end if;
  if not private.recruiting_claim(first_application, first_run, 'renew') then
    raise exception 'Owner renewal failed';
  end if;

  update private.recruiting_claims
  set expires_at = clock_timestamp() - interval '1 second'
  where resource = first_application;

  if private.recruiting_claim(first_application, first_run, 'renew') then
    raise exception 'Expired claim renewed';
  end if;
  if not private.recruiting_claim(first_application, second_run) then
    raise exception 'Expired claim could not be reclaimed';
  end if;
  if private.recruiting_claim(first_application, first_run, 'release') then
    raise exception 'Previous owner released a reclaimed application';
  end if;
  if not private.recruiting_claim(first_application, second_run, 'release')
     or not private.recruiting_claim(second_application, second_run, 'release') then
    raise exception 'Owner release failed';
  end if;

  if has_function_privilege('anon', 'private.recruiting_claim(text,uuid,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'private.recruiting_claim(text,uuid,text)', 'EXECUTE')
     or has_table_privilege('authenticated', 'private.recruiting_claims', 'UPDATE')
     or not has_function_privilege('service_role', 'private.recruiting_claim(text,uuid,text)', 'EXECUTE') then
    raise exception 'Unexpected claim privileges';
  end if;

  begin
    perform private.recruiting_lock(first_run, 'acquire');
    raise exception 'Legacy run-wide lock still accepts new runs' using errcode = 'XX000';
  exception when raise_exception then
    if sqlerrm <> 'Recruiting now uses per-application claims. Reload AGENTS.md from main.' then
      raise;
    end if;
  end;
end;
$test$;

rollback;
select 'application claim lifecycle, permissions and legacy cutover passed' as result;
