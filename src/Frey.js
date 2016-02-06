'use strict'
// import Depurar from 'depurar'
// var debug = Depurar('frey')
// var info = Depurar('frey')
import inflection from 'inflection'
import async from 'async'
// import util from 'util'
let _ = require('lodash')
// import fs from 'fs'
import os from 'os'
import path from 'path'
import mkdirp from 'mkdirp'
import chalk from 'chalk'
import Base from './Base'
import Mustache from 'mustache'
const osHomedir = require('os-homedir')
// import commands from './commands'
import chain from './chain'

class Frey extends Base {
  constructor (options) {
    super()
    this.boot = [
      '_injectOptions',
      '_defaults',
      '_normalize',
      '_setup',
      '_composeChain'
    ]
    this.options = options
    this.runtime = {}
  }

  _injectOptions (options, nextCb) {
    return nextCb(null, _.clone(this.options))
  }

  _defaults (options, nextCb) {
    if (!(typeof options !== 'undefined' && options !== null)) { options = {} }
    if (!(options._ != null)) { options._ = [] }
    if (!(options._[0] != null)) { options._[0] = 'prepare' }
    if (!(options.tmp != null)) { options.tmp = os.tmpdir() }
    if (!(options.home != null)) { options.home = osHomedir() }
    if (!(options.user != null)) { options.user = process.env.USER }

    return nextCb(null, options)
  }

  _normalize (options, nextCb) {
    // Render interdependent arguments
    for (let k1 in options) {
      let val = options[k1]
      if (val === `${val}`) {
        options[k1] = Mustache.render(val, options)
        if (options[k1].indexOf('{{{') > -1) {
          return nextCb(new Error(`Unable to render vars in '${k1}' '${options[k1]}'`))
        }
      }
    }

    // Apply simple functions
    for (let k2 in options) {
      let val = options[k2]
      if (`${val}`.match(/\|basename$/)) {
        val = val.replace(/\|basename$/, '')
        val = path.basename(val)
        options[k2] = val
      }
    }

    // Resolve to absolute paths
    const iterable = [ 'sshkeysDir', 'recipeDir', 'toolsDir' ]
    for (let i = 0, k3; i < iterable.length; i++) {
      k3 = iterable[i]
      if (!(options[k3] != null)) {
        throw new Error(`options.${k3} was found empty`)
      }

      options[k3] = path.resolve(options.recipeDir, options[k3])
    }

    if (!(options.tags != null)) {
      options.tags = ''
    }

    return nextCb(null, options)
  }

  _setup (options, nextCb) {
    return async.parallel([
      function (callback) {
        return mkdirp(options.toolsDir, callback)
      }
    ], err => {
      return nextCb(err, options)
    }
    )
  }

  _composeChain (options, nextCb) {
    const cmd = options._[0]
    const indexStart = chain.indexOf(cmd)

    if (indexStart < 0) {
      // This command is not part of the chain
      options.filteredChain = [ cmd ]
    } else {
      let length = 0
      if (options.bail) {
        length = indexStart + 1
      } else if (options.bailAfter && chain.indexOf(options.bailAfter) > -1) {
        length = chain.indexOf(options.bailAfter) + 1
      } else {
        length = chain.length
      }

      options.filteredChain = chain.slice(indexStart, length)
    }

    if (options.filteredChain.indexOf('prepare') < 0) {
      options.filteredChain.unshift('prepare')
    }

    options.filteredChain.unshift('runtime')

    return nextCb(null, options)
  }

  main (bootOptions, cb) {
    this.options = bootOptions

    if (this.options.verbose > 0) {
      this._out('--> Will run: %o\n', this.options.filteredChain)
    } else {
      this._out('--> Will run: %o\n', this.options.filteredChain)
    }

    return async.eachSeries(this.options.filteredChain, this._runOne.bind(this), cb)
  }

  _runOne (command, cb) {
    const className = inflection.classify(command)
    const p = `./commands/${className}`
    const Class = require(p)
    const obj = new Class(command, this.options, this.runtime)
    const func = obj.run.bind(obj)

    this._out(chalk.gray('--> '))
    this._out(chalk.gray(`${os.hostname()} - `))
    this._out(chalk.green(`${command}`))
    this._out(chalk.green('\n'))

    return func((err, result) => {
      const append = {}
      append[command] = result
      this.runtime = _.extend(this.runtime, append)
      return cb(err)
    })
  }
}

module.exports = Frey
