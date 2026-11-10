begin;

create table public.interview_records (
  id text primary key,
  position integer not null,
  details jsonb not null check (jsonb_typeof(details) = 'object' and not (details ? 'questions'))
);
create table public.interview_questions (
  interview_id text not null references public.interview_records(id),
  id text not null,
  position integer not null,
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  revision bigint not null default 1,
  primary key (interview_id, id)
);
create index interview_questions_order on public.interview_questions(interview_id, position, id);
create table public.interview_answer_history (
  id bigint generated always as identity primary key,
  interview_id text not null,
  question_id text not null,
  previous_content jsonb not null,
  previous_revision bigint not null,
  created_at timestamptz not null default now()
);

alter table public.interview_records enable row level security;
alter table public.interview_questions enable row level security;
alter table public.interview_answer_history enable row level security;
revoke all on public.interview_records, public.interview_questions, public.interview_answer_history from public, anon, authenticated;
grant select on public.interview_records, public.interview_questions to anon, authenticated;
grant all on public.interview_records, public.interview_questions, public.interview_answer_history to service_role;
grant usage, select on sequence public.interview_answer_history_id_seq to service_role;
create policy interview_records_read on public.interview_records for select to anon, authenticated using (true);
create policy interview_questions_read on public.interview_questions for select to anon, authenticated using (true);

-- 所有题目修改都会增加版本号，防止预览期间的人工编辑被覆盖。
create function public.bump_interview_question_revision() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  return new;
end;
$$;
revoke all on function public.bump_interview_question_revision() from public, anon, authenticated;
create trigger interview_question_revision before update on public.interview_questions
for each row execute function public.bump_interview_question_revision();

-- 校验版本、备份旧答案、更新正文在同一个事务内完成。
create function public.approve_interview_answer(p_interview_id text, p_question_id text, p_revision bigint, p_answer text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  current_question public.interview_questions%rowtype;
  updated_content jsonb;
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
  insert into public.interview_answer_history(interview_id, question_id, previous_content, previous_revision)
    values (p_interview_id, p_question_id, current_question.content, current_question.revision);
  update public.interview_questions
    set content = jsonb_set(content, '{answer}', to_jsonb(p_answer), true)
    where interview_id = p_interview_id and id = p_question_id
    returning content into updated_content;
  return jsonb_build_object('answer', updated_content->'answer');
end;
$$;
revoke all on function public.approve_interview_answer(text, text, bigint, text) from public, anon, authenticated;
grant execute on function public.approve_interview_answer(text, text, bigint, text) to service_role;

commit;
