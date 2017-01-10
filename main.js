// dependencies
const readline = require('readline');
const https = require('https');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');

// constants
const projectDir = 'D:\\PG\\git\\HiP-Forms';
const baseUrl = 'https://storage.googleapis.com/material-icons/external-assets/v4/icons/zip/';
const color = 'black';
const resolution = '24dp';
const tempDir = path.join(__dirname, 'tmp');

// Generates the name of the icon file based on the icon name.
// Optionally adds an extension if provided.
function getFilenameForIcon(name, ext) {
  let filename = `ic_${name.trim().replace(' ', '_')}_${color}_${resolution}`;
  if (ext) 
    return `${filename}.${ext}`;
  else
    return filename;
}

function processAndroid(icon) {
  console.log('Processing icons for Android');
  ['drawable-hdpi', 'drawable-mdpi', 'drawable-xhdpi', 'drawable-xxhdpi', 'drawable-xxxhdpi'].forEach((drawableDir) => {
    let origFile = path.join(tempDir, getFilenameForIcon(icon), 'android', drawableDir, getFilenameForIcon(icon, 'png'));
    let dest = path.join(projectDir, 'Sources\\HipMobileUI.Droid\\Resources', drawableDir, getFilenameForIcon(icon, 'png').replace('_black_24dp', ''));
    console.log('Creating', dest);
    copyFile(origFile, dest);
  });
  console.log('Processing icons for Android finished');
}

function processIos(icon) {
  console.log('Processing icons for iOS');
  let filenameBase = 'ic_' + icon.trim().replace(' ', '_');
  ['', '_2x', '_3x'].forEach((version) => {
    let origFile = path.join(tempDir, getFilenameForIcon(icon), 'ios', filenameBase + '.imageset', filenameBase + version + '.png');
    let dest = path.join(projectDir, 'Sources\\HipMobileUI.iOS\\Resources', filenameBase + version.replace('_', '@') + '.png');
    console.log('Creating', dest);
    copyFile(origFile, dest);
  })
  console.log('Processing icons for iOS finished');
}

// Copies file from src path to dest path.
// see: http://stackoverflow.com/questions/11293857/fastest-way-to-copy-file-in-node-js
function copyFile(src, dest) {
  fs.createReadStream(src).pipe(fs.createWriteStream(dest));
}

// Deletes folder.
// see: http://stackoverflow.com/questions/18052762/remove-directory-which-is-not-empty
function deleteFolderRecursive (path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// prompt for icon
rl.question('What is the name of the icon you want to download? ', (icon) => {
  let filename = getFilenameForIcon(icon, 'zip');
  let downloadUrl = baseUrl + filename;
  let downloadDest = path.join(tempDir, filename);

  console.log(`Downloading "${icon}" from ${downloadUrl}`);

  // download
  var file = fs.createWriteStream(downloadDest);
  var request = https.get(downloadUrl, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      console.log('Download finished');

      // extract
      fs.createReadStream(downloadDest).pipe(unzipper.Extract({ path: tempDir }))
      .on('close', () => {
        console.log('Extraction finished');

        // move files
        processAndroid(icon);
        processIos(icon);

        // delete zip & extracted folder
        fs.unlink(downloadDest);
        // deleteFolderRecursive(tempDir + getFilenameForIcon(icon));

        console.log("\nAll done! Don't forget to add the files to the project using Solution Explorer > Show All Files.");
      });
      
    });
  }).on('error', function(err) { // handle download errors
    console.error(err);
    fs.unlink(downloadDest); // Delete the file 
  });

  rl.close();
});
