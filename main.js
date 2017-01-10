// dependencies
const readline = require('readline');
const https = require('https');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const program = require('commander');

// constants
const baseUrl = 'https://storage.googleapis.com/material-icons/external-assets/v4/icons/zip/';
const tempDir = path.join(__dirname, 'tmp');

// commandline setup
program 
  .version('1.0.0')
  .usage('[options] "<Material Icon Name>"')
  .option('-d, --dir <dir>', 'Specify the project directory.')
  .option('-c, --color <color>', 'Optional: Specify the color of the icon ("black" | "white")', /^(black|white)$/i, 'black')
  .option('-s, --size <n>', 'Optional: Specify the size of the icon in dp (18 | 24 | 36 | 48)', 24);

program.on('--help', function () {
  console.log('  Example:');
  console.log('');
  console.log('    $ node main.js -d D:\\PG\\git\\HiP-Forms directions car');
  console.log('');
});

program.parse(process.argv);

// terminate if no HiP-Forms directory is specified.
if (!program.dir || program.dir.length <= 0) {
  console.error('ERROR! You need to specify the HiP-Forms directory!');
  process.exit(1)
}

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

// Downloads the ZipFile corresponding to the specified icon.
// Returns a Promise which resolves with the path of the downloaded Zip file.
function downloadZipFile() {
  let zipFilename = getIcFilename('zip', program.color, program.size);
  let downloadUrl = baseUrl + zipFilename;
  let downloadDest = path.join(tempDir, zipFilename);
  console.log(`Downloading "${iconArg}" from ${downloadUrl}`);

  return new Promise((resolve, reject) => {
    let file = fs.createWriteStream(downloadDest);

    file.on('error', (err) => {
      reject(err);
    });

    https.get(downloadUrl, (response) => {
      response.pipe(file);

      file.on('finish', () => {
        console.log('Download finished.');
        resolve(downloadDest);
      });
    });
  });
}

// Unzips the specified zip file.
// Returns a promise resolving with the path where the content of the zip file was extracted to.
function unzipZipFile(filepath) {
  console.log('Extracting icons from zip file ...')
  return new Promise((resolve, reject) => {
    let zipFile = fs.createReadStream(filepath);
    zipFile.on('error', (err) => {
      reject(err);
    });

    let targetPath = tempDir;
    let target = unzipper.Extract({ path: tempDir });
    target.on('error', reject);
    target.on('finish', () => {
      console.log('Extraction finished.')
      fs.unlink(filepath, (err) => {
        if (err)
          reject(err);
        else
          resolve(path.join(targetPath, path.basename(filepath, path.extname(filepath))));
      });
    });

    zipFile.pipe(target);
  });
}

// Copies the file identified by srcPath to a new file identified by destPath.
function copyFile(srcPath, destPath) {
  return new Promise((resolve, reject) => {
    let src = fs.createReadStream(srcPath);
    src.on('error', reject);

    let dest = fs.createWriteStream(destPath);
    dest.on('error', reject);

    console.log('\tCreating', destPath);
    src.pipe(dest);

    dest.on('finish', resolve);
  });
}

// Copies the Android icons from the specified directory into the HiP-Forms Solution.
// Returns a promise resolving with the path where the content of the zip file was extracted to.
function copyAndroidIcons(dir) {
  console.log('Copying Android icons ...');
  let copyPromises = [];
  ['drawable-hdpi', 'drawable-mdpi', 'drawable-xhdpi', 'drawable-xxhdpi', 'drawable-xxxhdpi'].forEach((drawableDir) => {
    let src = path.join(dir, 'android', drawableDir, getIcFilename('png', program.color, program.size));
    let dest = path.join(program.dir, 'Sources\\HipMobileUI.Droid\\Resources', drawableDir, getIcFilename('png'));
    copyPromises.push(copyFile(src, dest));
  });
  return Promise.all(copyPromises)
  .then(() => { 
    console.log('Copying Android icons finished.'); 
    return dir;
  });
}

// Copies the iOS icons from the specified directory into the HiP-Forms Solution.
// Returns a promise resolving with the path where the content of the zip file was extracted to.
function copyiOSIcons(dir) {
  console.log('Copying iOS icons ...');
  let copyPromises = [];
  ['', '_2x', '_3x'].forEach((version) => {
    let imageset = (program.color === 'black')? getIcFilename() : getIcFilename(null, program.color);
    let color = (program.color === 'black')? '': '_white';
    let size = (program.size === 24)? '' : `_${program.size}pt`;
    let src = path.join(dir, 'ios', imageset + size + '.imageset', getIcFilename() + color + size + version + '.png');
    let dest = path.join(program.dir, 'Sources\\HipMobileUI.iOS\\Resources', getIcFilename() + version.replace('_', '@') + '.png');
    copyPromises.push(copyFile(src, dest));
  })
  return Promise.all(copyPromises)
  .then(() => { 
    console.log('Copying iOS icons finished.');
    return dir;
  });
}

// Performs cleanup by deleting temporarily extracted contents of zip file.
function cleanup(dir) {
  console.log('Removing temporarily extracted zip contents ...');

  // cf. http://stackoverflow.com/questions/18052762/remove-directory-which-is-not-empty
  var deleteFolderRecursive = function(path) {
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

  deleteFolderRecursive(dir);
  return Promise.resolve();
}

downloadZipFile()
.then(unzipZipFile)
.then(copyAndroidIcons)
.then(copyiOSIcons)
.then(cleanup)
.then(() => console.log('Copying finished successfully! Remember to add the files to the project using Solution Explorer > Show All Files.'))
.catch((err) => {
  console.error(`\n !!! An error occured: !!!\n`)
  console.error(err);
});