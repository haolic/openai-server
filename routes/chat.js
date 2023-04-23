const express = require('express');
const { OpenAIApi, Configuration } = require('openai');
const router = express.Router();
const { log } = require('../utils.js');

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);

router.post('/chat', async (req, res) => {
  const { message, ...config } = req.body;
  log(message.role, ' post:', message.content);
  try {
    const openaiRes = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [message],
      ...config,
    });
    if (openaiRes.data.error) {
      res.end(JSON.stringify(openaiRes.data));
    }
    log(openaiRes.data.choices[0].message.role, ':', openaiRes.data.choices[0].message.content);
    res.end(JSON.stringify(openaiRes.data.choices[0]));
  } catch (e) {
    console.log('请求openai出错');
    log('system', '请求openai出错:', message.content);
    res.end({
      error: true,
      errorMsg: '请求openai出错',
    });
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
//     res.end(JSON.stringify(openaiRes.data.choices[0]));
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
