$(document).ready(main);

/**
 * URL param parser
 * @param name
 * @returns {string|false}
 */
function urlParam(name) {
  let results = new RegExp('[\?&]' + name + '=([^&#]*)')
    .exec(window.location.search);

  return (results !== null) ? results[1] || 0 : false;
}

function makeUrl() {
  return Array.prototype.join.call(arguments, '/').replace(/\/\/+/g, '/').trim();
}

function main() {
  const cfg = urlParam('cfg') || 'file-list.json';
  const base = urlParam('base') || 'out';

  $.get({
    dataType: 'json',
    url: base + '/' + cfg,
    success: (data, status) => {
      const files = data.files.map(f => makeUrl(base, f));

      getData(makeUrl(base, data.aggregateFile), 'Aggregate Data');
    },
  });
}

function getData(url, dataSetName) {
  $.get({
    dataType: 'json',
    url,
    success: (data, status) => {
      buildDataDisplay(data, dataSetName);
    }
  })
}

function buildDataDisplay(data, name) {
  const b = $('body');
  const title = $('<h2>').text(name + ` (${data.numWords} words)`);
  const subtitle = $('<h3>').text(`${data.numWords} words (${data.uniqueWords} unique)`);
  const table = $('<table>');
  b.append(title);
  b.append(subtitle);
  b.append(table);

  const counts = data.wordCounts;
  const words = [];



  for(const word in counts) {
    if (counts.hasOwnProperty(word)) {
      words.push({
        word,
        count: counts[word],
      });
    }
  }
  words.sort((a, b) => b.count - a.count);

  words.forEach((w, i) => {
    const row = $('<tr>');
    table.append(row);
    addCell(row, i + 1 + '.');
    addCell(row, w.word);
    addCell(row, w.count);
    addCell(row, (w.count / data.numWords * 100).toPrecision(2) + '%');
  });
}

function addCell(row, content) {
  row.append($('<td>').text(content));
}