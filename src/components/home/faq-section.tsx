'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { useTranslations } from '@/hooks/use-translations';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function FaqSection() {
  const { t } = useTranslations();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!t) return null;

  const faqItems = [
    {
      question: t.home.faq.items.howItWorks.question,
      answer: t.home.faq.items.howItWorks.answer,
    },
    {
      question: t.home.faq.items.paymentMethods.question,
      answer: t.home.faq.items.paymentMethods.answer,
    },
    {
      question: t.home.faq.items.subscription.question,
      answer: t.home.faq.items.subscription.answer,
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold mb-12 text-center">{t.home.faq.title}</h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="overflow-hidden transition-colors hover:bg-accent/5"
                  role="button"
                  onClick={() => toggleFaq(index)}
                >
                  <div className="p-6 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">{item.question}</h3>
                      <motion.div
                        animate={{ rotate: openIndex === index ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      </motion.div>
                    </div>
                    <AnimatePresence>
                      {openIndex === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <p className="mt-4 text-muted-foreground">{item.answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
} 