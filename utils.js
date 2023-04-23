const { readFile, writeFile } = require('node:fs/promises');
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

    let list = JSON.parse(contents || '[]');
    list.push(message);
    list = _.takeRight(list, 40);

    await writeFile(`./${messageHistoryDirStr}/${uid}.txt`, JSON.stringify(list), {
      encoding: 'utf8',
    });
  } catch (err) {
    console.log('logMessage', err);
    console.log('logMessage----', JSON.stringify([message]));
    await writeFile(`./${messageHistoryDirStr}/${uid}.txt`, JSON.stringify([message]), {
      encoding: 'utf8',
    });
  }
};

module.exports = { log, logMessage, messageHistoryDirStr };
