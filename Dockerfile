FROM node:18-alpine as builder

WORKDIR /app/web

COPY package.json package-lock.json .
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app 

RUN apk update
RUN apk add git
RUN git clone https://github.com/andyjsmith/Vultr-Dynamic-DNS.git vultr-ddns

COPY --from=builder /app/web/package.json package.json
COPY --from=builder /app/web/node_modules node_modules
COPY --from=builder /app/web/.next .next
COPY --from=builder /app/web/public public

EXPOSE 3000

# CMD npx --yes serve web
CMD npm run start
# ENTRYPOINT ["sh"]
