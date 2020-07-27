const { ApolloServer, UserInputError } = require("apollo-server");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const bcrypt = require("bcrypt");
require("dotenv").config();
const { Character, validateCharacter } = require("./models/Character");
const { User, validateUser } = require("./models/User");
const { sendConfirmationEmail } = require('./services/EmailService');

mongoose.connect("mongodb://localhost:27017/test-db", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

const resolvers = {
  Query: {
    characters: () =>
      Character.find({}, (error, characters) => {
        if (error) console.log("error", error);
        return characters;
      }),
    character: (_, { id }) =>
      Character.findById(id, (error, character) => {
        if (error) console.log("error", error);
        return character;
      }),
  },
  Mutation: {
    addCharacter(_, payload) {
      const { value, error } = validateCharacter(payload, {
        abortEarly: false,
      });
      if (error) {
        throw new UserInputError(
          "Failed to create a character due to validation errors",
          {
            validationErrors: error.details,
          }
        );
      }
      return Character.create(value);
    },
    async signup(_, {user}) {
      const { value, error } = validateUser(user);
      if (error) {
        throw new UserInputError(
          "Failed to create a character due to validation errors",
          {
            validationErrors: error.details,
          }
        );
      }
      const password = await bcrypt.hash(user.password, 10);
      const registerUser = await User.create({
        ...value,
        password,
      });

      sendConfirmationEmail(registerUser)

      const token = await jwt.sign({
        _id: registerUser._id,
      }, process.env.JWT_SECRET_KEY)

      return {
        token,
        user: lodash.pick(user, ["id","name", "email"]),
      };
    },
    async confirmEmail(_, { token }) {
      try  {
        const verifyToken = jwt.verify(token, process.env.JWT_SECRET_KEY)
        return true
      } catch (err) {
        return false


      }
    }
  },
};

const server = new ApolloServer({
  typeDefs: fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf-8"),
  resolvers,
});

server.listen().then(({ url }) => {
  console.log("Server is running on " + url);
});
