import express from "express";
import session from "express-session";
import { dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import bcrypt from "bcrypt";

const app = express();
const port = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

//define database
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "BlogDB",
  password: "Laughter11",
  port: 5432,
});

//CONNNECTTTTTTTTTTTTT
db.connect();

//middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

//initialize secret key
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

//if user logged in -> session else ->login
function isAuthenticated(req, res, next) {
  if (req.session.user) next();
  else res.redirect("/login");
}

//get authenticated before going to blog
app.get("/", isAuthenticated, async (req, res) => {
  const posts = await db.query("SELECT * FROM blogs ORDER BY date DESC");
  res.render(__dirname + "/views/index.ejs", 
  {
    title: "THE MOST AWESOME BLOG",
    posts: posts.rows,
    user: req.session.user,
  });
});

//get the sign up page added error for testing
app.get("/signup", (req, res) => {
  res.render(__dirname + "/views/signup.ejs", { error: null });
});

//get user info and check to see if already exists
app.post("/signup", async (req, res) => {
  const { user_id, password, name } = req.body;
  const exists = await db.query("SELECT * FROM users WHERE user_id = $1", [user_id]);
  
  //if exists send em back 
  if (exists.rows.length > 0) 
  {
    return res.render(__dirname + "/views/signup.ejs", { error: "User ID already taken" });
  }

  //hash password
  const hash = await bcrypt.hash(password, 10);
  await db.query("INSERT INTO users (user_id, password, name) VALUES ($1, $2, $3)", [user_id, hash, name]);
  res.redirect("/login");
});

//get login page
app.get("/login", (req, res) => {
  res.render(__dirname + "/views/login.ejs", { error: null });
});

//check login in the database
app.post("/login", async (req, res) => 
{
  const { user_id, password } = req.body;
  const result = await db.query("SELECT * FROM users WHERE user_id = $1", [user_id]);
  const user = result.rows[0];

  //if user password does not match password in database send em back
  if (!user || !(await bcrypt.compare(password, user.password))) 
  {
    return res.render(__dirname + "/views/login.ejs", { error: "Invalid credentials" });
  }

  //send to blog
  req.session.user = user;
  res.redirect("/");
});

//end session 
app.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

//create post check with to make sure logged in
app.post("/create-post", isAuthenticated, async (req, res) => {
  const { title, subject, text } = req.body;
  const { name, user_id } = req.session.user;

  //update database
  await db.query(
    "INSERT INTO blogs (name, user_id, title, subject, text) VALUES ($1, $2, $3, $4, $5)",
    [name, user_id, title, subject, text]
  );
  res.redirect("/");
});

//get edit for user blog
app.get("/edit/:id", isAuthenticated, async (req, res) => {
  const result = await db.query("SELECT * FROM blogs WHERE blog_id = $1", [req.params.id]);
  const post = result.rows[0];

  //go to edit
  res.render(__dirname + "/views/edit.ejs", { post });
});

//post editited post
app.post("/edit/:id", isAuthenticated, async (req, res) => {
  const { title, subject, text } = req.body;
  const result = await db.query("SELECT * FROM blogs WHERE blog_id = $1", [req.params.id]);
  const post = result.rows[0];

  //update database
  await db.query(
    "UPDATE blogs SET title = $1, subject = $2, text = $3 WHERE blog_id = $4",
    [title, subject, text, req.params.id]
  );
  res.redirect("/");
});

//delete post
app.post("/delete/:id", isAuthenticated, async (req, res) => {
  const result = await db.query("SELECT * FROM blogs WHERE blog_id = $1", [req.params.id]);
  const post = result.rows[0];

  await db.query("DELETE FROM blogs WHERE blog_id = $1", [req.params.id]);
  res.redirect("/");
});


app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
