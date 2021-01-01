#FROM alpine
FROM debian:buster-slim
#COPY ./bin/oak /usr/local/bin
COPY ./deps/quickjs /deps/quickjs
WORKDIR /deps/quickjs
RUN apt-get update && apt-get install -y \
    clang \
    gcc \
    make \
     --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

RUN make
RUN make install

RUN cp /deps/quickjs/qjs /usr/local/bin
RUN cp /deps/quickjs/qjsc /usr/local/bin

WORKDIR /src/oak
COPY src /src/oak/src
COPY Makefile /src/oak
COPY deps/runtime/runtime-qjs.js /src/oak/deps/runtime/runtime-qjs.js 
COPY deps/unofficial-observablehq-compiler/ocompiler-qjs.js  /src/oak/deps/unofficial-observablehq-compiler/ocompiler-qjs.js
RUN make all

FROM debian:buster-slim
COPY --from=0 /src/oak/bin/oak /usr/local/bin
CMD ["oak"]