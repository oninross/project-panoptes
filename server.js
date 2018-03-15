var express = require('express'),
    app = express(),
    fs = require('fs'),
    http = require('http').Server(app),
    bodyParser = require('body-parser'),
    VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3'),
    ssl = require('express-ssl'),
    router = express.Router(),
    visualRecognition = new VisualRecognitionV3({
        api_key: '6666546e9cca61687197f337b5b0f4f18a08e70c',
        version: '2016-05-20'
    });


app.use(router);
app.use(ssl());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname + '/client'));
app.use(function (req, res, next) {
    // res.setHeader('Access-Control-Allow-Origin', '*');
    // res.setHeader('Access-Control-Allow-Methods', 'POST');
    // res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    // res.setHeader('Content-Type', 'application/json');
    // res.setHeader('Access-Control-Allow-Credentials', true);

    if (req.secure) {
        // request was via https, so do no special handling
        next();
    } else {
        // request was via http, so redirect to https
        res.redirect('https://' + req.headers.host + req.url);
    }
});

router.get('/', function (req, res) {
    console.log('USER CONNECTED');
    res.sendFile(__dirname + '/client/index.html');
});

app.post('/godsEye', function (req, res) {
    console.log('God\'s Eye');

    console.log(req.body.image)

    let base64String = req.body.image,
        base64Image = base64String.split(';base64,').pop();

    fs.writeFile('./tmp/' + req.body.name, base64Image, { encoding: 'base64' }, function (err) {
        console.log('File created');

        let reqImg = req.body.image,
            params = {
                images_file: fs.createReadStream('./tmp/' + req.body.name),
                threshold: 0.8
            };

        visualRecognition.classify(params, function (err, response) {
            if (err) {
                console.warn(err);
            } else {
                console.log('Watson saw it.');
                res.json(response, null, 2);
            }

            fs.unlink('./tmp/' + req.body.name, function (err) {
                if (err) {
                    console.log("Failed to delete local image:" + err);
                } else {
                    console.log('Successfully deleted local image');
                }
            });
        });
    });
});

http.listen(process.env.PORT || 8888, function () {
    console.log('listening on *:8888');
});

// Reset = "\x1b[0m"
// Bright = "\x1b[1m"
// Dim = "\x1b[2m"
// Underscore = "\x1b[4m"
// Blink = "\x1b[5m"
// Reverse = "\x1b[7m"
// Hidden = "\x1b[8m"

// FgBlack = "\x1b[30m"
// FgRed = "\x1b[31m"
// FgGreen = "\x1b[32m"
// FgYellow = "\x1b[33m"
// FgBlue = "\x1b[34m"
// FgMagenta = "\x1b[35m"
// FgCyan = "\x1b[36m"
// FgWhite = "\x1b[37m"

// BgBlack = "\x1b[40m"
// BgRed = "\x1b[41m"
// BgGreen = "\x1b[42m"
// BgYellow = "\x1b[43m"
// BgBlue = "\x1b[44m"
// BgMagenta = "\x1b[45m"
// BgCyan = "\x1b[46m"
// BgWhite = "\x1b[47m"