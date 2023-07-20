const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const ejs = require('ejs');

const allHistory = require('./routes/all-history.js');
const chatRouter = require('./routes/chat.js');

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

app.use((req, res) => {
  if (!req.url.startsWith('/api')) {
    res.type('html');
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
