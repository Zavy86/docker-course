FROM node:24-alpine
WORKDIR /app
RUN [ "npm", "install", "-g", "nodemon" ]
CMD [ "sh", "-c", "\
  echo 'Subscriptions - Development Container'; \
  echo 'Installing or updating dependencies...'; \
  npm install && \
  echo 'Starting development server with nodemon...'; \
  npm run dev \
"]
EXPOSE 3000
