const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/user"); // Mongoose model
const auth = require("../middleware/auth");
const account = require("../emails/account");

const router = new express.Router();
const multipart = multer({
  limits: {
    fileSize: 1000000, // 1MB
  },
  fileFilter(req, file, callback) {
    const regex = /\.(png|jpg|jpeg)$/;
    if (!file.originalname.match(regex)) {
      return callback(new Error("File must be png, jpg or jpeg"));
    }
    callback(undefined, true);
  },
});

router.post("/users", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    account.sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((t) => {
      return t.token !== req.token;
    });
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/users/logout-all", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.get("/users/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) {
      return res.status(500).send({ error: "User not found." });
    }
    res.send(user);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedKeys = ["name", "email", "password", "age"];
  const isValidKey = updates.every((key) => allowedKeys.includes(key));
  if (!isValidKey) {
    return res.status(400).send({
      error: "Invalid field inclusion. Allowed field(s) are: " + allowedKeys,
    });
  }
  try {
    const user = req.user;
    updates.forEach((key) => (user[key] = req.body[key]));
    await user.save();
    res.send(user);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    account.sendCancelationEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post(
  "/users/me/avatar",
  auth,
  multipart.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    const user = req.user;
    user.avatar = buffer;
    await user.save();
    res.send({ message: "Avatar uploaded successfully" });
  },
  (error, req, res, next) => {
    res.status(500).send({ error: error.message });
  }
);

router.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    const user = req.user;
    user.avatar = undefined;
    await user.save();
    res.send({ message: "Avatar deleted successfully" });
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/users/avatar/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error("User avatar not available");
    }
    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
