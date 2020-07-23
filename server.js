'use strict';

var express = require('express');
//var mongo = require('mongodb');
var mongoose = require('mongoose');
var ejs = require('ejs');

//MongoDB URI
process.env.MONGO_URI='mongodb+srv://tanmay0808:%23tanmay%401999@cluster0-g4jxm.mongodb.net/cluster0?retryWrites=true&w=majority';

var cors = require('cors');
var dns = require('dns');
var bodyParser = require('body-parser');
var app = express();
var fs = require('fs');
const { url } = require('inspector');

// mongoose.connect(process.env.DB_URI);

try{
  mongoose.connect(process.env.MONGO_URI,{useNewUrlParser:true,useUnifiedTopology:true});
}
catch(error)
{
  console.log(error);
}

//Creating Model For Database
const Schema = mongoose.Schema;

const URLSchema = new Schema({
  url:String,
  hash:{type:String,unique:true}
});

var URLData = mongoose.model('URLData',URLSchema);

app.use(cors());

//Mounting body-parser
app.use(bodyParser.urlencoded({extended:false}));

app.use(express.static(__dirname + '/assets'));
app.get('/',function(req,res){
  res.sendFile(__dirname + '/public/index.html');
});

app.route('/api/shorturl/new').post(function(req,res){
  var myUrl = req.body.url;
 
  //Validation Of URL
  dns.lookup(myUrl.split('https://'|'http://')[1],(error,address)=>{
      if (error){
         res.json({"error":"invalid URL"});
      }
  });
  
  //Check If Present In Databse,Else Will Save It
    URLData.findOne({url:myUrl},function(err,data){
      if (!err){
        if (data === null){
         //CReating A Random Hash For URL 
          var random_string = Math.random().toString(32).substring(2, 5) + Math.random().toString(32).substring(2, 5);
          
          var myHash = encodeURI(random_string);
          
          var obj = new URLData({url:myUrl,hash:myHash});
          
          obj.save((err,data)=>{
            if (err) console.log(err.message);
          });
        }
        else{
          myHash = data.hash;
        }
        //Setting Content For Index.pug 
        app.set('view engine','pug');
        res.render('index',{originalUrl:myUrl, shortUrl:myHash});        
      }
      else
      {
        console.log(err.message);
        res.send("Some went wrong, check URL and try again");
      }
    });
});

app.get('/api/shorturl/:shorturl',function(req,res){
  const hashToDecode = req.params.shorturl;
  
  //Checking Hash In dB
  URLData.findOne({hash:hashToDecode},function(err,data){
      if (!err){
        if (data === null){
          res.json({"error" : 'inValid Url'});
        }
        else{
          res.redirect((/^[https://]/).test(data.url) ? data.url : 'https://' + data.url);
        }
      }else
      {
        console.log(err.message);
        res.send("Some went wrong");
      }
    });
  
});

app.listen(process.env.PORT || 3000, function () {
  console.log('Node.js listening ... ');
});

module.exports = app;

