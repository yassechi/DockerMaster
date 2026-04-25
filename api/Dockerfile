FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production \
PORT=3001

COPY ./ ./

RUN npm install --production

EXPOSE 3001

CMD ["npm", "start"]