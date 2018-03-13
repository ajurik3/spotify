/*
	Fetches an album's uri and begins playing the album
	@param {id} albumId - album's id to retrieve uri
*/
function playAlbum(albumId){
	$.get({
		url: "https://api.spotify.com/v1/albums/" + albumId,
		headers: bearerHeaders
	}).then(function(album){
		let uri = {context_uri : album.uri};
		$.ajax({
			method: "PUT",
			url: "https://api.spotify.com/v1/me/player/play",
			headers: bearerHeaders,
			data: JSON.stringify(uri)
		}).then( function(){
			$("#playButton").html("Pause");
			document.getElementById("playButton").onclick = pause;
		});
	});
}

/*
	@param {string} context - spotify context uri (album, artist, or playlist)
	@param {string} uris - list of track uris
	@param {number} offset - track number to start on in context or uri list.
							 Not valid within an artist context.
*/
function playSongs(context, uris, offset){
	let data;
	if(context)
		data = {context_uri : context};
	else if (uris){
		data = {uris : uris};
	}

	if(offset){
		data.offset = {"position" : offset};
	}

	$.ajax({
		method: "PUT",
		url: "https://api.spotify.com/v1/me/player/play",
		headers: bearerHeaders,
		data: JSON.stringify(data)
	}).then( function(){
		let playButton = document.getElementById("playButton");
		playButton.innerHTML = "Pause";
		playButton.onclick = pause;
		playButton.classList.add("active");
	});
}


//Resumes current playback context
function play(){
	$.ajax({
		method: "PUT",
		url: "https://api.spotify.com/v1/me/player/play",
		headers: bearerHeaders
	}).then( function(){
		let playButton = document.getElementById("playButton");
		playButton.innerHTML = "Pause";
		playButton.onclick = pause;
		playButton.classList.add("active");
	});
}

//pauses current playback context
function pause(){
	$.ajax({
		method: "PUT",
		url: "https://api.spotify.com/v1/me/player/pause",
		headers: bearerHeaders
	}).then( function(){
		let playButton = document.getElementById("playButton");
		playButton.innerHTML = "Play";
		playButton.onclick = play;
		playButton.classList.remove("active");
	});
}

//begins playback on previous track in current context
function previousTrack(){
	$.post({
		url: "https://api.spotify.com/v1/me/player/previous",
		headers: bearerHeaders
	});
}

//begins playback on next track in user's queue
function nextTrack(){
	$.post({
		url: "https://api.spotify.com/v1/me/player/next",
		headers: bearerHeaders
	});
}