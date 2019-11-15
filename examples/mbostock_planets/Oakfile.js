upr_all = task({
  target: "phl_hec_all_confirmed.csv",
  run: upr_all => shell`echo "doing upr_all"
curl 'http://www.hpcf.upr.edu/~abel/phl/phl_hec_all_confirmed.csv.zip' -O phl_hec_all_confirmed.csv.zip 
unzip -u phl_hec_all_confirmed.csv.zip
mv phl_hec_all_confirmed.csv ${upr_all}`
});

planets = task({
  target: "planets.csv",
  run: planets =>
    shell`echo "doing planets"
wget -O ${planets} https://gist.github.com/mbostock/3007180/raw/79339d19b6c9fea256ab9e99f7f0be18372904bf/planets.csv`
});

exoplanets = task({
  target: "exoplanets.csv",
  run: exoplanets => shell`# echo "doing exoplanets"
# cp -f ${planets} ${exoplanets}
cut -d, -f1,12,46 ${upr_all} | tail -n+2 >> ${exoplanets}`
});
