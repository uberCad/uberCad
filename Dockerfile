# Stage 1 - the build process
FROM node:10.16 as build-deps
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN npm install
COPY . ./
RUN npm run build


# Stage 2 - the production environment
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-deps /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]