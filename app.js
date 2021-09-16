const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const request = require('request');
const AdmZip = require('adm-zip');
const shortid = require('shortid');


app.use('/static', express.static(path.join(__dirname, 'client')))
app.use("/bootstrap/dist/css", express.static(path.join(__dirname, '/node_modules/bootstrap/dist/css')));
app.use("/bootstrap/dist/js", express.static(path.join(__dirname, '/node_modules/bootstrap/dist/js')));
app.use("/jquery/dist", express.static(path.join(__dirname, '/node_modules/jquery/dist')));

var arrayOfLines = [];
app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.get("/", (req,res) => {
	res.sendFile(__dirname + "/client/index.html");
})

app.post("/",(req,res) => {
	console.log(req.body)
	arrayOfLines = req.body.listofurl.split(/\r?\n/);

	uniqueId = shortid.generate();
	console.log(`unidqueId:${uniqueId}`)

	fs.mkdir(path.join(__dirname, `./tmp/${uniqueId}`), (err) => {
		console.log(`created folder: ./tmp/${uniqueId}`)
	})

	let downloaded = 0;
	arrayOfLines.forEach((element,index) => {
		console.log(element)
		var filename = path.basename(element);
		download(element, `${index}-${filename}`, uniqueId, function(){
			downloaded++;
		 	if(arrayOfLines.length == downloaded){ //adding this will avoid the corrupted images inside the zip. this will finish downloading files first before zipping it.
				console.log('done');
				console.log('all images are now downloaded in back end');
				 setTimeout(() => {
					zippingfiles(res)
				 }, 1000);
			}
		});
		//console.log(`${arrayOfLines.length}= ${index}`)

	});
})

var zippingfiles = (res) =>{

		console.log("zipping files")
		console.log('\x1b[33m%s\x1b[0m',`Unique Id found: ${uniqueId} \nDownloading: ${uniqueId}.zip `)
		const zip = new AdmZip();

		var uploadDir = fs.readdirSync(path.join(__dirname,`/tmp/${uniqueId}/` ));
		console.log(uploadDir)
		/*for(var i = 0; i < uploadDir.length;i++){
			zip.addLocalFile(path.join(__dirname, `/tmp/${uniqueId}/${uploadDir[i]}`));
		}*/
		uploadDir.forEach(function(element){
			zip.addLocalFile(path.join(__dirname, `/tmp/${uniqueId}/${element}`));
		});

		var data = zip.toBuffer();
		zip.writeZip(path.join(__dirname, `/zip/${uniqueId}.zip`));

		res.set('Content-Type','application/octet-stream');
		res.set('Content-Disposition',`attachment; filename=${uniqueId}.zip`);
		res.set('Content-Length',data.length);
		res.send(data)
}

//Downloding images
var download = function(uri, filename, uid, callback){
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']); //filesize
    request(uri).pipe(fs.createWriteStream(`./tmp/${uid}/${filename}`)).on('close', callback);
  });
};

var port = process.env.PORT || 8080;
 var create = app.listen(port, () =>{
	console.log('Listening on port %d', create.address().port);
 });




/*
 window.writeData = function() {
    var format = "";

    var campaignID = document.getElementById('campaignID').value;

    google.script.run.pullFBImageURLs(campaignID);
    };


*/
