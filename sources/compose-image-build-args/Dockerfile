FROM nginx:stable-alpine AS runtime
ARG VERSION=dev
LABEL org.opencontainers.image.version=$VERSION
COPY index.html /usr/share/nginx/html/index.html
