#!/usr/bin/env bash
# Frey. Copyright (c) 2016, Transloadit Ltd.
#
# This file:
#
#  - Walks over any FREY_ environment variable
#  - Adds encrypted keys ready for use to .travis.yml
#
# Run as:
#
#  ./encrypt.sh
#
# Authors:
#
#  - Kevin van Zonneveld <kevin@transloadit.com>

set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

# Set magic variables for current file & dir
__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
__file="${__dir}/$(basename "${BASH_SOURCE[0]}")"
__base="$(basename ${__file} .sh)"
__root="$(dirname "${__dir}")"

if [ ! -f "${__root}/roles/deploy/v1.3.0/README.md" ]; then
  ansible-galaxy install \
   --force \
   --roles-path "${__root}/roles/deploy/v1.3.0" \
   carlosbuenosvinos.ansistrano-deploy,1.3.0
  mv "${__root}/roles/deploy/v1.3.0/carlosbuenosvinos.ansistrano-deploy/"* "${__root}/roles/deploy/v1.3.0/"
  rmdir "${__root}/roles/deploy/v1.3.0/carlosbuenosvinos.ansistrano-deploy/"
fi

if [ ! -f "${__root}/roles/rollback/v1.2.0/README.md" ]; then
  ansible-galaxy install \
   --force \
   --roles-path "${__root}/roles/rollback/v1.2.0" \
   carlosbuenosvinos.ansistrano-rollback,1.2.0
   mv "${__root}/roles/rollback/v1.2.0/carlosbuenosvinos.ansistrano-rollback/"* "${__root}/roles/rollback/v1.2.0/"
   rmdir "${__root}/roles/rollback/v1.2.0/carlosbuenosvinos.ansistrano-rollback/"
fi

if [ ! -f "${__root}/roles/nodejs/v2.1.1/README.md" ]; then
  ansible-galaxy install \
   --force \
   --roles-path "${__root}/roles/nodejs/v2.1.1" \
   geerlingguy.nodejs,2.1.1
   mv "${__root}/roles/nodejs/v2.1.1/geerlingguy.nodejs/"* "${__root}/roles/nodejs/v2.1.1/"
   rmdir "${__root}/roles/nodejs/v2.1.1/geerlingguy.nodejs/"
fi

geerlingguy.nodejs