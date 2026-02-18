import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { ChatBot } from '@/components/ChatBot';

export default function Chat() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader variant="app" />
      
      <main className="flex-1 bg-muted/30 flex items-center justify-center">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <ChatBot />
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
}
