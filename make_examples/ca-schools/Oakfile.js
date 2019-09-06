COUNTY = "Los Angeles";

COUNTY_SNAKE = COUNTY.toLowerCase().replace(" ", "_");

cde_txt = cell({
  path: "pubschools.txt",
  recipe: cde_text =>
    shell`curl -o ${cde_text} https://raw.githubusercontent.com/datadesk/california-k12-notebooks/master/input/pubschls.txt`
});

public_schools = cell({
  path: "public_schools.csv",
  recipe: public_schools =>
    shell`pipenv run python clean_cde.py --input=${cde_txt} --output=${public_schools}`
});

charter_schools = cell({
  path: "charter_schools.csv",
  recipe: charter_schools =>
    shell`csvgrep -c is_charter -m Y ${public_schools} > ${charter_schools}`
});

public_schools_in_county = cell({
  path: `public_schools_in_${COUNTY_SNAKE}_county.csv`,
  recipe: public_schools_in_county =>
    shell`csvgrep -c county -m ${COUNTY} ${public_schools} > ${public_schools_in_county}`
});

charter_schools_in_county = cell({
  path: `charter_schools_in_${COUNTY_SNAKE}_county.csv`,
  recipe: charter_schools_in_county =>
    shell`csvgrep -c county -m ${COUNTY} ${charter_schools} > ${charter_schools_in_county}`
});

charter_schools_geo = cell({
  path: "charter_schools.geojson",
  recipe: charter_schools_geo =>
    shell`pipenv run python to_geo.py --input=${charter_schools} --output=${charter_schools_geo}`
});

public_schools_in_county_geo = cell({
  path: `public_schools_in_${COUNTY_SNAKE}_county.geojson`,
  recipe: public_schools_in_county_geo =>
    shell`pipenv run python to_geo.py --input=${public_schools_in_county} --output=${public_schools_in_county_geo}`
});

charter_schools_in_county_geo = cell({
  path: `charter_schools_in_${COUNTY_SNAKE}_county.geojson`,
  recipe: charter_schools_in_county_geo =>
    shell`pipenv run python to_geo.py --input=${charter_schools_in_county} --output=${charter_schools_in_county_geo}`
});
