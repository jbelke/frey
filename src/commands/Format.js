'use strict'
import Command from '../Command'
import constants from '../constants'
import Terraform from '../Terraform'
import async from 'async'
import fs from 'fs'
// import _ from 'lodash'
import globby from 'globby'
import depurar from 'depurar'; const debug = depurar('frey')

class Format extends Command {
  constructor (name, runtime) {
    super(name, runtime)
    this.boot = [
      '_confirm'
    ]
  }

  _confirm (cargo, cb) {
    this.shell.confirm('About to rewrite all HCL files in your project dir. Make sure your files are under source control as this is a best-effort procedure. May I proceed?', cb)
  }

  _reformatFile (hclFile, cb) {
    let args = {
      fmt: constants.SHELLARG_PREPEND_AS_IS,
      list: true,
      state: constants.SHELLARG_REMOVE,
      parallelism: constants.SHELLARG_REMOVE
    }
    args[hclFile] = constants.SHELLARG_APPEND_AS_IS

    const terraform = new Terraform({
      cmdOpts: { verbose: false },
      args: args,
      runtime: this.runtime
    })

    terraform.exe((err) => {
      if (err) {
        return cb(err)
      }

      let buf = fs.readFileSync(hclFile, 'utf-8')

      // remove equal sign from ` = {`
      buf = buf.replace(/ = {$/gm, ' {')

      // unquote keys if possible
      buf = buf.replace(/^(.*)"([a-z_]+)"(.*){$/gm, '$1$2$3{')
      buf = buf.replace(/^(\s+)"([a-z_]+)"(\s+)=/gm, '$1$2$3=')

      // remove all empty newlines
      buf = buf.replace(/\n(\n+)/gm, '\n')

      // add back newlines, just after main closing blocks
      buf = buf.replace(/^}$/gm, '}\n')

      fs.writeFileSync(hclFile, buf, 'utf-8')

      debug('Saved ' + hclFile)
      this.shell.confirm('About to rewrite all HCL files in your project dir. Make sure your files are under source control as this is a best-effort procedure. May I proceed?', cb)
    })
  }

  main (cargo, cb) {
    const pattern = `${this.runtime.init.cliargs.projectDir}/*.hcl`
    debug(`Reading from '${pattern}'`)
    return globby(pattern)
      .then((tomlFiles) => {
        async.map(tomlFiles, this._reformatFile.bind(this), (err, results) => {
          if (err) {
            return cb(err)
          }
          return cb(null)
        })
      })
      .catch(cb)
  }
}

module.exports = Format
