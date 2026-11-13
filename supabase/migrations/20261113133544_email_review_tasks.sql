alter table public.tasks
  alter column application_id drop not null,
  alter column last_stage drop not null,
  add column gmail_thread_id text,
  add constraint tasks_gmail_thread_id_key unique (gmail_thread_id),
  add constraint tasks_email_review_check check (
    (gmail_thread_id is null and application_id is not null and last_stage is not null)
    or (
      gmail_thread_id is not null
      and gmail_thread_id ~ '^[A-Za-z0-9_-]+$'
      and responsible = 'Candidate'
      and ((application_id is null) = (last_stage is null))
      and url ~ '^https://mail[.]google[.]com/mail/u/([0-9]+/|[?]authuser=[A-Za-z0-9._+%@-]+)#all/[A-Za-z0-9_-]+$'
      and split_part(url, '#all/', 2) = gmail_thread_id
    )
  );
