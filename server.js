const express = require("express");
const app = express();
const MongoClient = require("mongodb").MongoClient;
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

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

app.get("/detail/:postId", function (요청, 응답) {
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
    응답.send("로그인 안하셨는데요?");
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
    var 저장할거 = { _id: totalPost, title: 요청.body.title, date: 요청.body.date, author: 요청.user._id };
    db.collection("post").insertOne(저장할거, function (에러, 결과) {
      console.log("db저장완료");

      db.collection("counter").updateOne({ name: "게시물 갯수" }, { $inc: { totalPost: 1 } }, function (에러, 결과) {
        if (에러) return console.log(에러);
      });
    });
  });

  응답.render("write.ejs");
});

app.delete("/delete", function (요청, 응답) {
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
