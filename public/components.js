/*
  @param {string} label - HTML innerHTML attribute
  @param {string} width - Bootstrap column width
  @param {string} className - appended to HTML class attribute
  @param {string} id - HTML id attribute
  @param {Object} callback - HTML onclick attribute
  @return {Object} - HTML node of Bootstrap grid column containing text with click listener
*/
function getColLink(label, width, className, id, callback){
  let args = arguments;
  let col = document.createElement('div');
  col.className = "col-sm-" + width;
  col.setAttribute('style', 'text-decoration:underline;cursor:pointer;');
  col.innerHTML = label;

  if(id){
    col.id = id;
  }

  if(className){
    col.className += " " + className;
  }

  col.onclick = function(){
    let params = [];
    for(i = 5; i < args.length; i++){
      params.push(args[i]);
    }
    callback.apply(0, params);
  };

  return col;
}
/*
  @param {number} num - row number within container
  @param {string} className - appended to HTML class attribute
  @param {string} id - HTML id attribute
  @param {string} style - HTML style attribute
  @return {Object} - HTML node of Bootstrap grid row containing enter and exit listeners
*/
function getPlayableRow(num, className, id, style){
  let row = document.createElement('div');

  if(id)
    row.id = id;

  if(className)  
    row.className = "row py-1 my-0 " + className;
  else
    row.className = "row py-1 my-0";

  if(style)
    row.setAttribute("style", style);

  row.onmouseenter = function(){
    row.className += " active";
    row.style.backgroundColor = "#ddd";
    document.getElementById("plbutton"+num).style.visibility = "visible";

    let play = document.getElementById("play"+num);

    if(row.classList.contains("album-page-data"))
      play.innerHTML = "&#9658;";
    else
      play.style.visibility = "visible";
  }

  row.onmouseleave = function(){
    let contextMenu = document.getElementsByClassName("context-menu")[0];
    if(!contextMenu){
      row.classList.remove("active");
      row.style.backgroundColor = "transparent";
      document.getElementById("plbutton"+num).style.visibility = "hidden";

      let play = document.getElementById("play"+num);

      if(row.classList.contains("album-page-data"))
        play.innerHTML = num+1;
      else
          play.style.visibility = "hidden";
    }
  }

  return row;
}

/*
  @this {Object} - HTML parent node
  @param {string} label - HTML innerHTML attribute
  @param {string} id - HTML id attribute
  @param {string} className - appended to HTML class attribute
  @param {Object} onclick - HTML onclick attribute
*/
function addMenuItem(label, id, className, onclick){
  let row = document.createElement("div");
  row.className = "row";

  if(onclick)
    row.onclick = onclick;

  row.onmouseenter = function(){
      row.style.backgroundColor = "gray";
    };

    row.onmouseleave = function(){
      row.style.backgroundColor = "silver";
    };

  let col = document.createElement("div");
  if(id)
    col.id = id;
  if(className)
      col.className = "col-s-12 text-overflow dropdown " + className;
    else
      col.className = "col-s-12 text-overflow dropdown";
    col.innerHTML = label;
    col.style.cursor = "pointer";
    col.style.width = "150px";
    row.appendChild(col);
    this.appendChild(row);
}

/*
  @this {Object} - HTML parent node
  @param {string} innerHTML - HTML innerHTML attribute
  @param {string} className - appended to HTML class attribute
  @param {string} id - HTML id attribute
  @param {Object} callback - HTML onclick attribute
  @param {Object} data - data displayed when onclick function is called
*/
function addNavItem(innerHTML, className, id, callback, data){
  if(!data||!data.length)
    return;
  let args = arguments;
  let navItem = document.createElement("li");
  navItem.className = "nav-item";

  let navLink = document.createElement("a");
  navLink.style.cursor = "pointer";
  navLink.className = "nav-link";

  if(innerHTML)
    navLink.innerHTML = innerHTML;

  if(className)
    navItem.className += " " + className;

  if(id)
    navLink.id = id;

  if(data)
    navItem.onclick = function(){
      setActive(navItem);
      let params = [];
      for(i = 4; i < args.length; i++){
        params.push(args[i]);
      }
      callback.apply(0, params);
    };

  navItem.appendChild(navLink);
  this.appendChild(navItem);
}

