'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { useTranslations } from '@/hooks/use-translations';

export function FaqSection() {
  const { t } = useTranslations();

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
          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{item.question}</h3>
                  <p className="text-muted-foreground">{item.answer}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
} 