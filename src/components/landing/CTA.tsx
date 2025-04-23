import React from "react";
import Link from "next/link";
import * as motion from "motion/react-client";
import { Button } from "@/components/ui/button";
import { SDKButton } from "@/components/landing/sdk-button";

export default function CTA() {
  return (
    <motion.div
      className="relative z-10 container mx-auto max-w-4xl text-center"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
    >
      <motion.h2
        className="mb-6 text-3xl font-bold md:text-4xl"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        SDK Integration Made Simple
      </motion.h2>
      <motion.p
        className="text-muted-foreground mx-auto mb-10 max-w-2xl text-xl"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        Deploy specialized AI agents that understand your codebase and create
        clean, properly documented SDKs at $1 per integration.
      </motion.p>

      <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2">
        <motion.div
          className="bg-card rounded-xl border p-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3 className="mb-3 text-xl font-bold">For Developers</h3>
          <p className="text-muted-foreground mb-4">
            Integrate popular SDKs with proper error handling, typing, and best
            practices.
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-chart-1"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Clean pull requests</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-chart-1"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Multiple coordinated AI agents</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-chart-1"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Proper documentation and testing</span>
            </div>
          </div>
          <Button className="mt-6 w-full" variant="default">
            Connect Repository
          </Button>
        </motion.div>

        <motion.div
          className="bg-card rounded-xl border p-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h3 className="mb-3 text-xl font-bold">For SDK Providers</h3>
          <p className="text-muted-foreground mb-4">
            Add &quot;Integrate with AI Coder&quot; buttons to help developers
            implement your SDK instantly.
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            <SDKButton
              color="blue"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-1.5 h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              }
              text="Integrate with"
            />

            <SDKButton
              color="purple"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-1.5 h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
              text="Add with"
            />

            <SDKButton
              color="emerald"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-1.5 h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              }
              text="One-Click Integration"
              boldText=""
            />
          </div>
          <Button className="mt-2 w-full" variant="secondary">
            Become a Partner
          </Button>
        </motion.div>
      </div>

      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Link
          href="#recipes"
          className="text-primary flex items-center gap-2 hover:underline"
        >
          <span>Browse all integration recipes</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </motion.div>
    </motion.div>
  );
}
