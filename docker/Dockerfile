FROM debian:buster-slim

RUN apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get -y install sqlite3 && \
  rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY oak-linux /usr/local/bin/oak
COPY better_sqlite3.node /usr/local/bin/better_sqlite3.node
COPY integer.node /usr/local/bin/integer.node