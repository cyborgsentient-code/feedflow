FROM node:20-slim

RUN apt-get update && apt-get install -y curl --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npx playwright install-deps chromium
RUN npx playwright install chromium

COPY src ./src
# bust cache 3

CMD ["node", "src/index.js"]
