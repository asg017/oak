#/bin/bash
hyperfine \
    --prepare "make clean" "make all" \
    --prepare "rm -rf oak_data" "../../bin/oak run Oakfile"

make clean
rm -rf oak_data