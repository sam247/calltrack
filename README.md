# CallTrack - Next.js

Call tracking and attribution SaaS application built with Next.js 14+ and Supabase.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Supabase account and project

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Note: The code also supports `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as a fallback, but `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the recommended variable name for Supabase SSR.

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Building for Production

```bash
npm run build
npm start
```

## Deployment to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Import your project in [Vercel](https://vercel.com)

3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as fallback)

4. Deploy!

The deployment will automatically detect Next.js and configure the build settings.

## Project Structure

```
/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   ├── auth/              # Authentication pages
│   └── dashboard/         # Dashboard pages
├── components/            # React components
│   ├── landing/          # Landing page components
│   ├── dashboard/        # Dashboard components
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
├── integrations/         # Third-party integrations
│   └── supabase/        # Supabase client configuration
├── lib/                  # Utility functions
└── public/              # Static assets
```

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Backend**: Supabase
- **State Management**: React Context API
- **Data Fetching**: TanStack Query

## Features

- Landing page with SEO optimization
- User authentication (sign up, sign in, sign out)
- Protected dashboard routes
- Workspace management
- Call tracking and analytics
- SEO source attribution
- Reports generation

## License

Private - All rights reserved

