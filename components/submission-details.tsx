import type {Application} from '@/lib/model';
import {readSubmissionDetails} from '@/lib/submission-details';

export default function SubmissionDetails({application}: {application: Application}) {
 if (!application.submission_verified) return null;
 const details = readSubmissionDetails(application.submission_details);

 return <section className="submission-details" aria-labelledby="submission-details-heading">
  <h3 className="detail-section-title" id="submission-details-heading">What was sent</h3>
  {details ? <>
   <dl className="submission-facts">
    <div><dt>CV version</dt><dd>{details.cvVersion || 'Not recorded'}</dd></div>
    <div><dt>Salary expectation</dt><dd>{details.salaryExpectation || 'Not recorded'}</dd></div>
   </dl>
   {details.answers.length > 0 && <>
    <h4>Custom answers</h4>
    <dl className="submission-answers">
     {details.answers.map(({question, answer}, index) =>
      <div key={index}><dt>{question}</dt><dd>{answer}</dd></div>
     )}
    </dl>
   </>}
  </> : <p>No submission details recorded.</p>}
 </section>;
}
