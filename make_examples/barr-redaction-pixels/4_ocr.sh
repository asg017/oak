#!/bin/sh
find pages -name *.png | sort > pagelist
tesseract pagelist report_ocr
