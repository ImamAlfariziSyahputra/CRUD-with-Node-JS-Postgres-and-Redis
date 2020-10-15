const express = require('express')
const pool = require('./db')
const fetch = require('node-fetch')
const redis = require('redis')

const PORT = process.env.PORT || 3000
const REDIS_PORT = process.env.PORT || 6379

const client = redis.createClient(REDIS_PORT)

const app = express()

app.use(express.json())

// Set Response
function setResponse(username, repos) {
    return `<h2>${username} has ${repos} Github Repos</h2>`
}

// Make request to Github for data
async function getRepos(req,res,next){
    try {
        console.log('Fetching data...')

        const {username} = req.params

        const response = await fetch(`https://api.github.com/users/${username}`)

        // console.log(response)
        const data = await response.json()

        const repos =  data.public_repos

        // Set Data to redis
        client.setex(username, 3600, repos)

        res.send(setResponse(username, repos))
    } catch (err) {
        console.error(err)
        res.status(500) //server error
    }
}

// Cache Middleware
function cache(req, res, next){
    const {username} = req.params

    client.get(username, (err, data) => {
        if(err) throw err;

        if(data !== null){
            res.send(setResponse(username, data))
        }else {
            next()
        }
    })
}
// TES -----------------------------

// GET
async function getEmploy(req,res,next){
    try {
        console.log('Fetching data...')

        const {id} = req.params

        const response = await pool.query('SELECT * FROM employ WHERE id = $1',[id])

        console.log(response)

        const data = await response.json()

        const name =  data.name

        // Set Data to redis
        client.setex(id, 3600, name)

        res.send(data)
    } catch (err) {
        console.error(err)
        res.status(500) //server error
    }
}

// async function oneEmploy(req,res,next){
//     const {id} = req.params
//     try {
//         const employ = await pool.query('SELECT * FROM employ WHERE id = $1',[id])

//         res.json(employ.rows[0])
//     } catch (err) {
//         console.error(err.message)
//     }
// }

function cache(req, res, next){
    const {id} = req.params

    client.get(id, (err, data) => {
        if(err) throw err;

        if(data !== null){
            res.send(id, data)
        }else {
            next()
        }
    })
}

// Tambah Data
// app.post('/employs', async(req,res) => {
//     try {
//         const {name} = req.body

//         const newEmploy = await pool.query(
//             "INSERT INTO employ (name) VALUES ($1) RETURNING *",
//             [name]
//         )

//         res.json(newEmploy.rows[0])
//     } catch(err) {
//         console.error(err.message)
//     }
// })

app.get('/employs/:id', cache, getEmploy)
app.get('/repos/:username', cache, getRepos)

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
})