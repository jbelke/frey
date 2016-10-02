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

# https://galaxy.ansible.com/geerlingguy/mysql/

# DISCLAMER FREY VERIONS != ANSIBLE GALAXY VERSION EVEN THOUGH IT APPEARS THAST WAY

# "<freyRole>,<freyVersion>;<ansiRole>,<ansiVersion>"
roles=(
  "deploy,v1.3.0;carlosbuenosvinos.ansistrano-deploy,1.3.0"
  "deploy,v1.4.0;carlosbuenosvinos.ansistrano-deploy,1.4.0"
  "rollback,v1.2.0;carlosbuenosvinos.ansistrano-rollback,1.2.0"
  "nodejs,v2.1.1;geerlingguy.nodejs,2.1.1"
  "redis,v1.2.0;geerlingguy.redis,1.2.0"
  "unattended-upgrades,v1.2.0;jnv.unattended-upgrades,v1.2.0"
  "munin,v1.1.2;geerlingguy.munin,1.1.2"
  "munin-node,v1.2.0;geerlingguy.munin-node,1.2.0"
  "upstart,v1.0.0;telusdigital.upstart"
  "logrotate,v1.0.0;telusdigital.logrotate"
  "rsyslog,v3.0.1;tersmitten.rsyslog,v3.0.1"
  "fqdn,v1.0.0;holms.fqdn"
  "znc,v1.0.4;triplepoint.znc,1.0.4"
  "nginx,v2.0.1;jdauphant.nginx,v2.0.1"
  "prometheus,v1.3.6;williamyeh.prometheus,1.3.6"
  "smokeping,v0.0.1;akamine.smokeping"
  "jenkins,v1.3.0;geerlingguy.jenkins,1.3.0"
  "nix,v1.0.1;ktosiek.nix,v1.0.1"
)

for role in "${roles[@]}"; do
  freyRoleAndVersion="$(echo "${role}" |awk -F";" '{print $1}')"
  freyRole="$(echo "${freyRoleAndVersion}" |awk -F"," '{print $1}')"
  freyVersion="$(echo "${freyRoleAndVersion}" |awk -F"," '{print $2}')"

  ansiRoleAndVersion="$(echo "${role}" |awk -F";" '{print $2}')"
  ansiRole="$(echo "${ansiRoleAndVersion}" |awk -F"," '{print $1}')"
  ansiVersion="$(echo "${ansiRoleAndVersion}" |awk -F"," '{print $2}')"

  if [ ! -f "${__root}/roles/${freyRole}/${freyVersion}/README.md" ]; then
    ansible-galaxy install \
      --force \
      --roles-path "${__root}/roles/${freyRole}/${freyVersion}" \
    ${ansiRoleAndVersion}
    shopt -s dotglob nullglob # to also glob over hidden files
    set -x
    mv "${__root}/roles/${freyRole}/${freyVersion}/${ansiRole}/"* "${__root}/roles/${freyRole}/${freyVersion}/"
    rmdir "${__root}/roles/${freyRole}/${freyVersion}/${ansiRole}/"
  fi

  licenseFile="$(find "${__root}/roles/${freyRole}/${freyVersion}" -name 'LICENSE*')"
  if [ ! -f "${licenseFile}" ]; then
    echo "WARNING! No LICENSE found in ${__root}/roles/${freyRole}/${freyVersion}"
  else
    author=$(echo $(cat "${licenseFile}" |grep Copyright |tail -n1))

    echo "${licenseFile}"

    cp "${licenseFile}" "${__root}/licenses/${ansiRole}-LICENSE"

    if ! egrep "^- ${ansiRole}" "${__root}/licenses/index.md" 2>&1 > /dev/null; then
      echo "- ${ansiRole} -- ${author}" >> "${__root}/licenses/index.md"
    fi

    sort "${__root}/licenses/index.md" -o "${__root}/licenses/index.md"
  fi
done
