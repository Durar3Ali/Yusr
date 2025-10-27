import { useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { OnboardingTips } from '@/components/OnboardingTips';
import { TextUploader } from '@/components/TextUploader';
import { Reader } from '@/components/Reader';
import { Toolbar } from '@/components/Toolbar';

export default function Read() {
  const [originalText, setOriginalText] = useState('');

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader variant="app" />
      
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <OnboardingTips />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left column: Text Input */}
            <div className="lg:col-span-3 space-y-6">
              <TextUploader originalText={originalText} onTextChange={setOriginalText} />
            </div>

            {/* Center column: Formatted Reader */}
            <div className="lg:col-span-6">
              <div className="bg-card rounded-lg border min-h-[600px] shadow-sm">
                <Reader originalText={originalText} onTextChange={setOriginalText} />
              </div>
            </div>
            
            {/* Right column: Controls */}
            <div className="lg:col-span-3">
              <Toolbar originalText={originalText} />
            </div>
          </div>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
}
