# Yusr - Reading Support for Dyslexia

A professional, accessible web application designed to help dyslexic readers with customizable text formatting, lead-bold highlighting, word grouping, and text-to-speech capabilities.

## Features

### Reading Experience
- **Multiple Font Options**: Choose from Lexend, Comic Neue, Atkinson Hyperlegible, Arial, Verdana, or System fonts
- **Customizable Typography**: Adjust font size (14-28px), line spacing (1.2-2.5), and letter spacing (0-0.15em)
- **Color Themes**: Four accessible themes - Light Yellow, Light Blue, Sepia, and Dark mode
- **Lead-Bold Highlighting**: Bold the first letters of words with configurable strength (off/short/medium/strong)
- **Word Grouping**: Alternating color highlights for groups of 2-7 words to help track lines
- **RTL/LTR Support**: Automatic text direction detection for Arabic and English content

### Text Input
- **Direct Paste**: Copy and paste text directly into the editor
- **PDF Upload**: Extract text from PDF files right in your browser (privacy-first, no server upload)
- **Sample Text**: Try the app instantly with built-in bilingual sample content

### Text-to-Speech
- **Read Aloud**: Built-in TTS with play, pause, and stop controls
- **Adjustable Speed**: Speech rate from 0.5x to 2.0x
- **Language Support**: Auto-detect or manually select Arabic or English

### Preferences
- **Persistent Settings**: All preferences saved automatically to browser localStorage
- **Default Preferences**: Set your preferred defaults in Settings
- **Guest Mode**: Full functionality without requiring an account

### User Experience
- **Landing Page**: Clear product introduction with features, how-it-works, and CTAs
- **Onboarding Tips**: First-time user guide (dismissible, stored in localStorage)
- **Empty States**: Helpful prompts when no text is loaded, with quick sample text button
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## Tech Stack

- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui + Radix UI primitives
- **PDF Processing**: pdfjs-dist (browser-based, no server required)
- **Routing**: React Router v6
- **State Management**: React Context API with localStorage persistence
- **Accessibility**: WCAG-compliant with ARIA labels, semantic HTML, keyboard navigation

## Project Structure

```
src/
 components/
    AppHeader.tsx # Main navigation header
    AppFooter.tsx # Footer with links
    FeatureCard.tsx # Landing page feature cards
    CTAButtons.tsx # Call-to-action button groups
    EmptyState.tsx # Reader empty state with sample text
    OnboardingTips.tsx # First-time user onboarding
    Reader.tsx # Main text display with formatting
    TextUploader.tsx # Text input and PDF upload
    ThemeToggle.tsx # Theme switcher component
    Toolbar.tsx # Reading controls sidebar
    ui/ # shadcn/ui components
 context/
    PreferencesContext.tsx # User preferences state management
 lib/
    copy.ts # Product copy and content strings
    pdf.ts # PDF text extraction with pdfjs-dist
    rtl.ts # RTL/LTR language detection
    textPipeline.ts # Text processing: normalize, tokenize, render
    utils.ts # Utility functions
 pages/
    Landing.tsx # Landing page (/)
    Read.tsx # Main reading app (/read)
    Settings.tsx # Settings and preferences (/settings)
    Login.tsx # Login page stub (/auth/login)
    Signup.tsx # Signup page stub (/auth/signup)
    NotFound.tsx # 404 page
 types/
    index.ts # TypeScript type definitions
 index.css # Global styles and design tokens
 main.tsx # App entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm (or yarn/pnpm/bun)
- (Optional) Supabase account for backend features

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Supabase Backend Setup (Optional)

To enable authentication, user settings sync, document storage, and admin features:

1. **Create a Supabase project** at https://supabase.com
2. **Apply the database schema**:
   - Open your Supabase project → SQL Editor
   - Paste the contents of `supabase/init.sql`
   - Click "Run" to create all tables, policies, and triggers
3. **Create a storage bucket**:
   - Go to Storage in Supabase Dashboard
   - Create a new bucket named `documents` (set to **private**)
   - Apply RLS policies as documented in `supabase/init.sql` comments
4. **Set environment variables** (already configured in `src/lib/supabaseClient.ts`):
   - `VITE_SUPABASE_URL`: Your project URL
   - `VITE_SUPABASE_ANON_KEY`: Your public anon key
5. **Promote a user to admin** (optional):
   ```sql
   UPDATE public.profiles SET role = 'admin' 
   WHERE user_id = '<user-uuid-from-auth.users>';
   ```

**Without Supabase:**
- The app works fully offline as a guest
- Settings saved to browser localStorage
- PDF processing happens client-side
- Admin dashboard shows mock data

### Available Scripts

```bash
npm run dev # Start development server
npm run build # Build for production
npm run preview # Preview production build
npm run lint # Run ESLint
```

## Design System

Yusr uses a comprehensive design system with CSS custom properties for theming:

- **Color Themes**: Four dyslexia-friendly themes (Light Yellow, Light Blue, Sepia, Dark)
- **Typography Scale**: Lexend, Comic Neue, Atkinson Hyperlegible, and system fonts
- **Spacing System**: Consistent spacing scale using Tailwind utilities
- **Animations**: Subtle fade-in and transition effects (respects prefers-reduced-motion)
- **Accessibility**: WCAG AA compliant contrast ratios, visible focus states

### Build for Production

```bash
npm run build
npm run start
```

## Project Structure

```
src/
 components/ # React components
    Layout.tsx # App layout with navigation
    Reader.tsx # Main reading display
    TextUploader.tsx # Text/PDF input
    Toolbar.tsx # Reading controls
    ThemeToggle.tsx # Theme switcher
 context/
    PreferencesContext.tsx # Settings state management
 lib/
    pdf.ts # PDF text extraction
    textPipeline.ts # Text processing (normalize, tokenize, render)
    rtl.ts # RTL/LTR detection
 pages/ # Route pages
    Index.tsx # Redirect to /read
    Read.tsx # Main reading page
    Settings.tsx # User preferences
    Login.tsx # Auth stub (UI only)
    Signup.tsx # Auth stub (UI only)
 types/
    index.ts # TypeScript type definitions
 App.tsx # Root component with routing
 index.css # Global styles + theme tokens
