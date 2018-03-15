'use strict';

import path from 'path';

export default function(gulp, plugins, args, config, taskTarget, browserSync) {
  let dirs = config.directories;
  let dest = path.join(taskTarget, dirs.fonts.replace(/^_/, ''));

  // Copy fonts
  gulp.task('copyFonts', function() {
    gulp.src(path.join(dirs.source, '_assets/natseye/css/fonts/**/*.*'))
      .pipe(gulp.dest(dest))
});
}
