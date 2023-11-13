const { readFile, writeFile } = require('node:fs/promises');
const { writeFile: writeFileFs, existsSync } = require('fs');
const _ = require('lodash');
const dayjs = require('dayjs');

const messageHistoryDirStr = 'message-history';
const imageHistoryDirStr = 'image-history';

const log = async (...text) => {
  const today = dayjs.utc().add(8, 'hours').format('YYYY-MM-DD');
  try {
    const contents = await readFile(`./log/${today}.txt`, { encoding: 'utf8' });
    await writeFile(
      `./log/${today}.txt`,
      `${dayjs.utc().add(8, 'hours').format('HH:mm:ss')} ${contents}\n${text.join(' ')}`,
    );
  } catch (err) {
    writeFile(
      `./log/${today}.txt`,
      `${dayjs.utc().add(8, 'hours').format('HH:mm:ss')} ${text.join(' ')}`,
    );
    console.error(err.message);
  }
};

// 更新正在返回中的message
const updateMessage = async (uid, message, dir) => {
  if (existsSync(`./${dir || messageHistoryDirStr}/${uid}.json`)) {
    // 文件存在
    const contents = await readFile(`./${dir || messageHistoryDirStr}/${uid}.json`, {
      encoding: 'utf8',
    });
    let list = JSON.parse(contents || '[]');
    // 判断最后一条消息
    const lastMessage = list[list.length - 1];
    if (lastMessage.role === ROLEMAP.ASSISTANT) {
      lastMessage.content = message.content;
    } else {
      list.push({ ...message, time: dayjs.utc().add(8, 'hours').format('YYYY-MM-DD HH:mm:ss') });
    }

    list = _.takeRight(list, 500);

    await writeFile(`./${dir || messageHistoryDirStr}/${uid}.json`, JSON.stringify(list), {
      encoding: 'utf8',
    });
  } else {
    // 文件不存在
    await writeFile(
      `./${dir || messageHistoryDirStr}/${uid}.json`,
      JSON.stringify([
        { ...message, time: dayjs.utc().add(8, 'hours').format('YYYY-MM-DD HH:mm:ss') },
      ]),
      {
        encoding: 'utf8',
      },
    );
  }
};

const logMessage = async (uid, message, dir) => {
  console.log(uid, message, dir);
  if (existsSync(`./${dir || messageHistoryDirStr}/${uid}.json`)) {
    // 文件存在
    const contents = await readFile(`./${dir || messageHistoryDirStr}/${uid}.json`, {
      encoding: 'utf8',
    });
    let list = JSON.parse(contents || '[]');
    list.push({ ...message, time: dayjs.utc().add(8, 'hours').format('YYYY-MM-DD HH:mm:ss') });

    list = _.takeRight(list, 500);

    await writeFile(`./${dir || messageHistoryDirStr}/${uid}.json`, JSON.stringify(list), {
      encoding: 'utf8',
    });
  } else {
    // 文件不存在
    await writeFile(
      `./${dir || messageHistoryDirStr}/${uid}.json`,
      JSON.stringify([
        { ...message, time: dayjs.utc().add(8, 'hours').format('YYYY-MM-DD HH:mm:ss') },
      ]),
      {
        encoding: 'utf8',
      },
    );
  }
};

const ROLEMAP = {
  USER: 'user',
  ASSISTANT: 'assistant',
};

module.exports = {
  log,
  logMessage,
  updateMessage,
  messageHistoryDirStr,
  imageHistoryDirStr,
  ROLEMAP,
};
