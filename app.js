var static = require('node-static');
var marked = require('marked');
var mustache = require('mustache');
var fs = require('fs');
var path = require('path');
var moment = require('moment');
var FontSpider = require('font-spider');
var highlight = require('highlight.js');
var cheerio = require('cheerio');
var optimist = require('optimist');

var font = optimist.options('f', {
        alias: 'font',
        default: false
    }).argv.f;

var blogTitle = 'MZhou\'s blog - Taste of life.';
var blogTemplate = fs.readFileSync('./template/blog.mustache', {
    'encoding': 'utf8'
});
var indexTemplate = fs.readFileSync('./template/index.mustache', {
    'encoding': 'utf8'
});
marked.setOptions({
    gfm: true,
    table: true,
    highlight: function (code) {
        return highlight.highlightAuto(code).value;
    }
});
var getMarkdowns = function () {
    var files = fs.readdirSync('.');
    var result = [];
    files.forEach(function (filename) {
        if (filename.charAt(0) !== '_' && path.extname(filename) === '.md') {
            var filepath = './' + filename;
            var fileStats = fs.statSync(filepath);
            if (fileStats.isDirectory()) {
                return;
            }
            var fileContent = fs.readFileSync('./' + filename, {
                'encoding': 'utf8'
            });
            var markedContent = marked(fileContent);
            var $ = cheerio.load(markedContent);
            var title = $('h1').text();
            result.push({
                title: title,
                index: result.length,
                filename: filename,
                filepath: filepath,
                destpath: './' + path.basename(filepath, '.md') + '.html',
                content: markedContent
            });
        }
    });

    result.sort(function (a, b) {
        var b = b.filename.split('.');
        b = b && b[0] && parseInt(b[0], 10) || 0;
        var a = a.filename.split('.');
        a = a && a[0] && parseInt(a[0], 10) || 0;
        return  b - a;
    });
    return result;
};

// generate blog
var markdowns = getMarkdowns();
markdowns.forEach(function (markData) {
    var data = {
        'data': markData,
        'blogTitle': blogTitle,
        'all': markdowns
    };
    fs.writeFileSync(markData.destpath, mustache.render(blogTemplate, data), {
        'encoding': 'utf8'
    });
    console.log('Write: ' + markData.destpath);
});

fs.writeFileSync(
    './index.html',
    mustache.render(indexTemplate, {
        'blogTitle': blogTitle,
        'all': markdowns
    }),
    {
        'encoding': 'utf8'
    }
);
console.log('Write: index.html');

// generate font
if (font) {
    var fontspider = new FontSpider('./*.html').then(function () {
        console.log('Minify fonts done.');
    });
}


// static server
var file = new static.Server('.');
require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        file.serve(request, response);
    }).resume();
}).listen(8080);
