import records from "@/data/company-interviews.json";

export interface InterviewQuestion {
  id: string;
  number: number;
  group: string;
  topic: string;
  title: string;
  answer: string | null;
  oral: string | null;
  pitfalls: string | null;
}
export interface CompanyInterview {
  id: string;
  company: string;
  companyEn: string;
  role: string;
  round: string;
  duration: string;
  tags: string[];
  summary: string;
  answerNote?: string;
  notes: string[];
  questions: InterviewQuestion[];
}
export const interviews: CompanyInterview[] = records;
