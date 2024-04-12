const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbpath = path.join(__dirname, 'moviesData.db')

let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const convertMovieDbObjectTOResponseObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leaderActor: dbObject.lead_actor,
  }
}

const convertDirectorDbObjectTOResponseObject = dbObject => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  }
}

app.get('/movies/', async (request, response) => {
  const getMoviesQuery = `
  SELECT  movie_name FROM movie;
  `
  const moviesArray = await db.all(getMoviesQuery)
  response.send(
    moviesArray.map(eachMovie => ({movieName: eachMovie.movie_name})),
  )
})

app.post('/movies/', async (request, response) => {
  const {directorId, movieName, leadActor} = request.body
  const postMovieQuery = `
  INSERT INTO movie (director_id, movie_name, lead_actor)
  VALUES(${directorId}, '${movieName}', '${leadActor}');
  `
  await db.run(postMovieQuery)
  response.send('Movie Successfully Added')
})

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `
  SELECT * FROM movie WHERE movie_id = ${movieId};
  `
  const movieArray = await db.get(getMovieQuery)
  response.send(convertMovieDbObjectTOResponseObject(movieArray))
})

app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const {directorId, movieName, leadActor} = request.body
  const updateMovie = `
  UPDATE movie SET director_id = ${directorId}, movie_name = '${movieName}', lead_actor = '${leadActor}'
  WHERE movie_id = ${movieId}
  `
  await db.run(updateMovie)
  response.send('Movie Details Updated')
})

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `
  DELETE FROM movie WHERE movie_id = ${movieId};
  `
  await db.run(deleteMovieQuery)
  response.send('Movie Removed')
})

app.get('/directors/', async (request, response) => {
  const getDirectorQuery = `
  SELECT * FROM director ;
  `
  const directorArray = await db.all(getDirectorQuery)
  response.send(
    directorArray.map(eachDirector => {
      convertDirectorDbObjectTOResponseObject(eachDirector)
    }),
  )
})

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const getDirectorIdQuery = `
  SELECT * FROM director WHERE director_id = ${directorId};
  `
  const directorArrayId = await db.all(getDirectorIdQuery)
  response.send(
    directorArrayId.map(eachDirectorId => {
      movieName: eachDirectorId.movie_name
    }),
  )
})

module.exports = app
