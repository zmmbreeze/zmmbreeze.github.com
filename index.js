var static = require('node-static');
var marked = require('marked');
var mustache = require('mustache');
var fs = require('fs');
var path = require('path');
var moment = require('moment');
var FontSpider = require('font-spider');
var highlight = require('highlight.js');

var template = fs.readFileSync('./template.mustache', {
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
        if (path.extname(filename) === '.md') {
            var filepath = './' + filename;
            var fileStats = fs.statSync(filepath);
            if (fileStats.isDirectory()) {
                return;
            }
            var fileContent = fs.readFileSync('./' + filename, {
                'encoding': 'utf8'
            });
            result.push({
                index: result.length,
                filename: filename,
                filepath: filepath,
                destpath: './' + path.basename(filepath, '.md') + '.html',
                content: marked(fileContent),
                mtime: moment(fileStats.mtime).format('YYYY-MM-DD HH:mm'),
                ctime: moment(fileStats.ctime).format('YYYY-MM-DD HH:mm')
            });
        }
    });
    return result;
};

// generate blog
var markdowns = getMarkdowns();
markdowns.forEach(function (markData) {
    var data = {
        data: markData,
        all: markdowns
    };
    fs.writeFileSync(markData.destpath, mustache.render(template, data), {
        'encoding': 'utf8'
    });
    console.log('Write:' + markData.destpath);
});

// generate font
var fontspider = new FontSpider('./*.html');
console.log('Minify fonts.');



// static server
var file = new static.Server('.');
require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        file.serve(request, response);
    }).resume();
}).listen(8080);
