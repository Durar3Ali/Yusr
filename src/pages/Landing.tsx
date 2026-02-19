import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { FeatureCard } from '@/components/FeatureCard';
import { CTAButtons } from '@/components/CTAButtons';
import { copy } from '@/lib/copy';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Type,
  Eye,
  FileText,
  Volume2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader variant="landing" />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight animate-fade-in">
                <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {copy.tagline}
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in">
                {copy.subtitle}
              </p>
              
              {user ? (
                <div className="flex justify-center animate-fade-in">
                  <Button asChild size="lg" className="group">
                    <Link to="/read">
                      Start Reading
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <CTAButtons
                  primaryText={copy.ctaPrimary}
                  primaryHref="/read"
                  secondaryText={copy.ctaSecondary}
                  secondaryHref="/auth/login"
                  className="justify-center animate-fade-in"
                />
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">
                Everything you need for comfortable reading
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Customizable features designed to help dyslexic readers focus on content, not formatting.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard
                icon={Type}
                title={copy.features[0].title}
                description={copy.features[0].description}
              />
              <FeatureCard
                icon={Eye}
                title={copy.features[1].title}
                description={copy.features[1].description}
              />
              <FeatureCard
                icon={FileText}
                title={copy.features[2].title}
                description={copy.features[2].description}
              />
              <FeatureCard
                icon={Volume2}
                title={copy.features[3].title}
                description={copy.features[3].description}
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">How it works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get started in three simple steps
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {copy.howItWorks.map((item, index) => (
                <div key={index} className="relative text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                  
                  {index < copy.howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Accessibility Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h2 className="text-3xl md:text-4xl font-bold">
                    {copy.accessibility.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {copy.accessibility.description}
                  </p>
                  
                  <ul className="space-y-3">
                    {[
                      'Dyslexia-friendly fonts and spacing',
                      'Customizable color themes',
                      'Keyboard navigation support',
                      'Screen reader compatible',
                      'WCAG accessibility standards'
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="relative">
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <div className="text-center space-y-4 p-8">
                      <Type className="h-16 w-16 mx-auto text-primary" />
                      <p className="text-2xl font-semibold">
                        Designed for everyone
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-8 p-12 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border">
              <h2 className="text-3xl md:text-4xl font-bold">
                Start reading better today
              </h2>
              <p className="text-lg text-muted-foreground">
                {user
                  ? 'Welcome back! Jump straight into your reading experience.'
                  : 'No sign-up required. Try Yusr as a guest and customize your reading experience instantly.'}
              </p>
              {user ? (
                <div className="flex justify-center">
                  <Button asChild size="lg" className="group">
                    <Link to="/read">
                      Go to Reader
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <CTAButtons
                  primaryText="Try as Guest"
                  primaryHref="/read"
                  secondaryText="Log in"
                  secondaryHref="/auth/login"
                  className="justify-center"
                />
              )}
            </div>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
