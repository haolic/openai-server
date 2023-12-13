const express = require('express');
const { readFile } = require('node:fs/promises');
const path = require('path');
const uuid = require('uuid').v4;
const _ = require('lodash');
const router = express.Router();
const { log, updateMessage, logMessage, messageHistoryDirStr, ROLEMAP } = require('../utils.js');
const models = require('../constants.js');
const { openai } = require('../app.js');
const dayjs = require('dayjs');

router.post('/chat-string', async (req, res) => {
  const { messageuid } = req.headers;
  let uid = messageuid || `${dayjs.utc().add(8, 'hours').format('YYYYMMDDHHmmss')}__${uuid()}`;

  const { message, ...config } = req.body;
  console.log('接收', message, process.env.OPENAI_API_KEY);
  if (message.content?.length > 7000) {
    res.end(
      JSON.stringify({
        error: true,
        errorMsg: '发送字数不能超7000。',
        errorContent: '发送字数不能超7000',
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
        model: models.GPT4,
        messages: _.takeRight(
          listArr.map((el) => {
            const { time, ...rest } = el;
            return rest;
          }),
          12,
        ),
        stream: true,
        ...config,
      },
      { responseType: 'stream' },
    );

    let content = '';
    // 设置响应的 Content-Type 为 text/event-stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.setHeader('messageuid', uid);
    openaiRes.data.on('data', (chunk) => {
      const lines = chunk
        .toString()
        .split('\n')
        .filter((line) => line.trim() !== '');
      for (const line of lines) {
        const message = line.replace(/^data: /, '');
        if (message === '[DONE]') {
          res.end('data: [DONE]\n\n');
          updateMessage(uid, { role: ROLEMAP.ASSISTANT, content });
          return; // Stream finished
        }
        try {
          const parsed = JSON.parse(message);
          const text = parsed.choices[0].delta.content || '';
          content += text;
          res.write(`data: ${JSON.stringify({ data: text })}\n\n`); // Send SSE message to the browser client
        } catch (error) {
          log('Could not JSON parse stream message');
          console.log('Could not JSON parse stream message', message, error);
        }
      }
    });

    openaiRes.data.on('end', () => {
      res.write('event: end');
      res.end();
    });

    // 前端关闭连接
    req.on('close', () => {
      console.log('前端关闭连接', message.content);
      log('system', '前端关闭连接', message.content);
      openaiRes.data.destroy();
    });
  } catch (e) {
    log('system', '请求openai出错:', message.content);
    console.log(e);
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
