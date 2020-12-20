const express = require("express")
const app = express()
const http = require('http').createServer(app)
const PORT = 5000

const io = require("socket.io")(http)
const fs = require('fs')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const handlebars = require('express-handlebars')

const adapter = new FileSync('db.json')
const db = low(adapter)

const SOCKET_MESSAGE = 'chat message'

db
    .defaults({ messages: [] })
    .write()

app.set('view engine', 'handlebars')
app.engine('handlebars', handlebars({
    layoutsDir: `${__dirname}/views/layouts`
}))

app.use(express.static('public'))

app.get('/', (req, res) => {
    db.get('messages').write()
    res.render('main', {
        layout: 'index'
    })
})

app.get('/messages', async (req, res) => {
    const messages = await fs.readFileSync(`${__dirname}/db.json`)
    if (messages.length !== 0) {
        const messagesJSON = JSON.parse(messages)
        res.json(messagesJSON)
    } else {
        res.json({})
    }
})

io.on('connection', (socket) => {
    socket.on(SOCKET_MESSAGE, message => {
        const {
            message: msg,
            author
        } = message
        const dateTime = new Date().toLocaleString()
        console.log(`[${dateTime}] ${SOCKET_MESSAGE}: ${msg}, by ${author}`)
        const messageObject = { dateTime, ...message }
        db.get('messages')
            .push(messageObject)
            .write()
        io.emit(SOCKET_MESSAGE, messageObject)
    })
})

http.listen(PORT, () => {
  console.log(`listening on *:${PORT}`)
})
