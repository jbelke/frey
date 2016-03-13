'use strict'
import Command from '../Command'
import fs from 'fs'
import globby from 'globby'
import Terraform from '../Terraform'
import Ansible from '../Ansible'
import _ from 'lodash'
import uuid from 'node-uuid'
import mkdirp from 'mkdirp'
import depurar from 'depurar'; const debug = depurar('frey')

class Show extends Command {
  constructor (name, runtime) {
    super(name, runtime)
    this.boot = [
      '_createTmpDir',
      '_gatherHost',
      'output',
      'facts'
    ]
    this.tmpDir = this.runtime.init.os.tmp + '/' + uuid.v4()
  }

  _createTmpDir (cargo, cb) {
    mkdirp(this.tmpDir, cb)
  }

  _gatherHost (cargo, cb) {
    // @todo Ansible wants uppy-server here - not ec2.-etc
    // const terraform = new Terraform({
    //   args: {
    //     output: undefined,
    //     state: this.runtime.config.global.infra_state_file,
    //     parallelism: null,
    //     public_address: undefined
    //   },
    //   runtime: this.runtime
    // })
    //
    // terraform.exe((err, stdout) => {
    //   if (err) {
    //     return cb(err)
    //   }
    //
    //   const host = `${stdout}`.split('\n')[0].trim()
    //   return cb(null, host)
    // })
    //

    debug(this.runtime.config.install)
    cb(null, _.get(this.runtime, 'config.install.playbooks.0.hosts'))
  }

  output (cargo, cb) {
    if (!_.has(this.runtime.config, 'infra')) {
      debug(`Skipping output as there are no infra instructions`)
      return cb(null)
    }

    const terraform = new Terraform({
      cmdOpts: { verbose: false },
      args: {
        output: undefined,
        state: this.runtime.config.global.infra_state_file,
        parallelism: null
      },
      runtime: this.runtime
    })

    terraform.exe(cb)
  }

  facts (cargo, cb) {
    if (!_.has(this.runtime.config, 'install.playbooks')) {
      debug(`Skipping facts as there are no install instructions`)
      return cb(null)
    }

    const ansibleProps = _.find(this.runtime.prepare.deps, { name: 'ansible' })
    const opts = { exe: ansibleProps.exe, args: {}, runtime: this.runtime, cmdOpts: { verbose: false } }

    opts.args['module-name'] = 'setup'
    opts.args['tree'] = this.tmpDir
    opts.args[this.bootCargo._gatherHost] = undefined

    const ansible = new Ansible(opts)
    ansible.exe((err, stdout) => {
      if (err) {
        return cb(err)
      }

      let out = ''
      globby.sync(`${this.tmpDir}/*`).forEach((filepath, i) => {
        const facts = JSON.parse(fs.readFileSync(filepath, 'utf-8'))

        out += _.get(facts, 'ansible_facts.ansible_fqdn')
        out += ','
        out += 'ansible_facts.ansible_service_mgr = ' + _.get(facts, 'ansible_facts.ansible_service_mgr')
        out += '\n'
      })

      cb(null, out)
    })
  }

  main (cargo, cb) {
    const results = {
      output: this.bootCargo.output,
      facts: this.bootCargo.facts
    }

    _.forOwn(results, (out, key) => {
      if (out) {
        this._out(`- [ ${key} ] -------------------------------- \n`)
        this._out(`${out} \n`)
      }
    })

    cb(null, results)
  }
}

module.exports = Show
