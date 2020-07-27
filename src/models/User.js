const mongoose = require("mongoose");
const Joi = require("@hapi/joi");

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
  },
  email: {
    type: String,
    minlength: 5,
    maxlength: 255,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 1024,
  },
});

const User = mongoose.model("User", schema);

const validateUser = (user) => {
  return Joi.object({
    name: Joi.string().required().alphanum().min(1).max(50),
    email: Joi.string().required().email(),
    password: Joi.string().required().alphanum().min(6).max(1024),
  }).validate(user);
};

exports.User = User;
exports.validateUser = validateUser;
