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

  let listJson = '[]';
  try {
    listJson = await readFile(path.join(__dirname, `../${messageHistoryDirStr}/${uid}.txt`));
  } catch (e) {
    console.log(e);
  }

  let listArr = JSON.parse(listJson);

  try {
    const openaiRes = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: listArr,
      ...config,
    });
    // const openaiRes = {
    //   data: {
    //     id: 'chatcmpl-78SGbQJb0vJoNqwKXqSC6lB4eyGq9',
    //     object: 'chat.completion',
    //     created: 1682249637,
    //     model: 'gpt-3.5-turbo-0301',
    //     usage: { prompt_tokens: 2007, completion_tokens: 586, total_tokens: 2593 },
    //     choices: [
    //       {
    //         message: {
    //           role: 'assistant',
    //           content:
    //             "抱歉，我理解有误。如果 ChatGPT 返回的代码的语言不确定，我们可以根据返回的代码字符串中非常规的 `Markdown` 语法来解析出代码块中指定的语言。\n\n下面是一个示例，演示如何使用 `react-syntax-highlighter` 库和一些自定义代码来解析语言标记（标记要放在代码块的指定语言后面）：\n\n```jsx\nimport React from 'react';\nimport SyntaxHighlighter from 'react-syntax-highlighter';\nimport {atomOneDark} from 'react-syntax-highlighter/dist/cjs/styles/hljs';\n\nclass CodeBlock extends React.Component {\n  // 解析语言标记，并将代码块的语言设置为对应的值\n  // 如果解析出错，则默认使用 JavaScript\n  getLanguage = () => {\n    const {content} = this.props;\n    if (typeof content !== 'string' && !content.startsWith('```')) {\n      return 'javascript';\n    }\n    const firstLine = content.split('\\n')[0].trim();\n    const match = firstLine.match(/^```(\\w+)/);\n    return match ? match[1] : 'javascript';\n  }\n\n  render() {\n    const language = this.getLanguage();\n    const {content} = this.props;\n    return (\n      <SyntaxHighlighter language={language} style={atomOneDark}>\n        {content}\n      </SyntaxHighlighter>\n    );\n  }\n}\n```\n\n在上述示例中，我们通过提取字符串中的第一行，并利用一个正则表达式来识别语言标记来解析代码的语言。如果语言标记不能被解析，则默认使用 JavaScript。你可以根据自己的需要编写自己的解析逻辑。",
    //         },
    //         finish_reason: 'stop',
    //         index: 0,
    //       },
    //     ],
    //   },
    // };

    if (openaiRes.data.error) {
      res.end(JSON.stringify(openaiRes.data));
    }

    await logMessage(uid, openaiRes.data.choices[0].message);

    res.end(JSON.stringify({ ...openaiRes.data, messageUid: uid }));
  } catch (e) {
    log('system', '请求openai出错:', message.content);
    res.end({
      error: true,
      errorMsg: '请求openai出错',
    });
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
