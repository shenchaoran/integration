'use strict';

module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    var path = require('path');

    /**
     * Resolve external project resource as file path
     */
    function resolvePath(project, file) {
        return path.join(path.dirname(require.resolve(project)), file);
    }

    // project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        //把多个模块中用到的相同的东西放在这里，这样只用改一遍就行了
        config: {
            ejs: 'views',
            public: 'public'
        },

        uglify:{
            // options: {
            //     banner: bannerContent,
            //     sourceMapRoot: '../',
            //     sourceMap: 'distrib/' + name + '.min.js.map',
            //     sourceMapUrl: name + '.min.js.map'
            // },
            target: {
                expand: true,
                cwd: '<%=config.public %>',
                src: '/**/*.js',
                dest: '/**/*.min.js'
            }
        },

        jshint: {
            src: [
                ['<%=config.public %>/js/custom/*.js']
            ],
            options: {
                jshintrc: true,
                esversion: 6
            }
        },

        csslint: {
            all: {
                src: ['<%= config.public %>/css/custom/*.css']
            }
        },

        sass: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= config.public %>/css/custom',
                    src: ['*.scss'],
                    dest: '<%= config.public %>/css/custom',
                    ext: '.css'
                }]
            }
        },

        browserify: {
            options: {
                browserifyOptions: {
                    debug: true,
                    list: true,
                    // make sure we do not include browser shims unnecessarily
                    insertGlobalVars: {
                        process: function() {
                            return 'undefined';
                        },
                        Buffer: function() {
                            return 'undefined';
                        }
                    }
                },
                // transform: ['brfs']
            },
            watch: {
                options: {
                    watch: true
                },
                files: {
                    '<%= config.public %>/js/browserBundle.js': [
                        '<%= config.public %>/js/custom/*.js',
                        // resolvePath('bson', 'lib/bson/objectid')
                    ]
                }
            }
        },

        copy: {
            js: {},
            css: {
                // files:[
                //     {
                //         expand:true,
                //         cwd:'<%= config.ejs %>',
                //         src:['**/*.css'],
                //         dest:'<%= config.public %>/css'
                //     }
                // ]
            }
        },

        watch: {
            options: {
                livereload: 2345
            },
            js: {
                files: ['<%= config.public %>/js/custom/*.js'],
                tasks: ['browserify:watch']
            },
            css: {
                files: ['<%= config.public %>/css/custom/*.css'],
                // tasks: ['copy:css']
            },
            ejs: {
                files: ['<%= config.ejs %>/**/*.ejs'],
                tasks: ['browserify:watch']
            },
            sass: {
                files: ['<%= config.public %>/css/custom/**/*.scss'],
                tasks: ['sass']
            }
        },

        concat_sourcemap: {
            options: {

            },
            target: {
                files: {
                    // '<%= config.public %>/js/custom'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-concat-sourcemap');
    grunt.loadNpmTasks('grunt-browserify');

    // tasks
    grunt.registerTask('default', [
        // 'csslint',
        // 'jshint',
        // 'copy:css',
        'sass',
        // 'uglify',
        'browserify:watch',
        'watch'
    ]);
};