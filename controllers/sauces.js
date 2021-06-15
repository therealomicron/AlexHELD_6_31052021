const Sauce = require('../models/sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
  req.body.sauce = JSON.parse(req.body.sauce);
  const url = req.protocol + '://' + req.get('host');
  const sauce = new Sauce({
    name: req.body.sauce.name,
    manufacturer: req.body.sauce.manufacturer,
    description: req.body.sauce.description,
    imageUrl: url + '/images/' + req.file.filename,
    mainPepper: req.body.sauce.mainPepper,
    heat: req.body.sauce.heat,
    userId: req.body.sauce.userId,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: []
  });
  sauce.save().then(
    () => {
      res.status(201).json({
        message: 'Post saved successfully!'
      });
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id
  }).then(
    (sauce) => {
      res.status(200).json(sauce);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

exports.modifySauce = (req, res, next) => {
  let sauce = new Sauce({ _id: req.params._id });
  if (req.file) {
    const url = req.protocol + '://' + req.get('host');
    req.body.sauce = JSON.parse(req.body.sauce);
    sauce = {
      _id: req.params.id,
      name: req.body.sauce.name,
      manufacturer: req.body.sauce.manufacturer,
      description: req.body.sauce.description,
      imageUrl: url + '/images/' + req.file.filename,
      mainPepper: req.body.sauce.mainPepper,
      heat: req.body.sauce.heat,
      userId: req.body.sauce.userId,
    };
  } else {
    sauce = {
      _id: req.params.id,
      name: req.body.name,
      manufacturer: req.body.manufacturer,
      description: req.body.description,
      mainPepper: req.body.mainPepper,
      heat: req.body.heat,
      userId: req.body.userId,
    };
  }
  Sauce.updateOne({_id: req.params.id}, sauce).then(
    () => {
      res.status(201).json({
        message: 'Sauce updated successfully!'
      });
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({_id: req.params.id}).then(
    (sauce) => {
      const filename = sauce.imageUrl.split('/images/')[1];
      fs.unlink('images/' + filename, () => {
        Sauce.deleteOne({_id: req.params.id}).then(
          () => {
            res.status(200).json({
              message: 'Deleted!'
            });
          }
        ).catch(
          (error) => {
            res.status(400).json({
              error: error
            });
          }
        );
      });
    }
  );
};

exports.getAllSauces = (req, res, next) => {
  Sauce.find().then(
    (sauces) => {
      res.status(200).json(sauces);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.likeSauce = (req, res, next) => {
  let sauce = new Sauce({ _id: req.params._id });
  if(req.body.like === 1) {
    if(!sauce.usersLiked.includes(req.body.userId)) {
      //add user to list and increase likes by 1 if uid 
      //not present in usersLiked array
      Sauce.updateOne(
        {_id: req.params.id},
        {
          $push: {usersLiked: req.body.userId},
          $inc: {likes: 1}
        }
        ).then(
          () => {
            res.status(200).json({
              message: 'Sauce liked!'
            })
          }
        ).catch((error) => {
          res.status(400).json({
            error: error
          });
        })
    }
    //if uid already present in usersLiked, returns 409 error
    if(sauce.usersLiked.includes(req.body.userId)) {
      return res.status(409).json({
        message: "Sauce already liked!"
      })
    }
    //if uid is present in usersDisliked, removes uid from array, 
    //removes dislike, adds like, adds uid to array usersLiked
    if(sauce.usersDisliked.includes(req.body.userId)) {
      Sauce.updateOne(
        {_id: req.params.id},
        {
          $pull: {usersDisliked: req.body.userId},
          $inc: {dislikes: -1, likes: 1},
          $push: {usersLiked: req.body.userId}
        }
      ).catch((error) => {
        res.status(400).json({
          error: error
        });
      })
    } 
  }
  //if uid present in either usersDisliked or usersLiked array, 
  //the uid is removed and the likes or dislikes are increased by -1
  if(req.body.like === 0) {
    if(sauce.usersDisliked.includes(req.body.userId)) {
      Sauce.updateOne({_id: req.params.id},
        {
          $pull: {usersDisliked: req.body.userId},
          $inc: {dislikes: -1}
        }
        ).then(
          () => {
            res.status(201).json({
              message: 'Dislike removed'
            })
          }
        ).catch((error) => {
          res.status(400).json({
            error: error
          });
        })
    }
    else if(sauce.usersLiked.includes(req.body.userId)) {
      Sauce.updateOne({_id: req.params.id},
        {
          $pull: {usersLiked: req.body.userId},
          $inc: {likes: -1}
        }
        ).then(
          () => {
            res.status(201).json({
              message: 'Like removed'
            })
          }
        ).catch((error) => {
          res.status(400).json({
            error: error
          });
        })
    }
  }
  // if the sauce is already disliked, returns a message and does
  // not write anything to the database.
  if(req.body.like === -1) {
    if(sauce.usersDisliked.includes(req.body.userId)) {
      return res.status(409).json({
        message: 'Sauce already disliked'
      })
    }
  //if the user has already liked the sauce, the uid is pulled from
  //the usersLiked array, the likes are increased by -1, dislikes
  //increased by 1, the uid is then pushed to usersDisliked
    else if(sauce.usersLiked.includes(req.body.userId)) {
      Sauce.updateOne({_id: req.params.id},
        {
          $pull: {usersLiked: req.body.userId},
          $inc: {likes: -1, dislikes: 1},
          $push: {usersDisliked: req.body.userId}
        }).then(
          () => {
            res.status(201).json({
              message: "Sauce disliked"
            })
          }
        ).catch((error) => {
          res.status(400).json({
            error: error
          });
        })
    }
    else {
      Sauce.updateOne({_id: req.params.id},
        {
          $push: {usersDisliked: req.body.userId},
          $inc: {dislikes: 1}
        }
        ).then(
          () => {
            res.status(201).json({
              message: "Sauce disliked"
            })
          }
        ).catch((error) => {
          res.status(400).json({
            error: error
          });
        });
      }
  }
}
