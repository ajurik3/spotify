/*
  Retrieves user input and initiates search function for at most 10 artists
*/
function spotifySearchInit(){
  let input = document.getElementById("spotifySearchInput").value;

  if(input=="")
    return;
  input = encodeURIComponent(input + '*');

  input = "q=" + input + "&type=artist&limit=10"
  spotifySearch("https://api.spotify.com/v1/search?" + input, false);
}

/*
  Performs spotify search with a given url and offset
  @param {string} searchURL - full spotify search query url
  @param {number} offset - optional offset parameter to add to searchURL
*/
function spotifySearch(searchURL, offset){
  if(offset){
      searchURL += "&offset=" + offset;
  }
    
  $.get({
    url : searchURL,
    headers: bearerHeaders,
    success : function(response){
      displaySpotifySearchResults(response.artists);
    },
    error : function(response){
      refreshOrFail(arguments, spotifySearch, [searchURL, offset]);
    }
  });
}

/*
  Displays artist objects returned from spotify search
  @param {object} artistResults - object containing resulting artist array and metadata
*/
function displaySpotifySearchResults(artistResults){
  var div = document.getElementById("loggedin");
  div.innerHTML = "";

  let searchDisplay = document.createElement('div');
  let results = artistResults.items;

  for(i = 0; i < results.length; i++){
    let currentRow = document.createElement('div');
    currentRow.className = "row py-2 my-0";
    currentRow.setAttribute("style", "border-top:thin solid #ddd;");

    addColLink.call(currentRow, results[i].name, 10, "artist", results[i].id, 0, getArtistPage, results[i].id, results[i].name)

    addColLink.call(currentRow, "Track this Artist", 2, 0, 0, 0, searchAlbums, {'id':results[i].id,'name':results[i].name});
    searchDisplay.appendChild(currentRow);
  }

  if(searchDisplay.childElementCount > 0){
    searchDisplay.appendChild(createFooter(artistResults));
  }

  div.appendChild(searchDisplay);
}

/*
  Retrieve all albums from specified artist
  @param {Object} artist - spotify artist object
*/
function searchAlbums(artist){
  getTracking().then(function(){
    let url = ('https://api.spotify.com/v1/artists/' + artist.id + '/albums?market=US&limit=50');
    $.get({
      url : url,
      headers :bearerHeaders,
      success : function(albums){
        let artistAlbums = {'id': artist.id, 'name': artist.name,'albums': []};
        if(albums.total <= 50){
          artistAlbums.albums = albums.items;
          findLatestConcurrently(artistAlbums);
        }
        else
          getAlbumsConcurrently(url, artistAlbums, albums.total, findLatestConcurrently);
      },
      error : function(){
        refreshOrFail(arguments, searchAlbums, [artist]);
      }
    });
  });
}

/*
  Creates table footer displaying result indices and navigation links
*/
function createFooter(results){
  let footer = document.createElement('div');
  footer.className = "row py-2 my-0";
  footer.setAttribute("style", "border-top:thin solid silver;");

  let offset = results.offset;
  let limit = results.limit;
  let total = results.total-1;

  footer.appendChild(getColData("Displaying Results " + (offset+1) + "-" + ((offset+limit < total+1) ? offset+limit : total+1), 
    3, 0, 0, "margin-right:-30px;padding-right:-30px;"));

  if(offset>0){
    addColLink.call(footer, "Start", 1, 0, 0, "margin-left:-15px;margin-right:-15px;", searchIndex, 0, results);
  }
  if(offset>9){
    addColLink.call(footer, "Prev", 1, 0,0, "margin-left:-15px;margin-right:-15px;", searchIndex, offset - limit, results);
  }
  if(offset < total-20){
    addColLink.call(footer, "Next", 1, 0,0, "margin-left:-15px;margin-right:-15px;", searchIndex, offset + limit, results);
  }
  if(offset < total-10){
    addColLink.call(footer, "Last", 1, 0,0, "margin-left:-15px;margin-right:-15px;", searchIndex, total - limit, results);
  }
  return footer;
}

/*
  Initiates new spotify search from previous search but with a new search offset
  @param {number} index - new search offset
  @param {object} results - results from previous search
*/
function searchIndex(index, results){
  let query = results.href;
  query = query.substring(query.indexOf('?')+1);

  var queryParams = {};
  var e, r = /([^&;=]+)=?([^&;]*)/g;

  while ( e = r.exec(query)) {
    queryParams[e[1]] = decodeURIComponent(e[2]);
  }

  if(queryParams.offset){
    queryParams.offset = index;
    spotifySearch("https://api.spotify.com/v1/search?" + $.param(queryParams, true), false);
  }
  else
    console.log("Invalid query.");
}