#!/usr/bin/env node

var program = require('commander'),
    Promise = require("bluebird"),
    fs = require('fs'),
    path = require("path"),
    color = require('bash-color'),
    lineReader = require('line-reader'),
    postcss = require('postcss'),
    autoprefixer = require('autoprefixer'),
    cssnano = require('cssnano'),
    precss = require('precss'),
    postcssSorting = require('postcss-sorting'),
    cssMqpacker = require('css-mqpacker'),
    spritesmith = require('spritesmith'),
    sprites = require('postcss-sprites').default,
    updateRule = require('postcss-sprites').updateRule,
    browserSync = require('browser-sync'),
    http = require('http'),
    readdirp = require('readdirp'),
    json = require('JSONStream'),
    util = require('util'),
    rd = require('rd'),
    request = require('request'),
    ip = require('ip'),
    ipn = ip.address(),
    Q = require('q'),
    Qd = Q.defer(),
    atImport = require("postcss-import"),
    chokidar = require('chokidar');




// 配置
var config = {
    flowCur: false,
    ignor: [
        /node_modules/,
        /[\/\\]\./
    ]
}


// 颜色
var color = {
    COLORVALUE: {
        RED: '\033[0;31m',
        GREEN: '\033[0;32m',
        YELLOW: '\033[0;33m',
        BLUE: '\033[0;34m',
        PURPLE: '\033[0;35m',
        CYAN: '\033[0;36m',
        BLACK: '\033[0;30m',
        WHITE: '\033[0;37m',
    },
    red: function(str) {
        return this.COLORVALUE.RED + str + '\033[0m'
    },
    blue: function(str) {
        return this.COLORVALUE.BLUE + str + '\033[0m'
    },
    green: function(str) {
        return this.COLORVALUE.GREEN + str + '\033[0m'
    },
    yellow: function(str) {
        return this.COLORVALUE.YELLOW + str + '\033[0m'
    },
    cyan: function(str) {
        return this.COLORVALUE.CYAN + str + '\033[0m'
    },
    purple: function(str) {
        return this.COLORVALUE.PURPLE + str + '\033[0m'
    },
    black: function(str) {
        return this.COLORVALUE.BLACK + str + '\033[0m'
    },
    white: function(str) {
        return this.COLORVALUE.WHITE + str + '\033[0m'
    },
    TIPS: function(str) {
        return this.cyan('[TIPS] ') + str
    },
    WATCH: function(str) {
        return this.green('[WATCH] ') + str
    },
    ERROR: function(str) {
        return this.red('[ERROR] ') + str
    },
    INP: function(str) {
        return this.purple('[INP] ') + str
    },
    SUCCESS: function(str) {
        return this.green('[SUCCESS] ') + str
    }
}

// console.log(color.red("测试代码"))
// console.log(color.blue("测试代码"))
// console.log(color.green("测试代码"))
// console.log(color.yellow("测试代码"))
// console.log(color.cyan("测试代码"))
// console.log(color.purple("测试代码"))
// console.log(color.black("测试代码"))
// console.log(color.white("测试代码"))
// console.log(color.TIPS("测试代码"))
// console.log(color.WATCH("测试代码"))
// console.log(color.ERROR("测试代码"))
// console.log(color.INP("测试代码"))
// console.log(color.SUCCESS("测试代码"))



// 流控制
var flow = (str) => {
    if (!!config.flowCur)
        console.log(color.yellow('[FLOW] >>> ' + str));
}





// 交互

// var prompt = require('prompt');
// prompt.start();

// var schema = {
//     properties: {
//         name: {
//             pattern: /^\d/,
//             message: 'Name must be only letters, spaces, or dashes',
//             required: true
//         },
//         password: {
//             hidden: true
//         }
//     }
// };
// prompt.get(schema, function(err, result) {
//     console.log('Command-line input received:');
//     console.log('  name: ' + result.name);
//     console.log('  password: ' + result.password);
// });




// fs.readFileSync('./template/config/fedxConfig.json', function(err, data) {
//     var configData = JSON.parse(data);
// })




// 参数判断
// switch (program.rawArgs[program.rawArgs.length - 1]) {
//     case '-a':
//         var pa = process.cwd();
//         prompt(color.cyan('[INP]：') + '你是否要编译\n' + color.red(pa) + '\n目录下的' + color.red('所有文件') + '吗？(y/n)：', (c) => {
//             if (c == 'y' || c == 'Y') {
//                 all();
//             }
//         })
//     case '-m':
//     case '-c':
//     default:
//         dan();
// }

