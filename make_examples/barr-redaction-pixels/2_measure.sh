#!/usr/env bash
mkdir -p histograms
rm histograms/*

red="rgb(236,64,37)"
blue="rgb(5,51,255)"

for file in pages/*.png; do
  convert $file -fuzz 20% \
    -channel A \
    -transparent $red \
    -transparent $blue \
    -negate +channel -posterize 2 \
    -format %c histogram:info:histograms/${file#pages/}.txt
done