require('dotenv').config();

// I would use axios yet I wanted to try out the node fetch.
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Function to fetch the API and dealing with CSV
const functions = require('./functions.js');

const express = require('express');
const app = express();

app.use(express.json());

const port = process.env.PORT || 3000;

// Routes

app.get('/', (req, res) => {
  res.send(
    `<html>
    <p>In order to download the CSV for a searched artist please use the following pattern <b>api/artist/filename</b> e.g.</p>
    <blockquote><b>api/adele/adele</b></blockquote>
    <p><a href='/api/adele/adele'>Download Artist CSV for ("Adele")</a></p>
    <p><a href='/api/generic/generic'>Download Random Artists CSV</a></p>
    <p>If list (artist) hasn\'t been found I made a request to the <b>random<b> (api) instead of creating a local json data.</p></html>`
  );
});

app.get('/api/:artist/:filename', (req, res) => {
  const { artist, filename } = req.params;

  fetch(`http://ws.audioscrobbler.com/2.0/?method=artist.search&artist=${artist}&api_key=${process.env.API_KEY}&format=json&limit=20`)
    .then((res) => res.json())
    .then((data) => {
      if (data.results.artistmatches.artist[0]) {
        // data has been found => download CSV
        let csv = functions.getCSV(data.results.artistmatches.artist);
        res.attachment(`${filename}.csv`).send(csv);
        return;
      }
      const randomName = functions.getRandomArtist(artist_names); // generic (random) artist
      fetch(`http://ws.audioscrobbler.com/2.0/?method=artist.search&artist=${randomName}&api_key=${process.env.API_KEY}&format=json&limit=20`)
        .then((res) => res.json())
        .then((data) => {
          let csv = functions.getCSV(data.results.artistmatches.artist);
          res.attachment(`${filename}.csv`).send(csv);
        })
        .catch((err) => {
          console.log('error: no data has been found', err);
          res.end();
        });
    })
    .catch((err) => {
      console.log('error: error getting data from api', err);
      res.end();
    });
});

app.listen(port, () => console.log(`Server is running on port ${port}`));
