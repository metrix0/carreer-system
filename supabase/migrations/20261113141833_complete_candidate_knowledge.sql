create or replace function private.read_candidate_knowledge()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare k jsonb; identity_data jsonb; modified timestamptz; identity_modified timestamptz;
begin
 if auth.uid() is null or not private.is_owner() then
  raise exception 'Workspace owner required' using errcode='42501';
 end if;
 select decrypted_secret::jsonb,updated_at into k,modified
 from vault.decrypted_secrets where name='career_radar_candidate_answers';
 if k is null then raise exception 'Candidate knowledge unavailable' using errcode='P0002'; end if;
 select decrypted_secret::jsonb,updated_at into identity_data,identity_modified
 from vault.decrypted_secrets where name='career_radar_candidate_identity';
 return jsonb_build_object('updated_at',modified,'knowledge',k,
   'identity',coalesce(identity_data,'{}'::jsonb),'identity_updated_at',identity_modified);
end $$;
revoke all on function private.read_candidate_knowledge() from public,anon;
grant execute on function private.read_candidate_knowledge() to authenticated;
comment on function public.get_candidate_knowledge() is
 'Complete candidate knowledge and identity for the confirmed workspace owner only. No arbitrary Vault access.';
