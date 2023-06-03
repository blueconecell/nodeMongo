const express = require("express");
const app = express();
const MongoClient = require("mongodb").MongoClient;
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const { ObjectId } = require("mongodb");
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

let multer = require("multer");
require("dotenv").config;

// 미들웨어 3개
// 미들웨어: 요청과 응답 중간에 app.use를 사용하여 중간에 동작시키는 것
app.use(session({ secret: "kitchengun", resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static("public")); //미들웨어
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
    http.listen(8080, function () {
      console.log("listening on 8080");
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

    // list -> search part
    app.get("/search", (요청, 응답) => {
      var 검색조건 = [
        {
          $search: {
            index: "titleSearch",
            text: {
              query: 요청.query.value,
              path: "title", // 제목 날짜  둘다 찾고 싶으면 ['title','date']
            },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $limit: 10,
        },
        // {
        //   $project: { title: 1, _id: 0, score: { $meta: "searchScore" } },
        // },
      ];
      db.collection("post")
        .aggregate(검색조건)
        .toArray((에러, 결과) => {
          console.log(결과);
          응답.render("search.ejs", { posts: 결과 });
        });
    });

    // db post part
  }
);

app.get("/", function (요청, 응답) {
  응답.render("index.ejs");
});
app.get("/write", function (요청, 응답) {
  응답.render("write.ejs");
});

app.get("/detail/:postId", 로그인했니, function (요청, 응답) {
  db.collection("post").findOne({ _id: parseInt(요청.params.postId) }, function (에러, 결과) {
    console.log(결과);
    응답.render("detail.ejs", { data: 결과 });
  });
});

app.get("/edit/:postId", function (요청, 응답) {
  db.collection("post").findOne({ _id: parseInt(요청.params.postId) }, function (에러, 결과) {
    if (에러) {
      응답.status(400).send({ message: "오류발생." });
      return console.log(에러);
    } else {
      console.log(결과);
      응답.render("edit.ejs", { data: 결과 });
    }
  });
});

// put요청 form에서 가져온 title, date정보를 db에 업데이트
app.put("/edit", function (요청, 응답) {
  db.collection("post").updateOne({ _id: parseInt(요청.body.id) }, { $set: { title: 요청.body.title, date: 요청.body.date } }, function (에러, 결과) {
    console.log("수정완료");
    응답.redirect("/list");
  });
});

// 로그인기능
app.get("/login", function (요청, 응답) {
  응답.render("login.ejs");
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/fail",
  }),
  function (요청, 응답) {
    응답.redirect("/");
  }
);

// 마이페이지
app.get("/mypage", 로그인했니, function (요청, 응답) {
  console.log(요청.user);
  응답.render("mypage.ejs", { 사용자: 요청.user });
});

// 미들웨어 -> 로그인 했는지 안했는지 확인하는 기능
// 요청.user는 로그인한 user의 아이디 비번값을 갖고 있다.
function 로그인했니(요청, 응답, next) {
  if (요청.user) {
    console.log(요청.user);
    next();
  } else {
    응답.send("<script>alert('로그인안하셨는데요?'); window.location.replace('/');</script>");
  }
}

passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    function (입력한아이디, 입력한비번, done) {
      console.log(입력한아이디, 입력한비번);
      db.collection("login").findOne({ id: 입력한아이디 }, function (에러, 결과) {
        if (에러) return done(에러);

        if (!결과) return done(null, false, { message: "존재하지않는 아이디요" });
        if (입력한비번 == 결과.pw) {
          return done(null, 결과);
        } else {
          return done(null, false, { message: "비번틀렸어요" });
        }
      });
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (아이디, done) {
  // 위에있는 user.id == (파라미터) '아이디'

  // db에서 user.id로 유저를 찾은 뒤 유저정보를 표시
  db.collection("login").findOne({ id: 아이디 }, function (에러, 결과) {
    done(null, 결과);
  });
});

app.post("/register", function (요청, 응답) {
  db.collection("login").insertOne({ id: 요청.body.id, pw: 요청.body.pw }, function (에러, 결과) {
    응답.redirect("/");
  });
});

app.post("/add", function (요청, 응답) {
  console.log(요청.body);
  db.collection("counter").findOne({ name: "게시물 갯수" }, function (에러, 결과) {
    console.log(결과.totalPost);
    var totalPost = 결과.totalPost;
    var 저장할거 = { _id: totalPost, title: 요청.body.title, date: 요청.body.date, author_name: 요청.user.id, author_id: 요청.user._id };
    db.collection("post").insertOne(저장할거, function (에러, 결과) {
      console.log("db저장완료");

      db.collection("counter").updateOne({ name: "게시물 갯수" }, { $inc: { totalPost: 1 } }, function (에러, 결과) {
        if (에러) return console.log(에러);
      });
    });
  });

  응답.render("write.ejs");
});

app.delete("/delete", 로그인했니, function (요청, 응답) {
  요청.body._id = parseInt(요청.body._id);

  var 삭제할데이터 = { _id: 요청.body._id, author: 요청.user._id };
  db.collection("post").deleteOne(삭제할데이터, function (에러, 결과) {
    console.log("삭제완료");
    if (결과) console.log(결과);
    응답.status(200).send({ message: "성공했음." });
  });
  응답.send("삭제완료");
});

// app.use는 미들웨어를 쓰고 싶으면 쓰는 것이다.
// 미들웨어는 요청과 응답 사이에 실행되는 코드이다.
app.use("/shop", require("./routes/shop.js"));
app.use("/board/sub", require("./routes/board.js"));

app.get("/upload", function (요청, 응답) {
  응답.render("upload.ejs");
});

// 데이터를 쉽게 처리해주는 multer 라이브러리

//multer.memoryStorage()를 하면 휘발성 메모리에 저장함
var storage = multer.diskStorage({
  //이미지 저장 경로 지정해주기
  destination: function (req, file, cb) {
    cb(null, "./public/image");
  },
  // 어떤 파일명으로 저장할 것인지 지정하기
  // (여기서는 기존 이름유지)
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// 위에서 설정한 것들을 upload 변수에 저장해서 가져다쓰면 됨
var upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
      return callback(new Error("PNG, JPG, JPEG만 업로드하세요"));
    }
    callback(null, true);
  },
  limits: {
    fileSize: 1024 * 1024,
  },
});

