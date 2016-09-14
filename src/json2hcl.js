'use strict'
// import depurar from 'depurar'; const debug = depurar('frey')
import path from 'path'
import _ from 'lodash'
import squashArrays from './squashArrays'
import { spawn } from 'child_process'
import os from 'os'
const platform = os.platform()
const arch = `${os.arch()}`.replace('x64', 'amd64')

module.exports = (input, reverse, cb) => {
  let cmd = path.join(path.dirname(__dirname), 'bin', 'json2hcl-' + platform + '-' + arch)
  let args = []

  if (reverse) {
    // to json
    args.push('-reverse')
  } else {
    // to hcl
    if (!_.isString(input)) {
      input = JSON.stringify(input)
    }
  }

  // debug({
  //   cmd: cmd,
  //   args: args,
  //   input: input
  // })

  const child = spawn(cmd, args)

  let bufOut = ''
  let bufErr = ''

  child.stdin.write(input)
  child.stdin.end()

  child.stdout.on('data', (data) => {
    bufOut += data
  })
  child.stderr.on('data', (data) => {
    bufErr += data
  })

  child.on('close', (code, signal) => {
    if (code !== 0) {
      return cb(new Error(`json2hcl: ${bufOut}. ${bufErr}`))
    }

    if (!reverse) {
      return cb(null, bufOut)
    } else {
      let parsed = null
      let err = null
      try {
        parsed = JSON.parse(bufOut)
      } catch (e) {
        err = `Unable to parse '${bufOut}'. ${e}`
      }

      if (err) {
        return cb(err)
      }

      const squashed = squashArrays(parsed)
      return cb(null, squashed)
    }
  })
}
