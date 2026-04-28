import React, { useEffect, useState, useCallback } from 'react';

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

const SmartTranslator: React.FC = () => {
  // 1. IMPROVED STATE: Check localStorage first, then browser language, then default to English
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('user-language');
    if (saved) return saved;
    
    const browserLang = navigator.language.split('-')[0]; 
    const supported = ['en', 'es', 'pt', 'fr', 'de', 'zh', 'vi'];
    return supported.includes(browserLang) ? browserLang : 'en';
  });

  // 2. STABLE EVENT TRIGGER: Memoized to prevent unnecessary re-renders
  const handleLanguageChange = useCallback((langCode: string) => {
    setLang(langCode);
    localStorage.setItem('user-language', langCode); // Save the choice!
    
    let attempts = 0;
    const forceChange = setInterval(() => {
      const googleSelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (googleSelect) {
        googleSelect.value = langCode;
        googleSelect.dispatchEvent(new Event('change', { bubbles: true })); 
      }
      attempts++;
      if (attempts >= 3) clearInterval(forceChange);
    }, 150);
  }, []);

  useEffect(() => {
    if (document.getElementById('google-translate-script')) return;

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { 
          pageLanguage: 'en', 
          includedLanguages: 'en,es,fr,de,zh-CN,pt,vi', 
          autoDisplay: false 
        },
        'hidden_google_translate' 
      );

      // Auto-trigger the saved or detected language
      if (lang !== 'en') {
        handleLanguageChange(lang);
      }
    };

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);

    // 3. PERFORMANCE FIX: MutationObserver (The "Smart Listener")
    // Instead of a timer, we listen specifically for Google's changes
    const observer = new MutationObserver(() => {
      const iframe = document.querySelector('.goog-te-banner-frame') as HTMLElement;
      if (iframe) iframe.style.display = 'none';
      if (document.body.style.top !== '0px') {
        document.body.style.top = '0px';
      }
    });

    observer.observe(document.body, { attributes: true, childList: true, subtree: true });

    return () => observer.disconnect();
  }, [lang, handleLanguageChange]);

  return (
    <>
      <style>{`
        body { top: 0px !important; position: static !important; }
        .goog-te-banner-frame, .skiptranslate > iframe, .goog-te-balloon-frame, .goog-tooltip { 
            display: none !important; 
            visibility: hidden !important; 
        }
        /* Prevents the 'Original Text' hover popup by making the mouse ignore Google tags */
        font { pointer-events: none !important; }
        .goog-text-highlight { background-color: transparent !important; box-shadow: none !important; border: none !important; }
        #hidden_google_translate { display: none !important; }
      `}</style>

      <div id="hidden_google_translate"></div>

      <div className="fixed top-6 right-8 z-[9999]" title="Select Language">
        <div className="relative flex items-center gap-3 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-2xl border border-slate-700 hover:border-blue-500 transition-all group cursor-pointer">
          <span className="text-lg" aria-hidden="true">🌐</span>
          <select 
            aria-label="Language Selector"
            value={lang}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-transparent text-sm font-semibold outline-none cursor-pointer appearance-none pr-6 text-slate-100 group-hover:text-blue-400"
          >
            <option value="en" className="text-black">English</option>
            <option value="es" className="text-black">Español</option>
            <option value="vi" className="text-black">Vietnamese</option>
            <option value="pt" className="text-black">Português</option>
            <option value="fr" className="text-black">Français</option>
            <option value="de" className="text-black">Deutsch</option>
            <option value="zh-CN" className="text-black">中文</option>
          </select>
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 group-hover:text-blue-400">▼</div>
        </div>
      </div>
    </>
  );
};

export default SmartTranslator;