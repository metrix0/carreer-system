-- A live, owner-only projection of the existing encrypted knowledge record.
-- No second profile table and no client access to identity, pay history or Vault.
create or replace function private.read_candidate_knowledge()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  k jsonb;
  modified timestamptz;
begin
  if auth.uid() is null or not private.is_owner() then
    raise exception 'Workspace owner required' using errcode = '42501';
  end if;
  select decrypted_secret::jsonb, updated_at into k, modified
  from vault.decrypted_secrets where name = 'career_radar_candidate_answers';
  if k is null then
    raise exception 'Candidate knowledge is unavailable' using errcode = 'P0002';
  end if;
  return jsonb_build_object(
    'updated_at', modified,
    'candidate', k->'candidate',
    'education', jsonb_build_object(
      'course', k#>'{education,course}',
      'university', k#>'{education,university}',
      'status', k#>'{education,status}',
      'graduation_year', k#>'{education,expected_graduation_year}'
    ),
    'background', jsonb_build_object(
      'en', k#>'{background,en}',
      'pt_br', k#>'{background,pt_br}'
    ),
    'preferences', jsonb_build_object(
      'remote', k#>'{eligibility,remote}',
      'hours_per_week', k#>'{availability,hours_per_week}',
      'immediate', k#>'{availability,immediate}',
      'contracts', coalesce(k#>'{availability,contracts}', '[]'::jsonb),
      'minimum_brl_monthly', k#>'{compensation,minimum_brl_monthly}',
      'desired_brl_monthly', k#>'{compensation,desired_brl_monthly}'
    ),
    'writing', jsonb_build_object(
      'guidance', k#>'{application_writing,guidance}',
      'strengths', coalesce((
        select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
          'key', s->'key', 'claim', s->'claim', 'usage', s->'usage',
          'current_metrics', s->'candidate_provided_metrics'
        )) order by ordinal)
        from jsonb_array_elements(k#>'{application_writing,strengths}') with ordinality as a(s, ordinal)
      ), '[]'::jsonb),
      'cover_letter', jsonb_build_object(
        'en', k#>'{application_writing,cover_letter,en}',
        'pt-BR', k#>'{application_writing,cover_letter,pt-BR}'
      ),
      'short_answer', jsonb_build_object(
        'en', k#>'{application_writing,short_answer,en}',
        'pt-BR', k#>'{application_writing,short_answer,pt-BR}'
      )
    )
  );
end $$;
revoke all on function private.read_candidate_knowledge() from public, anon;
grant execute on function private.read_candidate_knowledge() to authenticated;

create or replace function public.get_candidate_knowledge()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select private.read_candidate_knowledge()
$$;
revoke all on function public.get_candidate_knowledge() from public, anon;
grant execute on function public.get_candidate_knowledge() to authenticated;
comment on function public.get_candidate_knowledge() is
  'Owner-only safe live projection of Candidate Knowledge. No identity, declarations, pay history or Vault access.';
