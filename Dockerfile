FROM node:22-bookworm-slim AS package
WORKDIR /source
COPY . .
RUN node scripts/package-runtime.mjs --out /runtime

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4173
COPY --from=package --chown=node:node /runtime/ .
RUN mkdir -p data-cache && chown node:node data-cache
USER node
EXPOSE 4173
CMD ["node", "server.mjs"]
