GENERATED_FILES = \
	exoplanets.csv

all: $(GENERATED_FILES)

clean:
	rm -rf -- $(GENERATED_FILES)

build/exoplanets.zip:
	mkdir -p build
	curl -o $@ 'http://www.hpcf.upr.edu/~abel/phl/phl_hec_all_confirmed.csv.zip'

planets.csv: 
	mkdir -p build
	wget https://gist.github.com/mbostock/3007180/raw/79339d19b6c9fea256ab9e99f7f0be18372904bf/planets.csv
	mv planets.csv build/
	ls


exoplanets.csv: build/exoplanets.zip planets.csv
	unzip -u -d build $<
	cp -f build/planets.csv $@
	cut -d, -f1,12,46 build/phl_hec_all_confirmed.csv | tail -n+2 >> $@


