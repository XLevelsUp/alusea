"use client";

import { useState } from "react";

const faqs = [
  {
    question: "What is the typical lead time for custom aluminium systems?",
    answer: "Typically, our custom systems are delivered within 8-12 weeks, depending on the complexity of the design and specific finish requirements."
  },
  {
    question: "Are Alusea products compliant with local building codes?",
    answer: "Yes, all our systems undergo rigorous testing and are fully compliant with both international standards and regional building regulations in the UAE and surrounding areas."
  },
  {
    question: "Do you offer installation services?",
    answer: "We work with a network of certified master installers who are trained specifically on Alusea systems to ensure perfect fit and performance."
  },
  {
    question: "Can I customize the color and finish of the frames?",
    answer: "Absolutely. We offer an extensive range of RAL colors, metallic finishes, and wood-grain textures to match your architectural vision."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="section-padding bg-white">
      <div className="max-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div className="space-y-8">
            <h2 className="text-brushed-bronze text-sm uppercase tracking-[0.3em] font-bold">Frequently Asked</h2>
            <p className="text-4xl md:text-5xl font-bold text-matte-black leading-tight">
              Answering Your <br />
              <span className="text-architectural-blue">Technical Queries</span>
            </p>
            <p className="text-steel-gray text-lg font-light leading-relaxed">
              We provide comprehensive support for architects, developers, and homeowners. If you don&apos;t find your answer here, feel free to reach out to our technical team.
            </p>
            <button className="px-10 py-4 bg-matte-black text-white text-sm uppercase tracking-widest font-bold rounded-sm hover:bg-architectural-blue transition-all">
              Technical Documents
            </button>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`border-b border-gray-100 transition-all duration-300 ${openIndex === index ? "pb-8" : "pb-4"}`}
              >
                <button 
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between py-6 text-left group"
                >
                  <span className={`text-xl font-bold transition-colors ${openIndex === index ? "text-brushed-bronze" : "text-matte-black group-hover:text-brushed-bronze"}`}>
                    {faq.question}
                  </span>
                  <span className={`transform transition-transform duration-300 ${openIndex === index ? "rotate-45 text-brushed-bronze" : "text-steel-gray"}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                </button>
                {openIndex === index && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-steel-gray text-base leading-relaxed font-light">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
