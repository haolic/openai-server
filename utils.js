import { readFile, writeFile } from 'node:fs/promises'
import moment from 'moment';

export const log = async (...text) => {
  const today = moment().format('YYYY-MM-DD');
  try {
    const contents = await readFile(`./log/${today}.txt`, { encoding: 'utf8' });
    await writeFile(`./log/${today}.txt`, `${moment().format('HH:mm:ss')} ${contents}\n${text.join(' ')}`);
  } catch (err) {
    writeFile(`./log/${today}.txt`, `${moment().format('HH:mm:ss')} ${text.join(' ')}`);
    console.error(err.message);
  }
}
