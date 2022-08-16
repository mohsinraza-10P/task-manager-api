const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../../src/models/user");
const Task = require("../../src/models/task");

const userOneId = new mongoose.Types.ObjectId();
const userOne = {
  _id: userOneId,
  name: "Andrew",
  email: "andrew@yopmail.com",
  password: "Andrew123",
  tokens: [
    {
      token: jwt.sign({ _id: userOneId.toString() }, process.env.JWT_SECRET),
    },
  ],
};

const userTwoId = new mongoose.Types.ObjectId();
const userTwo = {
  _id: userTwoId,
  name: "Usman",
  email: "usman@yopmail.com",
  password: "Usman123",
  tokens: [
    {
      token: jwt.sign({ _id: userTwoId.toString() }, process.env.JWT_SECRET),
    },
  ],
};

const taskOne = {
  _id: new mongoose.Types.ObjectId(),
  description: "First Task!",
  completed: false,
  user: userOne._id,
};

const taskTwo = {
  _id: new mongoose.Types.ObjectId(),
  description: "Second Task!",
  completed: true,
  user: userOne._id,
};

const taskThree = {
  _id: new mongoose.Types.ObjectId(),
  description: "Third Task!",
  completed: true,
  user: userTwo._id,
};

const setupDatabase = async () => {
  await User.deleteMany();
  await Task.deleteMany();
  await new User(userOne).save();
  await new User(userTwo).save();
  await new Task(taskOne).save();
  await new Task(taskTwo).save();
  await new Task(taskThree).save();
};

module.exports = {
  userOne,
  userTwo,
  taskOne,
  taskTwo,
  taskThree,
  setupDatabase,
};
