const express = require('express');
const { readFile } = require('node:fs/promises');
const { OpenAIApi, Configuration } = require('openai');
const path = require('path');
const uuid = require('uuid').v4;
const _ = require('lodash');
const router = express.Router();
const { log, logMessage, messageHistoryDirStr } = require('../utils.js');
const models = require('../constants.js');

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
        model: models['GPT3.5-16k'],
        messages: _.takeRight(listArr, 20),
        stream: true,
        ...config,
      },
      { responseType: 'stream' },
    );
      
    const response = openaiRes.data;
    
    let role = '';
    let content = '';
    // 设置响应的 Content-Type 为 text/event-stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('messageuid', uid);

    response.on('data', (data) => {
      try {
        data
          .toString()
          .split('data: ')
          .filter((item) => {
            const str = item.trim();
            return str !== '[DONE]' && str !== '';
          })
          .forEach((item) => {
            const delta = JSON.parse(item.trim())?.choices[0]?.delta;
            const text = delta?.content || '';
            role = role || delta?.role || 'assistant';
            content += text;
            res.write(text);
            res.flushHeaders();
          });
      } catch (err) {
        log('system', '请求openai出错:', dataStr.toString());
        console.log('err', dataStr.toString());
        res.end(dataStr.toString());
      }
    });

    response.on('end', () => {
      logMessage(uid, { role, content });
      res.end('');
    });
  } catch (e) {
    log('system', '请求openai出错:', message.content);
    console.log(e.toJSON());
    res.end('请求openai出错');
  }
});

router.get('/history', async (req, res) => {
  const { messageuid } = req.query;
  try {
    if (messageuid) {
      const list = await readFile(
        path.join(__dirname, `../${messageHistoryDirStr}/${messageuid}.json`),
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
