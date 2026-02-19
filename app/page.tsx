'use client'

import Link from 'next/link'
import { GridBackground } from '@/components/ui/grid-background'
import { Button } from '@/components/ui/button'
import { Coins } from 'lucide-react'
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards'
import { Avatar, AvatarFallback, AvatarImage, AvatarGroup, AvatarGroupCount, AvatarBadge } from '@/components/ui/avatar'
import { useState } from 'react'
import NavbarDemo from '@/components/resizable-navbar-demo'
import SocialFooter from '@/components/social-footer'
import GlowingFeaturesDemo from '@/components/glowing-features-demo'
import { translations, Language } from '@/lib/translations'

export default function Home() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('ru')
  const t = translations[currentLanguage]
  
  const testimonials = [
    {
      quote: t.testimonial1Quote,
      name: t.testimonial1Name,
      title: t.testimonial1Title,
    },
    {
      quote: t.testimonial2Quote,
      name: t.testimonial2Name,
      title: t.testimonial2Title,
    },
    {
      quote: t.testimonial3Quote,
      name: t.testimonial3Name,
      title: t.testimonial3Title,
    },
    {
      quote: t.testimonial4Quote,
      name: t.testimonial4Name,
      title: t.testimonial4Title,
    },
    {
      quote: t.testimonial5Quote,
      name: t.testimonial5Name,
      title: t.testimonial5Title,
    },
  ];

  return (
    <>
      <NavbarDemo 
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        navLabels={{
          features: t.features,
          howItWorks: t.howItWorks,
          faq: t.faq,
          login: t.login,
          getStarted: t.getStarted,
        }}
      />
      <GridBackground>
        <div className="container mx-auto px-4 py-16 max-w-7xl pt-40">
          {/* Hero Section - 110% Scale */}
          <div className="text-center mb-20" id="features" style={{ transform: 'scale(1.1)' }}>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 mb-5">
              <Coins className="h-4 w-4 text-black dark:text-white" />
              <span className="text-sm font-medium text-black dark:text-white">
                {t.schoolRewardSystem}
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-black dark:text-white mb-5 leading-tight">
              {t.algoCoins}
              <br />
              <span className="text-gray-600 dark:text-gray-400">
                {t.rewardSuccess}
              </span>
            </h1>
            
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              {t.heroDescription}
            </p>

            <div className="flex gap-4 justify-center">
              <Link href="/auth">
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="text-base h-11 px-8 bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 border border-black dark:border-white rounded-full"
                >
                  {t.startWorking}
                </Button>
              </Link>
            </div>
          </div>

          {/* Avatar Showcase Section */}
          <div className="max-w-2xl mx-auto text-center mb-20" id="how-it-works">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 mb-6">
              <span className="text-xs font-medium text-black dark:text-white">
                {t.availableForEveryone}
              </span>
            </div>
            <div className="flex flex-row flex-wrap items-center justify-center gap-6 md:gap-12">
              <Avatar>
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage
                  src="https://github.com/vercel.png"
                  alt="@vercel"
                />
                <AvatarFallback>VR</AvatarFallback>
                <AvatarBadge className="bg-green-500 dark:bg-green-600" />
              </Avatar>
              <AvatarGroup>
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarImage
                    src="https://github.com/nextjs.png"
                    alt="@nextjs"
                  />
                  <AvatarFallback>NX</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarImage
                    src="https://github.com/vercel.png"
                    alt="@vercel"
                  />
                  <AvatarFallback>VR</AvatarFallback>
                </Avatar>
                <AvatarGroupCount>+3</AvatarGroupCount>
              </AvatarGroup>
            </div>
          </div>

          {/* Glowing Features Grid */}
          <div className="mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-black dark:text-white mb-8">
              {t.platformFeatures}
            </h2>
            <GlowingFeaturesDemo currentLanguage={currentLanguage} />
          </div>

        {/* Infinite Moving Cards - Features Testimonials */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-black dark:text-white mb-8">
              {t.whatPeopleSay}
            </h2>
            <InfiniteMovingCards
              items={testimonials}
              direction="right"
              speed="slow"
            />
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto mb-20" id="faq">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-black dark:text-white mb-3">
              {t.faqTitle}
            </h2>
            <p className="text-center text-sm text-gray-700 dark:text-gray-300 mb-8">
              {t.faqSubtitle}{' '}
              <a href="mailto:salimboussaid@mail.ru" className="text-black dark:text-white hover:underline font-medium">
                salimboussaid@mail.ru
              </a>
            </p>
            <FAQSection currentLanguage={currentLanguage} />
          </div>

          {/* CTA Section */}
          <div className="text-center bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-xl p-8 mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-black dark:text-white mb-3">
              {t.readyToStart}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-6 max-w-xl mx-auto">
              {t.ctaDescription}
            </p>
            <Link href="/auth">
              <Button 
                variant="primary" 
                size="sm" 
                className="text-sm h-9 px-6 bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 border border-black dark:border-white rounded-full"
              >
                {t.loginToSystem}
              </Button>
            </Link>
          </div>

          {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-gray-300 dark:border-gray-700 text-center text-xs text-gray-700 dark:text-gray-300 mb-20">
            <p>{t.footerCopyright}</p>
          </footer>
        </div>
      </GridBackground>
      <SocialFooter />
    </>
  )
}

interface FAQSectionProps {
  currentLanguage: Language;
}

function FAQSection({ currentLanguage }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const t = translations[currentLanguage]

  const faqs = [
    {
      question: t.faqQ1,
      answer: t.faqA1,
    },
    {
      question: t.faqQ2,
      answer: t.faqA2,
    },
    {
      question: t.faqQ3,
      answer: t.faqA3,
    },
    {
      question: t.faqQ4,
      answer: t.faqA4,
    },
    {
      question: t.faqQ5,
      answer: t.faqA5,
    },
    {
      question: t.faqQ6,
      answer: t.faqA6,
    },
  ];

  return (
    <div className="space-y-2">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-black"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <span className="text-sm font-semibold text-black dark:text-white">
              {faq.question}
            </span>
            <svg
              className={`w-4 h-4 text-black dark:text-white transition-transform ${
                openIndex === index ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openIndex === index && (
            <div className="px-4 pb-3 text-xs text-gray-700 dark:text-gray-300 border-t border-gray-300 dark:border-gray-700 pt-3">
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
