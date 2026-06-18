# Stage 1: Dependencies
FROM node:lts-alpine AS deps
RUN apk add --no-cache pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# Need all dependencies for build
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:lts-alpine AS builder
RUN apk add --no-cache pnpm
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so they
# must be present here (pass via docker build --build-arg or compose build.args).
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID \
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY
# Builds standalone output
RUN pnpm build

# Stage 3: Runner
FROM node:lts-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000

# Only copy standalone output - no need for node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER node
EXPOSE 3000
# Uses standalone server
CMD ["node", "server.js"]
