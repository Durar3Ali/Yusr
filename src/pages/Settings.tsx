import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { usePreferences } from '@/context/PreferencesContext';
import { useMe } from '@/hooks/useMe';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { upsertPreferences, preferencesToDbPayload } from '@/lib/api/preferences';
import { updateMe } from '@/lib/api/users';
import { FontFamilySelect } from '@/components/preferences/FontFamilySelect';
import { ThemeSelect } from '@/components/preferences/ThemeSelect';
import { LeadBoldRadioGroup } from '@/components/preferences/LeadBoldRadioGroup';
import { LangHintRadioGroup } from '@/components/preferences/LangHintRadioGroup';
import { SliderControl } from '@/components/preferences/SliderControl';

export default function Settings() {
  const { preferences, setPreferences, resetPreferences } = usePreferences();
  const { authUser, me, loading } = useMe();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Populate profile fields once the user record is available
  useEffect(() => {
    if (me && !fullName && !email) {
      setLoadingProfile(true);
      setFullName(me.full_name || '');
      setEmail(me.email);
      setLoadingProfile(false);
    }
  }, [me, fullName, email]);

  // Auto-save preferences to Supabase with debounce when logged in
  useEffect(() => {
    if (!me) return;
    const saveTimer = setTimeout(() => {
      upsertPreferences(preferencesToDbPayload(preferences, me.id)).catch(err => {
        console.error('Failed to save preferences:', err);
        toast.error('Failed to save preferences');
      });
    }, 500);
    return () => clearTimeout(saveTimer);
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
      await upsertPreferences(preferencesToDbPayload(preferences, me.id));
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
            {/* Account */}
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
                    disabled={loading || !authUser || loadingProfile}
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
                {!loading && !authUser && (
                  <p className="text-sm text-muted-foreground p-3 rounded-md bg-muted">
                    You don't have an account.{' '}
                    <Link
                      to="/auth/login"
                      className="text-foreground underline underline-offset-4 hover:text-primary"
                    >
                      Login
                    </Link>{' '}
                    if you have an account or{' '}
                    <Link
                      to="/auth/signup"
                      className="text-foreground underline underline-offset-4 hover:text-primary"
                    >
                      Sign Up
                    </Link>
                    .
                  </p>
                )}
                <Button
                  onClick={handleSaveProfile}
                  disabled={loading || !authUser || loadingProfile}
                >
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
                <ThemeSelect
                  id="settings-theme"
                  value={preferences.theme}
                  onValueChange={(value) => setPreferences({ theme: value })}
                />

                <FontFamilySelect
                  id="settings-font-family"
                  value={preferences.fontFamily}
                  onValueChange={(value) => setPreferences({ fontFamily: value })}
                />

                <SliderControl
                  id="settings-font-size"
                  label="Font Size"
                  value={preferences.fontSize}
                  min={14}
                  max={28}
                  step={1}
                  displayValue={`${preferences.fontSize}px`}
                  onValueChange={(value) => setPreferences({ fontSize: value })}
                />

                <SliderControl
                  id="settings-line-spacing"
                  label="Line Spacing"
                  value={preferences.lineSpacing}
                  min={1.2}
                  max={2.5}
                  step={0.1}
                  displayValue={preferences.lineSpacing.toFixed(1)}
                  onValueChange={(value) => setPreferences({ lineSpacing: value })}
                />

                <SliderControl
                  id="settings-letter-spacing"
                  label="Letter Spacing"
                  value={preferences.letterSpacing}
                  min={0}
                  max={0.15}
                  step={0.01}
                  displayValue={`${preferences.letterSpacing.toFixed(2)}em`}
                  onValueChange={(value) => setPreferences({ letterSpacing: value })}
                />

                <LeadBoldRadioGroup
                  idPrefix="settings-bold"
                  value={preferences.leadBold}
                  onValueChange={(value) => setPreferences({ leadBold: value })}
                />

                <SliderControl
                  id="settings-group-size"
                  label="Group Color Size"
                  value={preferences.groupSize}
                  min={2}
                  max={7}
                  step={1}
                  displayValue={`${preferences.groupSize} words`}
                  onValueChange={(value) => setPreferences({ groupSize: value })}
                />

                <LangHintRadioGroup
                  idPrefix="settings-lang"
                  value={preferences.langHint}
                  onValueChange={(value) => setPreferences({ langHint: value })}
                />

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={handleResetPreferences}>
                    Reset to Defaults
                  </Button>
                  <Button
                    onClick={handleSaveReadingPreferences}
                    disabled={loading || !authUser}
                  >
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
