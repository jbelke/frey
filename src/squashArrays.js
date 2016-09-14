'use strict'
import depurar from 'depurar'; const debug = depurar('frey')
import _ from 'lodash'

// HCL nests EVERYTHING into an array. While that's cool.. going back to
// ansible yaml, it poses problems. Here's the counter hack.
const squashArrays = (i, exceptions, depth) => {
  const input = _.cloneDeep(i)
  if (!exceptions) {
    exceptions = [
      'playbooks',
      'security_groups',
      'records',
      'hosts',
      'roles',
      'depends_on',
      'ssh_keys',
      'inline',
      'with_items',
      'tags',
      'non_key_attributes',
      'cidr_blocks',
      'egress',
      'ingress',
      'tasks'
    ]
  }
  if (!depth) {
    depth = 0
  }
  depth = depth + 1

  if (_.isArray(input) || _.isPlainObject(input)) {
    _.forEach(input, (val, key) => {
      if (_.isArray(val)) {
        // if (val.length === 1 && depth < 4) {
        if (val.length === 1) {
          if (exceptions.indexOf(key) === -1) {
            debug(`squashed key=${key} with val=${val} at depth=${depth}`)
            input[key] = val[0]
          }
        }
        input[key] = squashArrays(input[key], exceptions, depth)
      } else if (_.isPlainObject(val)) {
        input[key] = squashArrays(val, exceptions, depth)
      } else {
        input[key] = val
      }
    })
  }

  return input
}

module.exports = squashArrays
