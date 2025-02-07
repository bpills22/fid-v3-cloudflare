# Flight Information Display System

Real-time flight data visualization using Next.js 15.1.4, Cloudflare Pages, and FlightAware's AeroAPI.

## Legal Notice
For educational/personal use only. No commercial use permitted.
- Cloudflare Pages/Workers © Cloudflare, Inc.
- AeroAPI © FlightAware
- Next.js © Vercel

## Setup

1. Clone repository:

`git clone https://github.com/bpills22/fid-v3-cloudflare.git`
`cd fid-v3-cloudflare`

2. Install dependencies:

`npm install`
`npm install -g wrangler`

3. Configure environment:

create `.dev.vars` in project root
API_KEY=`your_flightaware_api_key`

Add `wrangler.toml` to project root
Add both `.dev.vars` and `wrangler.toml` to `.gitignore`

4. Development:

# Terminal 1: Start Worker
`wrangler dev`

# Terminal 2: Start Next.js
`nvm use 18`
`npm run dev`

5. Access:

Worker API: http://localhost:8787/api/flights/[airport]/[type]  ex: http://localhost:8787/api/flights/egll/departures
Frontend: http://localhost:3000
Production: https://cf-next-flightaware.bpillsbury.com

6. Usage

Enter IATA/ICAO airport code (e.g., KAUS)
Select arrivals or departures
View real-time flight data

7. Technologies

Next.js 15.1.4
Cloudflare Pages/Workers
FlightAware AeroAPI
