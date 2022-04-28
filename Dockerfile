FROM node:alpine

WORKDIR /home/node/app

# Install dependencies
COPY ./package* ./
RUN npm install

COPY ./ ./
ENTRYPOINT [ "/entrypoint.sh" ]
