FROM node:22-alpine

WORKDIR /app

RUN apk update \
    && apk --no-cache add openjdk21-jre-headless curl bash \
    && rm -rf /var/cache/apk/*

RUN npm install -g firebase-tools \
    && firebase setup:emulators:ui \
    && firebase setup:emulators:firestore \
    && firebase setup:emulators:pubsub
