FROM debian:buster-slim

RUN apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get -y install sqlite3 && \
  rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY oak-linux /oak/oak
#COPY better_sqlite3.node /oak/better_sqlite3.node
#COPY integer.node /oak/integer.node
COPY node_modules /oak/node_modules