// 工具方法
var Fedx = function() {};
// 检测文件是否存在
var FEDX = new Fedx();
Fedx.prototype.isExist = function() {
    console.log('cunzai');
}

// 读取文件
Fedx.prototype.fsReadFile = function(file, type) {
    var fileData = fs.readFileSync(file);
    switch (type) {
        case "json":
            return fileDataJson = JSON.parse(fileData);
        case "string":
            return fileData;
    }
}


// 写文件
Fedx.prototype.fsWriteFile = function(file, data, cur) {
        fs.writeFile(file, data, (err) => {
            if (err) throw err;
            if (!!cur)
                console.log(data);
        });
    }
    // 时间
Fedx.prototype.tipsTime = function() {
        var data = new Date(),
            curHour = data.getHours() < 10 ? ('0' + data.getHours()) : data.getHours(),
            curMinute = data.getMinutes() < 10 ? ('0' + data.getMinutes()) : data.getMinutes(),
            curSec = data.getSeconds() < 10 ? ('0' + data.getSeconds()) : data.getSeconds(),
            curMill = Math.ceil(data.getMilliseconds() / 10),
            curMillis = curMill < 10 ? ('0' + curMill) : curMill;
        return '[' + curHour + ':' + curMinute + ':' + curSec + ':' + curMillis + '] ';
    }
    // 裁剪路径
Fedx.prototype.slicePath = function(f, str) {
        var _pathArr = f.split(path.sep),
            _pathIndex = _pathArr.indexOf(str);
        return _pathArr.slice(_pathIndex, _pathArr.length).join(path.sep);
    }
    // 替换路径
Fedx.prototype.replacePath = function(f, str) {
    var _pathArr = f.split(path.sep),
        _pathIndex = _pathArr.indexOf(getConfig.path.postcssPath);
    _pathArr[_pathIndex] = str;
    return path.dirname(_pathArr.join(path.sep));
}

// 文件添加版本号
Fedx.prototype.addFileVersion = function(f) {
    var fileName = path.basename(f, '.css'),
        _pathArr = path.dirname(f).split(path.sep),
        regv = /(v\d)(\.\d)+/;
    if (regv.test(_pathArr)) {
        return fileName + '_' + path.basename(_pathArr.join(path.sep)) + '.css'
    } else {
        return path.basename(f)
    }
}






// Fedx.prototype.fsWatchFile = function(setPath, setIgnor, ev, callback) {
//     chokidar.watch(path.join(setPath), { ignored: setIgnor }).on(ev, (event, f) => {
//         callback(f);
//     })
// }

// function dan() {
//     console.log(f + '------');
// }

// FEDX.fsWatchFile(process.cwd(), config.ignor, 'all', dan())










// function a(ev) {

//     chokidar.watch(process.cwd(), { ignored: config.ignor }).on('all', (event, f) => {
//         var fileArr = f;
//         if (event == 'add') {
//             // console.log(FEDX.tipsTime() + '\t' + color.red('build') + '\t' + f);
//             // console.log();
//         } else if (event == 'change') {
//             console.log(FEDX.tipsTime() + '\t' + color.blue('change') + '\t' + f);
//             console.log();
//              // a(ev)
//              console.log(fileArr);
//         }

//     })
// }

// a('all')



// rd.read(process.cwd(), function (err, files) {
//   if (err) throw err;
//   // files是一个数组，里面是目录/tmp目录下的所有文件（包括子目录）
//   console.log(files);
// });

var getConfig = FEDX.fsReadFile(path.join(__dirname, '../fedxConfig.json'), 'json');


