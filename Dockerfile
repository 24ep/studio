FROM 24ep/studio:dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate

RUN npm run build

EXPOSE 9846

RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]