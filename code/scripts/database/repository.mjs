import { createSupabaseApi, DatabaseError } from '../../src/lib/supabase-data.mjs';

export function createInterviewRepository(config) {
  const request = createSupabaseApi(config.url, config.key);
  return {
    async find(interviewId, questionId) {
      const interviewQuery = new URLSearchParams({ id: `eq.${interviewId}`, select: 'id,details' });
      const questionQuery = new URLSearchParams({ interview_id: `eq.${interviewId}`, id: `eq.${questionId}`, select: 'id,content,revision' });
      const [records, questions] = await Promise.all([request(`interview_records?${interviewQuery}`), request(`interview_questions?${questionQuery}`)]);
      if (!records[0] || !questions[0]) throw new DatabaseError(404);
      return { interview: { ...records[0].details, id: records[0].id }, question: { ...questions[0].content, id: questions[0].id }, revision: questions[0].revision };
    },
    async approve(draft) {
      return request('rpc/approve_interview_answer', { method: 'POST', body: { p_interview_id: draft.interviewId, p_question_id: draft.questionId, p_revision: draft.revision, p_answer: draft.output.answer } });
    },
  };
}
