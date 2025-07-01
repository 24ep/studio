FROM 24ep/studio:dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate

RUN npm run build

# Compile process-upload-queue.ts to process-upload-queue.mjs
RUN npx tsc process-upload-queue.ts --outFile process-upload-queue.mjs --module esnext --target es2020 --esModuleInterop

EXPOSE 9846

RUN chmod +x ./entrypoint.sh
CMD ["./entrypoint.sh"]