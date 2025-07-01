FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 9846

CMD ["npm", "run", "start"]