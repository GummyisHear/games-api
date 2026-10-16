const Database = require('better-sqlite3')
const db = new Database('games.db')

db.exec(`
    CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL
    )
`)

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

if (db.prepare('SELECT COUNT(*) AS count FROM games').get().count === 0) {
    const insert = db.prepare('INSERT INTO games (name, price) VALUES (?, ?)')
    for (const game of startingGames) {
        insert.run(game.name, game.price)
    }
}

function getGames() {
    return db.prepare('SELECT * FROM games').all()
}

function getGame(id) {
    return db.prepare('SELECT * FROM games WHERE id = ?').get(id)
}

function addGame(name, price) {
    const info = db.prepare('INSERT INTO games (name, price) VALUES (?, ?)').run(name, price)
    return {id: info.lastInsertRowid, name, price}
}

function deleteGame(id) {
    const info = db.prepare('DELETE FROM games WHERE id = ?').run(id)
    return info.changes > 0
}

module.exports = {getGames, getGame, addGame, deleteGame}