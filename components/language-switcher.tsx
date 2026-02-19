"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { translations, Language } from "@/lib/translations";

const languages = [
  { code: "en" as Language, name: "English", flag: "🇬🇧" },
  { code: "ru" as Language, name: "Русский", flag: "🇷🇺" },
  { code: "fr" as Language, name: "Français", flag: "🇫🇷" },
];

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  className?: string;
  dropdownDirection?: "up" | "down";
}

export function LanguageSwitcher({
  currentLanguage,
  onLanguageChange,
  className,
  dropdownDirection = "down",
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find((l) => l.code === currentLanguage);

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
      >
        <span className="text-sm">{currentLang?.flag}</span>
        <span className="text-xs font-medium text-black dark:text-white uppercase">
          {currentLang?.code}
        </span>
        <svg
          className={cn(
            "w-2.5 h-2.5 text-black dark:text-white transition-transform",
            isOpen && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className={cn(
            "absolute right-0 z-20 min-w-[160px] rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black shadow-lg overflow-hidden",
            dropdownDirection === "up" ? "bottom-full mb-2" : "top-full mt-2"
          )}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onLanguageChange(lang.code);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors",
                  currentLanguage === lang.code &&
                    "bg-gray-100 dark:bg-gray-800 font-medium"
                )}
              >
                <span className="text-base">{lang.flag}</span>
                <span className="text-black dark:text-white">{lang.name}</span>
                {currentLanguage === lang.code && (
                  <svg
                    className="w-4 h-4 ml-auto text-black dark:text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Hook for using translations
export function useTranslation(lang: Language) {
  return {
    t: (key: keyof typeof translations.en) => translations[lang][key],
    lang,
  };
}
