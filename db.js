require('dotenv').config()
const {MongoClient} = require('mongodb')

const url = process.env.MONGODB_URL || 'mongodb://localhost:27017'
const client = new MongoClient(url)

let games
let counters

const noMongoId = {projection: {_id: 0}}

const startingGames = [
    {name: "Witcher 3", price: 29.99},
    {name: "Cyberpunk 2077", price: 59.99},
    {name: "Minecraft", price: 26.99},
    {name: "Counter-Strike: Global Offensive", price: 0},
    {name: "Roblox", price: 0},
    {name: "Grand Theft Auto V", price: 29.99},
    {name: "Valorant", price: 0},
    {name: "Forza Horizon 5", price: 59.99}
]

async function connect() {
    await client.connect()
    const database = client.db('gamesdb')
    games = database.collection('games')
    counters = database.collection('counters')
    await games.createIndex({name: 1}, {unique: true, collation: {locale: 'en', strength: 2}})

    if (await games.countDocuments() === 0) {
        for (const game of startingGames) {
            await addGame(game.name, game.price)
        }
    }
}

async function getNextId() {
    const counter = await counters.findOneAndUpdate(
        {_id: 'games'},
        {$inc: {seq: 1}},
        {upsert: true, returnDocument: 'after'}
    )
    return counter.seq
}

async function getGames() {
    return await games.find({}, noMongoId).sort({id: 1}).toArray()
}

async function getGame(id) {
    return await games.findOne({id: Number(id)}, noMongoId)
}

async function addGame(name, price) {
    const game = {id: await getNextId(), name, price}
    await games.insertOne({...game})
    return game
}

async function updateGame(id, name, price) {
    return await games.findOneAndUpdate(
        {id: Number(id)},
        {$set: {name, price}},
        {returnDocument: 'after', ...noMongoId}
    )
}

async function deleteGame(id) {
    const result = await games.deleteOne({id: Number(id)})
    return result.deletedCount > 0
}

module.exports = {connect, getGames, getGame, addGame, deleteGame, updateGame}