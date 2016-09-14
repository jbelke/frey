#!/usr/bin/env bash
set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

version="v0.0.6"

for os in "darwin" "linux"; do
  for arch in "amd64"; do
    curl -SsL https://github.com/kvz/json2hcl/releases/download/${version}/json2hcl_${version}_${os}_${arch} \
      -o bin/json2hcl-${os}-${arch}
    chmod 755 bin/json2hcl-${os}-${arch}
  done
done
