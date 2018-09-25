import fs from 'fs'
import path from 'path'

import glob from 'glob'
import stripJSONComments from 'strip-json-comments'
import inquirer from 'inquirer'
import writeJsonFile from 'write-json-file'

// https://github.com/commitizen/cz-cli/blob/master/src/configLoader/findup.js
export function findUp(patterns, cwd) {
  if (typeof patterns === 'string') {
    patterns = [patterns]
  }
  let lastPath
  let file
  const options = {
    cwd: cwd || process.cwd(),
    nocase: true,
  }

  do {
    // get path of the first config file which exists
    file = patterns.filter(pattern => {
      const isFileFound = glob.sync(pattern, options)[0]
      return isFileFound
    })[0]

    if (file) {
      return path.join(options.cwd, file)
    }
    lastPath = options.cwd
    options.cwd = path.resolve(options.cwd, '..')
  } while (options.cwd !== lastPath)
}

// get json object from a config file
export function getJsonContent(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return
  }

  const pathInfo = path.parse(filePath)
  // TODO: create fn to check if ext ends up with 'rc'
  const isRcFile = pathInfo.ext !== '.js' && pathInfo.ext !== '.json'

  let json = fs.readFileSync(filePath, 'utf-8')
  json = isRcFile ? stripJSONComments(json) : json

  try {
    const content = JSON.parse(json)

    Object.defineProperty(content, 'configPath', {
      value: filePath,
    })

    return content
  } catch (err) {
    console.error(`NSD: Can't parse JSON at ${filePath}: ` + `${err.message}`)
    throw err
  }
}

export function writeJsonToFile(path, json) {
  let config = getJsonContent(path)

  if (path.includes('package.json')) {
    config.nsd = { ...config.nsd, ...json }
  } else {
    config = { ...config, ...json }
  }

  writeJsonFile.sync(path, config)
}
