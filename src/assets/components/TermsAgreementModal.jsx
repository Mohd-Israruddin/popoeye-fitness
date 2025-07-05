import React from 'react';
import { FiFileText, FiX } from 'react-icons/fi';

const TermsAgreementModal = ({ show, onClose, onAccept, showAcceptButton = false, title = "Terms and Agreement" }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal terms-modal">
        <div className="modal-header">
          <h3><FiFileText /> {title}</h3>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>
        
        <div className="terms-content">
          <h4>Solsparrow – Terms of Service</h4>
          
          <h5>1. Introduction</h5>
          <p>These Terms of Service ('Agreement') are entered into by and between the Customer ('User') and Solsparrow, a proposed company to be incorporated under Indian law ('Company'). By accessing or using the Solsparrow platform and services ('Service'), the User agrees to be legally bound by this Agreement. If you do not agree to these terms, do not use the Service.</p>
          
          <h5>2. Definitions</h5>
          <p>'User' refers to any person or entity who uses or accesses the Service. 'Account' means the registered profile created to access the Service. 'Content' includes any data, media, or information uploaded by the User. 'Service' refers to Solsparrow's web-based software and related tools and infrastructure.</p>
          
          <h5>3. Eligibility & Account Registration</h5>
          <p>To use the Service, you must be at least 18 years old or have the legal authority to enter into this Agreement. You are responsible for maintaining the confidentiality of your account credentials and for all activity occurring under your account.</p>
          
          <h5>4. Services Offered</h5>
          <p>Solsparrow provides SaaS tools for gym and class-based businesses, including attendance tracking, payment management, scheduling, and engagement features. Beta tools or experimental features may be released from time to time and are provided 'as is' without guarantees.</p>
          
          <h5>5. Subscription, Billing & Payment Terms</h5>
          <p>Users may subscribe monthly, quarterly, or annually. Charges are billed in advance. Subscriptions auto-renew unless cancelled before the renewal date.</p>
          <ul>
            <li>Refunds are discretionary and only granted in specific cases (e.g., service failure).</li>
            <li>Taxes and currency are based on local laws and jurisdiction. Trial periods may be offered at the Company's discretion.</li>
            <li>Late payments may incur a penalty as cutting days from subscription or fines.</li>
          </ul>
          
          <h5>6. Non-Payment & Termination</h5>
          <p>Failure to make subscription payments may result in the following:</p>
          <ol>
            <li><strong>Notice:</strong> The Client will receive a formal notice of non-payment.</li>
            <li><strong>Suspension:</strong> Services may be suspended if payment remains pending after notice.</li>
            <li><strong>Termination:</strong> Continued non-payment may lead to permanent termination of the Client's account and access.</li>
            <li><strong>Legal Action:</strong> Solsparrow reserves the right to initiate legal proceedings for recovery, including issuing legal notice. Any legal fees incurred will be the responsibility of the Client.</li>
            <li><strong>Limitation of Liability:</strong> Solsparrow is not liable for any data loss or business disruption resulting from suspension or termination due to non-payment.</li>
          </ol>
          
          <h5>7. User Responsibilities</h5>
          <p>Users agree to use the Service lawfully. Activities like hacking, scraping, reverse engineering, or uploading harmful or illegal content are strictly prohibited.</p>
          
          <h5>8. Acceptable Use Policy (AUP)</h5>
          <p>Prohibited activities include:</p>
          <ul>
            <li>Spamming, harassment, impersonation, or launching denial-of-service attacks</li>
            <li>Attempting to access restricted systems</li>
            <li>Violating the rights of others</li>
          </ul>
          <p>Violations may result in suspension or termination of your account.</p>
          
          <h5>9. Data & Privacy</h5>
          <p>We collect and store user data securely. Usage data may be analyzed in aggregate or anonymized forms to improve the product. For full privacy details, refer to our Privacy Policy. We comply with GDPR, CCPA, and similar laws.</p>
          
          <h5>10. AI & Automation Usage Terms</h5>
          <p>Some features may use AI to suggest meal plans, workouts, or analytics. These are provided as recommendations only. Users should verify AI-generated content independently. Solsparrow does not guarantee accuracy or liability of AI-driven features.</p>
          
          <h5>11. Data Ownership</h5>
          <p>Users retain ownership of the data they submit. By using the Service, you grant Solsparrow the right to process your data for service improvement. Users may request deletion or export of their data at any time.</p>
          
          <h5>12. Security & Breach Disclosure</h5>
          <p>We implement reasonable security measures to protect your data. In the event of a breach, affected Users will be informed. Users are responsible for keeping their passwords and accounts secure.</p>
          
          <h5>13. Third-Party Integrations</h5>
          <p>Solsparrow may integrate with third-party services. We are not liable for failures or issues caused by third-party providers. Use of such services is subject to their own terms and conditions.</p>
          
          <h5>14. Intellectual Property</h5>
          <p>All intellectual property related to Solsparrow — including software, branding, and features — belongs solely to the Company. Users may not replicate, distribute, or modify the platform without written permission.</p>
          
          <h5>15. User-Generated Content</h5>
          <p>If the User submits content (images, testimonials, feedback), they affirm it does not infringe on any third-party rights. Solsparrow reserves the right to remove content or suspend users who violate these terms.</p>
          
          <h5>16. Termination & Suspension</h5>
          <p>Solsparrow may suspend or terminate access for violation of these terms. Users may cancel subscriptions at any time via their account. Post-termination, data may be deleted unless otherwise required by law.</p>
          
          <h5>17. Limitation of Liability</h5>
          <p>Solsparrow is not liable for indirect, incidental, or consequential damages. Liability is limited to the total subscription fee paid by the User over the past three (3) months.</p>
          
          <h5>18. Disclaimer of Warranties</h5>
          <p>Solsparrow provides the Service 'as is' and 'as available' without any warranties of any kind. We do not guarantee that the Service will be uninterrupted, timely, secure, or error-free.</p>
          
          <h5>19. Indemnification</h5>
          <p>Users agree to indemnify and hold harmless Solsparrow, its founders, employees, and partners against any claims, damages, or legal expenses resulting from the User's misuse of the platform.</p>
          
          <h5>20. Changes to Terms</h5>
          <p>Solsparrow reserves the right to update or modify these Terms at any time. Continued use of the Service after such changes constitutes acceptance of the new terms.</p>
          
          <h5>21. Governing Law & Jurisdiction</h5>
          <p>This Agreement is governed by the laws of India. All disputes shall be handled in the courts of Hyderabad, Telangana.</p>
          
          <h5>22. Force Majeure</h5>
          <p>Solsparrow is not responsible for delays or failures caused by events beyond its control, including natural disasters, war, internet outages, or changes in law.</p>
          
          <h5>23. Contact Information</h5>
          <p>For legal or support concerns, Users can contact us at: <strong>hello@solsparrow.com</strong> or through the in-app support portal.</p>
          
          <h5>24. Entire Agreement</h5>
          <p>This document constitutes the entire agreement between the User and Solsparrow and supersedes all prior oral or written agreements.</p>
        </div>
        
        <div className="modal-actions">
          {showAcceptButton && (
            <button type="button" className="btn btn-primary" onClick={onAccept}>
              <FiFileText />
              I Accept Terms & Agreement
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {showAcceptButton ? 'Decline' : 'Close'}
          </button>
        </div>
      </div>
      
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        
        .terms-modal {
          background: linear-gradient(145deg, #2A2A2C, #1C1C1E);
          border: 2px solid #28B295;
          border-radius: 16px;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          color: #E3E3E0;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #28B295;
        }
        
        .modal-header h3 {
          margin: 0;
          color: #D6F84C;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .close-btn {
          background: none;
          border: none;
          color: #E3E3E0;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          transition: all 0.3s ease;
        }
        
        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #D6F84C;
        }
        
        .terms-content {
          padding: 2rem;
          max-height: 60vh;
          overflow-y: auto;
        }
        
        .terms-content h4 {
          color: #D6F84C;
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          text-align: center;
          border-bottom: 2px solid #28B295;
          padding-bottom: 0.5rem;
        }
        
        .terms-content h5 {
          color: #28B295;
          font-size: 1.2rem;
          margin: 1.5rem 0 0.5rem 0;
          font-weight: 600;
        }
        
        .terms-content p {
          color: #E3E3E0;
          line-height: 1.6;
          margin-bottom: 1rem;
          text-align: justify;
        }
        
        .terms-content ul {
          color: #E3E3E0;
          line-height: 1.6;
          margin: 1rem 0;
          padding-left: 2rem;
        }
        
        .terms-content li {
          margin-bottom: 0.5rem;
        }
        
        .terms-content strong {
          color: #D6F84C;
          font-weight: 600;
        }
        
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 2px solid #28B295;
          gap: 2rem;
        }
        
        .signature-block {
          flex: 1;
          background: linear-gradient(145deg, #1C1C1E, #2A2A2C);
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #28B295;
        }
        
        .signature-block p {
          margin: 0.5rem 0;
          color: #E3E3E0;
        }
        
        .signature-block p:first-child {
          color: #D6F84C;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        
        .modal-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
          padding: 1.5rem 2rem;
          border-top: 1px solid #28B295;
        }
        
        .btn {
          background: linear-gradient(135deg, #28B295, #2A9D8A);
          color: #1C1C1E;
          border: 2px solid #28B295;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 15px rgba(40, 178, 149, 0.4);
        }
        
        .btn:hover {
          background: linear-gradient(135deg, #D6F84C, #C4E83C);
          color: #1C1C1E;
          border-color: #D6F84C;
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(214, 248, 76, 0.5);
        }
        
        .btn-secondary {
          background: linear-gradient(135deg, #2A2A2C, #1C1C1E);
          color: #E3E3E0;
          border-color: #28B295;
        }
        
        .btn-secondary:hover {
          background: linear-gradient(135deg, #28B295, #2A9D8A);
          color: #1C1C1E;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #D6F84C, #C4E83C);
          color: #1C1C1E;
          border-color: #D6F84C;
          font-weight: 700;
        }
        
        .btn-primary:hover {
          background: linear-gradient(135deg, #C4E83C, #B2D62C);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(214, 248, 76, 0.5);
        }
        
        @media (max-width: 768px) {
          .terms-modal {
            max-width: 95vw;
            margin: 1rem;
          }
          
          .signature-section {
            flex-direction: column;
            gap: 1rem;
          }
          
          .terms-content {
            padding: 1rem;
            max-height: 50vh;
          }
          
          .modal-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default TermsAgreementModal; 