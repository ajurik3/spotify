/*
  Append one track or up to 50 tracks from an album to a playlist.  Only
  the album or track parameter should be defined.
  @param {string} album - album id
  @param {string} playlist - playlist id
  @param {string} track - track id
*/
function playlistAppend(album, playlist, track){

	let trackURIs;
	let url = album ? ("albums/" + album +"/tracks?limit=50"): ("tracks/" + track);

	$.get({
		url : "https://api.spotify.com/v1/" + url,
		headers: bearerHeaders
	}).then(function(tracks){
		trackURIs= album ? tracks.items.map(track => track.uri) : [tracks.uri];
		return $.get({
			url: "https://api.spotify.com/v1/me",
			headers: bearerHeaders
		});
	}).then(function(user){
		let url = "https://api.spotify.com/v1/users/" + user.id + "/playlists/" + playlist + "/tracks";
		let data = {'uris' : trackURIs};
		return $.post({
			url: url,
			headers: bearerHeaders,
			data : JSON.stringify(data)
		});
	}).catch(function(err){
		refreshOrFail(arguments, playlistAppend, [album, playlist]);
	});
}

/*
  Get all of a user's playlists
  @param {Object} success - function to be called on success
  @param param - success function's parameters
*/
function getPlaylists(success, param){
	$.get({
		url: "https://api.spotify.com/v1/me",
		headers: bearerHeaders
	}).then( function(user){
		return $.get({
		url:"https://api.spotify.com/v1/users/" + user.id + "/playlists",
		headers:bearerHeaders});
	}).then(function(playlists){
		success(playlists.items, param);
	}).catch(function(){
		refreshOrFail(arguments, getPlaylists, [success]);
	});
}

/*
  Creates a playlist for the user with the same name as the source playable
  and adds it to local database if it is temporary
  @param {Object} source - playable name and id
  @param {boolean} temp - true if playlist is to be temporary
*/
function createPlaylist(source, temp){
	console.log(arguments);
  let description = "";
  let uId;

  if(temp){
    var archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() + 21);
    description = "Playlist will be archived on " + getDateDisplay(archiveDate) + ".";
  }
  let playlist = {
    name : source.playName,
    description : description
  };

  $.get({
    url: "https://api.spotify.com/v1/me",
    headers: bearerHeaders
  }).then( function(user){
    uId = user.id;
    return $.post({
      url: "https://api.spotify.com/v1/users/" + uId + "/playlists",
      headers : {
        'Authorization' : 'Bearer ' + access_token,
        'Content-Type'  : 'application/json'
      },
      data : JSON.stringify(playlist)
    });
  }).then(function(playlist){

    if(temp){
      playlist.archiveDate = archiveDate;
      playlist.uId = uId;
      $.post('/temp', playlist);
    }

    if(source.type=="album")
      	playlistAppend(source.playId, playlist.id);
    else
      	playlistAppend(0, playlist.id, source.playId);

  }).catch(function(err){
    refreshOrFail(arguments, createPlaylist, [source, temp]);
  });
}

/*
  Checks dates of user's temporary playlists to determine if they should be archived.
*/
function checkTempPlaylists(){
  $.get({
    url: "https://api.spotify.com/v1/me",
    headers: bearerHeaders
  }).then(function(user){
    let uId = user.id;
	$.get({url : '/temp', data: {'uId' : uId},
      success : function(playlists){
        let now = new Date();
        for(i = 0; i < playlists.length; i++){
          let archiveDate = new Date(playlists[i].archiveDate);
          if(archiveDate.getTime() < now.getTime()){
            archivePlaylist(playlists[i]);
          }
        }
      }
    });
  }).catch(function(){
      refreshOrFail(arguments, checkTempPlaylists, null);
  });
}

/*
  Deletes a user's temporary playlist on spotify and saves the tracks which were on the playlist locally.
  @param {Object} archived - local playlist object to be archived
*/
function archivePlaylist(archived){
	let url = "https://api.spotify.com/v1/users/" + archived.uId + "/playlists/" + archived.id + "/tracks";
	let trackURIs;
	$.get({url: url, headers : bearerHeaders}).then(function(playlist){
		trackURIs = playlist.items.map(track => track.track.uri);
		archived.tracks = trackURIs;
		return $.post('/temp', archived);
	}).then(function(){
		let url = "https://api.spotify.com/v1/users/" + archived.uId + "/playlists/" + archived.id + "/followers";
		$.ajax({
			method: "DELETE",
			url : url,
			headers: bearerHeaders
		});
	}).catch(function(err){
    	refreshOrFail(arguments, archivePlaylist, [archived]);
  	});
}