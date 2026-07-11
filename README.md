#  Litmo

> *"Touch is not a transaction  it's a language."*
>
> **Litmo** is a consent-centered, trauma-informed platform for platonic physical connection  safe, non-sexual holding and co-regulation between consenting adults.
>
> This is not a dating app. It is a **touch wellness platform** built for neurodivergent, trauma-aware, and emotionally literate people who experience touch starvation and want a structured, safe way to give or receive platonic physical presence.
>
> ---
>
> ##  Why Litmo?
>
> In a post-isolation world, touch starvation is real. Litmo exists to repair attachment injuries, combat loneliness, and create a space where nervous systems can exhale  safely, consensually, and without sexual expectation.
>
> ---
>
> ##  Tech Stack
>
> | Layer | Technology |
> |---|---|
> | Mobile Frontend | React Native (Expo) |
> | Styling | NativeWind |
> | Backend | Node.js + Express |
> | Database + Auth | Supabase (PostgreSQL + Realtime) |
> | State Management | Zustand |
> | Navigation | Expo Router |
> | Real-time | Supabase Realtime |
>
> ---
>
> ##  Project Structure
>
> ```
> Litmo/
>  /app              # React Native (Expo) frontend
>     /screens      # Onboarding, Match, Session, Profile
>     /components
>     /hooks
>     /context
>  /backend          # Node.js + Express API
>     /routes
>     /middleware
>     /models
>  /supabase         # DB migrations + schema
>  /docs             # Concept, consent flow, trust system
> ```
>
> ---
>
> ##  Getting Started
>
> ### Prerequisites
> - Node.js 20+
> - - Expo CLI (`npm install -g expo-cli`)
>   - - Supabase account + project
>    
>     - ### Setup
>    
>     - ```bash
>       # Clone the repo
>       git clone https://github.com/softnessasastrength/Litmo.git
>       cd Litmo
>
>       # Install frontend dependencies
>       cd app && npm install
>
>       # Install backend dependencies
>       cd ../backend && npm install
>
>       # Copy and fill environment variables
>       cp .env.example .env
>
>       # Push Supabase migrations
>       cd ../supabase && supabase db push
>
>       # Start the app
>       cd ../app && npx expo start
>
>       # Start the backend (new terminal)
>       cd ../backend && node server.js
>       ```
>
> ---
>
> ##  Core Flows (POC)
>
> ### 1. Touch Language Onboarding
> Users build a profile expressing preferred hold types, pressure, session duration, environment, and nervous system notes.
>
> ### 2. Consent Setup
> A body-zone consent map where users mark each zone as Welcomed / Ask First / Off Limits, generating a hashed Consent Snapshot stored immutably in Supabase.
>
> ### 3. Consent-Gated Session Matching
> Two users match based on Touch Language compatibility. Before any session begins, both must review and confirm the consent overlap  only then does the session unlock.
>
> ### 4. Soft Signal
> An in-session exit button that ends the session gracefully with no questions asked, no explanation required. Triggers haptic feedback on both devices via Supabase Realtime.
>
> ### 5. Trust Ledger
> An immutable record of affirmed sessions that builds each user's trust score over time.
>
> ---
>
> ##  Safety Principles
>
> - Zero tolerance for sexual solicitation
> - - Consent is re-confirmed before every session
>   - - Soft Signal exit  always available, never stigmatized
>     - - Trust Ledger is immutable and tamper-proof
>       - - Uncomfortable session reports trigger private async review (no automatic penalties)
>        
>         - ---
>
> ##  POC Checklist
>
> - [ ] Touch Language Profile onboarding
> - [ ] - [ ] Consent Setup with body-zone map
> - [ ] - [ ] Discover screen with compatibility matching
> - [ ] - [ ] Consent Snapshot generated + confirmed by both users
> - [ ] - [ ] Active Session screen with timer + Soft Signal
> - [ ] - [ ] Session Wrap-Up + Trust Ledger write
> - [ ] - [ ] Trust score visible on profile
>
> - [ ] ---
>
> - [ ] ##  Documentation
>
> - [ ] See the `/docs` folder for:
> - [ ] - `CONCEPT.md`  Full product vision and philosophy
> - [ ] - `CONSENT_FLOW.md`  Detailed consent architecture
> - [ ] - `TRUST_SYSTEM.md`  Trust Ledger and Soul Ledger design
>
> - [ ] ---
>
> - [ ] ##  Contributing
>
> - [ ] Litmo is built with intention. If you want to contribute, please read `CONCEPT.md` first  the philosophy matters as much as the code.
>
> - [ ] ---
>
> - [ ] *Built with softness as a strength.*
