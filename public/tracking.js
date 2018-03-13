/*
  Gets user's tracked artists and calls display and update functions.
*/
function getTracking(){
  return $.get({
    url: "https://api.spotify.com/v1/me",
    headers: bearerHeaders
  }).then(function(user){
    return $.get({
      url: "/latest",
      data : {"uId" : user.id},
    });
  }).then(function(response){
    displayTrackingPage(response);
    updateTrackingConcurrently(response, 0);
  }).catch(function(){
    refreshOrFail(arguments, getTracking, null);
  });
}

/*
  Checks unhidden tracked artist's newest release to see if
  they have become two weeks old since user's last visit.
*/
function updateHidden(){
  let uId;

  return $.get({
    url: "https://api.spotify.com/v1/me",
    headers: bearerHeaders
  }).then(function(user){
      uId = user.id;
      $.get({
        url: "/latest",
        data : {"uId" : uId},
        success : function(tracking){
          let deleteDate = new Date();
          deleteDate.setDate(deleteDate.getDate() - 14);
          for(i = 0; i < tracking.length; i++){
            if(tracking[i].hidden == "false"){
              let objDate = new Date(tracking[i].dateSeen);
              if(objDate.getTime() < deleteDate.getTime()){
                tracking[i].hidden = true;
                $.post("/latest", tracking[i]);
              }
            }
          }
        }
      });
  }).catch(function(){
      refreshOrFail(arguments, updateHidden, null);
  });
}

/*
  Checks artist's spotify catalog for newest release if their
  number of releases has changed since last update.
  @param{Array<Object>} data - information for latest release 
    of all artists user tracks
*/
function updateTrackingConcurrently(data){
  let requests = [];

  for(i = 0; i < data.length; i++){
    const index = i;
    let url = "https://api.spotify.com/v1/artists/" 
      + data[i].artistID + "/albums?market=US&limit=50";

    let request = {
      url : url,
      headers : bearerHeaders,
      success : function(albums){
        if(albums.total != data[index].numAlbums)
          processArtist(albums, data[index].artistID, data[index].artist, url);
      }
    };

    request.error = function (){
      console.log(arguments);
    };
    requests.push($.get(request));
  }

  $.when.apply($, requests).catch(function(){
      console.log(arguments);
  });
}

/*
  Call function to find latest release or get the rest of artist's albums
*/
function processArtist(albums, id, name, url){
  let artistAlbums = { "id": id,
                       "name": name,
                       "albums": []};
  if(albums.total <=50){
    artistAlbums.albums = albums.items;
    findLatestConcurrently(artistAlbums);
  }
  else{
    getAlbumsConcurrently(url, artistAlbums, albums.total, findLatestConcurrently);
  }
}

/*
  Fetch 50 of artist albums until all albums are received
*/
function getAlbumsConcurrently(url, artistAlbums, total, callback, error){
  url += "&offset=";
  let requests = [];
  for(i = 0; i < total; i+=50){
    let request = {
      url : url + i,
      headers: bearerHeaders,
      success : function(albums){
        Array.prototype.push.apply(artistAlbums.albums, albums.items);
      }
    };
    requests.push($.get(request));
  }

  $.when.apply($, requests).done(function(){
    callback(artistAlbums);
  }).catch(function(){
      console.log(arguments);
  });
}

/*
    Gets all full album objects from Spotify to access album release dates.
    @param {Object} artistAlbums - artist information and array of simplified album objects
*/
function findLatestConcurrently(artistAlbums){
  let requests = [];
  let url = "https://api.spotify.com/v1/albums/?ids=";
  for(i = 0; i < artistAlbums.albums.length; i+=20){
    let limit = Math.min(artistAlbums.albums.length, i + 20);

    let ids ="";
    for(j = i;  j < limit; j++){
      if(j < limit-1)
        ids += artistAlbums.albums[j].id + ","
      else
        ids += artistAlbums.albums[j].id;
    }
    let request = {
      url : url + ids,
      headers : bearerHeaders,
      success : function(albums){
        for(j = 0; j < albums.albums.length; j++){
          for(k = 0; k < artistAlbums.albums.length; k++){
            if(albums.albums[j].id==artistAlbums.albums[k].id){
              artistAlbums.albums[k].date = new Date(albums.albums[j].release_date);
            }
          }
        }
        if(artistAlbums.albums.length < 21){
          findLatest(artistAlbums);
        }
      }
    };
    requests.push($.get(request));
  }
  if(artistAlbums.albums.length > 20){
    $.when.apply($, requests).done(function(){
      findLatest(artistAlbums);
    }).catch(function(){
        console.log(arguments);
    });
  }
}

/*
  Finds and saves most recent release by the artist.
  @param {Object} artistAlbums - artist information and array of full album objects
*/
function findLatest(artistAlbums){
  let latest = {
    artistID : artistAlbums.id,
    artist : artistAlbums.name,
    albumID : null,
    album   : null,
    date : new Date(0),
    numAlbums : artistAlbums.albums.length
  };

  for(i = 0; i < artistAlbums.albums.length; i++){
    if(latest.date.getTime() < artistAlbums.albums[i].date.getTime()){
      latest.date = artistAlbums.albums[i].date;
      latest.albumID = artistAlbums.albums[i].id;
      latest.album = artistAlbums.albums[i].name;
    }
  }
  latest.dateSeen = new Date();
  latest.hidden = false;
  saveLatestAlbum(latest);
}

/*
  Save an artist's latest album release
  @param {Object} data - artist's latest release
*/
function saveLatestAlbum(data){
  $.get({
    url: "https://api.spotify.com/v1/me",
    headers: bearerHeaders
  }).then(function(user){
    data.uId = user.id
    return $.post("/latest", data);
  }).then(function(){
    addTrackingItem(data);
  }).catch(function(err){
    refreshOrFail(arguments, saveLatestAlbum, [data]);
  });
}

/*
  Remove an artist from user's tracking list
  @param {string} id - artist's spotify id
*/
function removeTracking(id){
  $.get({
    url: "https://api.spotify.com/v1/me",
    headers: bearerHeaders
  }).then(function(user){
    return $.post("/latest", {id : id, uId : user.id}, function(response){
      removeTrackingItem(id);
    });
  }).catch(function(){
    refreshOrFail(arguments, removeTracking, [id]);
  });
}

/*
  Hide an artist from a user's "New" tracking spotify list
  @param {string} id - artist's spotify id
*/
function removeNew(id){
  $.get({
    url: "https://api.spotify.com/v1/me",
    headers: bearerHeaders
  }).then(function(user){
    return $.post("/latest", {id : id, uId : user.id, hidden : "true"}, function(response){
      removeTrackingItem(id);
    }).catch(function(){
      refreshOrFail(arguments, removeNew, [id]);
  });   
});
}