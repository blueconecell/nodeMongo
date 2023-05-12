const express = require("express");
const app = express();
const MongoClient = require("mongodb").MongoClient;
const request = require("request");
const youtubeAPI_URL = "AIzaSyBcB4AaEFGTrK0-dk26PFi95WMWdLoWqlM";

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
var db;
MongoClient.connect(
  "mongodb+srv://kimjeongyeon113:smart123@cluster0.vr7efrs.mongodb.net/?retryWrites=true&w=majority",
  { useUnifiedTopology: true },
  function (에러, client) {
    if (에러) return console.log(에러);

    db = client.db("todoApp");

    // db.collection("post").insertOne({ 이름: "JeongYeon", 나이: 24 }, function (에러, 결과) {
    //   console.log("db저장완료");
    // });
    app.listen(3000, function () {
      console.log("listening on 3000");
    });

    // db get part
    app.get("/list", function (요청, 응답) {
      db.collection("post")
        .find()
        .toArray(function (에러, 결과) {
          console.log("--------db 추출결과--------");
          console.log(결과);
          응답.render("list.ejs", { posts: 결과 });
        });
    });

    // db post part

    app.post("/add", function (요청, 응답) {
      console.log(요청.body);
      db.collection("counter").findOne({name:'게시물 갯수'}, function(에러, 결과){
        console.log(결과.totalPost)
        var totalPost = 결과.totalPost;
        db.collection("post").insertOne({_id:totalPost, title: 요청.body.title, date: 요청.body.date }, function (에러, 결과) {
          console.log("db저장완료");

          db.collection("counter").updateOne({name:'게시물 갯수'},{ $inc : {totalPost:1} },function(에러,결과){
            if(에러) return console.log(에러)
          })
        });
      })

      응답.sendFile(__dirname + "/write.html");
    });

    
  }
);

app.get("/", function (요청, 응답) {
  응답.sendFile(__dirname + "/index.html");
});
app.get("/write", function (요청, 응답) {
  응답.sendFile(__dirname + "/write.html");
});
