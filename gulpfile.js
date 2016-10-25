const gulp = require('gulp')
const util = require('gulp-util')
const fs = require('fs')

const IN_CSS = 'src/style.styl'
const OUT_CSS = 'dist/style.css'

const IN_JS = 'src/index.js'
const OUT_JS = 'dist/index.js'

let watching_css = false

gulp.task('build:css', resolve => {
  const stylus = require('stylus') // gulp-stylus doesn't work w/ gulp 4
  const postcss = require('postcss')

  function reject(err) {
    const e = new util.PluginError({
      plugin: 'build:css',
      message: err.message
    })

    if(watching_css) { util.log(
      util.colors.red('Error')
    + ' in plugin \''
    + util.colors.cyan('build:css')
    + '\'\nMessage:\n    '
    + e.message
    )
    } else throw e
  }

  fs.readFile(IN_CSS, 'utf8', (err, style) => {
    if(err) {
      throw new util.PluginError({
        plugin: 'build:css',
        message: err.message
      })
    } else {
      stylus(style)
        .set('filename', IN_CSS)
        .set('sourcemap', { inline: true })
        .set('paths', [__dirname + '/src'])
        .import(__dirname + '/node_modules/jeet/stylus/jeet/index')
        .render((err, css) => {
          if(err) {
            reject(err)
          } else {
            postcss([
              require('postcss-import')({ plugins: [
                require('cssnano')({ safe: true })
              ] }),
              require('rucksack-css')({ fallbacks: true, autoprefixer: true }),
              require('cssnano')({ safe: true }),
            ])
              .process(css, {
                from: IN_CSS,
                to: OUT_CSS,
                map: {
                  inline: false,
                },
              })
              .catch(reject)
              .then(res => {
                fs.writeFile(OUT_CSS, res.css, 'utf8', err => {
                  if(err) reject(err)
                  else {
                    fs.writeFile(OUT_CSS + '.map', res.map, 'utf8', err => {
                      if(err) reject(err)
                      else resolve()
                    })
                  }
                })
              })
          }
        })
    }
  })
})

gulp.task('watch:css', () => {
  watching_css = true
  gulp.watch('src/**/*.styl', gulp.series('build:css'))
})

function buildJs(resolve, watch=false) {
  let out = OUT_JS.split('/')
  let out_file = out.pop()
  let out_dir = out.join('/')

  const browserify = require('browserify')
  const watchify = require('uber-watchify')

  const sourcemaps = require('gulp-sourcemaps')

  const transform = require('vinyl-transform')
  const source = require('vinyl-source-stream')
  const buffer = require('vinyl-buffer')

  function reject(err) {
    const e = new util.PluginError({
      plugin: 'build:js',
      message: err.message
    })

    if(watch) { util.log(
      util.colors.red('Error')
    + ' in plugin \''
    + util.colors.cyan('build:css')
    + '\'\n'
    + (err.codeFrame || '') + '\n' + e.message
    )
    } else throw e
  }

  let opts = Object.assign({}, watchify.args, {
    entries: [IN_JS],
    debug: true,
    watch,
  })

  if(watch) var b = watchify(browserify(opts))
  else      var b = browserify(opts)

  b.transform(require('babelify').configure({
    presets: 'latest',
    plugins: [
      'transform-runtime',
      'typecheck',
      'syntax-flow',
      'transform-flow-strip-types'
    ],
  }))

  b.on('update', () => {
    util.log(`Starting '${util.colors.cyan(`build:js`)}'...`)
    build()
  })

  b.on('log', what => util.log(`Finished '${util.colors.cyan(`build:js`)}': ` + what))

  function build() {
    return b.bundle()
      .on('error', reject)
      .on('end', resolve)
      .pipe(source(out_file))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(require('gulp-uglify')())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(out_dir))
  }

  return build
}

gulp.task('build:js', resolve => {
  return buildJs(resolve, false)()
})

gulp.task('watch:js', () => {
  buildJs(() => {}, true)()
})

gulp.task('build', gulp.parallel('build:js', 'build:css'))
gulp.task('watch', gulp.parallel('watch:js', 'watch:css'))
gulp.task('default', gulp.series('build'))
