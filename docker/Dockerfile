FROM debian:buster-slim

#RUN apt-get update && \
  #DEBIAN_FRONTEND=noninteractive apt-get -y install sqlite3 && \
  #rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*


COPY binaries /opt/oak/bin

ENV PATH="/opt/oak/bin:${PATH}"
