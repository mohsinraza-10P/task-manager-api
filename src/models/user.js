const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");

const schema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is badly formatted.");
        }
      },
    },
    age: {
      type: Number,
      default: 0,
      required: true,
      validate(value) {
        if (value < 0) {
          throw new Error("Age must be a positive number.");
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minLength: 8,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("Password must not contain the phrase 'password'.");
        }
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer,
    },
  },
  { timestamps: true }
);

// Defining virual property to access user's task
// This property does not gets stored in DB
schema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "user",
});

// Accessible via instane of the model
schema.methods.toJSON = function () {
  const user = this.toObject();

  // Delete properties which does not needs to be exposed in response
  delete user.__v;
  delete user.password;
  delete user.tokens;
  delete user.avatar;

  return user;
};

schema.methods.generateAuthToken = async function () {
  const secretKey = process.env.JWT_SECRET;
  const token = jwt.sign({ _id: this._id.toString() }, secretKey);
  this.tokens = this.tokens.concat({ token });
  await this.save();
  return token;
};

// Accessible via model directly (Similar to static function in Java)
schema.statics.findByCredentials = async (email, password) => {
  const user = await model.findOne({ email });
  if (!user) {
    throw new Error("User not found.");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Email or password is incorrect.");
  }
  return user;
};

// Using middleware for hasing plain text password before save
schema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

// Using middleware for removing user's tasks when user is removed
schema.pre("remove", async function (next) {
  await Task.deleteMany({ user: this._id });
  next();
});

const model = mongoose.model("User", schema);

module.exports = model;
