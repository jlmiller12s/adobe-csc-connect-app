# Adobe CSC Connect

A private conference companion app for Adobe CSC attendees, built with Next.js 14, Tailwind CSS, and Supabase.

## Features
- Secure email-based authentication
- Private social photo feed
- Real-time chat channels
- Conference notes and sharing
- Schedule and attendee directory

## Prerequisites
- Node.js 18+
- A Supabase Project (for Auth, Database, Storage, and Realtime)

## Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Supabase Setup:**
   - Create a new project on [Supabase](https://supabase.com).
   - Go to the SQL Editor and run the contents of `schema.sql` to set up the tables and RLS policies.
   - Run the contents of `seed.sql` to populate initial demo data.
   - Set up Auth: Enable Email provider.
   - Set up Storage: Create a public bucket named `photos`.

3. **Environment Variables:**
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase project URL and anon key:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack
- [Next.js](https://nextjs.org/) (App Router)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)
- [TypeScript](https://www.typescriptlang.org/)