//same as getColLink, but appends column to "this", rather than returning it
function addColLink(label, width, className, id, style, callback){
  let args = arguments;
  let col = document.createElement('div');
  col.innerHTML = label;

  if(id)
    col.id = id;

  if(style!="play"){
    col.setAttribute("style", "text-decoration:underline;cursor:pointer;" + style);
  }
  else if(style=="play")
    col.setAttribute('style', 'cursor:pointer;');
  else
    col.setAttribute('style', 'text-decoration:underline;cursor:pointer;');

  if(className){
    col.className += "col-sm-" + width + " " + className;
  }
  else
    col.className = "col-sm-" + width;

  col.onclick = function(){
    let params = [];
    for(i = 6; i < args.length; i++){
      params.push(args[i]);
    }
    callback.apply(0, params);
  };

  this.append(col);
}

/*
  @param {string} data - HTML innerHTML attribute
  @param {number} width - Bootstrap column width
  @param {string} className - appended to HTML class attribute
  @param {string} id - HTML id attribute
  @param {string} style - HTML style attribute
  @return {Object} - HTML node of Bootstrap column containing text
*/
function getColData(data, width, className, id, style){
  let col = document.createElement('div');
  if(className)
    col.className = "col-sm-" + width + " text-overflow " + className;
  else
    col.className = "col-sm-" + width + " text-overflow";
  if(id)
    col.id = id;
  if(style)
    col.setAttribute("style", style);
  col.innerHTML = data;
  if(data.length > 30)
    col.title = data;
  return col;
}

/*
  @this {Object} - HTML parent node
  @param {string} src - HTML src attribute
  @param {number} width - Bootstrap column width
  @param {string} className - appended to HTML class attribute
  @param {string} id - HTML id attribute
  @param {string} style - HTML style attribute
*/
function addColImage(src, width, className, id, style){
  let imageCol = document.createElement("div");
  imageCol.className = "col-sm-" + width;
  let img = document.createElement("img");
  img.src = src;
  img.onload = function(){
    if(style)
      img.setAttribute("style", style);
    img.style.maxWidth = "100%";
  };
  if(className)
    img.className = className;
  if(id)
    img.id = id;
  imageCol.appendChild(img);

  this.appendChild(imageCol);
}

/*
  @param {string} data - data for date object
  @param {number} width - Bootstrap column width
  @param {string} className - appended to HTML class attribute
  @param {string} id - HTML id attribute
  @return {Object} - HTML node of Bootstrap column containing formatted date text
*/
function getColDate(data, width, className, id){
  let date = new Date(data);
  let displayDate = getDateDisplay(date);
  let col = document.createElement('div');
  if(className)
    col.className = "col-sm-" + width + " text-overflow text-center " + className;
  else
    col.className = "col-sm-" + width + " text-overflow text-center";
  if(id)
    col.id = id;
  col.innerHTML = displayDate;
  return col;
}

/*
  @param {string} name - HTML innerHTML attribute
  @param {number} width - Bootstrap column width
  @param {string} sort - appended to HTML class attribute if column 
                         is sortable, defines sorting order
*/
function getColHeader(name, width, sort){
  let col = document.createElement('div');
  col.className = "col-sm-" + width + " text-center ";

  if(sort){
    col.className += sort;

    col.onclick = function(){
      sortTable(col, name)
    };
  }
  let header = document.createElement('h5');
  header.innerHTML = name;
  col.appendChild(header);
  return col;
}

/*
  @param {string} id - HTML id attribute
  @return {Object} - HTML node with specified id and no content
*/
function getEmptyEnclosure(id){
  let div = document.getElementById(id);

  if(!div){
    div = document.createElement("div");
    div.id = id;
  }

  div.innerHTML = "";

  return div;
}