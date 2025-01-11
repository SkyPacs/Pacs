FROM node:22 AS build

WORKDIR /app

COPY package*.json ./

RUN npm i

COPY . .

FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules

COPY . .

EXPOSE 5000

CMD ["npm", "run", "start"]⏎    
