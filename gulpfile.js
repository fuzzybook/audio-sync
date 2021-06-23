const gulp = require('gulp')
const sass = require('gulp-sass')
const minifyCss = require('gulp-minify-css')
const autoprefixer = require('gulp-autoprefixer')
const htmlmin = require('gulp-htmlmin')
const connect = require('gulp-connect')
const imagemin = require('gulp-imagemin')
const plumber = require('gulp-plumber')
const pump = require('pump')
const rollup = require('rollup')
const rollupUglify = require('rollup-plugin-uglify-es')
const nodeResolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const sourcemaps = require('gulp-sourcemaps');

const srcPath = 'src'
const src = {
	scss: `${srcPath}/scss/style.scss`,
	html: `${srcPath}/**/*.html`,
	js: `${srcPath}/js/**/*.js`,
	img: `${srcPath}/img/*`,
	assets: `${srcPath}/statics/**/*`
}

// Dist set to docs for github pages, feel free to change
const distPath = 'dist'
const dist = {
	css: `${distPath}/css`,
	html: distPath,
	js: `${distPath}/js`,
	img: `${distPath}/img`,
	assets: `${distPath}/statics`
}

gulp.task('sass', function () {
  return gulp.src(src.scss)
   //.pipe(sourcemaps.init())
   .pipe(sass.sync({outputStyle: 'compressed'}).on('error', sass.logError))
   //.pipe(sourcemaps.write())
   .pipe(gulp.dest(dist.css));
 });

gulp.task('html', async () => {
	await pump([
		gulp.src(src.html),
		plumber(err => console.error(err)),
		// htmlmin({ collapseWhitespace: true, removeComments: true }),
		gulp.dest(dist.html)
	])
})

gulp.task('js', () => {
	return rollup
		.rollup({
			input: `${srcPath}/js/app.js`,
			plugins: [
				nodeResolve({
					browser: true
				}),
				commonjs()
				// rollupUglify()
			]
		})
		.then(bundle => {
			return bundle.write({
				file: `${distPath}/js/library.js`,
				format: 'iife',
				name: 'library',
				sourcemap: true
			})
		})
})

gulp.task('image', () => {
	pump([
		gulp.src(src.img),
		plumber(err => console.error(err)),
		imagemin({
			verbose: true
		}),
		gulp.dest(dist.img)
	])
})

gulp.task('move-assets', function() {
	return gulp.src([src.assets]).pipe(gulp.dest(dist.assets))
})

gulp.task('browserSync', gulp.parallel('sass', 'html', 'js', 'move-assets'), () => {
	browserSync.init({
		injectChanges: false,
		server: `./${distPath}`
	})

	gulp.watch(src.assets, ['move-assets'])
	gulp.watch(`${srcPath}/scss/*.scss`, ['sass'])
	gulp.watch(src.js, ['js'])
	gulp.watch(src.html, ['html'])
	/* gulp.watch(src.html).on('change', browserSync.reload)
  gulp.watch(src.js).on('change', browserSync.reload)
 */
})

gulp.task('serve', gulp.parallel('sass', 'html', 'js', 'move-assets'), () => {
	connect.server({
		root: `./${distPath}`,
		port: 3000,
		// port: 443,
		https: false,
		host: '0.0.0.0'
	})

	gulp.watch(src.assets, ['move-assets'])
	gulp.watch(`${srcPath}/scss/*.scss`, ['sass'])
	gulp.watch(src.js, ['js'])
	gulp.watch(src.html, ['html'])
})
// gulp.task('default', ['sass', 'html', 'js', 'move-assets'])
gulp.task('default', gulp.parallel('serve'))
