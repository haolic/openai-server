const { readFile, writeFile } = require('node:fs/promises');
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

const logMessage = async (msgItem) => {
  const today = dayjs().format('YYYY-MM-DD');
  try {
    const contents = await readFile(`./${messageHistoryDirStr}/${today}.txt`, { encoding: 'utf8' });
    const list = JSON.parse(contents);
    list.push(msgItem);

    await writeFile(`./${messageHistoryDirStr}/${today}.txt`, JSON.stringify(list));
  } catch (err) {
    console.log(err);
    writeFile(`./${messageHistoryDirStr}/${today}.txt`, JSON.stringify([]));
  }
};

module.exports = { log, logMessage, messageHistoryDirStr };
