const fs      = require('fs');
const gulp    = require('gulp');
const file    = require('gulp-file');
const rename  = require('gulp-rename');
const concat  = require('gulp-concat');
const uglify  = require('gulp-uglify');
const htmlmin = require('gulp-htmlmin');
const scrape  = require('website-scraper');

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
        .pipe(gulp.dest('dist/src'));

    });
});

gulp.task('partials-dev', async () => {
    return fs.readdirAsync('./partials').then(async (filenames) => {
        let componets = await Promise.all(filenames.map(getFile));

        return { data: componets, names: filenames };
    })
    
    .then((files) => {

        let snippets = files.data.map((file, i) => {
            let name = files.names[i].split(/.html/)[0];

            let prepend = `<script id="${name}-componet" type="text/html">`,
                append  = '</script>\n';

            return prepend + file + append;
        });

        let string = `<div>${snippets.join('')}</div>\n`;

        return file('components', string, {
            src: true
        })

        .pipe(rename('components.html'))
        .pipe(gulp.dest('dist/src'));

    });
});

gulp.task('compress', () => {
    return gulp.src('./src/index.js')
        .pipe(uglify())
        .pipe(rename('knowledge-component.min.js'))
        .pipe(gulp.dest('dist/src'));
});

gulp.task('compress-dev', () => {
    return gulp.src('./src/index.js')
        .pipe(rename('knowledge-component.js'))
        .pipe(gulp.dest('dist/src'));
});


gulp.task('styles', () => {
    return gulp.src('./style/*.css')
        .pipe(gulp.dest('dist/src'));
});


gulp.task('env-dev', () => {
    let options = {
        urls: ['https://www.esure.com/contact-us'],
        directory: './node-homepage',
    };

    return scrape(options).then((result) => {
        console.log("Website succesfully downloaded");
    }).catch((err) => {
        console.log("An error ocurred", err);
    });
});


gulp.task('clean:dist', () => {
    return clean();
});

gulp.task('build',
    gulp.series(
        'clean:dist',
        'partials',
        'compress',
        'styles'
    )
);

gulp.task('build-development',
    gulp.series(
        'clean:dist',
        'partials-dev',
        'compress-dev',
        'styles'
    )
);

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

const clean = async () => {
    return deleteFolderRecursive('./dist');
}

const getFile = (filename) => {
    return fs.readFileAsync('./partials/' + filename, 'utf8');
};

const deleteFolderRecursive = (path) => {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file, index) => {
            var curPath = path + '/' + file;

            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } 

            else { // delete file
                fs.unlinkSync(curPath);
            }
        });

        fs.rmdirSync(path);
    }
};