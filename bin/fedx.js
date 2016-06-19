#!/usr/bin/env node

var program = require('commander'),
    Promise = require("bluebird"),
    path = require("path"),
    color = require('bash-color'),
    fs = require('fs'),
    lineReader = require('line-reader'),
    postcss = require('postcss'), //postcss相关
    autoprefixer = require('autoprefixer'),
    cssnano = require('cssnano'),
    precss = require('precss'),
    postcssSorting = require('postcss-sorting'),
    cssMqpacker = require('css-mqpacker'),
    spritesmith = require('spritesmith'), //雪碧图
    sprites = require('postcss-sprites').default,
    updateRule = require('postcss-sprites').updateRule,

    browserSync = require('browser-sync'),

    http = require('http'),
    readdirp = require('readdirp'),
    json = require('JSONStream'),
    util = require('util'),
    rd = require('rd'),
    readLine = require('lei-stream').readLine,
    writeLineStream = require('lei-stream').writeLine,
    request = require('request'),
    ip = require('ip'), // 获取局域网ip地址方便测试
    ipn = ip.address(),
    Q = require('q'),
    Qd = Q.defer(),
    flowCur = false;


var chokidar = require('chokidar');

// 流控制
var flow = (str) => {
        if (flowCur == true)
            console.log(color.purple('[FLOW] >>> ' + str));
    }
// 创建目录
var mkdirFn = () => {
    prompt(color.cyan('[INP]：') + '你是否要创建目录(y/n)：', (c) => {
        if (c == 'y' || c == 'Y' || c == '') {
            flow('选择创建目录')
            flow('开始读取目录配置信息')
            var cdir = [];
            var cdirarr = ['imagesPath', 'postcssPath', 'cssPath', 'htmlPath'];
            fsReadFile(path.join(process.cwd(), 'fedxConfig.json'))
                .then((value) => {
                    flow('成功读取目录配置信息')
                    for (var i in value) {
                        for (var j in cdirarr) {
                            if (i == cdirarr[j])
                                cdir[j] = value[i];
                        }
                    }
                    Qd.resolve(value);
                    return Qd.promise;
                })
                .then((value) => {
                    if (value.mode) {
                        for (var l in cdir) {
                            ((l) => {
                                fs.exists(cdir[l], (exists) => {
                                    if (!exists) {
                                        fs.mkdir(cdir[l], () => {
                                            console.log(color.green('[SUCCEED]') + '成功创建' + color.green(cdir[l]) + '目录')
                                        })
                                    } else {
                                        console.log(color.red('[ERROR]') + color.yellow('［' + cdir[l] + '］') + '目录已经存在!')
                                    }
                                })
                            })(l)
                        }
                    }
                })
        }
    })
}


var oneSet = (str, key, file) => {
    var dataJSON = {};
    if (file == 'global') {
        file = path.join(__dirname, '../template/config/fedxConfig.json')
    } else {
        file = path.join(process.cwd(), 'fedxConfig.json')
    }
    fs.exists(path.join(process.cwd(), 'fedxConfig.json'), function(exists) {
        if (exists) {
            flow('本地存在配置，只会替换修改项参数')
            fs.readFile(file, function(err, data) {
                dataJSON = JSON.parse(data);
                prompt(color.cyan(str + '：'), function(c) {
                    if (c == 'Y' || c == 'y') {
                        c = true;
                    } else if (c == 'N' || c == 'n') {
                        c = false;
                    } else if (typeof c == 'number') {
                        c = c + 0;
                    }
                    dataJSON[key] = c;
                    fs.writeFile('fedxConfig.json', JSON.stringify(dataJSON), function(err) {
                        if (err) throw err;
                        console.log(color.cyan('[TIPS]：写入完成'));
                    });
                })
            })
        } else {
            flow('本地不存在配置，其它选项将读取全局配置信息')
            fs.readFile(path.join(__dirname, '../template/config/fedxConfig.json'), function(err, data) {
                dataJSON = JSON.parse(data);
                prompt(color.cyan(str + '：'), function(c) {
                    if (c == 'Y' || c == 'y') {
                        c = true;
                    } else if (c == 'N' || c == 'n') {
                        c = false;
                    } else if (typeof c == 'number') {
                        c = c + 0;
                    }
                    dataJSON[key] = c;
                    fs.writeFile('fedxConfig.json', JSON.stringify(dataJSON), function(err) {
                        if (err) throw err;
                        console.log(color.cyan('[TIPS]：写入完成'));
                    });
                })
            })
        }
    })

}




