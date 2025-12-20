# Build stage
FROM node:20-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm install --omit=dev

# Generate Prisma Client
RUN npx prisma generate

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create JAR storage directory
RUN mkdir -p /data/jars

# Expose port
EXPOSE 3001

# Start script that runs migrations and starts server
CMD npx prisma migrate deploy && node dist/index.js
