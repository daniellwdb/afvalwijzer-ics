FROM node:24-slim
LABEL org.opencontainers.image.source=https://github.com/daniellwdb/afvalwijzer-ics
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --ignore-sripts

CMD [ "node", "index.ts" ]