program
    .version(require('../package.json').version)
    .option('-c, --config', '设置本地配置文件')
    .option('-C, --CONFIG', '设置全局配置文件')
    .option('-a, --name', '设置本地项目名称')
    .option('-A, --NAME', '设置全局项目名称')
    .option('-r, --root', '配置本地项目根目录')
    .option('-R, --ROOT', '配置全局项目根目录')
    .option('-t, --html', '设置本地html目录')
    .option('-T, --HTML', '设置全局html目录')
    .option('-i, --images', '设置本地images目录')
    .option('-I, --IMAGES', '设置全局images目录')
    .option('-j, --jade', '设置本地jade目录')
    .option('-J, --JADE', '设置全局jade目录')
    .option('-s, --css', '设置本地css输出目录')
    .option('-S, --CSS', '设置全局css输出目录')
    .option('-p, --postcss', '设置本地postcss目录')
    .option('-P, --POSTCSS', '设置全局postcss目录')
    .option('-d, --debug', '设置本地debug模式')
    .option('-D, --DEBUG', '设置全局debug模式')
    .option('-e, --sprite', '设置本地sprite前缀')
    .option('-E, --SPRITE', '设置全局sprite前缀')
    .option('-n, --imgmin', '设置本地图片压缩质量')
    .option('-N, --IMGMIN', '设置全局图片压缩质量')
    .option('-m, --mode', '设置本地模式')
    .option('-N, --MODE', '设置全局模式')
    .option('-g, --create', '创建目录')
    .parse(process.argv);

switch (program.rawArgs[program.rawArgs.length - 1]) {
    case '-r':
        oneSet(color.red('[INP]') + '设置本地项目根目录(.)', 'rootPath', 'local')
        break;
    case '-R':
        oneSet(color.red('[INP]') + '设置全局项目根目录(.)', 'rootPath', 'global')
        break;
    case '-a':
        oneSet(color.red('[INP]') + '设置本地项目根目录(.)', 'name', 'local')
        break;
    case '-A':
        oneSet(color.red('[INP]') + '设置全局项目根目录(.)', 'name', 'global')
        break;
    case '-c':
        confAll('local');
        break;
    case '-C':
        confAll('global');
        break;
    case '-t':
        oneSet(color.red('[INP]') + '设置本地html目录(html)', 'htmlPath', 'local')
        break;
    case '-T':
        oneSet(color.red('[INP]') + '设置全局html目录(html)', 'htmlPath', 'global')
        break;
    case '-i':
        oneSet(color.red('[INP]') + '设置本地images目录(images)', 'imagesPath', 'local')
        break;
    case '-I':
        oneSet(color.red('[INP]') + '设置全局images目录(images)', 'imagesPath', 'global')
        break;
    case '-j':
        oneSet(color.red('[INP]') + '设置本地Jade目录(jade)', 'jadePath', 'local')
        break;
    case '-J':
        oneSet(color.red('[INP]') + '设置全局Jade目录(jade)', 'jadePath', 'global')
        break;
    case '-s':
        oneSet(color.red('[INP]') + '设置本地css输出目录(css)', 'cssPath', 'local')
        break;
    case '-S':
        oneSet(color.red('[INP]') + '设置全局css输出目录(css)', 'cssPath', 'global')
        break;
    case '-p':
        oneSet(color.red('[INP]') + '设置本地postcss目录(postcss)', 'postcssPath', 'local')
        break;
    case '-P':
        oneSet(color.red('[INP]') + '设置全局postcss目录(postcss)', 'postcssPath', 'global')
        break;
    case '-d':
        oneSet(color.red('[INP]') + '设置本地debug模式(y/n)', 'debug', 'local')
        break;
    case '-D':
        oneSet(color.red('[INP]') + '设置全局debug模式(y/n)', 'debug', 'global')
        break;
    case '-e':
        oneSet(color.red('[INP]') + '设置本地sprite前缀(icon)', 'sprite', 'local')
        break;
    case '-E':
        oneSet(color.red('[INP]') + '设置全局sprite前缀(icon)', 'sprite', 'global')
        break;
    case '-n':
        oneSet(color.red('[INP]') + '设置本地图片压缩质量(0-100)', 'imgmin', 'local')
        break;
    case '-N':
        oneSet(color.red('[INP]') + '设置全局图片压缩质量(0-100)', 'imgmin', 'global')
        break;
    case '-m':
        oneSet(color.red('[INP]') + '设置本地运行模式(y/n)', 'mode', 'local')
        break;
    case '-M':
        oneSet(color.red('[INP]') + '设置全局运行模式(y/n)', 'mode', 'global')
        break;
    case '-g':
        mkdirFn();
        break;
    default:
        // getabspath();
        break;
}





