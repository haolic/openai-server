const express = require('express');
const uuid = require('uuid').v4;
const router = express.Router();
const { log, logMessage, imageHistoryDirStr } = require('../utils.js');

const { openai } = require('../app.js');

router.post('/image', async (req, res) => {
  const { messageuid } = req.headers;
  let uid = messageuid || uuid();

  const { message } = req.body;
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

  try {
    const openaiRes = await openai.createImage(
      {
        /**
         * A text description of the desired image(s). The maximum length is 1000 characters.
         * @type {string}
         * @memberof CreateImageRequest
         */
        prompt: message,
        /**
         * The number of images to generate. Must be between 1 and 10.
         * @type {number}
         * @memberof CreateImageRequest
         */
        n: 2,
        /**
         * The size of the generated images. Must be one of `256x256`, `512x512`, or `1024x1024`.
         * @type {string}
         * @memberof CreateImageRequest
         */
        size: '1024x1024',
        /**
         * The format in which the generated images are returned. Must be one of `url` or `b64_json`.
         * @type {string}
         * @memberof CreateImageRequest
         */
        response_format: 'b64_json',
      },
    );
    // console.log(JSON.stringify(openaiRes.data));
    res.end(JSON.stringify({data: response.data.data}));

  } catch (e) {
    log('system-image', '请求openai出错:', message.content);
    console.log(e.toJSON());
    res.end(
      JSON.stringify({
        error: true,
        errorMsg: '请求openai出错',
        errorContent: '请求openai出错',
      }),
    )
  }
});

module.exports = router;
