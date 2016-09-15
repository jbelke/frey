'use strict'
// import depurar from 'depurar'; const debug = depurar('frey')
import _ from 'lodash'

// HCL nests EVERYTHING into an array. While that's cool.. going back to
// ansible yaml, it poses problems. Here's the counter hack.
const squashArrays = (i, exceptions, path) => {
  const input = _.cloneDeep(i)
  if (!exceptions) {
    exceptions = [
      '*.playbooks.*',
      '*.playbooks.*.handlers',
      '*.playbooks.*.roles.*.apt_packages',
      '*.playbooks.*.roles.*.munin_alerts',
      '*.playbooks.*.roles.*.munin_hosts',
      '*.playbooks.*.roles.*.munin_node_plugins',
      '*.playbooks.*.roles.*.nodejs_npm_global_packages',
      '*.playbooks.*.roles.*.rsyslog_rsyslog_d_files.*.rules',
      '*.playbooks.*.roles.*.znc_users',
      '*.playbooks.*.roles',
      '*.playbooks.*.tasks',
      '*.playbooks',
      '**.tags'
    ]
  }
  if (!path) {
    path = []
  }

  const regexceptions = []
  exceptions.forEach((ex, i) => {
    const pattern = [
      '^',
      ex
        .replace(/\./g, '\\.')
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^\\.]+'),
      '$'
    ].join('')
    regexceptions.push(new RegExp(pattern, 'g'))
  })

  const isException = (pathString) => {
    let match = false
    regexceptions.forEach((ex) => {
      if (ex.test(pathString)) {
        match = true
        return false // Abort loop
      }
    })

    return match
  }

  if (_.isArray(input) || _.isPlainObject(input)) {
    _.forEach(input, (val, key) => {
      let curPath = path.concat(key)
      let curPathString = path.concat(key).join('.')

      if (_.isArray(val)) {
        // debug(`question: key=${key} with val=${val} at path=${curPathString}`)
        if (val.length === 1 && _.isPlainObject(val[0]) && !isException(curPathString)) {
          // debug(`squashed key=${key} with val=${val} at path=${curPathString}`)
          input[key] = val[0]
        }
        input[key] = squashArrays(input[key], exceptions, curPath)
      } else if (_.isPlainObject(val)) {
        input[key] = squashArrays(val, exceptions, curPath)
      } else {
        input[key] = val
      }
    })
  }

  return input
}

module.exports = squashArrays
