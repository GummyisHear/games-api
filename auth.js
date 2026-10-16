require('dotenv').config()
const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('./db')

const JWT_SECRET = process.env.JWT_SECRET

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) return res.status(401).send({error: 'Access token required'})

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send({error: 'Invalid or expired token'})
        req.user = user
        next()
    })
}

function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).send({error: 'Admin privileges required'})
    }
    next()
}

router.post('/register', async (req, res) => {
    const {username, password} = req.body
    if (!username || !password) {
        return res.status(400).send({error: 'Username and password are required'})
    }

    try {
        await db.createUser(username, password, 'user')
        res.status(201).send({message: 'User registered successfully'})
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).send({error: 'Username already taken'})
        }
        res.status(500).send({error: 'Internal server error'})
    }
})

router.post('/login', async (req, res) => {
    const {username, password} = req.body
    const user = await db.getUserByUsername(username)
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send({error: 'Invalid username or password'})
    }

    const token = jwt.sign({username: user.username, role: user.role}, JWT_SECRET, {expiresIn: '8h'})
    res.send({token, role: user.role, username: user.username})
})

module.exports = {router, authenticateToken, requireAdmin}