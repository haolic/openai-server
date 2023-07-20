const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { messageHistoryDirStr } = require('../utils.js');

router.get('/history-list', async (req, res) => {
  try {
    const directoryPath = path.join(__dirname, `../${messageHistoryDirStr}`);

    fs.readdir(directoryPath, function (err, files) {
      // 处理可能出现的异常
      if (err) {
        console.log('读取文件夹内容失败：', err);
        JSON.stringify({
          error: true,
          errorMsg: '获取列表失败',
          errorContent: '获取列表失败',
        });
        return;
      }

      // 循环遍历文件夹中的每个文件名
      const allHistory = files.reduce((prev, current, idx) => {
        if (!current.endsWith('.txt')) {
          const filePath = path.join(directoryPath, current);
          // 读取文件内容
          const content = fs.readFileSync(filePath, 'utf8');
          const contentObj = JSON.parse(content);
          try {
            prev.push({
              id: current.split('.')[0],
              name: contentObj[0].content,
              content: contentObj,
            });
          } catch (e) {
            console.log(e);
          }
        }
        return prev;
      }, []);
      res.end(JSON.stringify(allHistory));
    });
  } catch (e) {
    console.log(e);
    JSON.stringify({
      error: true,
      errorMsg: '获取列表失败',
      errorContent: '获取列表失败',
    });
  }
});

module.exports = router;
