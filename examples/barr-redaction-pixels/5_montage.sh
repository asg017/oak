# sections:
# 1-II 22-43
# 1-III 44-73
# 1-IV 74-181
# 1-V 182-207

mkdir -p montages
rm montages/*

function makeMontage() {
  start=$1
  end=$2
  name=$3
  files=()
  for i in $(eval seq $start $end); do
    printf -v page '%03d' $i
    # echo $page
    files+=("pages/report-$page.png")
  done
  # echo "${files[@]}";
  montage "${files[@]}" -geometry 100x -quality 60% -tile 10x "montages/tiled-$name.jpg"
}

makeMontage 9 18 section1-summary
makeMontage 19 21 section1-i
makeMontage 22 43 section1-ii
makeMontage 44 73 section1-iii
makeMontage 74 181 section1-iv
makeMontage 182 207 section1-v
makeMontage 213 220 section2-summary
makeMontage 221 226 section2-i
makeMontage 227 370 section2-ii
makeMontage 371 393 section2-iii
makeMontage 394 394 section2-iv
makeMontage 395 448 appendices