```

## Key Features Explained

### PDF Text Extraction

The app uses `pdfjs-dist` to extract text directly in the browser:
- **Worker Configuration**: Uses the bundled PDF.js worker from the pdfjs-dist package
- **Page-by-page extraction**: Processes all pages and aggregates text
- **Normalization**: Cleans whitespace and attempts to restore paragraph breaks
- **Error Handling**: Clear feedback for corrupted or encrypted PDFs

### Text Processing Pipeline

1. **Normalize**: Trim, collapse spaces, standardize line breaks
2. **Tokenize**: Split into word/space/newline tokens
3. **Lead-Bold**: Highlight initial characters based on word length and language
4. **Group Coloring**: Apply alternating background colors to word groups
5. **Render HTML**: Generate semantic HTML with proper paragraph structure

### RTL Support

- **Auto-detection**: Analyzes Unicode ranges to detect Arabic script
- **Language Hints**: Manual override for English/Arabic
- **Proper Rendering**: Sets `dir` attribute and respects text direction

### Web Speech API

- Uses browser's built-in TTS engine
- Supports multiple languages (with appropriate browser voices)
- Configurable rate and pitch
- Play/Pause/Stop controls

**Known Limitations:**
- Browser support varies (works best in Chrome/Edge)
- Voice quality depends on system/browser TTS voices
- Some languages may have limited voice options

## Future Enhancements (Not in MVP)

- [ ] Self-hosted OpenDyslexic font option
- [ ] Backend integration for user accounts and cloud sync
- [ ] More advanced PDF parsing (tables, images, complex layouts)
- [ ] Additional language support beyond English/Arabic
- [ ] Export formatted text as HTML or PDF
- [ ] Reading progress tracking and bookmarks
- [ ] Custom color schemes and theme editor

## Accessibility

This app follows WCAG 2.1 guidelines:
- Semantic HTML with proper heading structure
- ARIA labels on all interactive elements
- Keyboard navigation support
- High contrast color themes
- Focus visible indicators
- Screen reader compatible

## Browser Compatibility

- **Recommended**: Chrome, Edge (latest versions)
- **Supported**: Firefox, Safari (with reduced TTS functionality)
- **Mobile**: iOS Safari, Chrome Android

## License

[Your License Here]

## Credits

Built with React, Vite, Tailwind CSS, and shadcn/ui components.

## Notes

- Authentication pages (login/signup) are UI stubs for future implementation
- Profile editing in Settings is disabled for guest users
- PDF.js worker loads from bundled pdfjs-dist package (no CDN)
- Web Speech API availability and quality vary by browser and OS
- All text processing happens client-side for privacy and performance

## License

This project is open source and available under the MIT License.

---

**Built with love for dyslexic readers**
