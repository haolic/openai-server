const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { messageHistoryDirStr } = require('../utils.js');
const dayjs = require('dayjs');

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

      res.end(
        JSON.stringify(
          allHistory.sort((a, b) => {
            // 根据a,b中的最后一条消息的time排序
            const { content: contentA } = a;
            const { content: contentB } = b;

            const lasta = contentA[contentA.length - 1];
            const lastb = contentB[contentB.length - 1];

            return dayjs(lasta.time).isBefore(dayjs(lastb.time)) ? 1 : -1;
          }),
        ),
      );
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

router.post('/delete-history', async (req, res) => {
  try {
    const { uid } = req.body;
    // 根据uid删除历史纪录
    const directoryPath = path.join(__dirname, `../${messageHistoryDirStr}`);
    const filePath = path.join(directoryPath, `${uid}.json`);
    fs.unlinkSync(filePath);

    res.end(
      JSON.stringify({
        error: false,
        errorMsg: '删除成功',
        errorContent: '删除成功',
      }),
    );
  } catch (e) {
    console.log(e);
    res.end(JSON.stringify({
      error: true,
      errorMsg: '删除失败',
      errorContent: '删除失败',
    }));
  }
});

module.exports = router;
