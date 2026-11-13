export type SubmissionAnswer = {question: string; answer: string};

const sensitiveQuestion = /\b(?:cpf|rg|passport|passaporte|ssn|identity|identidade|documento|filiacao|filiation|full name|nome completo|legal name|nome legal|mae|pai|mother|father|date of birth|data de nascimento|birthdate|birthday|address|endereco|cep|phone|telefone|celular|e[- ]?mail|health|saude|disability|deficiencia|pcd|gender|genero|race|raca|ethnicity|etnia|religion|religiao|sexual orientation|orientacao sexual|marital status|estado civil|password|senha|access token)\b|(?:salario|remuneracao|compensacao) (?:atual|anterior)|(?:current|previous) (?:salary|pay|compensation)/i;
const sensitiveValue = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{2}\.\d{3}\.\d{3}-[\dX]\b|\b\d{11}\b|(?:\+55[ -]?)?\(\d{2}\)[ -]?\d{4,5}[- ]\d{4}\b|\b[^\s@]+@[^\s@]+\.[a-z]{2,}\b/i;

function safeText(value: unknown) {
 return typeof value === 'string' && !sensitiveValue.test(value) ? value.trim() : '';
}

function readAnswers(value: unknown): SubmissionAnswer[] {
 if (!Array.isArray(value)) return [];
 const answers: SubmissionAnswer[] = [];
 for (const item of value) {
  if (!item || typeof item !== 'object') continue;
  const question = safeText(item.question);
  const answer = safeText(item.answer);
  const label = question.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  if (question && answer && !sensitiveQuestion.test(label)) answers.push({question, answer});
 }
 return answers;
}

export function readSubmissionDetails(value: unknown) {
 if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
 const fields = value as Record<string, unknown>;
 const customAnswers = readAnswers(fields.custom_answers);
 const otherAnswers = readAnswers(fields.other_answers ?? [
  {question: 'CV', answer: fields.cv_version},
  {question: 'Salary expectation', answer: fields.salary_expectation},
 ]);
 return customAnswers.length || otherAnswers.length ? {customAnswers, otherAnswers} : null;
}
