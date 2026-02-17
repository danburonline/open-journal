# OpenJournal

![Preview image](./preview.png)

A beautiful, minimal micro-journaling web application for daily reflection, dream logging, mood tracking, and personal wisdom collection. Built with React, Express, and PostgreSQL.

![OpenJournal](https://img.shields.io/badge/OpenJournal-Micro%20Journaling-c4841d)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D20-green)

## Features

- **Bullet-point journaling** - Quick, minimal entries with inline tags and mentions
- **Dream logging** - Dedicated dream entries with a separate dreams page
- **Highlights** - Mark important entries and browse them later
- **Mood tracking** - Optional mood rating on each entry
- **Daily prompts** - Rotating writing prompts for inspiration
- **Streak tracking** - Track your journaling consistency
- **Insights & analytics** - Heatmaps, word count charts, daytime distribution, and more
- **Tags & people** - Auto-extracted #tags and @mentions with dedicated pages
- **Tag goals** - Set "do more" or "do less" goals for any tag
- **Wisdom collection** - Save thoughts, quotes, facts, excerpts, and lessons with spaced repetition
- **Notes** - Separate notes with titles, content, and labels
- **Reflect** - Memory lane, one-year-ago entries, and weekly charts
- **Dark mode** - Full dark/light theme support
- **PWA** - Installable on desktop and mobile as a native-like app

## Tech Stack

| Layer    | Technology                                        |
| -------- | ------------------------------------------------- |
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui, Recharts |
| Backend  | Express.js 5, TypeScript                          |
| Database | PostgreSQL, Drizzle ORM                           |
| Routing  | wouter (client), Express (server)                 |
| State    | TanStack Query v5                                 |

---

## Getting Started

### Prerequisites

- **Node.js** >= 20
- **npm** >= 10
- **PostgreSQL** >= 14

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/openjournal.git
   cd openjournal
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up the database**

   Create a PostgreSQL database and set the connection URL:

   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/openjournal"
   ```

4. **Push the schema to your database**

   ```bash
   npm run db:push
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5000`.

### Environment Variables

| Variable         | Required | Description                                            |
| ---------------- | -------- | ------------------------------------------------------ |
| `DATABASE_URL`   | Yes      | PostgreSQL connection string                           |
| `SESSION_SECRET` | No       | Secret for session cookies (auto-generated if not set) |
| `PORT`           | No       | Server port (default: `5000`)                          |

---

## Production Build

Build the optimized production bundle:

```bash
npm run build
```

Start the production server:

```bash
NODE_ENV=production node dist/index.cjs
```

The production build bundles the React frontend into static files and the Express backend into a single `dist/index.cjs` file.

---

## Docker Deployment

### Using Docker

1. **Create a `Dockerfile`** in the project root:

   ```dockerfile
   FROM node:20-alpine AS builder

   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM node:20-alpine AS runner

   WORKDIR /app
   COPY --from=builder /app/dist ./dist
   COPY --from=builder /app/node_modules ./node_modules
   COPY --from=builder /app/package.json ./

   ENV NODE_ENV=production
   ENV PORT=5000
   EXPOSE 5000

   CMD ["node", "dist/index.cjs"]
   ```

2. **Build and run:**

   ```bash
   docker build -t openjournal .
   docker run -d \
     -p 5000:5000 \
     -e DATABASE_URL="postgresql://user:password@host:5432/openjournal" \
     -e SESSION_SECRET="your-secret-here" \
     --name openjournal \
     openjournal
   ```

### Using Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: openjournal
      POSTGRES_PASSWORD: openjournal
      POSTGRES_DB: openjournal
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - '5432:5432'

  app:
    build: .
    restart: unless-stopped
    ports:
      - '5000:5000'
    environment:
      DATABASE_URL: postgresql://openjournal:openjournal@db:5432/openjournal
      SESSION_SECRET: change-me-to-a-random-string
      PORT: '5000'
    depends_on:
      - db

volumes:
  pgdata:
```

Then run:

```bash
# Start everything
docker compose up -d

# Push the database schema (first time only)
docker compose exec app npx drizzle-kit push

# View logs
docker compose logs -f app
```

The app will be available at `http://localhost:5000`.

---

## Deploying to a VPS

1. **Set up a server** with Node.js 20+ and PostgreSQL installed.

2. **Clone, build, and run:**

   ```bash
   git clone https://github.com/your-username/openjournal.git
   cd openjournal
   npm ci
   npm run build

   # Set environment variables
   export DATABASE_URL="postgresql://user:password@localhost:5432/openjournal"
   export SESSION_SECRET="$(openssl rand -hex 32)"

   # Push schema
   npx drizzle-kit push

   # Run with a process manager
   npm install -g pm2
   pm2 start dist/index.cjs --name openjournal
   ```

3. **Set up a reverse proxy** (nginx example):

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Add SSL** with Let's Encrypt:

   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

---

## Deploying on Replit

This project is built to run natively on Replit:

1. Fork or import this repository into Replit
2. The database is provisioned automatically
3. Click **Run** to start the dev server
4. Click **Publish** to deploy with a public URL

---

## Project Structure

```
client/src/
  components/       UI components (sidebar, entry display, inputs)
  pages/            Page components (10 pages with sidebar navigation)
  hooks/            Custom React hooks
  lib/              Query client and utilities
server/
  index.ts          Express server entry point
  routes.ts         REST API endpoints
  storage.ts        Database access layer
  db.ts             PostgreSQL/Drizzle connection
shared/
  schema.ts         Database schema and types (shared between client/server)
```

## License

MIT
