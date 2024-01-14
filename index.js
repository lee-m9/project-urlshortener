require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParse = require('body-parser');
const dns = require('dns');
const app = express();
const mongoose = require('mongoose');

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

const ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);

app.use(bodyParse.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
	res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
	res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async function (req, res) {
	const url = req.body.url;
	const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
	if (!urlRegex.test(url)) {
		res.json({ error: 'invalid url' });
		return;
	}
	try {
		const urlObj = new URL(url);
		await dns.promises.lookup(urlObj.hostname);
		const shortUrl = await ShortUrl.findOne({ original_url: url });
		if (shortUrl && shortUrl._id) {
			res.json({
				original_url: shortUrl.original_url,
				short_url: shortUrl.short_url,
			});
		} else {
			const urlCount = await ShortUrl.countDocuments();
			const newUrl = new ShortUrl({
				original_url: url,
				short_url: urlCount + 1,
			});
			await newUrl.save();
			res.json({
				original_url: newUrl.original_url,
				short_url: newUrl.short_url,
			});
		}
	} catch (err) {
		res.json({ error: 'invalid url' });
	}
});

app.get('/api/shorturl/:short_url', async function (req, res) {
	const shortUrl = await ShortUrl.findOne({ short_url: req.params.short_url });
	if (!shortUrl) {
		res.json({ error: 'invalid url' });
		return;
	}
	res.redirect(shortUrl.original_url);
});

app.listen(port, function () {
	console.log(`Listening on port ${port}`);
});
