#/bin/bash

target=$1/*

for file in $target;
do
    cat $file
done