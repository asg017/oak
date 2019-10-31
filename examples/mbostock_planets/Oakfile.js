upr_all = cell({
  path: "phl_hec_all_confirmed.csv",
  recipe: upr_all => shell`echo "doing upr_all"
curl 'http://www.hpcf.upr.edu/~abel/phl/phl_hec_all_confirmed.csv.zip' -O phl_hec_all_confirmed.csv.zip 
unzip -u phl_hec_all_confirmed.csv.zip
mv phl_hec_all_confirmed.csv ${upr_all}`
});

planets = cell({
  path: "planets.csv",
  recipe: planets =>
    shell`echo "doing planets"
wget -O ${planets} https://gist.github.com/mbostock/3007180/raw/79339d19b6c9fea256ab9e99f7f0be18372904bf/planets.csv`
});

exoplanets = cell({
  path: "exoplanets.csv",
  recipe: exoplanets => shell`# echo "doing exoplanets"
# cp -f ${planets} ${exoplanets}
cut -d, -f1,12,46 ${upr_all} | tail -n+2 >> ${exoplanets}`
});
