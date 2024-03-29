const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Post, Hashtag } = require('../models');
const { isLoggedIn } = require('./middlewares');
const { devNull } = require('os');

const router = express.Router();

try {
  fs.readdirSync('uploads');
} catch (error) {
  console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
  fs.mkdirSync('uploads');
}

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {
  console.log(req.file);
  res.json({ url: `/img/${req.file.filename}` });
});

//댓글달기기능

// router.post('/comment', async (req, res, next) => {
//   try {
//     console.log(req.user);
//     await Post.create({
//       content: req.body.content,
//       UserId: req.user.id,
//     });


//     res.redirect('/');
//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// });

const upload2 = multer();
router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
  try {
    console.log(req.user);
    const post = await Post.create({
      content: req.body.content,
      img: req.body.url,
      UserId: req.user.id,
    });
    const hashtags = req.body.content.match(/#[^\s#]*/g);
    if (hashtags) {
      const result = await Promise.all(
        hashtags.map(tag => {
          return Hashtag.findOrCreate({
            where: { title: tag.slice(1).toLowerCase() },
          })
        }),
      );
      await post.addHashtags(result.map(r => r[0]));
    }
   
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

//게시글 삭제
router.post('/:id/delete',async(req,res,next)=>{
  
   
  try{
     await Post.destroy({where:{id: req.params.id, userId:req.user.id}});
    res.send('ok');
   }catch(error){
     console.error(error);
     next(error);
   }
  
});

//게시글 수정
router.post('/:id/patch',async(req,res,next)=>{
  
  
  try {
    await Post.update({content: req.body.content
    },{where:{id: req.params.id}});
    res.send('ok');
   }catch(error){
     console.error(error);
     next(error);
 
  }
});


//좋아요
router.post('/:id/like',async(req,res,next)=>{
  try{
   
    const post = await Post.findOne({where:{id:req.params.id}});
    await post.addLiker(req.user.id);
    res.redirect('/');

  }catch(error){
    console.error(error);
    next(error);
  }
});

//좋아요취소
router.post('/:id/unlike',async(req,res,next)=>{
  try{
    const post = await Post.findOne({where:{id:req.params.id}});
    await post.removeLiker(req.user.id);
    res.redirect('/');

  }catch(error){
    console.error(error);
    next(error);
  }
});



module.exports = router;
