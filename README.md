# hip-forms-material-icons

Automatically fetches Material Icons and adds them to the HiP-Forms project.

## Setup

Requires Node.js & npm. Other dependencies can be installed via `npm install`.

## Usage

```
$ node main.js --help

  Usage: main [options] "<Material Icon Name>"

  Options:

    -h, --help           output usage information
    -V, --version        output the version number
    -d, --dir <dir>      Specify the project directory.
    -c, --color <color>  Optional: Specify the color of the icon ("black" | "white")
    -s, --size <n>       Optional: Specify the size of the icon in dp (18 | 24 | 36 | 48)

  Example:

    $ node main.js -d D:\PG\git\HiP-Forms directions car
```

Make sure that you add the copied icons to the Visual Studio project as [described here](https://blogs.msdn.microsoft.com/davidklinems/2007/12/18/quick-tip-add-files-to-visual-studio-projects-the-easy-way/). The included icons can then be referenced in XAML files via `ic_icon_name.png`, e.g. for the "directions car" icon: `<Image Source="ic_directions_car.png"></Image>`.
