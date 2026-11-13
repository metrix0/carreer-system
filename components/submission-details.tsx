import type {Application} from '@/lib/model';
import {readSubmissionDetails, type SubmissionAnswer} from '@/lib/submission-details';

function AnswerGroup({title, answers}: {title: string; answers: SubmissionAnswer[]}) {
 if (!answers.length) return null;

 return <>
  <h4>{title}</h4>
  <dl className="submission-answers">
   {answers.map(({question, answer}, index) =>
    <div key={index}><dt>{question}</dt><dd>{answer}</dd></div>
   )}
  </dl>
 </>;
}

export default function SubmissionDetails({application}: {application: Application}) {
 if (!application.submission_verified) return null;
 const details = readSubmissionDetails(application.submission_details);

 return <section className="submission-details" aria-labelledby="submission-details-heading">
  <h3 className="detail-section-title" id="submission-details-heading">What was sent</h3>
  {details ? <>
   <AnswerGroup title="Custom answers" answers={details.customAnswers}/>
   <AnswerGroup title="Other answers" answers={details.otherAnswers}/>
  </> : <p>No submission details recorded.</p>}
 </section>;
}
