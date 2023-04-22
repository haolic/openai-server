import express from 'express';
import { OpenAIApi, Configuration } from 'openai';
import bodyParser from 'body-parser';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(config);

const app = express();

app.use(bodyParser.json())

// 解决跨域
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Content-Type', 'application/json;charset=utf-8');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  next();
});

app.get('/api/chat', async (req, res) => {
  const { input } = req.query;
  console.log('输入', input);
  try {
    const openaiRes = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: input }],
    });
    res.end(JSON.stringify(openaiRes.data.choices[0]));
    return;
  } catch (e) {
    console.log('请求openai出错', e);
    res.end({
      error: true,
      errorMsg: '请求openai出错'
    })
  }
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  try {
    const openaiRes = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [message],
    });

    if (openaiRes.data.error) {
      res.end(JSON.stringify(openaiRes.data))
    }
    res.end(JSON.stringify(openaiRes.data.choices[0]));
  } catch (e) {
    console.log('请求openai出错');
    res.end({
      error: true,
      errorMsg: '请求openai出错'
    })
  }
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});