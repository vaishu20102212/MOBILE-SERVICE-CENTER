import React, { useState } from 'react';
import { Check, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { WORKFLOW_STAGES, STATUS_CONFIG } from '../../utils/constants';

export default function WorkflowStepper({ currentStatus, onStepClick, interactive = false }) {
  const [showAllStepsMobile, setShowAllStepsMobile] = useState(false);
  const isCancelled = currentStatus === 'Cancelled';
  const isFailed = currentStatus === 'Repair Failed';
  const currentIndex = WORKFLOW_STAGES.indexOf(currentStatus);

  if (isCancelled || isFailed) {
    return (
      <div className={`p-4 rounded-2xl border ${isCancelled ? 'bg-slate-50 border-slate-300 dark:bg-slate-900' : 'bg-rose-50 border-rose-300 dark:bg-rose-950/40'} flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          {isCancelled ? (
            <XCircle className="w-7 h-7 sm:w-8 sm:h-8 text-slate-500 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-rose-500 flex-shrink-0" />
          )}
          <div>
            <h4 className={`font-bold text-sm sm:text-base ${isCancelled ? 'text-slate-800 dark:text-slate-200' : 'text-rose-800 dark:text-rose-200'}`}>
              Repair Workflow Terminated ({currentStatus})
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isCancelled
                ? 'This repair request was cancelled.'
                : 'Device hardware inspection revealed irreparable damage.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.round(((currentIndex + 1) / WORKFLOW_STAGES.length) * 100);

  return (
    <div className="w-full">
      {/* 1. Mobile-Optimized Stepper Card (Visible on screens < md) */}
      <div className="block md:hidden bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Step {currentIndex + 1} of {WORKFLOW_STAGES.length}
          </span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {progressPercentage}% Complete
          </span>
        </div>

        {/* Current Step Name & Description */}
        <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
          {currentStatus}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {STATUS_CONFIG[currentStatus]?.description || 'Repair progressing normally.'}
        </p>

        {/* Mobile Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-3 overflow-hidden">
          <div
            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Toggle to expand all 8 steps on mobile */}
        <button
          onClick={() => setShowAllStepsMobile(!showAllStepsMobile)}
          className="mt-3 w-full py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
        >
          <span>{showAllStepsMobile ? 'Hide Step Checklist' : 'View Full 8-Step Checklist'}</span>
          {showAllStepsMobile ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* Expanded step checklist for mobile */}
        {showAllStepsMobile && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
            {WORKFLOW_STAGES.map((stage, idx) => {
              const isPassed = idx < currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <div
                  key={stage}
                  className={`flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold ${
                    isCurrent
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold border border-blue-200'
                      : isPassed
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      isPassed
                        ? 'bg-blue-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 text-slate-400'
                    }`}
                  >
                    {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                  </div>
                  <span>{stage}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Desktop & Tablet Horizontal Stepper (Visible on screens >= md) */}
      <div className="hidden md:block relative py-4">
        <div className="overflow-x-auto pb-4">
          <div className="flex items-center min-w-[700px] justify-between relative">
            {/* Connecting line */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0" />
            
            {/* Active connecting line */}
            <div
              className="absolute top-4 left-6 h-0.5 bg-blue-600 dark:bg-blue-500 -z-0 transition-all duration-500"
              style={{
                width: `${Math.max(0, (currentIndex / (WORKFLOW_STAGES.length - 1)) * 96)}%`,
              }}
            />

            {WORKFLOW_STAGES.map((stage, idx) => {
              const isPassed = idx < currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <div
                  key={stage}
                  className="flex flex-col items-center relative z-10 group cursor-default"
                >
                  <button
                    disabled={!interactive}
                    onClick={() => interactive && onStepClick && onStepClick(stage)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                      isPassed
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : isCurrent
                        ? 'bg-white dark:bg-slate-900 border-2 border-blue-600 text-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/50 scale-110'
                        : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    {isPassed ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </button>

                  <span
                    className={`mt-2 text-[11px] font-semibold text-center max-w-[85px] leading-tight ${
                      isCurrent
                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                        : isPassed
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
