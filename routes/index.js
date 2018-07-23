var express = require('express');
var router = express.Router();
var path = require('path')

//image editing library for processing and applying filter to image
var Jimp = require("jimp");

//to deal with multipart uploads
const multer = require('multer')
const crypto = require('crypto')

//by default the multer does not keep file extension while saving files to disk
//so appended .jpeg to all files. Webcam.js makes sure to encode images with 'jpeg' only
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
  	crypto.pseudoRandomBytes(16, function (err, raw) {
      if (err) return cb(err)
      cb(null, raw.toString('hex') + '.jpeg')
    })
  }
})

var upload = multer({ storage: storage })

//global image to be processed
var imageUri = {}

/* GET home page. */
router.get('/', function(req, res, next) {

  	return res.render('index')
});

//saves image to disk using multer. upon returning 'success' the browser will be redirted to filter screen
// didn't use res.render or res.redirect because the incoming request is done through AJAX which can only 
// recieve response as data.
router.post('/getpic', upload.single('webcam'), function(req, res, next) {

	imageUri = req.file.filename

	return res.send('success')
});

//one by one prepare promises for all filters
router.get('/effects', function(req, res, next) {

	var imgPath = 'uploads/'+imageUri

	var tempFileName = imageUri.slice(0, -5)

	var bw = Jimp.read(imgPath).then(function (tempFileName){
		return tempFileName.resize(640,480).
    						quality(100).
    						greyscale().
    						write('edited/'+'BW'+imageUri);

	})

	var invert = Jimp.read(imgPath).then(function (tempFileName){
		return tempFileName.resize(640,480).
    						quality(100).
    						invert().
    						write('edited/'+'INVERT'+imageUri);

	})

	var sepia = Jimp.read(imgPath).then(function (tempFileName){
		return tempFileName.resize(640,480).
    						quality(100).
    						sepia().
    						write('edited/'+'SEPIA'+imageUri);

	})

	var blur = Jimp.read(imgPath).then(function (tempFileName){
		return tempFileName.resize(640,480).
    						quality(100).
    						blur(20).
    						write('edited/'+'BLUR'+imageUri);

	})

	//resolve all promises and then finally render the efects template
	Promise.all([bw, invert, sepia, blur])
		.then(res.render('efects',{img_src: 'uploads/'+imageUri,
								bw_img_src:'edited/'+'BW'+imageUri,
								invert_img_src: 'edited/'+'INVERT'+imageUri,
								sepia_img_src: 'edited/'+'SEPIA'+imageUri,
								blur_img_src: 'edited/'+'BLUR'+imageUri
		}))
		.catch(err => {
			console.log("ran into a error")
		})
})

module.exports = router;