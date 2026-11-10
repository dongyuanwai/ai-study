import { createApprovalHandler } from '@/lib/server/ai-approval.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = createApprovalHandler();
