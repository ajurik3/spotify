
/*
  Get album information to initialize display
  @param {string} id - album id
*/
function getAlbumPage(id){
	let url = "https://api.spotify.com/v1/albums/" + id;
	$.get({url: url, headers : bearerHeaders}).then(function(album){
		displayAlbumPage(album);
	}).catch(function(){
		refreshOrFail(arguments, getAlbumPage, [id]);
	});
}

/*
  Replaces main display with album page header and body
  @param {object} album - full spotify album object
*/
function displayAlbumPage(album){
	let main = document.getElementById("loggedin");
  main.innerHTML = "";

  let albumDisplay = document.createElement("div");
  albumDisplay.className = "container album-page";
  albumDisplay.id = "album-page";

  let albumHead = getAlbumHeader(album);
  albumDisplay.appendChild(albumHead);

  let trackDisplay = document.createElement("div");
  trackDisplay.className = "mt-5";
  trackDisplay.id = "album-page-body";

  getTrackDisplay(album.tracks.items, trackDisplay);
  albumDisplay.appendChild(trackDisplay);

  main.appendChild(albumDisplay);
  checkLibrary("playable");
}

/*
  Displays album page header containing track info and options
  @param {Array<Object>} tracks - full spotify track objects in album
  @param {Object} trackDisplay - reference to target DOM element for display
*/
function getTrackDisplay(tracks, trackDisplay){

  if(trackDisplay===undefined)
    trackDisplay = document.getElementById("album-page-body");

  trackDisplay.innerHTML = "";

  for(i = 0; i < tracks.length; i++){
    const num = i;
    let currentRow = getPlayableRow(i, "album-page-data result", "result" + i, "border-top: thin solid #ddd;border-bottom:1px solid #ddd;");

    addColLink.call(currentRow, num+1,1, "play", "play" + i, "play", getURIs, tracks, i);

    let track = getColData(tracks[i].name, 8, "playable track", tracks[i].id);
    currentRow.appendChild(track);

    addOptionButtonCol.call(currentRow, i, 2);
    let time = getColData(getDisplayTime(tracks[i].duration_ms), 1, "time", "time+i");
    currentRow.appendChild(time);
    trackDisplay.appendChild(currentRow);
  }
}

/*
  @param {number} ms - track play time in ms
  @return {string} - track play time in minutes:seconds format (ex. 4:05)
*/
function getDisplayTime(ms){
  let seconds = Math.round(ms/1000);
  let minutes = Math.floor(seconds/60);
  seconds %= 60;
  let zero = (seconds < 10) ? "0" : "";
  return minutes + ":" + zero + seconds;
}

/*
  Creates album header containing album image, title, artist, and options
  @param {Object} album - full spotify album object
  @return {Object} DOM element containing album header
*/
function getAlbumHeader(album){
	let albumHead = document.createElement("div");
  albumHead.className = "row album-head";

  addColImage.call(albumHead, album.images[getImageIndex(album.images)].url,
      2, "artist-image", 0, "max-width:100%;");

  let headContent = document.createElement("div");
  headContent.className = "col-sm-8";
  headContent.id = "album-head-content";

  albumHead.appendChild(headContent);

  let nameRow = document.createElement("div");
  nameRow.className = "row album-name font-weight-bold";
  nameRow.appendChild(getColData(album.name, 9, 0, 0, "font-size:150%;"));

  let artistRow = document.createElement("div");
  artistRow.className = "row";

  if(album.artists.length==1)
  	var artistCol = getColLink(album.artists[0].name, 9, "artist-name font-weight-bold", 0,
      getArtistPage, album.artists[0].id, album.artists[0].name);
  else{
  	let artists = album.artists.map(artist => artist.name);
    var artistCol = getColData.call(artistRow, artists.join(", "), 9);
  }
  artistCol.style.fontSize = "125%";
  artistRow.appendChild(artistCol);

  let options = document.createElement("div");
  options.className = "row mt-2";
  addColLink.call(options, "Play", 1, 0, 0, 0, playSongs, album.uri);

  headContent.appendChild(nameRow);
  headContent.appendChild(artistRow);
  headContent.appendChild(options);

  return albumHead;
}