FROM node:18-alpine as builder

# Install next-js dependencies
WORKDIR /app/web
COPY package.json package-lock.json .
RUN npm ci

# Install server dependencies
WORKDIR /app/web/syncServer
COPY syncServer/package.json syncServer/package-lock.json .
RUN npm ci

# Build both next-js and server together
WORKDIR /app/web
COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app 

COPY --from=builder /app/web/package.json package.json
COPY --from=builder /app/web/node_modules node_modules
COPY --from=builder /app/web/.next .next
COPY --from=builder /app/web/public public

COPY --from=builder /app/web/syncServer/package.json syncServer/package.json
COPY --from=builder /app/web/syncServer/node_modules syncServer/node_modules
COPY --from=builder /app/web/syncServer/dist syncServer/dist

EXPOSE 3000
EXPOSE 5000

CMD npm run start
# ENTRYPOINT ["sh"]