// 交互函数
var locaConfigArr = [{
    text: '您的项目名称（FEDX）:',
    key: 'name',
    value: 'FEDX',
    type: 'dirname',
    succ: success,
    fail: function() {}
}, {
    text: '是否为独立模式（Y/N）:',
    key: 'mode',
    value: true,
    type: 'boolean',
    succ: success,
    fail: function() {}
}, {
    text: '您的项目跟目录（.）:',
    key: 'rootPath',
    value: '.',
    type: 'dirname',
    succ: success,
    fail: function() {}
}, {
    text: '图片目录名称（images）:',
    key: 'imagesPath',
    value: 'images',
    type: 'dirname',
    succ: success,
    fail: function() {}
}, {
    text: 'postcss目录名称（postcss）:',
    key: 'postcssPath',
    value: 'postcss',
    type: 'dirname',
    succ: success,
    fail: function() {}
}, {
    text: 'html目录名称（html）:',
    key: 'htmlPath',
    value: 'html',
    type: 'dirname',
    succ: success,
    fail: function() {}
}, {
    text: 'css输出目录名称(css)：',
    key: 'cssPath',
    value: 'css',
    type: 'dirname',
    succ: success,
    fail: function() {}
}, {
    text: '图片压缩质量(0-100)：',
    key: 'imgMin',
    value: 70,
    type: 'number',
    succ: success,
    fail: function() {}
}, {
    text: '您是否要创建目录结构(Y/N)：',
    key: 'cdir',
    value: false,
    type: 'boolean',
    succ: success,
    fail: function() {}
}, ];

function success(key, value) {
    console.log('key: ' + key + '----' + 'value: ' + value);
}

function nextFn(arr) {
    var arg = arguments;
    if (arr.length == 0) {
        process.exit();
        return false;
    }
    var item = arr[0];
    prompt(item.text, function(c) {
        switch (item.type) {
            case 'boolean':
                if (c == 'Y' || c == 'y' || c == '') {
                    item.succ(item.key, true);
                    arr.shift();
                } else {
                    item.succ(item.key, false);
                    arr.shift();
                }
                break;
            case 'dirname':
                item.succ(item.key, c);
                arr.shift();
                break;
            case 'number':
                if (!isNaN(c)) {
                    if (c >= 100 || c == 0) {
                        item.succ(item.key, 100);
                        arr.shift();
                    } else if (c <= 50) {
                        item.succ(item.key, 50);
                        arr.shift();
                    } else {
                        item.succ(item.key, c);
                        arr.shift();
                    }
                } else {
                    console.log('请输出数字类型参数')
                }
                break;
            case 'version':
                break;
        }
        arg.callee(arr);
    })
}
// nextFn(locaConfigArr);

