// dependencies
const readline = require('readline');
const https = require('https');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const program = require('commander');

program 
  .version('1.0.0')
  .usage('[options] "<Material Icon Name>"')
  .option('-d, --dir <dir>', 'Specify the project directory.')
  .option('-c, --color <color>', 'Optional: Specify the color of the icon ("black" | "white")', /^(black|white)$/i, 'black')
  .option('-s, --size <n>', 'Optional: Specify the size of the icon in dp (18 | 24 | 36 | 48)', 24)
  .parse(process.argv);

program.on('--help', () => {
  console.log('  Example:');
  console.log('');
  console.log('    $ node main.js "directions car"');
  console.log('');
});

// constants
const baseUrl = 'https://storage.googleapis.com/material-icons/external-assets/v4/icons/zip/';
const tempDir = path.join(__dirname, 'tmp');

let iconArg = program.args.join(' ');

// Returns the 'ic_...' filename for the icon (based on extension, color and size if specified).
function getIcFilename(ext, color, size) {
  let filename = `ic_${iconArg.trim().replace(' ', '_')}`;
  if (color)
    filename += `_${color}`;
  if (size) 
    filename += `_${size}dp`;
  if (ext)
    filename += `.${ext}`;

  return filename;
}

// Moves icons for Android to correct location.
function processAndroid() {
  console.log('Processing icons for Android');
  ['drawable-hdpi', 'drawable-mdpi', 'drawable-xhdpi', 'drawable-xxhdpi', 'drawable-xxxhdpi'].forEach((drawableDir) => {
    let origFile = path.join(tempDir, getIcFilename(null, program.color, program.size), 'android', drawableDir, getIcFilename('png', program.color, program.size));
    let dest = path.join(program.dir, 'Sources\\HipMobileUI.Droid\\Resources', drawableDir, getIcFilename('png'));
    console.log('\tCreating', dest);
    copyFile(origFile, dest);
  });
  console.log('Processing icons for Android finished');
}

// Moves icons for iOS to correct location.
function processIos() {
  console.log('Processing icons for iOS');
  ['', '_2x', '_3x'].forEach((version) => {
    let imageset = (program.color === 'black')? getIcFilename() : getIcFilename(null, program.color);
    let color = (program.color === 'black')? '': '_white';
    let size = (program.size === 24)? '' : `_${program.size}pt`;
    let origFile = path.join(tempDir, getIcFilename(null, program.color, program.size), 'ios', imageset + size + '.imageset', getIcFilename() + color + size + version + '.png');
    let dest = path.join(program.dir, 'Sources\\HipMobileUI.iOS\\Resources', getIcFilename() + version.replace('_', '@') + '.png');
    console.log('\tCreating', dest);
    copyFile(origFile, dest);
  })
  console.log('Processing icons for iOS finished');
}

// Copies file from src path to dest path.
// see: http://stackoverflow.com/questions/11293857/fastest-way-to-copy-file-in-node-js
function copyFile(src, dest) {
  fs.createReadStream(src).pipe(fs.createWriteStream(dest));
}

// download
let zipFilename = getIcFilename('zip', program.color, program.size);
let downloadUrl = baseUrl + zipFilename;
let downloadDest = path.join(tempDir, zipFilename);
console.log(`Downloading "${iconArg}" from ${downloadUrl}`);

var file = fs.createWriteStream(downloadDest);
var request = https.get(downloadUrl, function(response) {
  response.pipe(file);
  file.on('finish', function() {
    console.log('Download finished.');

    // extract
    console.log('Extracting zip file ...');
    fs.createReadStream(downloadDest).pipe(unzipper.Extract({ path: tempDir }))
    .on('close', () => {
      console.log('Extraction finished.');

      // move files
      console.log('Moving files to project located at', program.dir);
      processAndroid();
      processIos();

      // delete zip & extracted folder
      fs.unlink(downloadDest, () => {});

      console.log("\nAll done! Don't forget to add the files to the project using Solution Explorer > Show All Files.");
    });
    
  });
}).on('error', function(err) { // handle download errors
  console.error(err);
  fs.unlink(downloadDest, () => {}); // Delete the file 
});
