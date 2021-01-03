#!/bin/bash
set -euo pipefail

function test_js {
    prefix="\t🔵"
    echo -e "$prefix Starting JS tests."
    for f in src/test_*.js; do 
        echo -e "\t\tTesting $f"
        qjs $f >> /dev/null
    done
    echo -e "$prefix JS tests complete!"
};

function test {
    echo "Starting test suite..."
    test_js
    echo "Test suite complete!"
}
test