import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));


app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

//array for the holding of new posts
const posts = [];  

//grab ejs index and show lists of posts
app.get("/", (req, res) => {
  res.render(__dirname + "/views/index.ejs", 
  {
    title: "THE MOST AWESOME BLOG",
    posts
  });
});

//post the posts title, subject, text n time
app.post("/", (req, res) => {
  
  const { title, subject, text } = req.body;
  if (title && subject && text) 
  {
    posts.unshift
    ({
      title,
      subject,
      text,
      timestamp: new Date().toLocaleString()
    });
  }
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
