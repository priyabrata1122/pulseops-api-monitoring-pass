FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Expose backend port
EXPOSE 8080

# Environment defaults
ENV PORT=8080
ENV NODE_ENV=production

# Start application
CMD ["node", "src/server.js"]
