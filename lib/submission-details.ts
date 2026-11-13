type CustomAnswer = {question: string; answer: string};

const sensitiveQuestion = /\b(?:cpf|rg|passport|passaporte|ssn|identity|identidade|documento|filiacao|filiation|full name|nome completo|legal name|nome legal|mae|pai|mother|father|date of birth|data de nascimento|birthdate|birthday|address|endereco|cep|phone|telefone|celular|e[- ]?mail|health|saude|disability|deficiencia|pcd|gender|genero|race|raca|ethnicity|etnia|religion|religiao|sexual orientation|orientacao sexual|marital status|estado civil|password|senha|access token)\b|(?:salario|remuneracao|compensacao) (?:atual|anterior)|(?:current|previous) (?:salary|pay|compensation)/i;
const sensitiveValue = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{2}\.\d{3}\.\d{3}-[\dX]\b|\b\d{11}\b|(?:\+55[ -]?)?\(\d{2}\)[ -]?\d{4,5}[- ]\d{4}\b|\b[^\s@]+@[^\s@]+\.[a-z]{2,}\b/i;

function safeText(value: unknown) {
 return typeof value === 'string' && !sensitiveValue.test(value) ? value.trim() : '';
}

export function readSubmissionDetails(value: unknown) {
 if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
 const fields = value as Record<string, unknown>;
 const cvVersion = safeText(fields.cv_version);
 const salaryExpectation = safeText(fields.salary_expectation);
 const answers: CustomAnswer[] = [];
 if (Array.isArray(fields.custom_answers)) {
  for (const item of fields.custom_answers) {
   if (!item || typeof item !== 'object') continue;
   const question = safeText(item.question);
   const answer = safeText(item.answer);
   const label = question.normalize('NFD').replace(/\p{Diacritic}/gu, '');
   if (question && answer && !sensitiveQuestion.test(label)) answers.push({question, answer});
  }
 }
 return cvVersion || salaryExpectation || answers.length
  ? {cvVersion, salaryExpectation, answers}
  : null;
}