var set = {
    flowCur: true
}

// color
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
        },
        FLOW: function(str) {
            if (set.flowCur) {
                console.log(this.cyan('[FLOW]>>> ') + str)
            }
        }
    }
    // 功能重写


var Fedx = function(option) {};

// 工具方法
// 判断文件是否存在
Fedx.prototype.isExist = function(position, file) {
    var existObj = {};
    if (position == 'local') {
        position = process.cwd();
        existObj.type = 'local'
    } else {
        position = __dirname;
        existObj.type = 'global'
    }
    var fsf = fs.access(path.join(position, file), fs.R_OK | fs.W_OK, (err) => {
        if (err) {
            existObj.exist = false;
            existObj.text = '不存在';
        } else {
            existObj.exist = true;
            existObj.text = '存在';
        }
        existObj.path = path.join(position, file);
        Qd.resolve(existObj);
    });
    return Qd.promise;
}

Fedx.prototype.fsReadFile = function(file) {
    var fileData = fs.readFileSync(file),
        fileDataJson = JSON.parse(fileData);
    return fileDataJson;
}





Fedx.prototype.uFileList = function() {}


Fedx.prototype.init = function() {

}



Fedx.prototype.init = function() {
    console.log(color.TIPS('提示'))
    console.log(color.SUCCESS('成功'))
    console.log(color.ERROR('错误'))
    console.log(color.INP('交互'))
    console.log(color.WATCH('监听'))
    color.FLOW('流')
    console.log(color.blue('blue'))
    console.log(color.red('red'))
    console.log(color.yellow('yellow'))
    console.log(color.cyan('cyan'))
    console.log(color.black('black'))
    console.log(color.white('white'))
    console.log(color.purple('purple'))
}


var FEDX = new Fedx();

// FEDX.init();

function _path(f, c) {
    var _Path = f;
    var _PathP = f.split(path.sep);
    var lk = _PathP.indexOf('postcss');
    _Path[lk] = c;
    _Path = path.join(path.sep);
    if (c == 'css') {
        console.log(_Path)
        return _Path;
    } else {

        return _Path;
    }
}

