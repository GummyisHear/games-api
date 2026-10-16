const express = require('express');
const cors = require('cors')
const app = express()
const port = 8080
const swaggerUi = require('swagger-ui-express')
const yamljs = require('yamljs')
const swaggerDocument = yamljs.load('./docs/swagger.yaml')
const db = require('./db')

app.use(cors())
app.use(express.json())

app.get('/games', async (req, res) => {
    res.send(await db.getGames())
})

app.get('/games/:id', async (req, res) => {
    const game = await db.getGame(req.params.id)
    if (!game) {
        return res.status(404).send({error: 'Game not found'})
    }
    res.send(game)
})

app.post('/games', async (req, res) => {
    if (!req.body.name || req.body.price === undefined) {
        return res.status(400).send({error: 'One or all params are missing'})
    }

    const game = await db.addGame(req.body.name, req.body.price)

    res.status(201)
        .location(`${getBaseUrl(req)}/games/${game.id}`)
        .send(game)
})

app.put('/games/:id', async (req, res) => {
    if (!req.body.name || req.body.price === undefined) {
        return res.status(400).send({error: 'One or all params are missing'})
    }

    const game = await db.updateGame(req.params.id, req.body.name, req.body.price)
    if (!game) {
        return res.status(404).send({error: 'Game not found'})
    }
    res.send(game)
})

app.delete('/games/:id', async (req, res) => {
    if (!await db.deleteGame(req.params.id)) {
        return res.status(404).send({error: 'Game not found'})
    }
    res.status(204).send()
})

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

db.connect().then(() => {
    app.listen(port, () => {
        console.log(`API up at: http://localhost:${port}`)
    })
}).catch(err => {
    console.error('Could not connect to MongoDB:', err.message)
    process.exit(1)
})

function getBaseUrl(req) {
    return req.connection && req.connection.encrypted
        ? `https://${req.headers.host}`
        : `http://${req.headers.host}`
}