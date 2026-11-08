import data from "@/data/questions.json";
import type { Question } from "./question-bank";

export const questions = data as Question[];
const questionsById = new Map(questions.map(question => [question.id, question]));
export const getQuestion = (id: string) => questionsById.get(id);
