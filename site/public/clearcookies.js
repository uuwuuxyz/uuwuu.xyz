require("dotenv").config();
const express = require("express");
const router = express.Router();

const catchAsync = (fn) => (req, res, next) => {
	const routePromise = fn(req, res, next);
	if (routePromise.catch) {
		routePromise.catch((err) => next(err));
	}
};

router.get(
	"/",
	catchAsync(async (req, res) => {
		Object.keys(req.session).forEach((cookie) => {
			req.session[cookie] = "";
			// res.cookie(cookie, "", {
			// 	maxAge: 0
			// });
		});
		if (process.env.DEV == "true") {
			res.redirect("http://localhost/");
		} else {
			res.redirect("https://uuwuu.xyz/");
		}
	})
);

module.exports = router;
