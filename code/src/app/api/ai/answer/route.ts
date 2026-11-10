import { createAnswerHandler } from '@/lib/server/ai-answer.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;
export const POST = createAnswerHandler();
