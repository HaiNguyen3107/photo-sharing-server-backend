const express = require("express");
const session = require("express-session");
const path = require("path");
const app = express();
const cors = require("cors");
const dbConnect = require("./db/dbConnect");
const User = require("./db/userModel");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");
const AuthRouter = require("./routes/AuthRouter");
dbConnect();
// Middleware
//app.set("trust proxy", 1);
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
const IS_PRODUCTION = process.env.NODE_ENV === "production";
// Session configuration
app.use(
  session({
    secret: "photo-app-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: IS_PRODUCTION,
      httpOnly: true,
      sameSite: IS_PRODUCTION ? "none" : "lax",
    },
  })
);

// Serve static images
app.use("/images", express.static(path.join(__dirname, "images")));
app.get("/", (request, response) => {
  response.send({ message: "Hello from photo-sharing app API!" });
});
// Routes
app.use("/user", UserRouter);
app.use("/", PhotoRouter);
app.use("/admin", AuthRouter);

app.listen(8081, () => {
  console.log("server listening on port 8081");
});
