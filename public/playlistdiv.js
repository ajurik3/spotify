/*
  Creates a Bootstrap container with rows containing user's playlists. Clicking
  these rows adds the active playable to the corresponding spotify playlist.
  @param {Array<Object>} playlists - the user's Spotify playlists
*/
function createPlaylistsDiv(playlists){
  removeExistingDivs();

  var playlistsDiv = document.createElement("div");
  playlistsDiv.className = "container text-overflow hover-content playlistDiv";
  playlistsDiv.setAttribute("style", "position:absolute;z-index:1;display:block;width:200px;overflow-y:auto;top:0;left:0;visibility:hidden;background-color:silver;");

  for(i = 0; i < playlists.length; i++){
    addMenuItem.call(playlistsDiv, playlists[i].name, playlists[i].id, "col-s-12 playlist dropdown", addToPlaylist);
  }

  document.body.appendChild(playlistsDiv);
}

/*
  Retrieves playlist id from event target and album id from active node in order
  to cal playlistAppend
  @param {Object} event - click event with target's HTML id set to playlist id
*/
function addToPlaylist(event){
  let rowNode = document.getElementsByClassName("result active")[0];
  let playlistId = event.target.id;
  let tracksInfo = getTracksInfo(rowNode);

  playlistAppend(tracksInfo.playId, playlistId);
  let playlistDiv = document.getElementsByClassName("playlistDiv")[0];
  document.body.removeChild(playlistDiv);
}

/*
  Extracts artist and playable information from a Bootstrap row
  by examining the values of attributes of its child nodes.

  @param {Object} rowNode - HTML DOM node containing playable information
*/
function getTracksInfo(rowNode){
  let row = rowNode.childNodes;
  
  for(i = 0; i < row.length; i++){
    if(row[i].classList.contains("artist")){
      var artistId = row[i].id;
      var artist = row[i].innerHTML;
    }
    else if(row[i].classList.contains("album")){
      var playId = row[i].id;
      var playName = row[i].innerHTML;
      var type = "album";
    }
    else if(row[i].classList.contains("date")){
      var date = row[i].innerHTML;
    }
    else if(row[i].classList.contains("track")){
      var playId = row[i].id;
      var playName = row[i].innerHTML;
      var type = "track";
    }
  }

  return {artistId : artistId, artist: artist, playId : playId, playName: playName, date: date, type: type};
}

/*
  Determine menu position relative to column
  @param {Object} menu - Bootstrap container of menu item rows
  @param {Object} col - Bootstrap column which triggered menu creation
*/
function setDivLocation(menu, col){
  let colRect = col.getBoundingClientRect();
  let divRect = getDivRect(menu, colRect);

  if(divRect.width + colRect.right < window.innerWidth)
    menu.style.left = colRect.right + "px";
  else
    menu.style.left = (colRect.left - divRect.width) + "px";

  if(menu.classList.contains("playlistDiv"))
    setLeaveListeners(menu, col);

  let scrollTop = $(window).scrollTop();
  if(divRect.down){
    menu.style.top = (colRect.top + scrollTop) + "px";
  }
  else{
    let top = colRect.bottom + scrollTop - divRect.height;
    menu.style.top = top + "px";
  }
  menu.style.visibility = "visible";
}


function setLeaveListeners(playlistDiv, plSelect){
  plSelect.onmouseleave = function(event){
    hoverOffPlSelect(event, playlistDiv, plSelect);
  };
  playlistDiv.onmouseleave = function(event){
    hoverOffPlay(event, playlistDiv);
  };
}

/*
  Restore contextMenu's default onmouseleave attribute if mouse is still
  on contextMenu
  @param {Object} event - plSelect mouseleave event
  @param {Object} playlistDiv - HTML DOM node containing playlistDiv
  @param {Object} plSelect - HTML DOM node containing plSelect
*/
function hoverOffPlSelect(event, playlistDiv, plSelect){
  let plRect = plSelect.getBoundingClientRect();
  let y = event.clientY;

  if(y <= plRect.top||y >= plRect.bottom){
    let contextMenu = plSelect.parentNode.parentNode;
    contextMenu.onmouseleave = function(){leaveMenu(contextMenu)};
    playlistDiv.style.visibility = "hidden";
  }
}

/*
  Removes playlistDiv from document and removes contextMenu if mouseleave
  event does not occur near contextMenu.
  @param {Object} event - playlistDiv mouseleave event
  @param {Object} playlistDiv - HTML DOM node containing playlistDiv
*/
function hoverOffPlay(event, playlistDiv){
  let x = event.clientX;
  let y = event.clientY;
  let playRect = playlistDiv.getBoundingClientRect();

  let contextMenu = document.getElementsByClassName("context-menu")[0];

  if(!contextMenu){
    document.body.removeChild(playlistDiv);
    return;
  }

  let contextRect = contextMenu.getBoundingClientRect();
  let oppositeSide = (playRect.left < contextRect.left) ? (x <= playRect.left) : (x >=getRight(playlistDiv));

  if(y >= playRect.bottom|| y <= playRect.top||oppositeSide){
    leaveMenu(contextMenu);
  }
  else if(y >=contextRect.bottom||y <=contextRect.top){
    leaveMenu(contextMenu);
  }
  else
    document.body.removeChild(playlistDiv);
}

/*
  Determines available vertical space and adjusts size and position
  of menuDiv relative to buttonRect.
  @param {Object} menuDiv - div node being added to document
  @param {object} buttonRect - client bounding rectangle of button which created menuDiv
*/
function getDivRect(menuDiv, buttonRect){
    menuDiv.style.visibility = "hidden";
    document.body.appendChild(menuDiv);
    let divRect = menuDiv.getBoundingClientRect();
    let navRect = document.getElementById("topNavbar").getBoundingClientRect();
    let playRect = document.getElementById("playbar").getBoundingClientRect();

    let maxAbove = buttonRect.bottom - navRect.bottom;
    let maxBelow = window.innerHeight - playRect.height - buttonRect.top;

    let newHeight = (maxAbove > maxBelow) ? (maxAbove-1) : (maxBelow-1);
    let down = (maxAbove < maxBelow);

    if(newHeight > divRect.height)
      newHeight = divRect.height;

    $(menuDiv).height(divRect.height);

    return {width: divRect.width, height: newHeight, down: down};
}

/*
  Get the column element's right position in the client, accounting for padding
  @param {Object} col - Bootstrap column HTML element
*/
function getRight(col){
  let colPadding = $(col).css("padding-left").replace("px", "");
  colPadding = parseInt(colPadding)*2;
  return col.getBoundingClientRect().right - colPadding;
}

//remove existing playlistDivs left from quick mouse movements
function removeExistingDivs(){
  let divExists = document.getElementsByClassName("playlistDiv");
  if(divExists){
    for(i = 0; i < divExists.length; i++)
      document.body.removeChild(divExists[i]);
  }
}