"use client";

import { Users, Award, Gift, TrendingUp, Shield, Coins } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { translations, Language } from "@/lib/translations";

interface GlowingFeaturesDemoProps {
  currentLanguage: Language;
}

export default function GlowingFeaturesDemo({ currentLanguage }: GlowingFeaturesDemoProps) {
  const t = translations[currentLanguage];
  
  return (
    <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-6 xl:grid-rows-2">
      <GridItem
        area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
        icon={<Users className="h-4 w-4 text-black dark:text-white" />}
        title={t.studentManagement}
        description={t.studentManagementDesc}
      />

      <GridItem
        area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
        icon={<Award className="h-4 w-4 text-black dark:text-white" />}
        title={t.rewardSystem}
        description={t.rewardSystemDesc}
      />

      <GridItem
        area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
        icon={<Gift className="h-4 w-4 text-black dark:text-white" />}
        title={t.giftCatalog}
        description={t.giftCatalogDesc}
      />

      <GridItem
        area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
        icon={<TrendingUp className="h-4 w-4 text-black dark:text-white" />}
        title={t.transactionHistory}
        description={t.transactionHistoryDesc}
      />

      <GridItem
        area="md:[grid-area:3/1/4/7] xl:[grid-area:2/8/3/11]"
        icon={<Shield className="h-4 w-4 text-black dark:text-white" />}
        title={t.secureLogin}
        description={t.secureLoginDesc}
      />

      <GridItem
        area="md:[grid-area:3/7/4/13] xl:[grid-area:2/11/3/13]"
        icon={<Coins className="h-4 w-4 text-black dark:text-white" />}
        title={t.flexibleSystem}
        description={t.flexibleSystemDesc}
      />
    </ul>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <li className={`min-h-[10rem] list-none ${area}`}>
      <div className="relative h-full rounded-xl border border-gray-300 dark:border-gray-700 p-1.5">
        <GlowingEffect
          spread={30}
          glow={true}
          disabled={false}
          proximity={48}
          inactiveZone={0.01}
        />
        <div className="relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-lg p-4 bg-white dark:bg-black">
          <div className="relative flex flex-1 flex-col justify-between gap-2">
            <div className="w-fit rounded-md border border-gray-300 dark:border-gray-700 p-1.5">
              {icon}
            </div>
            <div className="space-y-2">
              <h3 className="font-sans text-base font-semibold text-black md:text-lg dark:text-white">
                {title}
              </h3>
              <p className="font-sans text-xs text-gray-700 md:text-sm dark:text-gray-300">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
