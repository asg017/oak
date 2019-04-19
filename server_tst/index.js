const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = 3000

app.get('/', (req, res) =>{
    res.send('hello');
});

app.post('/update', (req, res)=>{
  console.log('updated endpoint hit')

  io.emit('update', 'spooky')

  res.send('updated')
})

io.on('connection', socket => {
  console.log('connection!')
  socket.on('disconnect', socket=>{
    console.log('disconnected!')
  })
});


server.listen(port, ()=>console.log(`socket.io update server listening on ${port}!`));
