import React, { useState, useEffect, useRef } from 'react';

const TERM_SECTIONS = [
    { id: 'section-1', title: '1. About This Application' },
    { id: 'section-2', title: '2. Eligibility' },
    { id: 'section-3', title: '3. Data Collection and Privacy' },
    { id: 'section-4', title: '4. Your Rights' },
    { id: 'section-5', title: '5. Community Guidelines' },
    { id: 'section-6', title: '6. Security' },
    { id: 'section-7', title: '7. Limitations' },
    { id: 'section-9', title: '9. Changes to These Terms' },
    { id: 'section-10', title: '10. Governing Law' },
];

const TermsAndConditions = ({ onClose }) => {
    const [activeSection, setActiveSection] = useState('section-1');
    const contentRef = useRef(null);

    useEffect(() => {
        const observerOptions = {
            root: contentRef.current,
            rootMargin: '0px',
            threshold: 0.5,
        };

        const observerCallback = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        TERM_SECTIONS.forEach((section) => {
            const element = document.getElementById(section.id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => {
            TERM_SECTIONS.forEach((section) => {
                const element = document.getElementById(section.id);
                if (element) {
                    observer.unobserve(element);
                }
            });
        };
    }, []);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element && contentRef.current) {
            contentRef.current.scrollTo({
                top: element.offsetTop - contentRef.current.offsetTop,
                behavior: 'smooth',
            });
            setActiveSection(id);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 md:p-12">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Terms and Conditions</h2>
                        <p className="text-sm text-gray-500 mt-1">SOLEVIA - Last updated: [2026/5/23]</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors focus:outline-none"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Navigation */}
                    <div className="hidden md:block w-1/3 border-r border-gray-200 bg-gray-50 overflow-y-auto p-6">
                        <p className="text-sm text-gray-600 mb-6 font-medium">
                            By creating an account, you agree to the following terms. Please read them carefully before registering.
                        </p>
                        <ul className="space-y-2">
                            {TERM_SECTIONS.map((section) => (
                                <li key={section.id}>
                                    <button
                                        onClick={() => scrollToSection(section.id)}
                                        className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 ${activeSection === section.id
                                                ? 'bg-indigo-100 text-indigo-700 font-semibold shadow-sm'
                                                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                                            }`}
                                    >
                                        {section.title}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Right Content */}
                    <div
                        ref={contentRef}
                        className="w-full md:w-2/3 overflow-y-auto p-6 md:p-8 scroll-smooth bg-white"
                    >
                        <div className="md:hidden mb-6 pb-6 border-b border-gray-200 text-gray-600 text-sm">
                            By creating an account, you agree to the following terms. Please read them carefully before registering.
                        </div>

                        <div className="space-y-10 max-w-2xl mx-auto">
                            <section id="section-1" className="scroll-mt-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-3">1. About This Application</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Solevia is a self-monitoring wellness platform for mood tracking, habit formation, journaling, and peer community support. It is not a medical or mental health treatment service and does not replace professional psychological care. If you are in crisis, please contact a qualified mental health professional.
                                </p>
                            </section>

                            <section id="section-2" className="scroll-mt-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-3">2. Eligibility</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    You must be at least 13 years of age to register. By creating an account, you confirm that the information you provide is accurate and complete.
                                </p>
                            </section>

                            <section id="section-3" className="scroll-mt-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-3">3. Data Collection and Privacy</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    We collect personal and wellness-related information to provide the app's core features. This data is treated as sensitive personal information under Nepal's Privacy Act 2018 and handled in accordance with applicable data protection standards. Your data will never be sold or used for advertising purposes.
                                </p>
                            </section>

                            <section id="section-4" className="scroll-mt-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-3">4. Your Rights</h3>
                                <p className="text-gray-600 leading-relaxed mb-4">
                                    You have the right to access, correct, or permanently delete your account and associated data at any time. Deleting your account will remove all stored personal data from our systems.
                                </p>
                                <p className="text-gray-600 leading-relaxed">
                                    All journal entries and personal content you create remain your own. We do not claim ownership over any content you write within the application.
                                </p>
                            </section>

                            <section id="section-5" className="scroll-mt-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-3">5. Community Guidelines</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    By participating in community features, you agree not to post harmful, abusive, or misleading content. Violations may result in warnings, content removal, or account suspension.
                                </p>
                            </section>

                            <section id="section-6" className="scroll-mt-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-3">6. Security</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    We take reasonable technical measures to protect your personal data. You are responsible for keeping your login credentials and journal PIN confidential. We are not liable for unauthorised access resulting from your failure to secure your account.
                                </p>
                            </section>

                            <section id="section-7" className="scroll-mt-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-3">7. Limitations</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    This application does not provide clinical assessments, diagnoses, or crisis intervention. It is a self-help tool only.
                                </p>
                            </section>

                            <section id="section-9" className="scroll-mt-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-3">9. Changes to These Terms</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    We may update these Terms and Conditions from time to time. Continued use of the application after changes are notified constitutes acceptance of the updated terms.
                                </p>
                            </section>

                            <section id="section-10" className="scroll-mt-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-3">10. Governing Law</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    These terms are governed by the laws of Nepal, including the Privacy Act 2018 and applicable regulations.
                                </p>
                            </section>

                            <div className="pt-8 pb-4">
                                <p className="text-gray-500 italic text-center">
                                    By clicking "Submit", you confirm that you have read and agree to these Terms and Conditions.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md"
                    >
                        I Understand
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default TermsAndConditions;
