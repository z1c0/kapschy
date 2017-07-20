'use strict';
const googleTTS = require('google-tts-api');
const request = require('request');
const Speaker = require('speaker')
const lame = require('lame');
const Dropbox = require('dropbox');

const token = require('./secrets.json').DropBoxToken;
const dbx = new Dropbox({ accessToken: token });


const decoder = lame.Decoder();

const speaker = new Speaker({
  channels: 1,
  bitDepth: 16,
  sampleRate: 44100
})


function speak(text) {
  googleTTS(text, 'de')
    .then(function (url) {
      request.get(url)
      .pipe(decoder)
      .on("format", function (format) {
        this.pipe(new Speaker(format))
      })
    })
    .catch(function (e) {
      console.error(e);
    }
  );
}



//
// TODO: cleanup job for old files
//


dbx.filesListFolder({ path: '/IFTTT' })
  .then(function(response) {
    response.entries.forEach(e => {
      //console.log(e);
      let arg = { path : e.path_lower };
      dbx.filesDownload(arg).then(f => {
        //console.log(f.fileBinary);
        speak(f.fileBinary);

        dbx.filesDelete(arg);
      })
      .catch(function(error) {
        console.log(error);
      });
    });
  })
  .catch(function(error) {
    console.log(error);
  });