const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const { OpenAIApi, Configuration } = require('openai');

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);
module.exports = { openai };

const allHistory = require('./routes/all-history.js');
const chatRouter = require('./routes/chat.js');
const imageRouter = require('./routes/image.js');

const app = express();

app.engine('html', ejs.__express);
app.set('view engine', 'html');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

// 临时解决跨域
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://xxx.cainiao.test:5173');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Content-Type', 'application/json;charset=utf-8');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  next();
});

app.use('/api', chatRouter);
app.use('/api', allHistory);
app.use('/api', imageRouter);

app.use((req, res) => {
  if (!req.url.startsWith('/api')) {
    res.type('html');
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
