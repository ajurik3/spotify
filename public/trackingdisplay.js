/*
  Creates tracking navigation tabs and initializes results node

  @param {Array<Object>} tracking - latest release by each artist the user follows
*/
function displayTrackingPage(tracking){
  let mainDisplay = document.getElementById("loggedin");
  mainDisplay.innerHTML = "";

  let nav = document.createElement("ul");
  nav.className = "nav nav-tabs";

  tracking.new = tracking.filter(result => result.hidden=="false");

  addNavItem.call(nav, "New", "active display-nav", "tracking-new", addTrackingBody, tracking.new, "new");
  addNavItem.call(nav, "Show All", "display-nav", "tracking-all", addTrackingBody, tracking, "all");
  nav.firstChild.firstChild.className += " active";

  let trackingDiv = document.createElement("div");
  trackingDiv.id = "tracking";

  mainDisplay.appendChild(nav);
  mainDisplay.appendChild(trackingDiv);

  if(tracking.new.length > 0){
    displayTracking(tracking.new, "new");
  }
  else
    trackingDiv.className = "all";
}

/*
  Creates headers for display of the artist, their latest release, and release date

  @param {Array<Object>} tracking - latest release by each artist the user tracks
  @param {string} trackingClass - "new": only artists with recent releases are shown
                                  "all": all followed artists are shown
*/
function displayTracking(tracking, trackingClass){
  let trackingDisplay = document.getElementById("tracking");
  trackingDisplay.innerHTML = "";
  if(trackingClass)
    trackingDisplay.className = trackingClass;

  let headerRow = document.createElement('div');
  headerRow.className = "row header-row mt-4";
  headerRow.id = "tracking-header-row";
  let blankCol = getColHeader("&#9658;", 1);
  blankCol.style.visibility = "hidden";
  headerRow.appendChild(blankCol);
  headerRow.appendChild(getColHeader("Artist", 3, "sort-desc"));
  headerRow.appendChild(getColHeader("Album", 4, "sort-desc"));
  headerRow.appendChild(getColHeader("Date", 2, "sort-desc"));
  trackingDisplay.appendChild(headerRow);

  sortTracking("Date", -1);
}

/*
  For each artist, displays play button, name, release name, release date, and option button

  @param {Array<Object>} tracking - latest release by each artist the user follows
*/
function addTrackingBody(tracking, trackingClass){
  let trackingDisplay = document.getElementById("tracking");

  if(!trackingClass)
    trackingClass = trackingDisplay.className;
  else
    trackingDisplay.className = trackingClass;

  if(trackingClass=="new")
    tracking = tracking.filter(result => result.hidden=="false");

  let trackingBody = getEmptyEnclosure("tracking-body");

  for(i = 0; i < tracking.length; i++){
    addTrackingRow.call(trackingBody, i, tracking[i]);
  }
  trackingDisplay.append(trackingBody);
  checkLibrary("playable");
}

/*
  Add a recently added item to current tracking display.
  @param {Object} data - information for new tracking item.
*/
function addTrackingItem(data){
  let trackingBody = document.getElementById("tracking-body");
  if(!trackingBody)
    return;

  let trackingArtists = Array.from(document.getElementsByClassName("artist"));
  trackingArtists.forEach(artist => {
    if(artist.id === data.id)
      trackingBody.removeChild(artist.parentNode);
  });

  addTrackingRow.call(trackingBody, trackingArtists.length, data);
}

/*
  Remove a recently removed item from current tracking display.
  @param {string} id - id of newly removed item
*/
function removeTrackingItem(id){
  let trackingBody = document.getElementById("tracking-body");
  if(!trackingBody)
    return;
  let trackingArtists = Array.from(document.getElementsByClassName("artist"));
  trackingArtists.forEach(artist => {
    if(artist.id === id)
      trackingBody.removeChild(artist.parentNode);
  });

}

/*
  Add a row to tracking display for an individual artist's latest album release
  @param {number} i - index of artist in array of tracked artists
  @param {Object} data - artist and album release information

*/
function addTrackingRow(i, data){
  let currentRow = getPlayableRow(i, "result", "result" + i, "border-top:1px solid #ddd;");

  addColLink.call(currentRow, "&#9658;",1, "play", "play" + i, "visibility:hidden;", playAlbum, data.albumID);

  addColLink.call(currentRow, data.artist, 3, "artist text-overflow", data.artistID, 
    "float:left;", getArtistPage, data.artistID, data.artist);

  addColLink.call(currentRow, data.album, 4, "album playable text-overflow", data.albumID,0,
    getAlbumPage, data.albumID);

  currentRow.appendChild(getColDate(data.date, 2, "date", "date" + i));
    
  addOptionButtonCol.call(currentRow, i, 2, "-t");

  this.appendChild(currentRow);
}

/*
  Updates navigation tab to reflect recently changed data
  @param {Array<Object>} tracking - information for all of a user's artists and their latest releases
*/
function updateTrackingNavItems(tracking){
  tracking.new = tracking.filter(result => result.hidden=="false");
  let tnew = document.getElementById("tracking-new");
  let all = document.getElementById("tracking-all");

  tnew.onclick = function(){
    setActive(tnew);
    addTrackingBody(tracking.new, "new");
  };

  all.onclick = function(){
    setActive(all);
    addTrackingBody(tracking, "all");
  }
}

/*
  Reads sorting order from header class and updates header class.

  @param {DOM Node} col - header element clicked to trigger sort
  @param {string} data - data used to sort the table
*/
function sortTable(col, data){
  if(col.classList.contains("sort-asc")){
    col.classList.remove("sort-asc");
    col.classList.add("sort-desc");
    var order = -1;
  }
  else if(col.classList.contains("sort-desc")){
    col.classList.remove("sort-desc");
    col.classList.add("sort-asc");
    var order = 1;
  }

  sortTracking(data, order);
}

/*
  @param {string} data - data used to sort the table
  @param {number} order - -1: sort in descending order
                           1: sort in ascending order
*/
function sortTracking(data, order){
  if(data=="Artist")
    var func = compareArtists;
  else if(data=="Album")
    var func = compareAlbums;
  else if(data=="Date")
    var func = compareDates;

  $.get({
    url: "https://api.spotify.com/v1/me",
    headers: bearerHeaders
  }).then(function(user){
    return $.get({
      url: '/latest',
      data : {'uId' : user.id},
      success : function(response){
        if(order===0)
          addTrackingBody(response);
        else if(order===1)
          addTrackingBody(response.sort(func));
        else if(order===-1)
          addTrackingBody(response.sort(func).reverse());
      }, 
      error : function(){
        console.log(arguments);
      }
    });
  }).catch(function(err){
    refreshOrFail(arguments, sortTracking, [data, order]);
  });
}

function compareArtists(a, b){
  a = a.artist.toLowerCase();
  b = b.artist.toLowerCase();

  if(a < b)
    return -1;
  if(a > b)
    return 1;
  if (a==b)
    return 0;
}

function compareAlbums(a, b){
  a = a.album.toLowerCase();
  b = b.album.toLowerCase();

  if(a < b)
    return -1;
  if(a > b)
    return 1;
  if (a==b)
    return 0;
}

function compareDates(a, b){
  a = new Date(a.date);
  b = new Date(b.date);

  if(a.getTime() < b.getTime())
    return -1;
  if(a.getTime() > b.getTime())
    return 1;
  if (a.getTime()==b.getTime())
    return 0;
}