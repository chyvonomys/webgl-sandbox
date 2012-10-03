var http = require("http");
var fs = require("fs");

var port = 8777;
var hostname = "127.0.0.1"

var allowed =
{
    "/webgl.html" :          { type: "text/html", enc: "utf-8" },
    "/arrow_down_blue.png" : { type: "image/png", enc: "binary" },
    "/checker.png" :         { type: "image/png", enc: "binary" },
    "/webgl.js" :            { type: "text/javascript", enc: "utf-8" }
}

http.createServer(function (request, response) {

    console.log("requested: " + request.url);

    if (!(request.url in allowed))
    {
        console.log("forbidden");
	response.writeHead(403);
	response.end();
	return;
    }
    
    fs.readFile("." + request.url, function(error, content) {
	if (error) {
	    response.writeHead(500);
	    response.end();
	} else {
	    response.writeHead(200, { "Content-Type": allowed[request.url].type });
            response.write(content, allowed[request.url].enc);
	    response.end();
	}
    });
}).listen(port, hostname);

console.log("http://" + hostname + ":" + port + "/webgl.html");
