import path from 'path'

import program from 'commander'
import chalk from 'chalk'
import Table from 'cli-table'
import inquirer from 'inquirer'

import * as utils from './utils'

export default class NSD {
  constructor() {
    // get json package for npm scripts
    const packagePath = utils.findUp('package.json')
    this.jsonPackage = utils.getJsonContent(packagePath)
    if (!this.jsonPackage) {
      throw Error(
        `${chalk.red('NSD')}: No package.json found in the current directory`
      )
    }
    this.npmScripts = this.jsonPackage.scripts

    // assign docs
    this.configPath = packagePath
    this.docs = this.jsonPackage.nsd
    if (!this.jsonPackage.nsd) {
      const configs = ['.nsdrc', '.nsd.json']
      this.configPath = utils.findUp(configs)
      this.docs = utils.getJsonContent(this.configPath)
    }
  }

  _write({ name, docs }) {
    try {
      utils.writeJsonToFile(this.configPath, {
        [name]: docs,
      })
      console.log(
        `Docs for script ${chalk.blue(name)} added to ${path.basename(
          this.configPath
        )}`
      )
    } catch (error) {
      console.log(
        `Can't add docs for script ${chalk.blue(name)} in ${path.basename(
          this.configPath
        )}`
      )
      throw error
    }
  }

  list() {
    console.log(chalk.green(`\nHere are your NPM docs scripts`))
    const table = new Table()
    for (const [script, docs] of Object.entries(this.docs)) {
      table.push({ [chalk.blue(script)]: docs })
    }
    return console.log(table.toString())
  }

  add({ name, docs }) {
    if (this.availableScripts.includes(name) && docs) {
      return this._write({ name, docs })
    }

    inquirer.prompt(this.setupPrompter()).then(({ name, docs }) => {
      this._write({ name, docs })
    })
  }

  get(scripts, options) {
    const table = new Table()

    console.log(
      chalk.green(`\nHere are NPM docs scripts for ${scripts.join(', ')}`)
    )

    scripts.forEach(script => {
      const documented = script in this.docs
      const exists = script in this.npmScripts
      switch (true) {
        case documented && exists:
          table.push({ [chalk.green(script)]: this.docs[script] })
          break
        case exists:
          table.push({
            [chalk.yellow(script)]:
              `${script} is not documented in ${path.basename(
                this.configPath
              )} but found in npm scripts.\n` +
              `nsd add <script> to docify it.`,
          })
          break
        default:
          table.push({ [chalk.red(script)]: `${script} is not a npm script.` })
          break
      }
    })
    return console.log(table.toString())
  }

  setCustomConfigFile(file) {
    const configPath = utils.findUp(file)
    if (!configPath) {
      throw Error(`${chalk.red('NSD')}: File at path ${file} doesn't exist`)
    }
    this.docs = utils.getJsonContent(configPath)
    this.configPath = configPath
  }

  get availableScripts() {
    const availableScripts = []
    for (const key of Object.keys(this.npmScripts)) {
      !(key in this.docs) && availableScripts.push(key)
    }
    return availableScripts
  }

  setupPrompter() {
    return [
      {
        type: 'list',
        name: 'name',
        message: 'Which script you want to choose ?',
        choices: this.availableScripts,
      },
      {
        type: 'editor',
        name: 'docs',
        message: 'Please write a short docs for this npm script',
      },
    ]
  }
}
