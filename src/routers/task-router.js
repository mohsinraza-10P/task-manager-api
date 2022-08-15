const express = require("express");
const auth = require("../middleware/auth");
const Task = require("../models/task"); // Mongoose model

const router = new express.Router();

router.post("/tasks", auth, async (req, res) => {
  try {
    // ... ES6 operator to copy all fields from an object
    const task = new Task({
      ...req.body,
      user: req.user._id,
    });
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

// GET /tasks
// GET /tasks?completed=true
// GET /tasks?limit=10&skip=0 --- 1st page with 10 results
// GET /tasks?limit=10&skip=10 --- 2nd page with 10 results
// GET /tasks?limit=10&skip=20 --- 3rd page with 10 results
// GET /tasks?sortBy=createdAt:desc
router.get("/tasks", auth, async (req, res) => {
  try {
    // Method 1
    // const tasks = await Task.find({ user: req.user._id  });

    // Method 2
    const match = {};
    const sort = {};

    // Set completed filter only if its provided
    if (req.query.completed) {
      match.completed = req.query.completed === "true";
    }

    // Set sortBy filter only if its provided
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(":");
      const property = parts[0];
      const order = parts[1];
      sort[property] = order === "desc" ? -1 : 1;
    }

    const user = req.user;
    await user.populate({
      path: "tasks",
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort,
      },
    });
    res.send(user.tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/tasks/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;
    const task = await getCurrentAuthorizedUserTask(id, req.user._id);
    if (!task) {
      return res.status(500).send({ error: "Task not found." });
    }
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedKeys = ["description", "completed"];
  const isValidKey = updates.every((key) => allowedKeys.includes(key));
  if (!isValidKey) {
    return res.status(400).send({
      error: "Invalid field inclusion. Allowed field(s) are: " + allowedKeys,
    });
  }
  try {
    const id = req.params.id;
    const task = await getCurrentAuthorizedUserTask(id, req.user._id);
    if (!task) {
      return res.status(500).send({ error: "Task not found." });
    }
    updates.forEach((key) => (task[key] = req.body[key]));
    await task.save();
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;
    const task = await Task.findOneAndDelete({ _id: id, user: req.user._id });
    if (!task) {
      return res.status(500).send({ error: "Task not found." });
    }
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

const getCurrentAuthorizedUserTask = async (taskId, userId) => {
  // Fetch task by ID which is created by current authorized user only
  const task = await Task.findOne({ _id: taskId, user: userId });
  return task;
};

module.exports = router;
