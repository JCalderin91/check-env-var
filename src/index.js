#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const argv = require('minimist')(process.argv.slice(2));

const envName = argv.e || '.env'

const extensionsToSearch = ['.js', '.ts', '.jsx', '.tsx']
const baseDir = './'
const files = []
const envFilePath = `./${envName}`

let usedEnvVars = []
let match = []

function searchFiles(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file)
    const fileStat = fs.lstatSync(filePath)
    if (fileStat.isDirectory()) {
      searchFiles(filePath)
    } else if (fileStat.isFile()) {
      if (filePath.includes('node_modules') || filePath.includes('.next')) return
      if (extensionsToSearch.includes(path.extname(filePath))) {
        files.push(filePath)
      }
    }
  })
}

console.log("Environment file: " + envName)
console.log('Procesing files...\n')
console.time('Scanning duration')

searchFiles(baseDir)

files.forEach((fileToSearch) => {
  const fileContent = fs.readFileSync(fileToSearch, 'utf8')
  const regex = /process\.env\.(\w+)/g
  let match = []
  while ((match = regex.exec(fileContent))) {
    usedEnvVars.push(match[1])
  }
})

const environmentSet = new Set(usedEnvVars)

environmentSet.delete('NODE_ENV')
usedEnvVars = [...environmentSet]
const fileContent = fs.readFileSync(envFilePath, 'utf8')

usedEnvVars.map((envVar) => {
  if (!fileContent.includes(envVar)) {
    match.push(envVar)
  }
})

const countFiles = new Intl.NumberFormat('de-DE').format(files.length)

console.log(`Files scanned: ${countFiles}`)
console.timeEnd('Scanning duration')

if (match.length) {
  if (match.length == 1) {
    console.log(`\n[error] There is ${match.length} variable that is not present in .env\n`)
  } else {
    console.log(`\n[error] There are ${match.length} variables that is not present in .env\n`)
  }
  match.map((v) => {
    console.log(`- ${v}`)
  })
  console.log('')
  throw new Error('Missing variables')
} else {
  console.log("\n[success] All variables are present ")
}

