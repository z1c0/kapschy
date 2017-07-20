'use strict';
const googleTTS = require('google-tts-api');
const request = require('request');
const Speaker = require('speaker')
const lame = require('lame');
const Dropbox = require('dropbox');

const token = require('./secrets.json').DropBoxToken;
const dbx = new Dropbox({ accessToken: token });


function light(isOn, text) {
  return new Promise(function(resolve, reject) {
    if (isOn) {
      console.log('ON: ' + text);
    }
    setTimeout(function() {
      if (!isOn) {
        console.log('OFF: ' + text);
      }
      console.log('OK');
      resolve();
    }, 2000); 
  });
}

function speak(text) {
   return light(true, text)
    .then(() => new Promise((resolve, reject) => {
      googleTTS(text, 'de')
        .then(function (url) {
          request.get(url)
          .pipe(lame.Decoder())
          .on("format", function (format) {            
            const speaker = new Speaker(format);
            speaker.on('finish', () => {
              resolve();
            });
            this.pipe(speaker)
          })
        })
        .catch(function (e) {
          console.error(e);
          reject();
        })
      }))
    .then(() => light(false, text));
}

//
// TODO: cleanup job for old files
//


dbx.filesListFolder({ path: '/IFTTT' })
  .then(function(response) {
    let p = Promise.resolve();
    response.entries.forEach(e => {
      //console.log(e);
      let arg = { path : e.path_lower };
      dbx.filesDownload(arg).then(f => {
        //console.log(f.fileBinary);
        p = p.then(() => speak(f.fileBinary));
        //dbx.filesDelete(arg);
      })
      .catch(function(error) {
        console.log(error);
      });
    });
  })
  .catch(function(error) {
    console.log(error);
  });
  