"use client";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Language } from "@/lib/translations";
import { useState } from "react";
import Link from "next/link";

interface NavbarDemoProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  navLabels: {
    features: string;
    howItWorks: string;
    faq: string;
    login: string;
    getStarted: string;
  };
}

export default function NavbarDemo({ currentLanguage, onLanguageChange, navLabels }: NavbarDemoProps) {
  const navItems = [
    {
      name: navLabels.features,
      link: "#features",
    },
    {
      name: navLabels.howItWorks,
      link: "#how-it-works",
    },
    {
      name: navLabels.faq,
      link: "#faq",
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative w-full">
      <Navbar className="fixed">
        {/* Desktop Navigation */}
        <NavBody>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-bold">
              A
            </div>
            <span className="font-semibold text-black dark:text-white">AlgoCoins</span>
          </div>
          <NavItems items={navItems} />
          <div className="flex items-center gap-2">
            <LanguageSwitcher
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />
            <ThemeToggle />
            <Link href="/auth">
              <NavbarButton variant="secondary">{navLabels.login}</NavbarButton>
            </Link>
            <Link href="/auth">
              <NavbarButton variant="dark">{navLabels.getStarted}</NavbarButton>
            </Link>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-bold">
                A
              </div>
              <span className="font-semibold text-black dark:text-white">AlgoCoins</span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
              />
              <ThemeToggle />
              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-800 dark:text-neutral-200 font-medium"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-3 mt-4">
              <Link href="/auth">
                <NavbarButton
                  onClick={() => setIsMobileMenuOpen(false)}
                  variant="secondary"
                  className="w-full"
                >
                  {navLabels.login}
                </NavbarButton>
              </Link>
              <Link href="/auth">
                <NavbarButton
                  onClick={() => setIsMobileMenuOpen(false)}
                  variant="dark"
                  className="w-full"
                >
                  {navLabels.getStarted}
                </NavbarButton>
              </Link>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}
