a:
	echo -n "a" | tee $@
b:
	echo -n "b" | tee $@

c: a b	
	cat a b | tee $@

.PHONY: clean all

all: a b c 

clean:
	rm a b c || true