begin;
alter table public.interview_records add column revision bigint not null default 1;
create trigger interview_record_revision before update on public.interview_records
for each row execute function public.bump_interview_question_revision();

create table public.knowledge_questions (
  id text primary key,
  position integer not null,
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  revision bigint not null default 1
);
create table public.knowledge_question_history (
  id bigint generated always as identity primary key,
  question_id text not null,
  previous_content jsonb not null,
  previous_revision bigint not null,
  operation text not null,
  created_at timestamptz not null default now()
);
alter table public.interview_answer_history add column operation text not null default 'update';
alter table public.knowledge_questions enable row level security;
alter table public.knowledge_question_history enable row level security;
revoke all on public.knowledge_questions, public.knowledge_question_history from public, anon, authenticated;
grant select on public.knowledge_questions to anon, authenticated;
grant all on public.knowledge_questions, public.knowledge_question_history to service_role;
grant usage, select on sequence public.knowledge_question_history_id_seq to service_role;
create policy knowledge_questions_read on public.knowledge_questions for select to anon, authenticated using (true);
create trigger knowledge_question_revision before update on public.knowledge_questions
for each row execute function public.bump_interview_question_revision();

-- 统一备份所有 API 修改和删除；与修改在同一事务中完成。
create function public.archive_question_change() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_table_name = 'knowledge_questions' then
    insert into public.knowledge_question_history(question_id, previous_content, previous_revision, operation)
      values (old.id, old.content, old.revision, lower(tg_op));
  else
    insert into public.interview_answer_history(interview_id, question_id, previous_content, previous_revision, operation)
      values (old.interview_id, old.id, old.content, old.revision, lower(tg_op));
  end if;
  return old;
end;
$$;
revoke all on function public.archive_question_change() from public, anon, authenticated;
create trigger knowledge_question_history after update or delete on public.knowledge_questions
for each row execute function public.archive_question_change();
create trigger interview_question_history after update or delete on public.interview_questions
for each row execute function public.archive_question_change();

create or replace function public.approve_interview_answer(p_interview_id text, p_question_id text, p_revision bigint, p_answer text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare current_question public.interview_questions%rowtype; updated_content jsonb;
begin
  if p_answer is null or length(trim(p_answer)) = 0 or length(p_answer) > 24000 then
    raise sqlstate 'PT400' using message = 'invalid_answer';
  end if;
  select * into current_question from public.interview_questions
    where interview_id = p_interview_id and id = p_question_id for update;
  if not found then raise sqlstate 'PT404' using message = 'question_not_found'; end if;
  if p_revision is null or current_question.revision <> p_revision then
    raise sqlstate 'PT409' using message = 'answer_conflict';
  end if;
  update public.interview_questions set content = jsonb_set(content, '{answer}', to_jsonb(p_answer), true)
    where interview_id = p_interview_id and id = p_question_id returning content into updated_content;
  return jsonb_build_object('answer', updated_content->'answer');
end;
$$;
commit;
