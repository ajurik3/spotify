/*
  Requests artist info, albums, and top tracks to display the artist's page.
  @param {string} id - artist id
  @param {string} name - artist name
*/
function getArtistPage(id, name){
  let artistAlbums = {artistID : id, artist : name, albums : []};

  let artist = new Promise(function(resolve, reject){
    $.get({
      url: "https://api.spotify.com/v1/artists/" + id,
      headers: bearerHeaders,
      success: function(artist){
        resolve(artist);
      }
    });
  });
  let url = 'https://api.spotify.com/v1/artists/' + id + '/albums?market=US&limit=50';
  let albums = new Promise(function(resolve, reject){
    $.get({
        url : url,
        headers :bearerHeaders,
        success : function(albumResponse){
            if(albums.total <=50){
                artistAlbums.albums = albumResponse.items;
                resolve(artistAlbums);
            }
            else{
                getAlbumsConcurrently(url, artistAlbums, albumResponse.total, resolve, reject);
            }
        }
      });
  });

  let topTracks = new Promise(function(resolve, reject){
    $.get({
      url: "https://api.spotify.com/v1/artists/" + id + "/top-tracks/?country=US",
      headers: bearerHeaders,
      success: function(tracks){
        resolve(tracks);
      }
    });
  });

  $.when(artist, albums, topTracks).done( function(artistResponse, albumResponse, trackResponse){
    displayArtistPage(artistResponse, albumResponse, trackResponse.tracks);
  }).catch(function(){
    console.log(arguments);
    refreshOrFail(arguments, getArtistPage, [id, name]);
  });
}

/*
  Creates and initiates display of artist page header, navigation tabs,
  and content display.
  @param {Object} artist - spotify artist object
  @param {Array<Object>} artistAlbums - artist id, name and simplified album objects
  @param {Array<Object>} topTracks - artist top tracks
*/
function displayArtistPage(artist, artistAlbums, topTracks){

	let div = document.getElementById("loggedin");
  div.innerHTML = "";

  let artistDisplay = document.createElement("div");
  artistDisplay.className = "container artist-page";

  let artistHead = getArtistHeader(artist);
  artistDisplay.appendChild(artistHead);

  let albumNavRow = document.createElement("div");
  albumNavRow.className = "album-nav-row mt-4";
  setAlbumNavRow(albumNavRow, artist, artistAlbums.albums, topTracks);
  artistDisplay.appendChild(albumNavRow);

  let albumDisplay = document.createElement("div");
  albumDisplay.id = "artist-page-body";

  getAlbumDisplay(topTracks, albumDisplay);
  artistDisplay.appendChild(albumDisplay);

  div.appendChild(artistDisplay);
}

/*
  Displays albums for the artist or their top tracks.
  @param {Array<Object>} data - albums or tracks to be displayed
  @param {Object} div - containing HTML element
*/
function getAlbumDisplay(data, div){
  if(div===undefined)
    div = document.getElementById("artist-page-body");

  div.innerHTML = "";

  for(i = 0; i < data.length; i++){
    const num = i;
    let currentRow = getPlayableRow(i, "result", "result" + i, "border-bottom:1px solid #ddd;");

    if(data[i].type == "track")
      var playAnchor = getColLink("&#9658;",1, "play", "play" + i, getURIs, data, i);
    else
      var playAnchor = getColLink("&#9658;",1, "play", "play" + i, playAlbum, data[i].id);
    playAnchor.style.visibility = "hidden";
    currentRow.appendChild(playAnchor);

    let result = document.createElement("div");
    result.className = "col-sm-8 playable artist-page-data";
    result.id = data[i].id;
    
    if(data[i].type=="track"){
      result.innerHTML = data[i].name;
      result.className += " " + "track";
    }
    else{
      let albumAnchor = getColLink(data[i].name, 8, "album text-overflow", data[i].id, getAlbumPage, data[i].id);
      result.appendChild(albumAnchor);
      result.className += " " + "album";
    }
    currentRow.appendChild(result);

    addOptionButtonCol.call(currentRow,i, 3);
    div.appendChild(currentRow);
  }
  checkLibrary("playable");
}

/*
  Gets all track uris from an array of playables.
  @param {Array<Object>} tracks - array of playable objects
  @param {number} offset - position of clicked track in array
*/
function getURIs(tracks, offset){
  let trackURIs = tracks.filter(track => track.type == "track");
  trackURIs = trackURIs.map(track => track.uri);
  playSongs(0, trackURIs, offset);
}

