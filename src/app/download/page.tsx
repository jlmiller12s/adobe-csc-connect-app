"use client";

import { useEffect, useState } from "react";
import { Apple, Smartphone, Download, CheckCircle2, Share, PlusSquare, MoreVertical } from "lucide-react";

// Define a type for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function DownloadPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 md:pb-6 bg-gradient-to-tr from-gray-50 to-white dark:from-black dark:to-gray-900 overflow-x-hidden">
      
      {/* Header section w/ beautiful glow effects */}
      <div className="relative bg-black text-white pt-20 pb-32 px-6 overflow-hidden w-full">
        {/* Abstract shapes for premium feel */}
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-adobe-red/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-orange-500/20 blur-[100px] rounded-full -translate-x-1/4 translate-y-1/3 pointer-events-none" />
        
        <div className="relative max-w-4xl mx-auto text-center z-10 w-full">
          <div className="inline-flex items-center justify-center p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 mb-8 shadow-2xl">
            <Download size={40} className="text-adobe-red" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
            Install Adobe CSC
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed px-4">
            Add the app directly to your home screen for quick access, offline capabilities, and a seamless native experience. No app store required.
          </p>
          
          {deferredPrompt && (
            <div className="mt-8">
              <button 
                onClick={handleInstallClick}
                className="px-8 py-4 bg-adobe-red hover:bg-red-600 text-white font-bold rounded-full shadow-lg shadow-adobe-red/30 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center mx-auto space-x-2"
              >
                <Download size={20} />
                <span>Install App Now</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 -mt-16 z-20 w-full mb-12">
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* iOS Card */}
          <div className="group glass bg-white/90 dark:bg-gray-800/90 rounded-3xl p-6 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 transform md:hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl rounded-full transition-opacity group-hover:bg-blue-500/10 pointer-events-none" />
            
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-14 h-14 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black shadow-md flex-shrink-0">
                <Apple size={30} fill="currentColor" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">iOS (Safari)</h3>
                <p className="text-gray-500 dark:text-gray-400">iPhone & iPad Instructions</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                 <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold flex-shrink-0 shadow-sm border border-blue-200 dark:border-blue-800">1</div>
                 <p className="text-gray-700 dark:text-gray-300 leading-relaxed pt-1">
                   Open this page in <strong>Safari</strong> on your device.
                 </p>
              </div>
              
              <div className="flex items-start space-x-4">
                 <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold flex-shrink-0 shadow-sm border border-blue-200 dark:border-blue-800">2</div>
                 <p className="text-gray-700 dark:text-gray-300 leading-relaxed pt-1 flex items-center flex-wrap">
                   Tap the{" "}<strong>Share</strong>{" "}button{" "}<span className="bg-gray-100 dark:bg-gray-700 p-1 rounded-md mx-2 inline-flex items-center shadow-sm"><Share className="w-4 h-4 text-blue-500" /></span>{" "}located at the bottom of the screen.
                 </p>
              </div>
              
              <div className="flex items-start space-x-4">
                 <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold flex-shrink-0 shadow-sm border border-blue-200 dark:border-blue-800">3</div>
                 <p className="text-gray-700 dark:text-gray-300 leading-relaxed pt-1 flex items-center flex-wrap">
                   Scroll down the menu and tap{" "}<strong>Add to Home Screen</strong>{" "}<span className="bg-gray-100 dark:bg-gray-700 p-1 rounded-md mx-2 inline-flex items-center shadow-sm"><PlusSquare className="w-4 h-4 text-gray-800 dark:text-gray-200" /></span>.
                 </p>
              </div>
              
              <div className="flex items-start space-x-4">
                 <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold flex-shrink-0 shadow-sm border border-blue-200 dark:border-blue-800">4</div>
                 <p className="text-gray-700 dark:text-gray-300 leading-relaxed pt-1">
                   Tap <strong>Add</strong> in the top right corner to finish.
                 </p>
              </div>
            </div>
          </div>

          {/* Android Card */}
          <div className="group glass bg-white/90 dark:bg-gray-800/90 rounded-3xl p-6 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 transform md:hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl rounded-full transition-opacity group-hover:bg-emerald-500/10 pointer-events-none" />
            
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20 flex-shrink-0">
                <Smartphone size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Android (Chrome)</h3>
                <p className="text-gray-500 dark:text-gray-400">Android Device Instructions</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                 <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold flex-shrink-0 shadow-sm border border-emerald-200 dark:border-emerald-800">1</div>
                 <p className="text-gray-700 dark:text-gray-300 leading-relaxed pt-1">
                   Open this page in <strong>Chrome</strong> on your device.
                 </p>
              </div>
              
              <div className="flex items-start space-x-4">
                 <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold flex-shrink-0 shadow-sm border border-emerald-200 dark:border-emerald-800">2</div>
                 <p className="text-gray-700 dark:text-gray-300 leading-relaxed pt-1 flex items-center flex-wrap">
                   Tap the{" "}<strong>Menu</strong>{" "}button{" "}<span className="bg-gray-100 dark:bg-gray-700 p-1 rounded-md mx-2 inline-flex items-center shadow-sm"><MoreVertical className="w-4 h-4 text-gray-800 dark:text-gray-200" /></span>{" "}in the top right corner.
                 </p>
              </div>
              
              <div className="flex items-start space-x-4">
                 <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold flex-shrink-0 shadow-sm border border-emerald-200 dark:border-emerald-800">3</div>
                 <p className="text-gray-700 dark:text-gray-300 leading-relaxed pt-1">
                   Tap{" "}<strong>Add to Home screen</strong>{" "}or{" "}<strong>Install app</strong>{" "}from the menu.
                 </p>
              </div>
              
              <div className="flex items-start space-x-4">
                 <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold flex-shrink-0 shadow-sm border border-emerald-200 dark:border-emerald-800">4</div>
                 <p className="text-gray-700 dark:text-gray-300 leading-relaxed pt-1">
                   Follow the on-screen prompts to complete installation.
                 </p>
              </div>
            </div>
            
            {deferredPrompt && (
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button 
                  onClick={handleInstallClick}
                  className="w-full py-4 bg-emerald-500 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30 active:scale-[0.98]"
                >
                  <Download size={20} />
                  <span>Install App Now</span>
                </button>
              </div>
            )}
          </div>
          
        </div>
      </div>
      
      {/* Features List Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-12 w-full">
        <div className="glass bg-white/80 dark:bg-gray-800/80 rounded-3xl p-6 sm:p-8 border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Why Add to Home Screen?</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            <FeatureItem title="Native Experience" desc="Looks and feels just like an app downloaded from the store." />
            <FeatureItem title="Quick Access" desc="Launch instantly directly from your device's home screen." />
            <FeatureItem title="Always Updated" desc="Get the latest features immediately without updating manually." />
          </div>
        </div>
      </div>

    </div>
  );
}

function FeatureItem({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="flex items-start space-x-3">
      <CheckCircle2 className="text-adobe-red shrink-0 mt-1" size={20} />
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
