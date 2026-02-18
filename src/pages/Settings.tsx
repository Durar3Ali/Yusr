import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { usePreferences } from '@/context/PreferencesContext';
import { useMe } from '@/hooks/useMe';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { FontFamily, LeadBoldStrength, LanguageHint, Theme } from '@/types';
import { getPreferences, upsertPreferences } from '@/lib/api/preferences';
import { updateMe } from '@/lib/api/users';

export default function Settings() {
  const { preferences, setPreferences, resetPreferences } = usePreferences();
  const { authUser, me, loading } = useMe();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Load profile and settings from Supabase on mount if user is logged in
  useEffect(() => {
    if (me && !fullName && !email) {
      setLoadingProfile(true);
      
      // Set profile data from me (only if fields are empty)
      setFullName(me.full_name || '');
      setEmail(me.email);
      setLoadingProfile(false);
      
      // Load preferences
      getPreferences(me.id)
        .then(data => {
          setPreferences({
            theme: data.theme as Theme,
            fontFamily: data.font_family as FontFamily,
            fontSize: data.font_size,
            lineSpacing: data.line_spacing,
            letterSpacing: data.letter_spacing,
            leadBold: data.lead_bold as LeadBoldStrength,
            groupSize: data.group_size,
            langHint: data.lang_hint as LanguageHint,
          });
        })
        .catch(err => {
          console.error('Failed to load preferences:', err);
        });
    }
  }, [me, setPreferences, fullName, email]);

  // Save preferences to Supabase when changed (if logged in)
  useEffect(() => {
    if (me) {
      const saveTimer = setTimeout(() => {
        upsertPreferences({
          user_id: me.id,
          theme: preferences.theme,
          font_family: preferences.fontFamily,
          font_size: preferences.fontSize,
          line_spacing: preferences.lineSpacing,
          letter_spacing: preferences.letterSpacing,
          lead_bold: preferences.leadBold,
          group_size: preferences.groupSize,
          lang_hint: preferences.langHint,
        }).catch(err => {
          console.error('Failed to save preferences:', err);
          toast.error('Failed to save preferences');
        });
      }, 500);

      return () => clearTimeout(saveTimer);
    }
  }, [me, preferences]);

  const handleSaveProfile = async () => {
    if (!me) {
      toast.error('You must log in to save your profile');
      return;
    }

    try {
      setLoadingProfile(true);
      await updateMe({ full_name: fullName });
      toast.success('Profile saved successfully');
    } catch (err) {
      console.error('Failed to save profile:', err);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleResetPreferences = () => {
    resetPreferences();
    toast.success('Preferences reset to defaults');
  };

  const handleSaveReadingPreferences = async () => {
    if (!me) {
      toast.error('You must log in to save your reading preferences');
      return;
    }

    try {
      await upsertPreferences({
        user_id: me.id,
        theme: preferences.theme,
        font_family: preferences.fontFamily,
        font_size: preferences.fontSize,
        line_spacing: preferences.lineSpacing,
        letter_spacing: preferences.letterSpacing,
        lead_bold: preferences.leadBold,
        group_size: preferences.groupSize,
        lang_hint: preferences.langHint,
      });
      toast.success('Reading preferences saved successfully');
    } catch (err) {
      console.error('Failed to save reading preferences:', err);
      toast.error('Failed to save reading preferences. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader variant="app" />
      
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
          </div>

        <div className="space-y-8">
          {/* Personal Information */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!authUser || loadingProfile}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your.email@example.com"
                  value={email}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed here. Managed by authentication.
                </p>
              </div>
              {!authUser && (
                <p className="text-sm text-muted-foreground p-3 rounded-md bg-muted">
                  You don't have an account.{' '}
                  <Link to="/auth/login" className="text-foreground underline underline-offset-4 hover:text-primary">
                    Login
                  </Link>{' '}
                  if you have an account or{' '}
                  <Link to="/auth/signup" className="text-foreground underline underline-offset-4 hover:text-primary">
                    Sign Up
                  </Link>
                  .
                </p>
              )}
              <Button onClick={handleSaveProfile} disabled={!authUser || loadingProfile}>
                Save Profile
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Reading Preferences */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Reading Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme */}
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={preferences.theme}
                  onValueChange={(value: Theme) => setPreferences({ theme: value })}
                >
                  <SelectTrigger id="theme" className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="light-yellow">Light Yellow</SelectItem>
                    <SelectItem value="light-blue">Light Blue</SelectItem>
                    <SelectItem value="sepia">Sepia</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Font Family */}
              <div className="space-y-2">
                <Label htmlFor="font-family-setting">Font</Label>
                <Select
                  value={preferences.fontFamily}
                  onValueChange={(value: FontFamily) => setPreferences({ fontFamily: value })}
                >
                  <SelectTrigger id="font-family-setting" className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="Lexend">Lexend</SelectItem>
                    <SelectItem value="Comic Neue">Comic Neue</SelectItem>
                    <SelectItem value="Atkinson Hyperlegible">Atkinson Hyperlegible</SelectItem>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Verdana">Verdana</SelectItem>
                    <SelectItem value="System">System Default</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  All fonts are optimized for dyslexia-friendly reading
                </p>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="font-size-setting">Font Size</Label>
                  <span className="text-sm text-muted-foreground">{preferences.fontSize}px</span>
                </div>
                <Slider
                  id="font-size-setting"
                  min={14}
                  max={28}
                  step={1}
                  value={[preferences.fontSize]}
                  onValueChange={([value]) => setPreferences({ fontSize: value })}
                />
              </div>

              {/* Line Spacing */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="line-spacing-setting">Line Spacing</Label>
                  <span className="text-sm text-muted-foreground">
                    {preferences.lineSpacing.toFixed(1)}
                  </span>
                </div>
                <Slider
                  id="line-spacing-setting"
                  min={1.2}
                  max={2.5}
                  step={0.1}
                  value={[preferences.lineSpacing]}
                  onValueChange={([value]) => setPreferences({ lineSpacing: value })}
                />
              </div>

              {/* Letter Spacing */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="letter-spacing-setting">Letter Spacing</Label>
                  <span className="text-sm text-muted-foreground">
                    {preferences.letterSpacing.toFixed(2)}em
                  </span>
                </div>
                <Slider
                  id="letter-spacing-setting"
                  min={0}
                  max={0.15}
                  step={0.01}
                  value={[preferences.letterSpacing]}
                  onValueChange={([value]) => setPreferences({ letterSpacing: value })}
                />
              </div>

              {/* Lead Bold */}
              <div className="space-y-2">
                <Label>Lead Bold Strength</Label>
                <RadioGroup
                  value={preferences.leadBold}
                  onValueChange={(value: LeadBoldStrength) => setPreferences({ leadBold: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="off" id="settings-bold-off" />
                    <Label htmlFor="settings-bold-off" className="font-normal cursor-pointer">
                      Off
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="short" id="settings-bold-short" />
                    <Label htmlFor="settings-bold-short" className="font-normal cursor-pointer">
                      Short
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="settings-bold-medium" />
                    <Label htmlFor="settings-bold-medium" className="font-normal cursor-pointer">
                      Medium
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="strong" id="settings-bold-strong" />
                    <Label htmlFor="settings-bold-strong" className="font-normal cursor-pointer">
                      Strong
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Group Size */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="group-size-setting">Group Color Size</Label>
                  <span className="text-sm text-muted-foreground">
                    {preferences.groupSize} words
                  </span>
                </div>
                <Slider
                  id="group-size-setting"
                  min={2}
                  max={7}
                  step={1}
                  value={[preferences.groupSize]}
                  onValueChange={([value]) => setPreferences({ groupSize: value })}
                />
              </div>

              {/* Language Hint */}
              <div className="space-y-2">
                <Label>Language Hint</Label>
                <RadioGroup
                  value={preferences.langHint}
                  onValueChange={(value: LanguageHint) => setPreferences({ langHint: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="settings-lang-auto" />
                    <Label htmlFor="settings-lang-auto" className="font-normal cursor-pointer">
                      Auto-detect
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="en" id="settings-lang-en" />
                    <Label htmlFor="settings-lang-en" className="font-normal cursor-pointer">
                      English
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ar" id="settings-lang-ar" />
                    <Label htmlFor="settings-lang-ar" className="font-normal cursor-pointer">
                      Arabic
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleResetPreferences}>
                  Reset to Defaults
                </Button>
                <Button onClick={handleSaveReadingPreferences} disabled={!authUser}>
                  Save Reading Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
}