function build() {
    flow('读取配置文件');
    var curPath = process.cwd();
    var _path = curPath.split(path.sep);
    flow('判断运行目录是否为跟目录');
    if (new RegExp(getConfig.path.rootPath).test(_path)) {
        flow('监听文件');
        chokidar.watch(process.cwd(), { ignored: config.ignor }).on('all', (event, f) => {
            if (event == 'change') {
                var changeFile = f.split(path.sep);
                var ff = f;
                if (new RegExp(getConfig.path.postcssPath).test(changeFile)) {
                    rd.eachSync(path.dirname(f), function(f, s) {
                        if (path.extname(f) == '.css') {
                            (f == ff) ?
                            (console.log(FEDX.tipsTime() + '\t' + color.yellow(event) + '\t' + FEDX.slicePath(f, getConfig.path.rootPath))) :
                            (console.log(FEDX.tipsTime() + '\t' + color.blue('Build') + '\t' + FEDX.slicePath(f, getConfig.path.rootPath)));
                            (function(f) {
                                postcssBuild(f)
                            })(f)
                        }
                    })
                }
            }
        })
    } else {
        console.log(color.ERROR('请在' + color.red('[ ' + getConfig.path.rootPath + ' ]')) + '目录下运行命令！');
    }
}
build()


function css(f) {
    console.log(f);
}






// 自定义postcss函数函数函数函数
function mobilepx2(css) {
    flow('已开启移动端px单位除2功能')
    css.walkRules(function(rule) {
        rule.walkDecls(function(decl, i) {
            decl.value = decl.value.replace(/(\d*\.?\d+)pm/ig, function(str) {
                return (parseFloat(str) / 2) + 'px';
            })

        })
    });
}

// 自定义postcss插件rem
function pxtorem(css) {
    flow('已开启pm转换rem')
    css.walkRules(function(rule) {
        rule.walkDecls(function(decl, i) {
            decl.value = decl.value.replace(/(\d*\.?\d+)rm/ig, function(str) {
                return (parseFloat(str) / 100) + 'rem';
            })
        })
    });
}

// 重复字段
function str_repeat(str, num) {
    return new Array(num).join(str);
}

var i1;
// 自定义postcss插件替换路径
function replaceImgPath(css) {
    flow('已开启postcss图片相对路径处理')
    css.walkRules(function(rule) {
        rule.walkDecls(function(decl, i) {
            i1 += i;
            decl.value = decl.value.replace(/url\(.*\)/, function(str) {
                var cssFile = decl.source.input.file;
                if (path.basename(cssFile) == 'common.css') {
                    var _abimg1 = abimg1.split('/');
                    var _abimgIndex = _abimg1.indexOf('images');
                    var _imgpath = _abimg1.slice(0, _abimgIndex).join('/') + '/';
                    var st = str.replace('url(../images/', '')
                    var c1 = st.split('/');
                    var c2 = c1.slice(0, c1.length - 1)
                    str = 'url(' + _imgpath + str.slice(7, str.length - 1) + ')';
                    return str;
                } else {
                    var st = str.replace('url(', '')
                    var c1 = st.split('/');
                    var c2 = c1.slice(0, c1.length - 1)
                    str = 'url(' + abimg1 + '/' + str.slice(4, str.length - 1) + ')';
                    return str;
                }

            })
        })
    });
}

function postcssMedia(css) {
    flow('已开启媒体查询识别功能')
    css.walkRules(function(rule) {
        rule.walkDecls(function(decl, i) {
            if (rule.parent.params != 'undefined') {
                var mv = rule.parent.params;
                var mtv = {
                    'iphone4': 'screen and (device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 2)',
                    'iphone45': 'screen and (device-width: 320px) and (-webkit-device-pixel-ratio: 2)',
                    'iphone5': 'screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
                    'iphone6': 'only screen and (min-device-width: 375px) and (max-device-width: 667px) and (orientation: portrait)',
                    'iphone6p': 'only screen and (min-device-width: 414px) and (max-device-width: 736px) and (orientation: portrait)',
                    'landscape': 'screen and (orientation: landscape)'
                }
                switch (mv) {
                    case '(iphone4)':
                        return rule.parent.params = mtv.iphone4;
                        break;
                    case '(iphone5)':
                        return rule.parent.params = mtv.iphone5;
                        break;
                    case '(iphone45)':
                        return rule.parent.params = mtv.iphone45;
                        break;
                    case '(iphone6)':
                        return rule.parent.params = mtv.iphone6;
                        break;
                    case '(iphone6p)':
                        return rule.parent.params = mtv.iphone6p;
                        break;
                    case '(landscape)':
                        return rule.parent.params = mtv.iphone4;
                        break;
                    case 'default':
                        break;
                }
            }
        });
    });
}













