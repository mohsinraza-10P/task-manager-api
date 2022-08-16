const express = require("express");
require("./db/mongoose");
const userRouter = require("./routers/user-router");
const taskRouter = require("./routers/task-router");

const app = express();

// Automatically parse incoming JSON to an object
app.use(express.json());

// Routers
app.use(userRouter);
app.use(taskRouter);

module.exports = app;
