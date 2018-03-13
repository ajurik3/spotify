/*
  Creates a Bootstrap container with rows displaying functions to perform
  on the active playable.
  @param {string} options - specifies additional functions to perform
*/
function getContextMenu(options){
	let menu = document.createElement("div");
  	menu.className = "container text-overflow hover-content context-menu";
 	menu.setAttribute("style", "position:absolute;z-index:1;display:block;width:150px;overflow-y:auto;top:0;left:0;visibility:hidden;background-color:silver");
 	menu.onmouseleave = function(){
 		leaveMenu(menu);
 	};

 	addMenuItem.call(menu, "New Playlist", "plCreator", "context-menu-item", createNewPlaylist);
 	addMenuItem.call(menu, "New Temp Playlist", "tempCreator", "context-menu-item", createTempPlaylist);
 	addMenuItem.call(menu, "Add to Playlist", "pl-select", "context-menu-item");

 	if(options&&options.includes("-t"))
 		addMenuItem.call(menu, "Remove", "remove-tracking", "context-menu-item", callRemoveFunction);

 	return menu;
}

/*
	Style button which displays playlistDiv and create playlistDiv. On mouse
	entry, display playlistDiv and set new onmouseleave for contextMenu.
*/
function initAddPlaylist(){
	let plSelect = document.getElementById("pl-select");
	let label = document.createElement("div");
	label.innerHTML = plSelect.innerHTML;
	label.style.display = "inline";
	label.style.float = "left";
	plSelect.innerHTML = "";
	plSelect.width = "150px";

	let arrow = document.createElement("div");
	arrow.style.display = "inline";
	arrow.style.float = "right";
	arrow.innerHTML = "&#9656;";
	plSelect.appendChild(label);
	plSelect.appendChild(arrow);
	getPlaylists(createPlaylistsDiv, plSelect);

	plSelect.onmouseenter = function(){
		let playlistDiv = document.getElementsByClassName("playlistDiv")[0];
		setDivLocation(playlistDiv, plSelect);
		setNewMenuListener(playlistDiv);
		playlistDiv.style.visibility = "visible";
	};
}
/*
	Remove context menu from document as well as playlistDiv, if one exists.
	Also return any active result rows to an inactive state.

	@param {Object} menu - HTML DOM object containing context menu
*/
function leaveMenu(menu){
	if(!menu)
		menu = document.getElementsByClassName("context-menu")[0];

	document.body.removeChild(menu);
	revertUnorderedHoverText();

	let playlistDiv = document.getElementsByClassName("playlistDiv")[0];
	if(playlistDiv)
		document.body.removeChild(playlistDiv);
}

//revert active result row to inactive state
function revertUnorderedHoverText(){
  let row = document.getElementsByClassName("result active")[0];
  row.style.backgroundColor = "transparent";
  row.classList.remove("active");

  let children = row.childNodes;

  for(i = 0; i < children.length; i++){
    if(children[i].classList.contains("play")){
    	if(row.classList.contains("album-page-data"))
    		children[i].innerHTML = parseInt(children[i].id.replace("play", ""))+1;
    	else
      		children[i].style.visibility = "hidden";
    }
    else if(children[i].classList.contains("hover-button")){
      children[i].style.visibility = "hidden";
    }
  }
}

//remove context and playlistdiv only if mouse hovers off contextmenu and not onto playlistdiv
function setNewMenuListener(playlistDiv){
	let contextMenu = document.getElementsByClassName("context-menu")[0];
	contextMenu.onmouseleave = function(event){
		let menuRect = contextMenu.getBoundingClientRect();
		let divRect = playlistDiv.getBoundingClientRect();
		let y = event.clientY;

		let otherSide = (divRect.left > menuRect.left)&&(event.clientX <=menuRect.left);

		if(y >= menuRect.bottom||y <=menuRect.top||otherSide){
		  leaveMenu(contextMenu);
		}
		else if(y >=divRect.bottom||y <=divRect.top){
		  leaveMenu(contextMenu);
		}
	};
}

/*
	Creates an option button which creates and positions a context menu when entered
	@param {number} num - number of Bootstrap row in container
	@param {number} width - Bootstrap column width
	@param {string} options - specifies additional options for this row in the contextMenu
*/
function addOptionButtonCol(num, width, options){
  let row = this;
  let col = document.createElement("div");
  col.className = "col-sm-" + width + " hover-button text-center";
  col.id = "plbutton" + num;
  col.innerHTML = "&bull;&bull;&bull;";
  col.setAttribute("style", "position:relative;visibility:hidden;max-width:50px;");

  col.onmouseenter = function(event){
    let contextMenu = getContextMenu(options);
    if(row.classList.contains("lib"))
    	addMenuItem.call(contextMenu, "Remove from Library", "remove-library", "context-menu-item", callToggleLibrary);
    else
    	addMenuItem.call(contextMenu, "Add to Library", "add-library", "context-menu-item", callToggleLibrary);
    setDivLocation(contextMenu, col);
    setOptLeave(contextMenu, col);
    document.body.appendChild(contextMenu);
    initAddPlaylist();    
  };
  this.appendChild(col);
}

/*
  Remove context if mouse leaves option button without entering contextMenu.
  @param {Object} contextMenu - HTML DOM node containing contextMenu
  @param {Object} opt - HTML DOM node containing the active option button
 */
function setOptLeave(contextMenu, opt){
  opt.onmouseleave = function(event){
    let x = event.clientX;
    let y = event.clientY;

    let optRect = opt.getBoundingClientRect();
    let menuRect = contextMenu.getBoundingClientRect();
    
    let oppositeSide = (optRect.left < menuRect.left) ? (x <= optRect.left) : (x >=getRight(opt));
    if(y <= optRect.top || y >= optRect.bottom||oppositeSide)
        document.body.removeChild(contextMenu);
  };
}

//get playable info and call createPlaylist
function createNewPlaylist(){
	let rowNode = document.getElementsByClassName("result active")[0];

	let playable = getTracksInfo(rowNode);
    createPlaylist(playable, false);
    leaveMenu();
}

//get playable info and call createPlaylist with temporary option
function createTempPlaylist(){
	let rowNode = document.getElementsByClassName("result active")[0];

	let playable = getTracksInfo(rowNode);
    createPlaylist(playable, true);
    leaveMenu();
}

//get playable info and playlist id and call addToPlaylist
function addToPlaylist(event){
	let rowNode = document.getElementsByClassName("result active")[0];
	let playlistId = event.target.id;

    let playable = getTracksInfo(rowNode);
    if(playable.type=="album")
    	playlistAppend(playable.playId, playlistId);
    else
    	playlistAppend(0, playlistId, playable.playId);

    leaveMenu();
}

//get playable info and library status and call toggleLibrary
function callToggleLibrary(){
	let rowNode = document.getElementsByClassName("result active")[0];
	let playable = getTracksInfo(rowNode);

	if(rowNode.classList.contains("lib"))
		toggleLibrary(playable.playId, playable.type, "DELETE");
	else
		toggleLibrary(playable.playId, playable.type, "PUT");

	rowNode.classList.toggle("lib");
	leaveMenu();
}

//get playable info and current tracking display and call appropriate remove
function callRemoveFunction(){
	let rowNode = document.getElementsByClassName("result active")[0];
	let playable = getTracksInfo(rowNode);
	let trackingClass = document.getElementById("tracking").className;
	if(trackingClass == "all")
		removeTracking(playable.artistId);
	else
		removeNew(playable.artistId);

	leaveMenu();
}