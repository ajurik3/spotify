var params,
          access_token,
          refresh_token,
          pageInitLoadError,
          bearerHeaders;

      function getHashParams() {
        var hashParams = {};
        var e, r = /([^&;=]+)=?([^&;]*)/g,
          q = window.location.hash.substring(1);

        while ( e = r.exec(q)) {
          hashParams[e[1]] = decodeURIComponent(e[2]);
        }
        return hashParams;
      }

      function getDateDisplay(date){

        if(typeof date === 'string')
          date = new Date(date);

        return "" + (date.getMonth()+1) + "-" + date.getDate() + "-" + date.getFullYear();
      }

      function refreshOrFail(err, callback, params, onFail){

        if(err[0].status===401){
          refreshToken().then(callback.apply(0, params));
        } 
        else if (err[0].status===429) {
          console.log(err);
          console.log(err[0].getResponseHeader());
        }
        else{
          console.log(err);
          if(onFail)
            onFail();
        }
      }

      function refreshToken(){
        return $.ajax({
            url: '/refresh_token',
            data: {
              'refresh_token': refresh_token
            },
            success : function(data){
              access_token = data.access_token;
              bearerHeaders = {
                'Authorization' : 'Bearer ' + access_token
              };
            },
            error : function(data){
              console.log(data);
            }
          });
      }

      (function() {
        params = getHashParams();

        access_token = params.access_token,
        refresh_token = params.refresh_token,
        pageInitLoadError = params.error;
        bearerHeaders = {
          'Authorization' : 'Bearer ' + access_token
        };

        if (pageInitLoadError) {
          console.log(pageInitLoadError);
        } 
        else {
          if (access_token) 
          {
            $('#login').hide();
            $('#loggedin').show();
            updateHidden().then(getTracking).then(checkTempPlaylists);
          } 
          else {
              // render initial screen
              $('#login').show();
              $('#loggedin').hide();
          }
        }
      })();