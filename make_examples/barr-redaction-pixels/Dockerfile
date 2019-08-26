FROM node:12.9-alpine
LABEL name="Barr Redaction Pixels"
LABEL maintainer="Alex Garcia <alexsebastian.garcia@gmail.com>"

RUN apk add --update \
    imagemagick \
    tesseract-ocr \
    poppler \
    poppler-utils \
    curl
WORKDIR /app

COPY . /app

