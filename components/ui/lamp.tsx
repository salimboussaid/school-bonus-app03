"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const LampContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative flex min-h-[40vh] flex-col items-center justify-center overflow-visible w-full z-0",
        className
      )}
    >
      <div className="relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-0">
        {/* Glowing Lamp Line */}
        <motion.div
          initial={{ width: "15rem" }}
          whileInView={{ width: "30rem" }}
          animate={{
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            delay: 0.3,
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-50 h-1 w-[30rem] -translate-y-[7rem] bg-black dark:bg-white shadow-[0_0_50px_10px_rgba(0,0,0,0.5)] dark:shadow-[0_0_50px_10px_rgba(255,255,255,0.5)]"
        ></motion.div>

        {/* Main Light Glow from Line */}
        <motion.div
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scaleY: [1, 1.2, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-40 h-[40rem] w-[50rem] -translate-y-[2rem] bg-black dark:bg-white opacity-20 blur-[120px]"
        ></motion.div>

        {/* Secondary Soft Glow */}
        <motion.div
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scaleY: [1, 1.1, 1],
          }}
          transition={{
            delay: 0.5,
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-30 h-[35rem] w-[40rem] -translate-y-[1rem] bg-gray-800 dark:bg-gray-200 opacity-30 blur-[100px]"
        ></motion.div>
      </div>

      <div className="relative z-50 flex -translate-y-80 flex-col items-center px-5">
        {children}
      </div>
    </div>
  );
};