//multer를 미들웨어처럼 사용해주면 된다.
//input의 name 속성을 받아와서 single() 안에적어준다.
app.post("/upload", upload.single("profile"), function (요청, 응답) {
  응답.send("업로드 완료!");
});

app.get("/image/:imgName", function (요청, 응답) {
  응답.sendFile(__dirname + "/public/image/" + 요청.params.imgName);
});
app.get("/chat", function (요청, 응답) {
  db.collection("chatroom")
    .find({ member: 요청.user._id })
    .toArray(function (에러, 결과) {
      console.log("결과 : ");
      console.log(결과);

      응답.render("chat.ejs", { chats: 결과 });
    });
});

// // gpt의 2개이상의 컬랙션 사용하기
// app.get("/chat", function (요청, 응답) {
//   db.collection("chatroom")
//     .find({ member: 요청.user._id })
//     .toArray(function (에러, chatrooms) {
//       if (에러) {
//         console.error(에러);
//         return 응답.status(500).send("서버 오류");
//       }

//       // chatrooms 컬렉션에서 멤버 ID로 검색한 결과를 가져옴
//       const memberChatrooms = chatrooms.map((chatroom) => chatroom._id);

//       db.collection("chat")
//         .find({ chatroom: { $in: memberChatrooms } })
//         .toArray(function (에러, chats) {
//           if (에러) {
//             console.error(에러);
//             return 응답.status(500).send("서버 오류");
//           }

//           console.log("채팅 결과: ");
//           console.log(chats);

//           응답.render("chat.ejs", { chats: chats });
//         });
//     });
// });

app.get("/addChat", 로그인했니, function (요청, 응답) {
  console.log("요청.body : ");
  console.log(요청.body);
  console.log("요청.user : ");
  console.log(요청.user);
  console.log("요청.target : ");
  console.log(요청.target);
  console.log("게시물 제목을 예상 : " + 요청.body.title);

  var 저장할거 = { member: [요청.user.id, 요청.user._id], date: Date.now(), title: 요청.body.title + "의 채팅방" };
  db.collection("chatroom").insertOne(저장할거, function (에러, 결과) {
    console.log("chatroom 저장완료!");
  });
  응답.redirect("/list");
});

//선생님이 만든 chatroom
app.post("/chatroom", 로그인했니, function (요청, 응답) {
  console.log(요청.body.hostid);
  console.log(ObjectId(요청.body.hostid));
  var 저장할거 = {
    title: "채팅방 이름",
    member: [ObjectId(요청.body.hostid), 요청.user._id],
    date: new Date(),
  };
  db.collection("chatroom")
    .insertOne(저장할거)
    .then((결과) => {
      응답.send("성공");
    });
});

app.post("/message", 로그인했니, function (요청, 응답) {
  var 저장할거 = {
    parent: 요청.body.parent,
    content: 요청.body.content,
    userid: 요청.user._id,
    date: new Date(),
  };
  db.collection("message")
    .insertOne(저장할거)
    .then(() => {
      console.log("db 저장성공");
      응답.send("db저장성공");
    });
});

app.get("/message/:id", 로그인했니, function (요청, 응답) {
  응답.writeHead(200, {
    Connection: "keep-alive",
    "Content-type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  console.log("요청.params : ");
  console.log(요청.params);
  db.collection("message")
    .find({ parent: 요청.params.id })
    .toArray()
    .then((결과) => {
      응답.write("event: test\n");
      응답.write("data: " + JSON.stringify(결과) + "\n\n");
    });
  const pipeline = [{ $match: { "fullDocument.parent": 요청.params.id } }];
  const collection = db.collection("message");
  const changeStream = collection.watch(pipeline);

  changeStream.on("change", (result) => {
    console.log("result");
    console.log(result);
    console.log("result.fullDocument");
    console.log(result.fullDocument);
    응답.write("event: test\n");
    응답.write("data: " + JSON.stringify([result.fullDocument]) + "\n\n");
  });
});

app.get("/socket", function (요청, 응답) {
  응답.render("socket.ejs");
});

io.on("connection", function (socket) {
  console.log("socket connected!");

  socket.on("room1-send", function (data) {
    io.to("room1").emit("broadcast", data);
  });

  socket.on("joinroom", function (data) {
    console.log("room1");
    socket.join("room1");
  });

  socket.on("user-send", function (data) {
    console.log(data);
    io.emit("broadcast", data);
    // 원하는 사람 1명과 대화하고 싶을 때 socket id를 이용하여 확인
    // socket.id를 콘솔에 찍어보자
    // io.to(socket.id).emit("broadcast", data)~~~~
  });
});
