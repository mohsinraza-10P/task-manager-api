const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Accessible via instane of the model
schema.methods.toJSON = function () {
  const task = this.toObject();
  // Delete properties which does not needs to be exposed in response
  delete task.__v;
  return task;
};

const model = new mongoose.model("Task", schema);

module.exports = model;
