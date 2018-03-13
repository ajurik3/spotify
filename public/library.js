/*
	Called to add or remove a playable from the user's library

	@param {string} id - id of the playable
	@param {string} type - type of the playable
	@param {string} methodType - type of ajax request to perform
		"PUT" to add to library
		"DELETE" to remove
*/
function toggleLibrary(id, type, methodType){
	let url = "https://api.spotify.com/v1/me/" + type + "s";

	$.ajax({
		method: methodType,
		url : url,
		headers : {"Authorization" : "Bearer " + access_token, 
					"Content-Type" : "application/json"}, 
		error : function(){
			refreshOrFail(arguments, toggleLibrary, [id, type, methodType]);
		},
		data : JSON.stringify({"ids" : [id]})
	});
}

/*
	Checks whether displayed playables are present in user's library
	@param {string} rowClass - class of playable element in DOM
*/
function checkLibrary(rowClass){

	let nodes = document.getElementsByClassName(rowClass);

	if(nodes.length===0)
	  return;
	else if(nodes.length > 50){
	  var playables = Array.from(nodes).slice(0, 50);
	}
	else
		var playables = Array.from(nodes);

	let sortedPlayables = getSortedPlayables(playables);

	if(sortedPlayables.tracks.length){
		let ids = sortedPlayables.tracks.map(playable => playable.id);
		ids = ids.join(",");

		var tracks = $.get({
	  		url : "https://api.spotify.com/v1/me/tracks/contains/?ids=" + ids,
	  		headers : bearerHeaders,
	  		success : function(result){
	  		  if(sortedPlayables.albums.length)
	  		  	return;
	  		  for(i = 0; i < sortedPlayables.tracks.length; i++){
	    		if(result[i])
	      		  sortedPlayables.tracks[i].parentNode.className += " lib";
			  }
	  		},
	  		error: function(){
	  			console.log("https://api.spotify.com/v1/me/tracks/contains/?ids=" + ids);
	   		  refreshOrFail(arguments,checkLibrary, [rowClass]);
	   		}
		});
	}

	if(sortedPlayables.albums.length){
		let ids = sortedPlayables.albums.map(playable => playable.id);
		ids = ids.join(",");

		var albums = $.get({
	  	  url : "https://api.spotify.com/v1/me/albums/contains/?ids=" + ids,
	  	  headers : bearerHeaders,
	  	  success : function(result){
	  	  	if(sortedPlayables.tracks.length)
	  		  	return;
	  	    for(i = 0; i < sortedPlayables.albums.length; i++){
	    	  if(result[i])
	            sortedPlayables.albums[i].parentNode.className += " lib";
			}
	  	  },
	  	  error: function(){
	  	  	console.log("https://api.spotify.com/v1/me/albums/contains/?ids=" + ids);
	   	    refreshOrFail(arguments,checkLibrary, [rowClass]);
	   	  }
		});
	}

	if(tracks&&albums){
		when(tracks&&albums).done(function(trackResponse, albumResponse){
			console.log("both tracks and albums");
		});
	}
}

/*
	@param {Array<Object>} results - DOM elements which must have album or track class
	@return {Object} object with arrays of all results of each type
*/
function getSortedPlayables(results){
	let playables = {
		tracks : [],
		albums : []
	};

	results.forEach(result => {
		if(result.classList.contains("track"))
			playables.tracks.push(result);
		else
			playables.albums.push(result);
	});

	return playables;
}