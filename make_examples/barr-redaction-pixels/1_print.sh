mkdir -p pages
rm pages/*
pdftoppm -png -f 1 report.pdf pages/report