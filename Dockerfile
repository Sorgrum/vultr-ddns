FROM node:18-alpine as builder

WORKDIR /app/web

COPY web/package.json web/package-lock.json .
RUN npm ci

COPY web .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

RUN apk update
RUN apk add git
RUN git clone https://github.com/andyjsmith/Vultr-Dynamic-DNS.git vultr-ddns

COPY --from=builder /app/web/package.json web/package.json
COPY --from=builder /app/web/node_modules web/node_modules
COPY --from=builder /app/web/.next web/.next
COPY --from=builder /app/web/public web/public

EXPOSE 3000

# CMD npx --yes serve web
CMD npm --prefix web run start
# ENTRYPOINT ["sh"]
