"use client";
import React from "react";
import { FloatingDock } from "@/components/ui/floating-dock";
import { IconBrandGithub, IconBrandTelegram, IconBrandFacebook, IconBrandLinkedin, IconMail } from "@tabler/icons-react";

export default function SocialFooter() {
  const socialLinks = [
    {
      title: "Telegram",
      icon: (
        <IconBrandTelegram className="h-full w-full text-black dark:text-white" />
      ),
      href: "https://t.me/salimbsd",
    },
    {
      title: "Email",
      icon: (
        <IconMail className="h-full w-full text-black dark:text-white" />
      ),
      href: "mailto:salimboussaid@mail.ru",
    },
    {
      title: "Facebook",
      icon: (
        <IconBrandFacebook className="h-full w-full text-black dark:text-white" />
      ),
      href: "https://www.facebook.com/salim.boussaid.171036",
    },
    {
      title: "LinkedIn",
      icon: (
        <IconBrandLinkedin className="h-full w-full text-black dark:text-white" />
      ),
      href: "https://www.linkedin.com/in/mohamed-salim-boussaid-1ba90a228/",
    },
    {
      title: "GitHub",
      icon: (
        <IconBrandGithub className="h-full w-full text-black dark:text-white" />
      ),
      href: "https://github.com/salimboussaid",
    },
  ];

  return (
    <div className="fixed bottom-8 left-0 right-0 z-50 flex items-center justify-center">
      <FloatingDock items={socialLinks} />
    </div>
  );
}
