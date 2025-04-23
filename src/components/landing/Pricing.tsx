import React from 'react';
import * as motion from 'motion/react-client';
import { Button } from '@/components/ui/button';

export default function Pricing() {
  return (
    <div className="container mx-auto max-w-6xl">
      <motion.div
        className="mb-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="mb-4 text-3xl font-bold md:text-4xl">Pricing</h2>
        <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
          Simple, straightforward pricing for developers and organizations
        </p>
      </motion.div>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        <motion.div
          className="bg-card relative rounded-xl border p-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ y: -10, transition: { duration: 0.2 } }}
        >
          <div className="bg-chart-1/5 absolute top-0 right-0 h-32 w-32 translate-x-1/4 -translate-y-1/4 transform rounded-full blur-3xl" />
          <h3 className="relative z-10 mb-2 text-xl font-semibold">
            For Individuals
          </h3>
          <div className="relative z-10 mb-6">
            <span className="text-4xl font-bold">$2</span>
            <span className="text-muted-foreground">/integration</span>
          </div>
          <ul className="relative z-10 mb-8 space-y-2">
            <li className="flex items-center gap-2">
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
                className="text-chart-1"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Pay only for what you need</span>
            </li>
            <li className="flex items-center gap-2">
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
                className="text-chart-1"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Multiple AI agents per integration</span>
            </li>
            <li className="flex items-center gap-2">
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
                className="text-chart-1"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Automated PR creation</span>
            </li>
            <li className="flex items-center gap-2">
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
                className="text-chart-1"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Connect your GitHub repositories</span>
            </li>
          </ul>
          <Button
            className="relative z-10 w-full"
            variant="default"
          >
            Get Started
          </Button>
        </motion.div>

        <motion.div
          className="bg-card relative rounded-xl border p-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ y: -10, transition: { duration: 0.2 } }}
        >
          <div className="bg-chart-5/5 absolute top-0 right-0 h-32 w-32 translate-x-1/4 -translate-y-1/4 transform rounded-full blur-3xl" />
          <h3 className="relative z-10 mb-2 text-xl font-semibold">
            For Companies
          </h3>
          <div className="relative z-10 mb-6">
            <span className="text-4xl font-bold">Custom</span>
          </div>
          <ul className="relative z-10 mb-8 space-y-2">
            <li className="flex items-center gap-2">
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
                className="text-chart-1"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Unlimited AI agents</span>
            </li>
            <li className="flex items-center gap-2">
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
                className="text-chart-1"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Private cloud deployment</span>
            </li>
            <li className="flex items-center gap-2">
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
                className="text-chart-1"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>SSO & advanced security</span>
            </li>
            <li className="flex items-center gap-2">
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
                className="text-chart-1"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Official SDK partnership</span>
            </li>
            <li className="flex items-center gap-2">
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
                className="text-chart-1"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>24/7 dedicated support</span>
            </li>
          </ul>
          <Button
            className="relative z-10 w-full" 
            variant="secondary"
          >
            Talk to Us
          </Button>
        </motion.div>
      </div>
    </div>
  );
} 