const MongoClient = require("mongodb").MongoClient;
const express = require("express");
const app = express();
var db;

MongoClient.connect(
  "mongodb+srv://kimjeongyeon113:smart123@cluster0.vr7efrs.mongodb.net/?retryWrites=true&w=majority",
  { useUnifiedTopology: true },
  function (에러, client) {
    // 연결되면 할일
    if (에러) return console.log(에러);

    db = client.db("todoApp");

    //데이터 저장할 때 쓰이는 코드
    db.collection("post").insertOne({ 이름: "kimjeongyeon", 나이: 23 }, function (에러, 결과) {
      console.log("저장완료");
    });

    app.listen(8080, function () {
      console.log("listening on 8080");
    });
  }
);
app.get("/", function (요청, 응답) {
  응답.sendFile(__dirname + "/index.html");
});
app.get("/write", function (요청, 응답) {
  응답.sendFile(__dirname + "/write.html");
});
app.post("/add", function (요청, 응답) {
  응답.send("전송완료");
  console.log(요청.body.date);
  console.log(요청.body.title);
});
//
