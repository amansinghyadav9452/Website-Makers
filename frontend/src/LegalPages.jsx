import React from 'react';

const pages = {
  privacy: {
    title: 'Privacy Policy',
    eyebrow: 'Privacy',
    sections: [
      ['What we collect', 'When you contact Website Makers, we may collect the information you submit, such as your name, email address, phone number, service requirements and message. We also collect limited technical analytics when analytics is enabled.'],
      ['How we use it', 'We use enquiry information to respond to requests, prepare estimates, deliver projects and provide support. We do not sell customer enquiry data.'],
      ['Retention', 'We retain business records only as long as reasonably necessary for support, accounting, legal obligations and project history.'],
      ['Third parties', 'We may use hosting, database, email and payment providers to operate the service. They receive only the information required for the relevant service.'],
      ['Your choices', 'You can request correction or deletion of personal information, subject to records we are legally required to retain.'],
    ]
  },
  terms: {
    title: 'Terms & Conditions',
    eyebrow: 'Terms',
    sections: [
      ['Scope', 'Project scope, deliverables, timelines and pricing are confirmed in the approved quotation or project agreement.'],
      ['Client responsibilities', 'Clients are responsible for providing accurate content, brand assets, approvals and access required to complete the project.'],
      ['Payments', 'Any advance, milestone and final payment terms are those stated in the approved quotation or invoice. Work may pause on overdue payments.'],
      ['Changes', 'Requests outside the agreed scope may change price and delivery time. Material changes should be approved before implementation.'],
      ['Delivery', 'A project is considered delivered when the agreed deliverables are deployed or made available for client review according to the agreed acceptance process.'],
    ]
  },
  refund: {
    title: 'Refund & Cancellation Policy',
    eyebrow: 'Billing',
    sections: [
      ['Before work starts', 'Cancellation before project work begins can be handled according to the quotation and any payment-provider rules.'],
      ['After work starts', 'Once design, development or third-party costs have been incurred, refunds may be reduced by completed work and non-refundable costs.'],
      ['Third-party costs', 'Domain names, hosting, paid themes, licences, APIs and other third-party purchases may be non-refundable.'],
      ['Project pause', 'If a project is paused because required client inputs or approvals are unavailable, the delivery timeline may move accordingly.'],
    ]
  },
  cookies: {
    title: 'Cookie Policy',
    eyebrow: 'Cookies',
    sections: [
      ['Essential storage', 'The application may use browser storage for authentication sessions and basic application functionality.'],
      ['Analytics', 'Where analytics is enabled, events such as page views, CTA interactions and demo opens may be recorded to improve the website.'],
      ['Control', 'You can clear browser storage or restrict cookies through your browser settings. Some authenticated features may stop working if required storage is blocked.'],
    ]
  }
};

export default function LegalPages({type='privacy', onBack}) {
  const page = pages[type] || pages.privacy;
  return <div className="legal-page">
    <div className="legal-shell">
      <button className="legal-back" onClick={onBack}>← Back to Website Makers</button>
      <span className="eyebrow">{page.eyebrow}</span>
      <h1>{page.title}</h1>
      <p className="legal-updated">Last updated: August 2026</p>
      {page.sections.map(([h,p])=><section key={h}><h2>{h}</h2><p>{p}</p></section>)}
      <div className="legal-contact"><strong>Website Makers</strong><span>For policy questions, contact us through the website enquiry form.</span></div>
    </div>
  </div>;
}
