FROM node:16-buster-slim

RUN npm i -g queuekit-connector-bull@latest

ENTRYPOINT ["queuekit-connector-bull"]
