const express = require('express');
const { readFile } = require('node:fs/promises');
const { OpenAIApi, Configuration } = require('openai');
const path = require('path');
const uuid = require('uuid').v4;
const _ = require('lodash');
const router = express.Router();
const { log, logMessage, messageHistoryDirStr } = require('../utils.js');

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);

router.post('/chat', async (req, res) => {
  const { messageuid } = req.headers;
  let uid = messageuid || uuid();

  const { message, ...config } = req.body;
  console.log('接收', message, process.env.OPENAI_API_KEY);
  if (message.content?.length > 700) {
    res.end(
      JSON.stringify({
        error: true,
        errorMsg: '发送字数不能超700。',
        errorContent: '发送字数不能超700',
      }),
    );
    return;
  }

  await logMessage(uid, message);

  let listJson = '[]';
  try {
    listJson = await readFile(path.join(__dirname, `../${messageHistoryDirStr}/${uid}.json`), {
      encoding: 'utf8',
    });
  } catch (e) {
    console.log('listJson', e);
  }

  let listArr = JSON.parse(listJson);
  try {
    const openaiRes = await openai.createChatCompletion(
      {
        model: 'gpt-3.5-turbo',
        messages: _.takeRight(listArr, 15),
        stream: true,
        ...config,
      },
      { responseType: 'stream' },
    );

    let role = '';
    let content = '';
    openaiRes.data.on('data', (dataStr) => {
      try {
        const arr = dataStr.toString().split('\n\n');
        for (let index = 0; index < arr.length; index++) {
          let element = arr[index];
          if (element) {
            if (element === 'data: [DONE]') {
              logMessage(uid, { role, content });
              res.end('');
              return;
            }
            element = element.replace('data: ', '');
            const obj = JSON.parse(_.trim(element));
            const messageContent = _.get(obj, 'choices[0].delta.content');
            const messageRole = _.get(obj, 'choices[0].delta.role');
            if (messageRole) {
              role = messageRole;
              res.set({
                'Content-Type': 'text/event-stream',
                messageUid: uid,
                role,
              });
            }
            if (messageContent) {
              content += messageContent;
              res.write(messageContent);
            }
          }
        }
      } catch (e) {
        log('system', '请求openai出错:', dataStr.toString());
        console.log('err', dataStr.toString());
        res.end(dataStr.toString());
      }
    });
  } catch (e) {
    log('system', '请求openai出错:', message.content);
    console.log(e);
    res.end('请求openai出错');
  }
});

router.get('/history', async (req, res) => {
  const { messageUid } = req.query;
  try {
    if (messageUid) {
      const list = await readFile(
        path.join(__dirname, `../${messageHistoryDirStr}/${messageUid}.json`),
      );
      res.end(list);
    } else {
      res.end('[]');
    }
  } catch (e) {
    console.log(e);
    res.end('[]');
  }
});

module.exports = router;
