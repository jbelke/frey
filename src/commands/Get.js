'use strict'
import Terraform from '../Terraform'
import Command from '../Command'
import _ from 'lodash'
import constants from '../constants'

class Get extends Command {
  main (cargo, cb) {
    if (!_.has(this.runtime.config, 'infra')) {
      this._out(`Skipping as there are no infra instructions\n`)
      return cb(null)
    }

    const terraform = new Terraform({
      args: {
        get: constants.SHELLARG_PREPEND_AS_IS,
        state: constants.SHELLARG_REMOVE,
        parallelism: constants.SHELLARG_REMOVE,
        update: true
      },
      runtime: this.runtime
    })

    terraform.exe((err, stdout) => {
      if (err) {
        return cb(err)
      }

      this._out(`--> Updated modules'\n`)
      return cb(null)
    })
  }
}

module.exports = Get
