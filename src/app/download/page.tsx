"use client";

import { Apple, Smartphone, Download, CheckCircle2 } from "lucide-react";

export default function DownloadPage() {
  const iosDownloadLink = "https://apple.com/app-store";
  const androidDownloadLink = "https://play.google.com/store/apps";
  
  // Use public QR code API
  const iosQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(iosDownloadLink)}&color=000000&bgcolor=FFFFFF`;
  const androidQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(androidDownloadLink)}&color=000000&bgcolor=FFFFFF`;

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
            Take Adobe CSC Everywhere
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed px-4">
            Scan the QR codes below or tap the buttons on your mobile device to download the official companion app for iOS and Android.
          </p>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 -mt-16 z-20 w-full mb-12">
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* iOS Card */}
          <div className="group glass bg-white/90 dark:bg-gray-800/90 rounded-3xl p-6 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 transform md:hover:-translate-y-2 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl rounded-full transition-opacity group-hover:bg-blue-500/10 pointer-events-none" />
            
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-14 h-14 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black shadow-md flex-shrink-0">
                <Apple size={30} fill="currentColor" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">iOS App</h3>
                <p className="text-gray-500 dark:text-gray-400">For iPhone & iPad</p>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 w-56 h-56 flex items-center justify-center overflow-hidden transition-transform duration-300 md:group-hover:scale-105">
                <img 
                  src={iosQrCodeUrl} 
                  alt="iOS QR Code" 
                  className="w-full h-full object-contain"
                />
              </div>
              
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6 text-center">
                Point your camera at the QR code<br/>to open the App Store
              </p>
              
              <a 
                href={iosDownloadLink}
                target="_blank"
                rel="noreferrer"
                className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                <Apple size={20} fill="currentColor" />
                <span>Download on the App Store</span>
              </a>
            </div>
          </div>

          {/* Android Card */}
          <div className="group glass bg-white/90 dark:bg-gray-800/90 rounded-3xl p-6 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 transform md:hover:-translate-y-2 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl rounded-full transition-opacity group-hover:bg-emerald-500/10 pointer-events-none" />
            
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20 flex-shrink-0">
                <Smartphone size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Android App</h3>
                <p className="text-gray-500 dark:text-gray-400">For Android Devices</p>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 w-56 h-56 flex items-center justify-center overflow-hidden transition-transform duration-300 md:group-hover:scale-105">
                <img 
                  src={androidQrCodeUrl} 
                  alt="Android QR Code" 
                  className="w-full h-full object-contain"
                />
              </div>
              
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6 text-center">
                Point your camera at the QR code<br/>to open Google Play
              </p>
              
              <a 
                href={androidDownloadLink}
                target="_blank"
                rel="noreferrer"
                className="w-full py-4 bg-emerald-500 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30 active:scale-[0.98]"
              >
                <Smartphone size={20} />
                <span>Get it on Google Play</span>
              </a>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Features List Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-12 w-full">
        <div className="glass bg-white/80 dark:bg-gray-800/80 rounded-3xl p-6 sm:p-8 border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">App Features</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            <FeatureItem title="Instant Chat" desc="Connect with your colleagues effortlessly." />
            <FeatureItem title="Notes & Docs" desc="Access essential documents anywhere." />
            <FeatureItem title="Schedule" desc="Stay up to date seamlessly." />
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
