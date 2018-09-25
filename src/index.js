import program from 'commander'

import { version as VERSION } from '../package.json'
import NSD from './nsd'

const nsd = new NSD()

program
  .version(VERSION, '-v, --version')
  .option(
    '-c, --config-file <file>',
    'Which NSD config file to use',
    nsd.setCustomConfigFile.bind(nsd)
  )
  .option('-l, --list', 'Which NSD config file to use', nsd.list.bind(nsd))
  .description('Your npm scripts documentation')

program
  .command('get <scripts...>')
  .alias('g')
  .description('get the doc of a specific npm script')
  .action((scripts, options) => nsd.get(scripts, options))

program
  .command('list')
  .description('list all the documented scripts of your project')
  .alias('l')
  .action((cmd, options) => nsd.list())

program
  .command('add')
  .description('add a npm script documentation')
  .alias('a')
  .option('-n, --name <name>', 'the script name')
  .option('-d, --docs <docs>', 'the script description')
  .action(options => nsd.add(options))

// output help information on unknown commands
program.arguments('<command>').action(cmd => {
  program.outputHelp()
  console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`))
  console.log()
})

program.parse(process.argv)

const NO_COMMAND_SPECIFIED = program.rawArgs.length <= 2
if (NO_COMMAND_SPECIFIED) {
  program.help()
}

if (!process.argv.slice(2).length) {
  program.outputHelp()
}

