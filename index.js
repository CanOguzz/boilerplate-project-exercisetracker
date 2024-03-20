const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const { Schema } = mongoose;
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Connect to the database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//test db connection
async function connectToMongodb() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to the database");
  } catch (error) {
    console.error("Error connecting to the database: ", error);
  }
}
connectToMongodb();

const userSchema = new Schema({
  username: { type: String, required: true },
  //id being generated automatically
});
const User = mongoose.model("User", userSchema);

const exerciseSchema = new Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true },
});
const Exercise = mongoose.model("Exercise", exerciseSchema);

//add user
app.post("/api/users", async (req, res) => {
  const username = req.body.username;
  res.send({ username: username });
  console.log("usernamsend");

  const newUser = new User({ username: username });

  try {
    const savedUser = await newUser.save();
    console.log("User saved: ", savedUser);
  } catch (err) {
    console.error(err);
  }
});
//get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}).select("username _id");
    res.json(users);
  } catch (err) {
    console.error(err);
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const userId = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date;
  res.send({ description: description, duration: duration, date: date });
  console.log("exercisesend");

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).send("User not found");
  } else {
    const newExercise = new Exercise({
      username: user.username,
      description: description,
      duration: duration,
      date: date ? new Date(date) : new Date(),
    });
    try {
      const savedExercise = await newExercise.save();
      console.log("Exercise saved: ", savedExercise);
    } catch (err) {
      console.error(err);
    }
  }
});

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
