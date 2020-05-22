.PHONY: binaries docker alpine alpine-binaries

docker: binaries
	docker build -t oak:latest -f Dockerfile .

# NOTE: I dont think alpine works
# docker is hard and i lave limits
alpine: alpine-binaries
	docker build -t oak-alpine:latest -f Dockerfile.alpine .

alpine-binaries:
	rm -rf binaries-alpine
	mkdir -p binaries-alpine/node_modules
	cp ../pkg/oak-alpine binaries-alpine/oak
	cp -r ../node_modules/better-sqlite3 binaries-alpine/node_modules

binaries:
	rm -rf binaries
	mkdir -p binaries
	cp ../pkg/oak-linux binaries/oak
	cp ../node_modules/better-sqlite3/build/Release/better_sqlite3.node binaries