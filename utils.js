const { readFile, writeFile } = require('node:fs/promises');
const { writeFile: writeFileFs } = require('fs');
const _ = require('lodash');
const dayjs = require('dayjs');

const messageHistoryDirStr = 'message-history';

const log = async (...text) => {
  const today = dayjs().format('YYYY-MM-DD');
  try {
    const contents = await readFile(`./log/${today}.txt`, { encoding: 'utf8' });
    await writeFile(
      `./log/${today}.txt`,
      `${dayjs().format('HH:mm:ss')} ${contents}\n${text.join(' ')}`,
    );
  } catch (err) {
    writeFile(`./log/${today}.txt`, `${dayjs().format('HH:mm:ss')} ${text.join(' ')}`);
    console.error(err.message);
  }
};

const logMessage = async (uid, message) => {
  try {
    const contents = await readFile(`./${messageHistoryDirStr}/${uid}.txt`, { encoding: 'utf8' });
    console.log(111111111, contents)
    let list = JSON.parse(contents || '[]');
    list.push(message);
    list = _.takeRight(list, 40);

    await writeFile(`./${messageHistoryDirStr}/${uid}.txt`, JSON.stringify(list), {
      encoding: 'utf8',
    });
  } catch (err) {
    console.log(22222, JSON.stringify([message]))
    const res = await writeFile(`./${messageHistoryDirStr}/${uid}.txt`, JSON.stringify([message]), {
      encoding: 'utf8',
    });
    console.log(33333333, res);
  }
};

module.exports = { log, logMessage, messageHistoryDirStr };