function postcssBuild(f) {
    var abimg1,
        mode;
    if (!(new RegExp(/^\_/)).test(path.basename(f))) {
        var pathSplit = f.split(path.sep),
            _cssPath = FEDX.replacePath(f, 'css'),
            _imgPath = FEDX.replacePath(f, 'images'),
            cnn = FEDX.addFileVersion(f);
        mode = (new RegExp(getConfig.type.mobile).test(pathSplit)) ? 2 : 1;
        abimg1 = path.relative(_cssPath, f)
        var cssStr = FEDX.fsReadFile(f, 'string');
        var processors = [
            atImport,
            // replaceImgPath,
            precss,
            autoprefixer({
                browsers: [
                    'last 9 versions'
                ]
            }),
            // sprites(spritesOption(_cssPath, _imgPath)),
            pxtorem,
            mobilepx2,
            cssnano,
            postcssMedia,
            cssMqpacker({
                sort: function(a, b) {
                    return a.localeCompare(b);
                }
            }),
            postcssSorting({
                "sort-order": "yandex"
            })
            // opacity,
            // crip,
            // clean,
        ];
        postcss(processors)
            .process(cssStr, { from: f, to: path.join(_cssPath, cnn) })
            .then(function(result) {
                fs.writeFileSync(path.join(_cssPath, cnn), result.css);
            }, function(error) {
                console.log(color.red('[' + 'ERROR' + ']：'))
                console.log(color.yellow('  ［文件］：' + error.file))
                console.log(color.yellow('  ［位置］：第' + error.line + '行' + error.column + '列'))
                console.log(color.yellow('  ［错误］：' + error.reason))

            }).catch();
    }
};

function spritesOption(csspath, imgpath) {
    return {
        stylesheetPath: csspath,
        spritePath: imgpath,
        spritesmith: {
            padding: 10
        },
        hooks: {
            onUpdateRule: function(rule, token, image) {
                var backgroundSizeX = (image.spriteWidth / image.coords.width) * 100;
                var backgroundSizeY = (image.spriteHeight / image.coords.height) * 100;
                var backgroundPositionX = (image.coords.x / (image.spriteWidth - image.coords.width)) * 100;
                var backgroundPositionY = (image.coords.y / (image.spriteHeight - image.coords.height)) * 100;

                backgroundSizeX = isNaN(backgroundSizeX) ? 0 : backgroundSizeX.toFixed(3);
                backgroundSizeY = isNaN(backgroundSizeY) ? 0 : backgroundSizeY.toFixed(3);
                backgroundPositionX = isNaN(backgroundPositionX) ? 0 : backgroundPositionX.toFixed(3);
                backgroundPositionY = isNaN(backgroundPositionY) ? 0 : backgroundPositionY.toFixed(3);

                var backgroundImage = postcss.decl({
                    prop: 'background-image',
                    value: 'url(' + image.spriteUrl + ')'
                });

                var backgroundSize = postcss.decl({
                    prop: 'background-size',
                    value: backgroundSizeX + '% ' + backgroundSizeY + '%'
                });

                var backgroundPosition = postcss.decl({
                    prop: 'background-position',
                    value: backgroundPositionX + '% ' + backgroundPositionY + '%'
                });

                var minSpriteWidth = postcss.decl({
                    prop: 'width',
                    value: (image.coords.width / mode) + 'px'
                });

                var minSpriteHeight = postcss.decl({
                    prop: 'height',
                    value: (image.coords.height / mode) + 'px'
                });
                var norepeat = postcss.decl({
                    prop: 'background-repeat',
                    value: 'no-repeat'
                });

                rule.insertAfter(token, backgroundImage);
                rule.insertAfter(backgroundImage, backgroundPosition);
                rule.insertAfter(backgroundPosition, backgroundSize);
                rule.insertAfter(minSpriteWidth, minSpriteWidth);
                rule.insertAfter(minSpriteHeight, minSpriteHeight);
                rule.insertAfter(minSpriteHeight, minSpriteHeight);
                rule.insertAfter(norepeat, norepeat);
            }
        },
        groupBy: function(image) {
            var reg = /((icon)-?([\w]*))/;
            if (reg.test(image.url) === -1) {
                return Promise.reject();
            }
            var a = reg.exec(image.url);
            var c = image.url.split('/');
            return Promise.resolve(c[c.length - 3]);
        },
        filterBy: function(image) {
            if (!/((icon)-?([\w]*))/.test(image.url))
                return Promise.reject();
            return Promise.resolve();
        }
    }
}