// 自定义postcss函数函数函数函数
function mobilepx2(css) {
    flow('已开启移动端px单位除2功能')
    css.walkRules(function(rule) {
        rule.walkDecls(function(decl, i) {
            decl.value = decl.value.replace(/(\d*\.?\d+)px/ig, function(str) {
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
            decl.value = decl.value.replace(/(\d*\.?\d+)pm/ig, function(str) {
                return (parseFloat(str) / 100) + 'rem';
            })
        })
    });
}


// 自定义postcss插件替换路径
function replaceImgPath(css) {
    flow('已开启postcss图片相对路径处理')
    css.walkRules(function(rule) {
        rule.walkDecls(function(decl, i) {
            decl.value = decl.value.replace(/url\(.*\)/, function(str) {
                str = 'url(' + abimg + '/' + str.slice(4, str.length - 1) + ')';
                return str;
            })
        })
    });
}

function postcssMedia(css) {
    flow('已开启媒体查询识别功能')
    css.walkRules(function(rule) {
        rule.walkDecls(function(decl, i) {
            if (rule.type === "atrule" || (rule.parent && rule.parent.type === "atrule")) {
                var mv = rule.parent.params;
                var mtv = {
                    'iphone4': 'screen and (device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 2)',
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
                    case '(iphone6)':
                        return rule.parent.params = mtv.iphone6;
                        break;
                    case '(iphone6p)':
                        return rule.parent.params = mtv.iphone6p;
                        break;
                    case '(landscape)':
                        return rule.parent.params = mtv.iphone4;
                        break;
                }
            }
        });
    });
}

FEDX.isExist('local', 'fedxConfig.json')
    .then(function(existInfo) {
        return {
            existInfo: existInfo,
            configInfo: FEDX.fsReadFile(existInfo.path)
        }
    }).then(function(value) {
        if (value.mode) {
            console.log('zzzzz')
        }
        var roop = process.cwd();
        var roop2 = roop.split(path.sep);
        var roopl = roop2.indexOf('FEDX') + 1;
        var broo = roop2.slice(0, roopl).join(path.sep);
        chokidar.watch(broo, { ignored: /[\/\\]\./ }).on('all', (event, f) => {
            if (event == 'change' && f.split(path.sep).indexOf('postcss') != -1) {
                var ff = path.dirname(f);
                var _css = ff.split(path.sep);
                var _css2 = _css.indexOf('postcss');
                _css[_css2] = 'css';
                _css = _css.slice(0, _css.length -1)
                var _cssPath = _css.join(path.sep);


                var _img = f.split(path.sep);
                var _img2 = _img.indexOf('postcss');
                _css[_img2] = 'images';
                var _imgPath = _img.join(path.sep);
                var cnn1 = path.basename(f);
                var cnn2 = cnn1.split('.css');
                console.log(cnn2)
                var cnn = cnn2[0]+ '_v1.0.1' + path.extname(cnn1);


                var data = new Date(),
                    curHour = data.getHours() < 10 ? ('0' + data.getHours()) : data.getHours(),
                    curMinute = data.getMinutes() < 10 ? ('0' + data.getMinutes()) : data.getMinutes(),
                    curSec = data.getSeconds() < 10 ? ('0' + data.getSeconds()) : data.getSeconds(),
                    curMill = Math.ceil(data.getMilliseconds() / 10),
                    curMillis = curMill < 10 ? ('0' + curMill) : curMill;
                time = '[' + curHour + ':' + curMinute + ':' + curSec + ':' + curMillis + '] ';
                console.log(color.WATCH(color.red(time)) + f)
                fs.readFile(f, function(err, data) {
                    var st = data;
                    var processors = [
                        precss,
                        replaceImgPath,
                        sprites({
                            stylesheetPath: _cssPath,
                            spritePath: _imgPath,
                            spritesmith: {
                                padding: 5
                            },
                            hooks: {
                                onUpdateRule: function(rule, token, image) {
                                    var backgroundSizeX = image.spriteWidth;
                                    var backgroundSizeY = image.spriteHeight;
                                    var backgroundPositionX = image.coords.x;
                                    var backgroundPositionY = image.coords.y;
                                    backgroundSizeX = isNaN(backgroundSizeX) ? 0 : backgroundSizeX;
                                    backgroundSizeY = isNaN(backgroundSizeY) ? 0 : backgroundSizeY;
                                    backgroundPositionX = isNaN(backgroundPositionX) ? 0 : backgroundPositionX;
                                    backgroundPositionY = isNaN(backgroundPositionY) ? 0 : backgroundPositionY;

                                    var backgroundImage = postcss.decl({
                                        prop: 'background-image',
                                        value: 'url(' + image.spriteUrl + ')'
                                    });

                                    var backgroundSize = postcss.decl({
                                        prop: 'background-size',
                                        value: backgroundSizeX + 'px ' + backgroundSizeY + 'px'
                                    });

                                    var backgroundPosition = postcss.decl({
                                        prop: 'background-position',
                                        value: -backgroundPositionX + 'px ' + -backgroundPositionY + 'px'
                                    });

                                    var minSpriteWidth = postcss.decl({
                                        prop: 'width',
                                        value: image.coords.width + 'px'
                                    });

                                    var minSpriteHeight = postcss.decl({
                                        prop: 'height',
                                        value: image.coords.height + 'px'
                                    });

                                    rule.insertAfter(token, backgroundImage);
                                    rule.insertAfter(backgroundImage, backgroundPosition);
                                    rule.insertAfter(backgroundPosition, backgroundSize);
                                    rule.insertAfter(minSpriteWidth, minSpriteWidth);
                                    rule.insertAfter(minSpriteHeight, minSpriteHeight);
                                }
                            },
                            groupBy: function(image) {
                                var reg = /((icon)-?([\w]*))/;
                                if (reg.test(image.url) === -1) {
                                    return Promise.reject();
                                }
                                var a = reg.exec(image.url);
                                var c = image.url.split(path.sep);
                                patm = c[c.length - 3];
                                return Promise.resolve(c[c.length - 2]);
                            },
                            filterBy: function(image) {
                                if (!/((icon)-?([\w]*))/.test(image.url))
                                    return Promise.reject();
                                return Promise.resolve();
                            }
                        }),
                        pxtorem,
                        // mobilepx2,
                        cssnano,
                        postcssMedia,
                        cssMqpacker({
                            sort: function(a, b) {
                                return a.localeCompare(b);
                            }
                        }),
                        autoprefixer({
                            browsers: [
                                'last 9 versions'
                            ]
                        }),
                        postcssSorting({
                            "sort-order": "yandex"
                        })
                        // opacity,
                        // crip,
                        // clean,
                    ];
                    postcss(processors)
                        .process(st, { from: f, to: path.join(_cssPath, cnn) })
                        .then(function(result) {
                            console.log(_cssPath)
                            fs.writeFileSync(path.join(_cssPath, cnn), result.css);
                            console.log(color.green('[WATCH] ') + color.cyan(f) + ' ' + color.green(timer));
                        }, function(error) {
                            console.log(color.red('[' + 'ERROR' + ']：'))
                            console.log(color.yellow('  ［文件］：' + error.file))
                            console.log(color.yellow('  ［位置］：第' + error.line + '行' + error.column + '列'))
                            console.log(color.yellow('  ［错误］：' + error.reason))
                        }).catch();
                });
                // browserFn();

            }
        });

    })

// 生成项目文件列表
function cPList() {
    FEDX.isExist('local', 'fedxConfig.json')
        .then(function(existInfo) {
            return {
                existInfo: existInfo,
                configInfo: FEDX.fsReadFile(existInfo.path)
            }
        }).then(function(value) {
            var absPath = [
                'postcssAbsolute ',
                'htmlAbsolute ',
                'imagesAbsolute ',
                'cssAbsolute '
            ]
            var list = {
                postcssList: [],
                htmlList: [],
                imagesList: [],
                cssList: []
            }
            rd.read(value.configInfo.rootAbsolute, function(err, files) {
                if (err) throw err;
                for (var i = 0; i < files.length; i++) {
                    if (path.extname(files[i]) != '') {
                        var aa = files[i].split(path.sep)
                        if (aa.indexOf(value.configInfo.name) != -1) {
                            if (files[i].split(path.sep).indexOf('postcss') != -1)
                                list.postcssList.push(files[i])
                            if (files[i].split(path.sep).indexOf('html') != -1)
                                list.htmlList.push(files[i])
                            if (files[i].split(path.sep).indexOf('images') != -1)
                                list.imagesList.push(files[i])
                            if (files[i].split(path.sep).indexOf('css') != -1)
                                list.cssList.push(files[i])
                        }
                    }
                }

                var s = writeLineStream(fs.createWriteStream(path.join('./list.json')), {
                    newline: '\n',
                    encoding: function(data) {
                        return JSON.stringify(data);
                    },
                    cachelines: 0
                });
                s.write(list, function() {});
                s.end(function() {
                    console.log(color.TIPS('文件列表写入完成(list.json)。'))
                    process.exit();
                });

            });

        })
}

// cPList()
