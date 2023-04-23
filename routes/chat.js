const express = require('express');
const { readFile } = require('node:fs/promises');
const { OpenAIApi, Configuration } = require('openai');
const path = require('path');
const dayjs = require('dayjs');
const _ = require('lodash');
const router = express.Router();
const { log, logMessage, messageHistoryDirStr } = require('../utils.js');

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);

let messageList = [];

router.post('/chat', async (req, res) => {
  const { message, ...config } = req.body;
  log(message.role, ' post:', message.content);
  logMessage(message);
  messageList.push(message);
  if (message.content === '忘掉前边所有对话。') {
    messageList = [message];
  }

  let sendMsgList = messageList;
  if (messageList.length > 16) {
    sendMsgList = _.takeRight(sendMsgList, 16);
  }
  try {
    const openaiRes = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: sendMsgList,
      ...config,
    });
    if (openaiRes.data.error) {
      res.end(JSON.stringify(openaiRes.data));
    }

    messageList.push(openaiRes.data.choices[0].message);
    logMessage(openaiRes.data.choices[0].message);
    log(openaiRes.data.choices[0].message.role, ':', openaiRes.data.choices[0].message.content);
    res.end(JSON.stringify(openaiRes.data));
  } catch (e) {
    log('system', '请求openai出错:', message.content);
    res.end({
      error: true,
      errorMsg: '请求openai出错',
    });
  }
});

router.get('/history', async (req, res) => {
  const today = dayjs().format('YYYY-MM-DD');
  try {
    const list = await readFile(path.join(__dirname, `../${messageHistoryDirStr}/${today}.txt`));
    res.end(list);
  } catch (e) {
    console.log(2222, e);
    res.end([]);
  }
});

// router.get('/chat', async (req, res) => {
//   const { input } = req.query;
//   console.log('get输入:', input);
//   log('user:', input);
//   try {
//     const openaiRes = await openai.createChatCompletion({
//       model: 'gpt-3.5-turbo',
//       messages: [{ role: 'user', content: input }],
//     });
//     log(openaiRes.data.choices[0].message.role, ':', openaiRes.data.choices[0].message.content);
//     res.end(JSON.stringify(openaiRes.data));
//     return;
//   } catch (e) {
//     console.log('请求openai出错', e);
//     res.end({
//       error: true,
//       errorMsg: '请求openai出错',
//     });
//   }
// });

module.exports = router;
