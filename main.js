const Curl = require('node-libcurl').Curl;
const cheerio = require('cheerio');
const clArgs = require('command-line-args');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const rimraf = require('rimraf');

const clOptsDefs = [
  {name: 'config', alias: 'c', type: String},
  {name: 'overwrite', alias: 'o', type: Boolean},
];
let options;

try {
  options = clArgs(clOptsDefs);
}
catch (e) {
  const list = clOptsDefs.map(el => `\r\n- ${el.name}`).join('');
  throw new Error('Bad command line option passed when setting base ref.'
    + ' Possible options are:' + list);
}

const data = fs.readFileSync(
  path.join(__dirname, options.config || 'config.json'),
  {encoding: 'utf-8'}
);
const cfg = JSON.parse(data);
const items = cfg.items;
const certFile = path.join(__dirname, 'cacert.pem');
const numItems = items.length;
let numErrors = 0;
let numItemsCompleted = 0;
let outputDirReady = false;
let aggregate = {
  numWords: 0,
  wordCounts: {},
  uniqueWords: 0,
};

// Clear the base directory if it already exists, unless --overwrite isn't set
// Then (or otherwise) create the new fresh base directory
const baseDir = path.join(__dirname, (cfg.output && cfg.output.baseDir) || 'out');
if (fs.existsSync(baseDir)) {
  if (!options.overwrite) {
    throw new Error("Can't complete operation - target output directory already exists. Aborting. To overwrite target output directory, set the --overwrite or -o flag.");
  }
  rimraf(baseDir, {}, prepareBaseDir);
}
else {
  prepareBaseDir();
}


// Kick off all requests to get remote files via curl
items.forEach(i => {
  const req = new Curl();  

  req.setOpt('URL', i.url);
  req.setOpt('FOLLOWLOCATION', true);
  req.setOpt(Curl.option.CAINFO, certFile);
  req.on('end', (status, body) => {
    console.log('COMPLETE');
    onCurlComplete(i, status, body);
  });
  req.on('error', () => {
    console.log('ERROR');
    
    numItemsCompleted++;
    numErrors++;
    onParseComplete();
  });
  req.perform();
});

// Parse a curl request
function onCurlComplete(item, status, body) {
  console.log('COMPLETED');
  
  const $ = cheerio.load(body);

  item._parsed = {
    contexts: [],
    fullString: '',
    numWords: 0,
    wordCounts: {},
    filename: (item.name.replace(/[\s-]+/g, '-') + '.json').toLowerCase()
  };

  item.contexts.forEach(c => {
    const str = parsePageContext(c, $);

    item._parsed.contexts.push(str);
    item._parsed.fullString = item._parsed.fullString + str;
  });

  const words = item._parsed.fullString.split(' ');
  const wc = {};
  let uniqueWords = 0;

  item._parsed.numWords = words.length;
  words.forEach(w => {
    w = w.toLowerCase();
    const awc = aggregate.wordCounts;
    if (!wc[w]) {
      uniqueWords++;
    }
    wc[w] = wc[w] ? wc[w] + 1 : 1;
    awc[w] = awc[w] ? awc[w] + 1 : 1;
  });
  item._parsed.wordCounts = wc;
  item._parsed.uniqueWords = uniqueWords;

  aggregate.numWords += item._parsed.numWords;
  aggregate.uniqueWords += item._parsed.uniqueWords;

  numItemsCompleted++;
  onParseComplete();
}

/**
 * Parse a portion of a page
 * @param context
 */
function parsePageContext(context, $) {
  const parent = $(context.parent || 'body');
  parent.find((context.exclude || []).join(',')).remove();

  return parent.text().toLowerCase().replace(/[^a-z\u00E0-\u00FC0-9]+/g, ' ');
}

/**
 * Create the base directory for data output
 */
function prepareBaseDir() {
  mkdirp(baseDir, () => {
    outputDirReady = true;
    onParseComplete();
  });
}

/**
 * Once parsing is complete, check all flags to make sure we can create data
 * files and that all items have been completed. Then continue
 */
function onParseComplete() {
  if (!outputDirReady || numItems !== numItemsCompleted) {
    return;
  }
  if (numErrors) {
    console.warn(`There were errors when parsing ${numErrors} items. Continuing.`);
  }

  buildDataFiles();
}

/**
 * Builds all data files to be consumed by any consumer
 */
function buildDataFiles() {
  const items = cfg.items;
  const aggregateFilename = 'aggregate.json';
  const fileList = {
    aggregateFile: aggregateFilename,
    files: items.map(i => i._parsed.filename)
  };
  const fileopts = {encoding: 'utf-8'};

  // Create master fileList file
  fs.writeFile(
    path.join(baseDir, 'file-list.json'),
    JSON.stringify(fileList),
    fileopts,
    (err) => {
      if (err) {
        console.error('Error writing fileList file! Aborting...');
        throw err;
      }
      console.log('Successfully create fileList file.');
    }
  );

  // Write the main aggregate data file
  fs.writeFile(
    path.join(baseDir, aggregateFilename),
    JSON.stringify(aggregate),
    fileopts,
    (err) => {
      if (err) {
        console.error(`Error writing aggregate data file! Aborting...`);
        throw err;
      }
      console.log(`Successfully created aggregate data file.`);
    }
  );

  // Write each individual data file
  items.forEach(i => {
    const name = i._parsed.filename;

    fs.writeFile(
      path.join(baseDir, name),
      JSON.stringify(i._parsed),
      fileopts,
      (err) => {
        if (err) {
          console.error(`Error writing a data file (${name})! Aborting...`);
          throw err;
        }
        console.log(`Successfully created ${name}`);
      }
    )
  });
}