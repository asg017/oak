all: a b c d e
.PHONY : all
.DEFAULT_GOAL := all

a:
	echo "a" > a
b:
	echo "b" > b
c: a b
	cat a b > c
d: c
	cat c > d
e: d
	cat d > e
