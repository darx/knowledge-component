const fs      = require('fs');
const gulp    = require('gulp');
const file    = require('gulp-file');
const babel   = require('gulp-babel');
const rename  = require('gulp-rename');
const concat  = require('gulp-concat');
const uglify  = require('gulp-uglify');
const cssnano = require('gulp-cssnano');
const htmlmin = require('gulp-htmlmin');
const prefix  = require('gulp-autoprefixer');

gulp.task('clean:dist', () => {
    return clean();
});

gulp.task('partials', async () => {
    return fs.readdirAsync('./partials').then(async (filenames) => {
        let actions = filenames.map(async (file) => {
            return getFile('./partials/', file);
        });

        let componets = await Promise.all(actions);

        return { data: componets, names: filenames };
    })
    
    .then((files) => {

        let snippets = files.data.map((file, i) => {
            let name = files.names[i].split(/\.[^.]*$/)[0];

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

gulp.task('compress', () => {
    gulp.src('./src/index.js')
        .pipe(babel())
        .pipe(rename({
            basename: 'knowledge-component'
        }))
        .pipe(gulp.dest('dist/src'));

    return gulp.src('./src/index.js')
        .pipe(babel())
        .pipe(uglify())
        .pipe(rename({
            basename: 'knowledge-component',
            suffix: '.min'
        }))
        .pipe(gulp.dest('dist/src'));
});

gulp.task('svg', async () => {

    return fs.readdirAsync('./icons').then(async (filenames) => {
        var actions = filenames.map(async (file) => {
            return getFile('./icons/', file);
        });

        var components = await Promise.all(actions);

        return { data: components, names: filenames };
    })

    .then((files) => {

        var snippets = files.data.map((file, i) => {
            let name = files.names[i].split(/\./)[0];

            let prepend = `<svg 
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlns:xlink="http://www.w3.org/1999/xlink">
                            <defs>`,
                append = `</defs></svg>`;

                file = file
                    .replace('<svg ', `<symbol id="sx_${name}_icon" `)
                    .replace('</svg>', '</symbol>');

            
            return prepend + file + append;
        });

        let string = `<div style="display:none!important;">${snippets.join('')}</div>\n`;
    
        return file('icons', string, {
            src: true
        })
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true,
            processScripts: ['text/html']
        }))
        .pipe(rename('icons.html'))
        .pipe(gulp.dest('dist/src'));
    });

});

gulp.task('styles', () => {
    gulp.src('./style/*.css')
        .pipe(prefix())
        .pipe(gulp.dest('dist/src'));

    return gulp.src('./style/*.css')
        .pipe(prefix())
        .pipe(cssnano({
            reduceIdents: false
        }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist/src'));
});


gulp.task('compress-dev', () => {
    return gulp.src('./src/index.js')
        .pipe(babel())
        .pipe(rename({ basename: 'knowledge-component' }))
        .pipe(gulp.dest('dist/src'));
});

gulp.task('partials-dev', async () => {
    return fs.readdirAsync('./partials').then(async (filenames) => {
        let actions = filenames.map(async (file) => {
            return getFile('./partials/', file);
        });

        let componets = await Promise.all(actions);

        return { data: componets, names: filenames };
    })
    
    .then((files) => {

        let snippets = files.data.map((file, i) => {
            let name = files.names[i].split(/\.[^.]*$/)[0];

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

gulp.task('svg-dev', async () => {

    return fs.readdirAsync('./icons').then(async (filenames) => {
        var actions = filenames.map(async (file) => {
            return getFile('./icons/', file);
        });

        var components = await Promise.all(actions);

        return { data: components, names: filenames };
    })

    .then((files) => {

        var snippets = files.data.map((file, i) => {
            let name = files.names[i].split(/\./)[0];

            let prepend = `<svg 
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlns:xlink="http://www.w3.org/1999/xlink">
                            <defs>`,
                append = `</defs></svg>`;

                file = file
                    .replace('<svg ', `<symbol id="sx_${name}_icon" `)
                    .replace('</svg>', '</symbol>');

            
            return prepend + file + append;
        });

        let string = `<div style="display:none!important;">${snippets.join('')}</div>\n`;
    
        return file('icons', string, {
            src: true
        })

        .pipe(rename('icons.html'))
        .pipe(gulp.dest('dist/src'));
    });

});

gulp.task('styles-dev', () => {
    return gulp.src('./style/*.css')
        .pipe(prefix())
        .pipe(gulp.dest('dist/src'));
});

gulp.task('build-production',
    gulp.series(
        'clean:dist',
        'partials',
        'compress',
        'styles',
        'svg'
    )
);

gulp.task('build-development',
    gulp.series(
        'clean:dist',
        'partials-dev',
        'compress-dev',
        'styles-dev',
        'svg-dev'
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

const getFile = (dir, filename) => {
    return fs.readFileAsync(dir + filename, 'utf8');
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