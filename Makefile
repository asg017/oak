BINDIR=bin
DISTDIR=dist

# Makefile reminders
#	$@ target filename

$(BINDIR):
	mkdir -p $(BINDIR)

$(BINDIR)/oak: $(BINDIR) ./src/oak.js ./src/Task.js ./src/sh.js
	qjsc -o $@ ./src/oak.js

.PHONY: all build clean test docker help dist

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help

dist: $(BINDIR)/oak docker
	rm -rf $(DISTDIR)
	mkdir $(DISTDIR)
	# assuming built on a mac
	cp $(BINDIR)/oak dist/oak-darwin

	docker run -d --name tmp_qoak_debian qoak:debian;
	docker cp tmp_qoak_debian:/usr/local/bin/oak $(DISTDIR)/oak-debian;
	docker rm tmp_qoak_debian;

	docker run -d --name tmp_qoak_alpine qoak:alpine;
	docker cp tmp_qoak_alpine:/usr/local/bin/oak $(DISTDIR)/oak-alpine;
	docker rm tmp_qoak_alpine;


all: dist

build: $(BINDIR)/oak

clean:
	rm -rf $(BINDIR)
	rm -rf $(DISTDIR)

test:
	./test.sh

docker:
	docker build -f docker/Dockerfile.debian -t qoak:debian .
	docker build -f docker/Dockerfile.alpine -t qoak:alpine .