const express = require('express');
const { readFile } = require('node:fs/promises');
const { OpenAIApi, Configuration } = require('openai');
const path = require('path');
const dayjs = require('dayjs');
const uuid = require('uuid').v4;
const _ = require('lodash');
const router = express.Router();
const { log, logMessage, messageHistoryDirStr } = require('../utils.js');

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);

// let messageList = [];

router.post('/chat', async (req, res) => {
  const { message, messageUid, ...config } = req.body;
  let uid = messageUid || uuid();

  await logMessage(uid, message);
  console.log('ahhahhahhhahahahahh');
  let listJson = '[]';
  try {
    listJson = await readFile(path.join(__dirname, `../${messageHistoryDirStr}/${uid}.txt`));
  } catch (e) {
    console.log('listJson', e);
  }

  let listArr = JSON.parse(listJson);

  try {
    const openaiRes = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: listArr,
      ...config,
    });
    console.log(openaiRes.data);

    if (openaiRes.data.error) {
      res.end(JSON.stringify(openaiRes.data));
    }

    await logMessage(uid, openaiRes.data.choices[0].message);

    res.end(JSON.stringify({ ...openaiRes.data, messageUid: uid }));
  } catch (e) {
    log('system', '请求openai出错:', message.content);
    console.log(e);
    res.end(JSON.stringify({
      error: true,
      errorMsg: '请求openai出错',
    }));
  }
});

router.get('/history', async (req, res) => {
  const { messageUid } = req.query;
  try {
    if (messageUid) {
      const list = await readFile(
        path.join(__dirname, `../${messageHistoryDirStr}/${messageUid}.txt`),
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
