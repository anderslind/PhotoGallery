var restify = require('restify');
var aws = require('./filesystem');

function defaultRespond(req, res, next) {
  res.send('gallery loading...');
  next();
}

function respond(req, res, next) {
  res.send('hello ' + req.params.name);
  next();
}

function list(req, res, next) {
  
  //  TODO: Input parameter validation
  
  try {
    aws.listFolder(req, res);
  } catch(err) {
    console.log(err);
    res.send("An error occured");
  }
  next();
}

function getImage(req, res, next) {
  try {
    aws.getImage(req, res);
  } catch(err) {
    console.log(err);
    res.send("An error occured");
  }
  next();
};

function getThumb(req, res, next) {
  try {
    aws.getThumb(req, res);
  } catch(err) {
    console.log(err);
    res.send("An error occured");
  }
  next();
};

var server = restify.createServer();
server.use(restify.queryParser());
server.get('/api/:path', list);
server.get('/api/image/:path', getImage);
server.get('/api/thumb/:path', getThumb);

server.get(/.*/, restify.serveStatic({
	'directory': './public',
	'default': 'index.html'
}));


server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});