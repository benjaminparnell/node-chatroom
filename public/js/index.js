function init() {

  // Hide the notifications flash
  var flash = $(".flash");
  flash.hide();

  var serverBaseUrl = document.domain;

  var socket = io.connect(serverBaseUrl);

  var sessionId = '';

  function updateParticipants(participants) {
   $('#participants').html('');
   for (var i = 0; i < participants.length; i++) {
      $('#participants').append('<span id="' + participants[i].id + '">' +
        participants[i].name + ' ' + (participants[i].id === sessionId ? '(You)' : '') + '<br /></span>');
    } 
  }

  socket.on('connect', function () {
    sessionId = socket.socket.sessionid;
    console.log('Connected ' + sessionId);
    socket.emit('newUser', {id: sessionId, name: $('#name').val()});
  });

  socket.on('newConnection', function (data) {    
    updateParticipants(data.participants);
  });

  socket.on('userDisconnected', function(data) {
    $('#' + data.id).remove();
  });

  socket.on('nameChanged', function (data) {
    $('#' + data.id).html(data.name + ' ' + (data.id === sessionId ? '(You)' : '') + '<br />');
  });

  socket.on('incomingMessage', function (data) {
    var message = data.message;
    var name = data.name;
    var time = timestamp();
    $('#messages').append('<b>' + name + '</b> - ' + time + '<br />' + message + '<br /><br />');
  });

  socket.on('error', function (reason) {
    console.log('Unable to connect to server', reason);
  });

  function sendMessage() {
    var outgoingMessage = $('#outgoingMessage').val();
    $("#outgoingMessage").val("");
    $("#send").attr("disabled", true);
    var name = $('#name').val();
    $.ajax({
      url:  '/message',
      type: 'POST',
      dataType: 'json',
      data: {message: outgoingMessage, name: name}
    });
  }

  function outgoingMessageKeyDown(event) {
    if (event.which == 13) {
      event.preventDefault();
      if ($('#outgoingMessage').val().trim().length <= 0) {
        return;
      }
      var messages = document.getElementById("messages");
      messages.scrollTop = messages.scrollHeight;
      sendMessage();
    }
  }

  function outgoingMessageKeyUp() {
    var outgoingMessageValue = $('#outgoingMessage').val();
    $('#send').attr('disabled', (outgoingMessageValue.trim()).length > 0 ? false : true);
  }


  function nameFocusOut() {
    var name = $('#name').val();
    if(name.trim().length <= 0) {
      return;
    } else if (name.length > 15) {
      displayFlash("That name is too long. Please choose a shorter one ( < 15 characters ).", "error");
      return;
    }
    socket.emit('nameChange', {id: sessionId, name: name});
  }

  // Helper function to create a timestamp

  function timestamp() {
    var stamp = "";
    var currentTime = new Date();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();

    if(minutes < 10) {
      minutes = '0' + minutes;
    }

    stamp += hours + ":" + minutes;

    if(hours > 11) {
      stamp += "PM";
    } else {
      stamp += "AM";
    }
    return stamp;
  }

  function displayFlash(message, type) {
    flash.empty();
    flash.addClass(type);
    flash.slideDown('fast', function() {
      flash.append("<p>" + message + "</p>");
    });
  }

  flash.on('click', function() {
    flash.slideUp('fast');
  });

  $('#outgoingMessage').on('keydown', outgoingMessageKeyDown);
  $('#outgoingMessage').on('keyup', outgoingMessageKeyUp);
  $('#name').on('focusout', nameFocusOut);
  $('#send').on('click', sendMessage);
}

// Call init() on document.ready
$(function() { init(); });