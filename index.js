const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const { Schema } = mongoose;
const bodyParser = require("body-parser");
const e = require("express");

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

  const userObj = new User({ username: username });
  try {
    const user = await userObj.save();
    console.log("User saved: ", user);
    res.json(user);
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
  const id = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).send("User not found");
    } else {
      const exerciseObj = new Exercise({
        username: user.username,
        user_id: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date(),
      })
      const exercise = await exerciseObj.save();
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString(),
      });
    }
  } catch (err) {
    console.error(err);
    res.send("Error adding exercise");
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const { from, to, limit } = req.query;
  const userId = req.params._id;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).send("User not found");
  } else {
    let dateObj = {};
    if (from) {
      dateObj.$gte = new Date(from);
    }
    if (to) {
      dateObj.$lte = new Date(to);
    }
    let filter = {
      user_id: userId,
    };
    if (from || to) {
      filter.date = dateObj;
    }

    const exercises = await Exercise.find(filter).limit(
      parseInt(+limit) ?? 500
    );

    const log = exercises.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString(),
    }));
    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log,
    });
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