/*
  Creates navigation tabs for album categories and top tracks and
  filters album data into their appropriate categories.

  @param {Object} albumNavRow - containing HTML element
  @param {Object} artist - spotify artist object
  @param {Array<Object>} albums - simplified album objects
  @param {Array<Object>} topTracks - artist top tracks
*/
function setAlbumNavRow(albumNavRow, artist, albums, topTracks){
  if(albumNavRow===undefined)
    albumNavRow = document.getElementById("album-nav-row");

  //removes albums with duplicate names
  if(albums.length > 1){
    for(i = 1; i < albums.length; i++)
      if(albums[i].name === albums[i-1].name)
        albums[i].album_type = "";
  }

  let albumNavigation = document.createElement("ul");
  albumNavigation.style.marginLeft = "-15px";
  albumNavigation.style.marginRight = "-15px";
  albumNavigation.className = "nav nav-tabs";
  albumNavRow.appendChild(albumNavigation);

  let fullAlbums = albums.filter(album => album.album_type === "album");
  let singles = albums.filter(album => album.album_type === "single");
  let compilations = albums.filter(album => album.album_type === "compilation");
  let primaryAlbums = [];
  let primarySingles = [];
  let appearanceAlbums = [];

  fullAlbums.forEach(function(album){
    if(album.artists.some(albumArtist => albumArtist.name === artist.name))
      primaryAlbums.push(album);
    else
      appearanceAlbums.push(album);
  });

  singles.forEach(function(single){
    if(single.artists.some(albumArtist => albumArtist.name === artist.name))
      primarySingles.push(single);
    else
      appearanceAlbums.push(single);
  });

  addNavItem.call(albumNavigation, "Top Tracks", "active display-nav", "album-nav-popular", getAlbumDisplay, topTracks);
  addNavItem.call(albumNavigation, "Albums", "display-nav", "display-nav-albums", getAlbumDisplay,primaryAlbums);
  addNavItem.call(albumNavigation, "Singles", "display-nav", "display-nav-singles", getAlbumDisplay,primarySingles);
  addNavItem.call(albumNavigation, "Compilations", "display-nav", "display-nav-comp", getAlbumDisplay,compilations);
  addNavItem.call(albumNavigation, "Appears On", "display-nav", "display-nav-appears", getAlbumDisplay,appearanceAlbums);

  albumNavigation.firstChild.firstChild.className += " active";
}

/*
  Sets clicked navigation tab to active and removes active from classlist of any similar tabs.
  @param {Object} active - HTML element selected to be active
*/
function setActive(active){
  if(!active.classList.contains("active")){
    let current = document.getElementsByClassName("display-nav active")[0];
    current.classList.remove("active");
    current.firstChild.classList.remove("active");
    active.classList.add("active");
    active.firstChild.classList.add("active");
  }
}
/*
  Creates and displays artist page header including artist image and name, as well as
  play and follow options.
  @param {Object} artist - spotify artist object
*/
function getArtistHeader(artist){
	  let artistHead = document.createElement("div");
  	artistHead.className = "row artist-head";
  	artistHead.id = "artist-head";

    addColImage.call(artistHead, artist.images[getImageIndex(artist.images)].url,
      2, "artist-image", 0, "max-width:100%;");

  	let headContent = document.createElement("div");
  	headContent.className = "col-sm-8";
  	headContent.id = "artist-head-content";

  	artistHead.appendChild(headContent);

  	let nameRow = document.createElement("div");
  	nameRow.className = "row artist-name font-weight-bold";
  	let nameCol = getColData(artist.name, 9, 0, 0);
  	nameCol.style.fontSize = "150%";
  	nameRow.appendChild(nameCol);

  	let options = document.createElement("div");
  	options.className = "row mt-2";

  	headContent.appendChild(nameRow);
  	headContent.appendChild(options);

  	let play = getColLink("Play",1, 0, 0, playSongs, artist.uri);
  	let follow = getColLink("Follow",1, 0, 0, searchAlbums, artist);
  	follow.style.borderLeft = "thin solid silver";

  	options.appendChild(play);
  	options.appendChild(follow);

  	return artistHead;
}

/*
  Finds the image with the smallest width greater than 160 in an array of images,
  or the first image if none exists.
  @param {Array<Object>} images - array of image locations and metadata
*/
function getImageIndex(images){
	let index = 0;
	for(i = 0; i < images.length; i++){
		if(images[i].width > 160)
			index = i;
		else
			break;
	}

	return index;
}