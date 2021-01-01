BINDIR=bin

# Makefile reminders
#	$@ target filename

$(BINDIR):
	mkdir -p $(BINDIR)

$(BINDIR)/oak: $(BINDIR) ./src/oak.js ./src/Task.js ./src/sh.js
	qjsc -o $@ ./src/oak.js

.PHONY: all clean

all: $(BINDIR)/oak

clean:
	rm -rf $(BINDIR)