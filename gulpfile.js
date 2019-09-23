const fs      = require('fs');
const gulp    = require('gulp');
const file    = require('gulp-file');
const rename  = require('gulp-rename');
const concat  = require('gulp-concat');
const htmlmin = require('gulp-htmlmin');

gulp.task('partials', async () => {
    return fs.readdirAsync('./partials').then(async (filenames) => {
        let componets = await Promise.all(filenames.map(getFile));

        return { data: componets, names: filenames };
    })
    
    .then((files) => {

        let snippets = files.data.map((file, i) => {
            let name = files.names[i].split(/.html/)[0];

            let prepend = `<script id="${name}-componet" type="text/html">`,
                append  = '</script>';

            return prepend + file + append;
        });

        let string = `<div>${snippets.join('')}</div>`;

        return file('components', string, {
            src: true
        })

        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true,
            processScripts: ['text/html']
        }))
        .pipe(rename('components.html'))
        .pipe(gulp.dest('dist/src'))
    });
});

fs.readdirAsync = (dirname) => {
    return new Promise((resolve, reject) => {
        fs.readdir(dirname, (err, filenames) => {
            if (err) {
                reject(err); 
            }
            
            else {
                resolve(filenames);
            }
        });
    });
};

fs.readFileAsync = (filename, enc) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, enc, (err, data) => {
            if (err) {
                reject(err); 
            }

            else {
                resolve(data);
            }
        });
    });
};

const getFile = (filename) => {
    return fs.readFileAsync('./partials/' + filename, 'utf8');
}