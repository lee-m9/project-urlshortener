require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParse = require("body-parser");
const dns = require("dns");
const app = express();
const mongoose = require("mongoose");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const shortUrlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});

const ShortUrl = mongoose.model("ShortUrl", shortUrlSchema);

app.use(bodyParse.urlencoded({ extended: false }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", (req, res) => {
  const url = req.body.url;
  const urlRegex =
    /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  if (!urlRegex.test(url)) {
    res.json({ error: "invalid url" });
  } else {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    console.log("----------before dns---------");
    dns.lookup(hostname, (err) => {
      console.log("----------dbs response---------");
      if (err) {
        res.json({ error: "invalid url" });
      } else {
        console.log("----------before find one---------");
        ShortUrl.findOne({ original_url: url }, function (err, shortUrl) {
          console.log("----------after find one---------");
          if (shortUrl) {
            console.log("----------found one url---------");
            res.json({ original_url: shortUrl.original_url, short_url: shortUrl.short_url });
          } else {
            const newShortUrl = new ShortUrl({
              original_url: url,
              short_url: Math.floor(Math.random() * 10000),
            });
            console.log("----------before save---------");
            newShortUrl.save(function (err, data) {
              console.log("----------after save---------");
              if (err) return console.error(err);
              res.json({
                original_url: data.original_url,
                short_url: data.short_url,
              });
            });
          }
        });
      }
    });
  }
});

app.get("/api/shorturl/:shortUrl", (req, res) => {
  ShortUrl.findOne({ short_url: req.params.shortUrl }, function (err, data) {
    if (data) {
      res.redirect(data.original_url);
    } else {
      res.json({ error: "invalid url" });
    }
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
