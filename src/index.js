require('dotenv').config();
//import express from 'express';
const express = require('express');
//express for the website and pug to create the pages
const app = express();
const pug = require('pug');
const path = require('path');
var publicDir = path.join(__dirname, 'public');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine','pug');
app.use(express.static('public'));

var request = require("request");

//apivideo
const apiVideo = require('@api.video/nodejs-sdk');
const { Console } = require('console');


const apiVideoKey = process.env.apivideoKeyProd;



app.get('/story', (req, res) => {
	res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	//create apivideo client
	const client = new apiVideo.Client({ apiKey: apiVideoKey });
	var hours = 24;
	var videoStream = "pilivestream"
	var currentTime = new Date();
	
	//get the values from the form to figure out which stream, and for how far backwards 
	if(req.query.hours){
		hours = req.query.hours;
	}
	if(req.query.chooseStory){
		videoStream = req.query.chooseStory;
	}
	//we need to convert hours to ms, 3600s in an hour, 1000ms in a sec
	var hoursInMs = hours*3600*1000
	var earliestTime = new Date(currentTime - hoursInMs);

	console.log ("current", currentTime + "  " + currentTime.getTime());
	console.log("hours less", hours);
	console.log("earliest time", earliestTime +  + earliestTime.toUTCString());

	//set the paramaters for the video search

	//default will be the first choice pi livesream
	var searchParameters = "currentPage: 1, pageSize: 25, sortBy: 'publishedAt', sortOrder: 'desc'";
	if (videoStream==="piLivestream"){
		// pi livestream saved videos
		 searchParameters = {currentPage: 1, pageSize: 25, sortBy: 'publishedAt', sortOrder: 'desc', liveStreamId: 'liEJzHaTzuWTSWilgL0MSJ9'};
	}
	else if (videoStream==="foreheads"){
		// livestream a video saved videos
		//"foreheads" is a joke - most of the thumbnails are of someone's forehead
		searchParameters = {currentPage: 1, pageSize: 25, sortBy: 'publishedAt', sortOrder: 'desc', liveStreamId: 'li400mYKSgQ6xs7taUeSaEKr'};

	}else if (videoStream==="tutorials"){
		//these are video tutorials for a.video
		//tagged 'avideo'
		searchParameters= {currentPage: 1, pageSize: 25, sortBy: 'publishedAt', sortOrder: 'desc', tags: ['avideo']};

	}
	//currentPage: 1, pageSize: 25, sortBy: 'publishedAt', sortOrder: 'desc', liveStreamId: 'liEJzHaTzuWTSWilgL0MSJ9'
	console.log("search params", searchParameters);
	let result =client.videos.search(searchParameters);	
	result.then(function(videoList){
		//25 most recent stories
		console.log(videoList);
		
		//let's get the ones that fit inside the "story lifetime"
		var validStories=[];
		for (var i=0;i<videoList.length;i++){
			var publishDate = new Date(videoList[i].publishedAt);
			//console.log("published", publishDate);
			if(publishDate > earliestTime){
				//any videos that match this are valid to display
				//grab the title and the iframe url
				console.log("published", publishDate);
				var iframe = "iframe src=\""+videoList[i].assets.player+"\" width=\"50%\" height=\"28%\" frameborder=\"0\" scrolling=\"no\" allowfullscreen=\true\"";
				var name = videoList[i].title;

				var data = {
					"name": name, 
					"iframe":iframe,
					"published":publishDate
				};
				validStories.push(data);
			}
		}
		//ow we have all the videos
		//send them to the webpage
		console.log(validStories);
		return res.render('story', {hours, validStories});

		
		}).catch((err) => {
			console.log(err);
		});

});




//testing on 3007
app.listen(process.env.PORT || 3007, () =>
  console.log('Example app listening on port 3007!'),
);
process.on('uncaughtException', function(err) {
    // handle the error safely
    console.log(err)
    // Note: after client disconnect, the subprocess will cause an Error EPIPE, which can only be caught this way.
});

