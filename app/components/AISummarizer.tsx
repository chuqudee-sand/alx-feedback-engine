'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AISummarizerProps {
  program: string;
  activeTab: string;
  startDate: string;
  endDate: string;
  activeEvent: string;
  reportPeriod: string;
  isDark: boolean;
}

export default function AISummarizer({ program, activeTab, startDate, endDate, activeEvent, reportPeriod, isDark }: AISummarizerProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSummarize = async () => {
    setLoading(true);
    setMessage("AI is reading and summarizing learner responses... please refresh after a few minutes.");

    try {
      // PASTE YOUR RENDER LINK HERE
      const response = await fetch("https://feedback-summarizer-kkds.onrender.com/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program,
          activeTab,
          startDate,
          endDate,
          activeEvent,
          reportPeriod
        }),
      });

      if (response.ok) {
        // The Python backend is now working in the background.
        // We don't wait for it to finish (to avoid Vercel timeout).
        console.log("Job sent to Render successfully");
      }
    } catch (error) {
      console.error("Error triggering AI:", error);
      setMessage("Connection error. Please check if the Render server is awake.");
      setLoading(false);
    }
  };

  return (
    <div className="text-center p-8 rounded-2xl border md:col-span-2 flex flex-col items-center justify-center gap-4" 
         style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }}>
      
      {loading ? (
        <div className="flex flex-col items-center gap-4">
          {/* SPINNING CIRCLE */}
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-[#5648B7]"></div>
          <p className="text-sm font-bold italic animate-pulse" style={{ color: '#5648B7' }}>
            {message}
          </p>
          <button 
            onClick={() => router.refresh()} 
            className="mt-2 text-[10px] underline opacity-50 hover:opacity-100"
          >
            Refresh page to check for results
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm font-bold italic text-zinc-500">
            {message || "No AI summaries generated for this context yet."}
          </p>
          <button 
            onClick={handleSummarize}
            className="px-6 py-3 rounded-xl text-xs font-black tracking-widest text-white transition-all hover:scale-105 shadow-md flex items-center gap-2" 
            style={{ backgroundColor: '#5648B7' }}
          >
            ✨ SUMMARIZE FEEDBACK FOR {(activeTab === 'community' || activeTab === 'support') ? activeEvent.toUpperCase() : "THIS PERIOD"}
          </button>
        </>
      )}
    </div>
  );
}
