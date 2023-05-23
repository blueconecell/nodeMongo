var router = require("express").Router();
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

router.use(로그인했니);

// app 대신에 router라고 바꿔주자
router.get("/sports", function (요청, 응답) {
  응답.send("스포츠 게시판");
});
router.get("/game", function (요청, 응답) {
  응답.send("게임 게시판");
});

module.exports = router;
