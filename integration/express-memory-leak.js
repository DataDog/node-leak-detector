let hung = 0;
const memoryLeak = new Set();
const express = require('express');
const app = express();

app.get('/', function (req, res) {
  if (Math.random() < 0.01) { // 1% chance of leaking memory
    // console.log('DID LEAK');
    memoryLeak.add(req);
  } else {
    // console.log('DID NOT LEAK');
  }

  if (Math.random() < 0.001) { // 0.1% chance of request hanging
    // console.log('HUNG REQUEST');
    hung++;
    return;
  }

  res.send('hello world');
});

app.get('/gc', function (req, res) {
  gc();
  res.send('gc');
});

app.listen(3000);
setInterval(() => {
  console.log({hung, leaks: memoryLeak.size});
}, 5_000).unref();