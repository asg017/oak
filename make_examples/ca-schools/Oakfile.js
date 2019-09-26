COUNTY = "Los Angeles";

COUNTY_SNAKE = COUNTY.toLowerCase().replace(" ", "_");

recipe cde_txt = task({
  path: "pubschools.txt",
  make: cde_text =>
    shell`curl -o ${cde_text} https://raw.githubusercontent.com/datadesk/california-k12-notebooks/master/input/pubschls.txt`
});

recipe public_schools = task({
  path: "public_schools.csv",
  make: public_schools =>
    shell`pipenv run python clean_cde.py --input=${cde_txt} --output=${public_schools}`
});

recipe charter_schools = task({
  path: "charter_schools.csv",
  make: charter_schools =>
    shell`csvgrep -c is_charter -m Y ${public_schools} > ${charter_schools}`
});

recipe public_schools_in_county = task({
  path: `public_schools_in_${COUNTY_SNAKE}_county.csv`,
  make: public_schools_in_county =>
    shell`csvgrep -c county -m ${COUNTY} ${public_schools} > ${public_schools_in_county}`
});

recipe charter_schools_in_county = task({
  path: `charter_schools_in_${COUNTY_SNAKE}_county.csv`,
  make: charter_schools_in_county =>
    shell`csvgrep -c county -m ${COUNTY} ${charter_schools} > ${charter_schools_in_county}`
});

recipe charter_schools_geo = task({
  path: "charter_schools.geojson",
  make: charter_schools_geo =>
    shell`pipenv run python to_geo.py --input=${charter_schools} --output=${charter_schools_geo}`
});

recipe public_schools_in_county_geo = task({
  path: `public_schools_in_${COUNTY_SNAKE}_county.geojson`,
  make: public_schools_in_county_geo =>
    shell`pipenv run python to_geo.py --input=${public_schools_in_county} --output=${public_schools_in_county_geo}`
});

recipe charter_schools_in_county_geo = task({
  path: `charter_schools_in_${COUNTY_SNAKE}_county.geojson`,
  make: charter_schools_in_county_geo =>
    shell`pipenv run python to_geo.py --input=${charter_schools_in_county} --output=${charter_schools_in_county_geo}`
});
