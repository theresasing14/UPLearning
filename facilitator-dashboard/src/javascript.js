/* eslint-disable complexity */
/* eslint-disable max-statements */
      window.addEventListener('load', getLoadState);
      var allEventData;
      var filteredEvents = [];
      var events=[];
      var archiveEventData;
      var participantEmails = [];
      var participantDetails;
      var usingFeedback = true;
      var instance;

function getLoadState() {
  console.log("getting load state");
  console.log(window.location);
  const withSuccess = google.script.run.withSuccessHandler(function(instance) {
    fetchAllEvents(instance);
  })
  const withFailure = withSuccess.withFailureHandler(function(error) {
    console.log(error)
  })
  withFailure.getUserPermissions();
  // google.script.url.getLocation(function(loc) {
  //   instance = loc.parameter.instance;
  //   if (!instance) {
  //     document.getElementById("main-spinner").innerHTML = "Bad URL";
  //     return;
  //   } else {
  //     fetchAllEvents(instance);
  //   }
  // });
}

function fetchAllEvents(instances) {
  var withSuccess = google.script.run.withSuccessHandler(renderEvents);
  var withFailure = withSuccess.withFailureHandler(function(error) {
     console.log("error handler for fetchParticipantDetails message: "+error);
     document.getElementById("main-spinner").innerHTML = "Something went wrong Are you logged into a Google Strongschools account with permission to access the dashboard?";
   });
  withFailure.getAllEvents(instances);  
}

function exportRegDetails() {
  var withSuccess = google.script.run.withSuccessHandler(function(msg) {
    document.getElementById("modal-body").style.display = "";
    document.getElementById("modal-footer").style.display = "";
    document.getElementById("modal-spinner").style.display = "none";
    document.getElementById("modal-success").style.display = "";
    document.getElementById("modal-success").innerHTML = "<a target=_blank href='"+msg+"'>Here is your spreadsheet</a>";
  });
  var withFailure = withSuccess.withFailureHandler(function(error) {
    document.getElementById("modal-body").style.display = "";
    document.getElementById("modal-footer").style.display = "";
    document.getElementById("modal-spinner").style.display = "none";
    document.getElementById("modal-failure").style.display = "";
    document.getElementById("modal-failure").innerHTML = error;
  });  
  if (filteredEvents.length>0) {
    withFailure.createRegSs(filteredEvents,instance);
  } else {
    withFailure.createRegSs(allEventData.events,instance);
  }
  document.getElementById("modal-vertical").style.display="";
  document.getElementById("modal-title").innerHTML = "Export Registrant Details";
  document.getElementById("modal-footer").style.display = "none";
  document.getElementById("modal-spinner").style.display = "";
  document.getElementById("modal-spinner-msg").style.display = "";
  document.getElementById("modal-spinner-msg").innerHTML = "Generating a Spreadsheet using the filters you selected."
  document.getElementById("modal-success").style.display = "none";
  document.getElementById("modal-failure").style.display = "none";
  document.getElementById("modal-body-msg").style.display = "none";
}

function renderEvents(eventsobj,filter) {
  var parsedEventsObj = JSON.parse(eventsobj);
  var events = parsedEventsObj.events;
  if (!filter) {
    allEventData=parsedEventsObj;
    if (!events || events.length===0) {
      document.getElementById("event-details").innerHTML = "You don't have any events to display";
      document.getElementById("main-spinner").style.display = "none";
      return;
    }
    var districtSelector = document.getElementById("districts");
    var districtAttendedSelector = document.getElementById("districts_attending");
    if (districtSelector.dataset.rendered==="false" && districtAttendedSelector.dataset.rendered==="false") { 
      parsedEventsObj.districts.forEach(function(dist,index) {
        if (dist.toLowerCase()==="all districts") return;
        districtSelector.appendChild(htmlElement({tag: "OPTION", value: dist, innerHTML: dist}));
        districtSelector.dataset.rendered="true";
        districtAttendedSelector.appendChild(htmlElement({tag: "OPTION", value: dist, innerHTML: dist}));
        districtAttendedSelector.dataset.rendered="true";
      });
    }
  }
  var allEvents = 0;
  var totalRegistered = 0;
  var totalAttended = 0;
  var attendanceRate = 0;
  var attendedOnce = 0;
  var regRate = 0;
  for (var i=0;i<events.length;i++) {
    allEvents++;
    if (events[i].attendanceInfo.attendanceTrackRate===1) {
      if (events[i].attendanceInfo.sessions_attended || events[i].attendanceInfo.sessions_attended===0) {
        totalAttended+=events[i].attendanceInfo.sessions_attended
      } else {
        console.log("event "+events[i].id+" sessions attended = "+events[i].attendanceInfo.sessions_attended+" attended= "+events[i].attendanceInfo.attended);
        totalAttended+=events[i].attendanceInfo.attended
      }
      regRate+=events[i].attendanceInfo.registered*events[i].countDates;
    }
    totalRegistered+=events[i].currentRegs;
    if (events[i].attendanceInfo.attended1day) {
      attendedOnce+=events[i].attendanceInfo.attended1day
    }
    var newCard = card(events[i]);
    document.getElementById("event-details").appendChild(newCard);
  }
  document.getElementById("total-events").innerHTML=allEvents;
  document.getElementById("registered").innerHTML=totalRegistered;
  document.getElementById("attended").innerHTML=attendedOnce;
  document.getElementById("attn-rate").innerHTML=Math.round(Number(totalAttended/regRate)*100)+"%";
  document.getElementById("main-spinner").style.display = "none";
  console.log("sessions registered: "+regRate+" sessions attended: "+totalAttended);
}

function card(event) {
  // parent element
  var card = htmlElement({tag: "DIV", className: "card text-center event-tile", style: "width: 75%; margin-bottom: 25px;", id: "event-card-"+event.id});
  // the header where the nav bar will go
  var cardHeader = htmlElement({"tag": "DIV", "className": "card-header", style: "display: flex; align-items: center; justify-content: space-between"});
  //begin nav items
  var navBar = htmlElement({"tag": "UL", "className": "nav nav-pills card-header-pills"});
  var navItems = [];
  for (var i=0; i<4; i++) {navItems.push(htmlElement({tag: "LI", className: "nav-item"}))}
  navItems[0].className = "nav-item dropdown";
    var dropDownLabel = htmlElement({tag: "A", className: "nav-link dropdown-toggle", "data-toggle": "dropdown", href: "#", innerHTML: "Links", role: "button", "aria-expanded": "false", "aria-haspopup": "true", eventListener: {event: "click", "function": function(e) {e.preventDefault()} }});
    var linksDropDown = htmlElement({tag: "DIV", className: "dropdown-menu"})
      linksDropDown.appendChild(htmlElement({tag: "A", className: "dropdown-item", href: event.event_page, innerHTML: "Event Page", target: "_blank"}));
      linksDropDown.appendChild(htmlElement({tag: "A", className: "dropdown-item", href: event.feedback_form, innerHTML: "Feedback Form", target: "_blank"}));
      linksDropDown.appendChild(htmlElement({tag: "A", className: "dropdown-item", href: event.reg_link, innerHTML: "Registration Link", target: "_blank"}));
      linksDropDown.appendChild(htmlElement({tag: "A", className: "dropdown-item", href: event.qr_codes, innerHTML: "QR Codes", target: "_blank"}));
    navItems[0].appendChild(dropDownLabel);
    navItems[0].appendChild(linksDropDown);
  navItems[1].className = "nav-item dropdown";
    dropDownLabel = htmlElement({tag: "A", className: "nav-link dropdown-toggle", "data-toggle": "dropdown", href: "#", innerHTML: "Manage Event", role: "button", "aria-expanded": "false", "aria-haspopup": "true", eventListener: {event: "click", "function": function(e) {e.preventDefault()} }});
    linksDropDown = htmlElement({tag: "DIV", className: "dropdown-menu"});
      if (event.status==="active") linksDropDown.appendChild(htmlElement({tag: "DIV", className: "dropdown-item", eventListener: {"event": "click", "function": function() {verifyCancel(event.id)}}, innerHTML: "Cancel Event", "data-toggle": "modal", "data-target": "#modal-vertical"}));
      linksDropDown.appendChild(htmlElement({tag: "DIV", className: "dropdown-item", eventListener: {"event": "click", "function": function(e) {copyEvent(event.id,instance)}}, innerHTML: "Duplicate Event"}));
      linksDropDown.appendChild(htmlElement({tag: "A", className: "dropdown-item", href: event.edit_link, innerHTML: "Edit Event", target: "_blank"}));
      linksDropDown.appendChild(htmlElement({tag: "A", className: "dropdown-item", href: event.session_notes_link, innerHTML: "Session Notes", target: "_blank"}));
    navItems[1].appendChild(dropDownLabel);
    navItems[1].appendChild(linksDropDown);
  navItems[2].className = "nav-item dropdown";
    dropDownLabel = htmlElement({tag: "A", className: "nav-link dropdown-toggle", "data-toggle": "dropdown", href: "#", innerHTML: "Participants", role: "button", "aria-expanded": "false", "aria-haspopup": "true", eventListener: {event: "click", "function": function(e) {e.preventDefault()} }});
    linksDropDown = htmlElement({tag: "DIV", className: "dropdown-menu"});
      linksDropDown.appendChild(htmlElement({tag: "A", className: "dropdown-item", href: event.participant_details_link, target: "_blank", innerHTML: "Manage Participants"}));
      linksDropDown.appendChild(htmlElement({tag: "A", className: "dropdown-item", href: event.feedback_link, innerHTML: "View Feedback", target: "_blank"}));
      if (event.status==="archived") linksDropDown.appendChild(htmlElement({tag: "DIV", innerHTML: "Show Attendance Table", className: "dropdown-item", eventListener: {"event": "click", "function": function(e) {showDbnTable(e.target,event.id)}}}));
    navItems[2].appendChild(dropDownLabel);
    navItems[2].appendChild(linksDropDown); 
  navItems[3].className = "nav-item dropdown";
    dropDownLabel = htmlElement({tag: "A", className: "nav-link dropdown-toggle", "data-toggle": "dropdown", href: "#", innerHTML: "Digital Sign in", role: "button", "aria-expanded": "false", "aria-haspopup": "true", eventListener: {event: "click", "function": function(e) {e.preventDefault()} }});
    linksDropDown = htmlElement({tag: "DIV", className: "dropdown-menu"});
      linksDropDown.appendChild(htmlElement({tag: "A", className: "dropdown-item", href: event.signin_link, innerHTML: "Digital Sign In", target: "_blank"}));
    navItems[3].appendChild(dropDownLabel);
    navItems[3].appendChild(linksDropDown);     
  navItems.forEach(function(item) {navBar.appendChild(item)});
  cardHeader.appendChild(navBar);
  var statusIdBox = htmlElement({tag: "DIV", style: "display: flex; flex-direction: column; align-items: center; justify-content: space-between"});
    statusIdBox.appendChild(htmlElement({tag: "DIV", innerHTML: "ID: "+event.id}))
    statusIdBox.appendChild(htmlElement({tag: "DIV", innerHTML: "Status: "+event.status}))
  cardHeader.appendChild(statusIdBox);
  card.appendChild(cardHeader);
  // end nav items
  
  //the card body
  var cardBody = htmlElement({"tag": "DIV", "className": "card-body"});
  var title = htmlElement({"tag": "H5", "className": "card-title", "innerHTML": event.title});
  cardBody.appendChild(title);
  var attnSummaryDiv = htmlElement({tag: "DIV", style: "display: flex; width: 100%; justify-content: space-around; align-items: center;"});
  attnSummaryDiv.appendChild(htmlElement({tag: "P", className: "card-text", innerHTML: "<b>Registered: </b>"+event.currentRegs+"/"+event.max_regs}));
  attnSummaryDiv.appendChild(htmlElement({tag: "P", className: "card-text", innerHTML: "<b>Waitlist: </b>"+event.waitlist}));
  attnSummaryDiv.appendChild(htmlElement({tag: "P", className: "card-text", innerHTML: "<b>Feedback: </b>"+event.feedback}));
  if (event.attendanceInfo) {
    attnSummaryDiv.appendChild(htmlElement({tag: "P", style: "margin-bottom: 1rem;",className: "card-text", innerHTML: "<b>Attendance Rate: </b>"+Math.round(Number(event.attendanceInfo.attendanceRate)*100)+"%" || "N/A"}));
  } else {
    attnSummaryDiv.appendChild(htmlElement({tag: "P", className: "card-text", innerHTML: "<b>AttendanceRate: </b>N/A"}));
  }
  cardBody.appendChild(attnSummaryDiv);
  cardBody.appendChild(htmlElement({tag: "DIV", id: "dbn-container-"+event.id, style: "display: none;"}));
    // more info  
    var moreInfo = htmlElement({tag: "DIV", id: "more-info-box-"+event.id, style: "display: none; flex-direction: column;"});
      moreInfo.appendChild(htmlElement({tag: "P", className: "card-text", innerHTML: "<b>Where: </b>"+event.location}));
      moreInfo.appendChild(htmlElement({tag: "P", className: "card-text", innerHTML: "<b>All Dates: </b>"+event.allDates}));
      moreInfo.appendChild(htmlElement({tag: "P", className: "card-text", innerHTML: "<b>Times: </b>"+event.times}))
      moreInfo.appendChild(htmlElement({tag: "P", className: "card-text", innerHTML: "<b>Districts: </b>"+event.districts}));
      moreInfo.appendChild(htmlElement({tag: "P", className: "card-text", innerHTML: "<b>Content: </b>"+event.content}));
      moreInfo.appendChild(htmlElement({tag: "P", className: "card-text", innerHTML: "<b>Facilitators: </b>"+event.facilitators}));
      moreInfo.appendChild(htmlElement({tag: "P", className: "card-text", innerHTML: "<b>CTLE Eligible: </b>"+event.ctle_eligible}))
    cardBody.appendChild(moreInfo);
      //more info button
      var moreButtonsContainer = htmlElement({tag: "DIV", style: "width: 100%; display: flex; align-items: center; align-content: center; justify-content: center; position: relative; margin-top: 15px;"});
      if ((event.attendanceInfo.attendanceTrackRate < 1 || !event.attendanceInfo) && event.currentRegs > 0) {
        var attnNeededButton=htmlElement({tag: "A", className: "btn btn-outline-danger btn-sm", innerHTML: "Attendance Needed", style: "position: absolute; left: 0;", href: event.participant_details_link, target: "_blank"});
      } else if (event.currentRegs === 0) {
        var attnNeededButton=htmlElement({tag: "A", className: "btn btn-outline-secondary btn-sm", innerHTML: "No Registrants", style: "position: absolute; left: 0;", href: event.participant_details_link, target: "_blank"});
      } else {
        var attnNeededButton=htmlElement({tag: "A", className: "btn btn-outline-success btn-sm", innerHTML: "Attendance Complete", style: "position: absolute; left: 0;", href: event.participant_details_link, target: "_blank"});
      }
      moreButtonsContainer.appendChild(attnNeededButton);
      moreButtonsContainer.appendChild(htmlElement({tag: "DIV", className: "btn btn-primary btn-sm", eventListener: {"event": "click", "function": function(e) {
         if (document.getElementById("more-info-box-"+event.id).style.display==="none") {
            document.getElementById("more-info-box-"+event.id).style.display="flex";
            e.target.innerHTML="Show Less";
          } else {
            document.getElementById("more-info-box-"+event.id).style.display="none";
            e.target.innerHTML="Show More";
          }
        }}, innerHTML: "Show More"}));
      cardBody.appendChild(moreButtonsContainer)
    //end more info
   card.appendChild(cardBody);
  // end card body
  return card;
}
   
      function toggleFilters(canvas) {
        if (canvas.dataset.expanded==="false") {
          document.getElementById("filters-container").style.display="";
          canvas.dataset.expanded="true";
          canvas.style.transform="rotate(225deg)";
        } else {
          document.getElementById("filters-container").style.display="none";
          canvas.dataset.expanded="false";
          canvas.style.transform="rotate(45deg)";
        }
      }
      
      function fetchEventDetails() {
        document.getElementById("event-details").innerHTML = "";
        document.getElementById("suggestions-container").innerHTML = "";
        document.getElementById("archived-event-portal").innerHTML = "Archived Events";
        document.getElementById("event-portal").innerHTML = "Active Events";
        if (allEventData) {renderEventDetails(allEventData); return;}
        var withSuccess = google.script.run.withSuccessHandler(renderEventDetails);
        var withFailure = withSuccess.withFailureHandler(function(error) {
          console.log("error handler for fetchEventDetails message: "+error);
          document.getElementById("event-details").innerHTML = "Sorry, something went wrong.";
        });
        withFailure.getEventDetails(instance);
        showProgress(0,1500,document.getElementById("event-progress-bar"),document.getElementById("event-details"));
      }

      function notifyRegistrants(eventObj) {
        document.getElementById("modal-body-msg").style.display = "none";
        document.getElementById("modal-spinner").style.display=""
        document.getElementById("modal-title").innerHTML="Notifying Registrants";
        document.getElementById("modal-spinner-msg").innerHTML="Searching for registrants to notfiy. Please wait for confirmation."      
        var withSuccess = google.script.run.withSuccessHandler(function(confirmation) {
          document.getElementById("modal-spinner").style.display="none";
          document.getElementById("modal-success").style.display="";
          document.getElementById("modal-success").innerHTML=confirmation;
          document.getElementById("modal-footer").style.display="";
        });
        var withFailure = withSuccess.withFailureHandler(function(error) {
          document.getElementById("modal-spinner").style.display="none";
          document.getElementById("modal-failure").style.display="";
          document.getElementById("modal-failure").innerHTML=error;
          document.getElementById("modal-title").innerHTML="Error";
          document.getElementById("modal-footer").style.display="";
        });
        withFailure.emailRegistrants(eventObj,instance);
      }

      function initiateCancel(eventId) {
          document.getElementById("modal-title").innerHTML = "Canceling Event";
          document.getElementById("modal-footer").style.display = "none";
          document.getElementById("modal-spinner").style.display = "";
          document.getElementById("modal-spinner-msg").style.display = "";
          document.getElementById("modal-spinner-msg").innerHTML = "Canceling your event. Please wait for confirmation."
          document.getElementById("modal-body-msg").style.display = "none";
        var withSuccess = google.script.run.withSuccessHandler(function(eventobj) {
          console.log(eventobj);
          console.log(document.getElementById("event-card-"+eventobj.eventId));
          document.getElementById("event-details").removeChild(document.getElementById("event-card-"+eventobj.eventId));
          document.getElementById("modal-body-msg").style.display = "";
          document.getElementById("modal-body-msg").innerHTML="<div class='alert alert-success' role='alert'>Your event was canceled.</div><p class='card-text'>Do you want to send an automated cancelation email to registrants now?</p><div style='width: 100%; display: flex; justify-content: space-around;'><button class='btn btn-primary' style='margin-right: 100px;' id='send-notification-button'>Send</button><button class='btn btn-secondary' data-dismiss='modal'>Don't Send</button></div>";
          document.getElementById("modal-spinner").style.display = "none";
          document.getElementById("modal-title").innerHTML = "Event Cancelled";
          document.getElementById("send-notification-button").addEventListener('click', function () {
            notifyRegistrants(eventobj);
          });
          document.getElementById("close-modal-button").style.display="";
        });
        var withFailure = withSuccess.withFailureHandler(function(error) {
          document.getElementById("modal-title").innerHTML = "Error";
          document.getElementById("modal-failure").style.display = "";
          document.getElementById("modal-failure").innerHTML=error;
          document.getElementById("modal-body-msg").style.display = "none";
          document.getElementById("close-modal-button").style.display="";
        });
        withFailure.cancelEvent(eventId,instance);
      }
      
      function restore() {
         document.getElementById('spinner-loader').style.visibility='visibile';
         document.getElementById('main-spinner').style.display='none';
         document.getElementById('event-details').style.visibility='visible';       
      }
      
      function verifyCancel(eventId) {
        document.getElementById("modal-vertical").style.display="";
        document.getElementById("modal-title").style.display="";
        document.getElementById("modal-title").innerHTML = "Cancel Event?";
        document.getElementById("modal-footer").style.display = "none";
        document.getElementById("modal-spinner").style.display = "none";
        document.getElementById("modal-spinner-msg").style.display = "none";
        document.getElementById("modal-body-msg").style.display = "";
        document.getElementById("modal-body-msg").innerHTML='This will delete all the sessions for this event. Are you sure you want to cancel all the sessions?<br><br>\
        <div style="display: flex; width: 100%; justify-content: space-around;"><button id="yes-cancel-button" type="button" class="btn btn-primary" onclick="initiateCancel(\''+eventId+'\')">Yes</button>\
        <button id="no-cancel-button" type="button" class="btn btn-secondary" data-dismiss="modal">No</button>\
        </div>';
        document.getElementById("close-modal-button").style.display="none";
      }
      
      
      var filters = {"division": "", "status": "", "title": "", "content": "", "district": "", "startdate": "", "id": "", "districts_attending": "", "has_registrants": "", "ctle_eligible": "", "date": "",
                       "currentFilters": function() {
                                           let currentFilters = [];
                                           let keys = Object.keys(this);
                                           for (var i in keys) {
                                             if (this[keys[i]] !== "" && keys[i] !== "currentFilters") {
                                               currentFilters.push(keys[i]);
                                             }
                                           }
                                           return currentFilters;
                                          }
                     }
      
      
      function filterTable(input) {
        var events = allEventData.events;
        var table = document.getElementById("event-details");
        table.innerHTML = "";
        document.getElementById("main-spinner").style.display="";
        document.getElementById("main-spinner-msg").innerHTML = "filtering";
        if (input.id === "date" && input.value !== "") {
          //filters[input.id] = new Date(new Date(input.value).getTime()+24*60*60*1000).toString().slice(0,15)
          var inputDate = new Date(input.value);
          inputDate.setUTCHours(20);
          console.log(inputDate.toDateString());
          filters[input.id] = inputDate.toDateString();
        } else {
          filters[input.id] = input.value;
        }
        var currentFilters = filters.currentFilters();
        if (currentFilters.length === 0) {
          filteredEvents=[];
          renderEvents(JSON.stringify({"districts": allEventData.districts, "events": events}),false);
          return;
        } else {
          filteredEvents=[];
          for (var x=0; x<events.length; x++) {
            if (currentFilters.reduce(function(hide,key) {  
                if (events[x][key]) {
                  if (key==="ctle_eligible") {
                    if (filters.ctle_eligible==="eligible") {
                      if (events[x][key].toString().indexOf("NOT") !==-1) {
                        hide++;
                      }
                    } else if (filters.ctle_eligible==="not eligible") {
                      if (events[x][key].toString().indexOf("NOT")===-1) {
                        hide++;
                      }                      
                    }
                  } else {
                    if (events[x][key].toString().toUpperCase().indexOf(filters[key].toString().toUpperCase()) === -1) {
                       hide++
                    }
                  }
                }
                if (filters.has_registrants!=="") {
                    if (events[x].currentRegs==="" || events[x].currentRegs===0) {
                      hide++;
                    }
                }
                if (filters.date!=="") {
                  if (events[x].allDates.indexOf(filters.date)===-1) hide++;
                }                
                return hide;
              },0) === 0) {
                var event = copyObject(events[x]);
                if (x===0) {console.log("orig: ",events[x],"\n new: ",event)}
                if (filters.districts_attending==="") {
                  filteredEvents.push(event);
                } else {
                  if (event.districts_attending) {
                    if (event.districts_attending.indexOf(filters.districts_attending)!==-1) {
                      //var filteredEvent = events[events.length-1];
                      event.attendanceInfo.registered=0;
                      event.attendanceInfo.attended=0;
                      event.attendanceInfo.regRate=0;
                      event.attendanceInfo.sessions_attended=0;
                      var districtRegs = 0;
                      for (var i=event.attendanceInfo.dbns.length-1; i>=0; i--) {
                        if (event.attendanceInfo.dbns[i].district.toString()!==filters.districts_attending.toString()) {
                          event.attendanceInfo.attended1day=event.attended1day-event.attendanceInfo.dbns[i].attended;
                          event.attendanceInfo.dbns.splice(i,1);
                        } else {
                          if (event.attendanceInfo.dbns[i].sessions_attended || event.attendanceInfo.dbns[i].sessions_attended===0) {
                            event.attendanceInfo.sessions_attended+=event.attendanceInfo.dbns[i].sessions_attended;
                          } else {
                            event.attendanceInfo.sessions_attended+=event.attendanceInfo.dbns[i].attended;
                          }
                          event.attendanceInfo.regRate+=event.attendanceInfo.dbns[i].registered_sessions;
                          event.attendanceInfo.registered+=event.attendanceInfo.dbns[i].registered;
                          districtRegs+=event.attendanceInfo.dbns[i].registered;
                        }
                      }
                      event.max_regs = event.currentRegs;
                      event.currentRegs = districtRegs;
                      event.attendanceInfo.attendanceRate=event.attendanceInfo.sessions_attended/event.attendanceInfo.regRate;
                      filteredEvents.push(event);
                    }
                  }
                }
            }
          }
          renderEvents(JSON.stringify({"districts": allEventData.districts, "events": filteredEvents}),true);
        }
      }
      
      function copyArray(arr,newarr) {
        if (!newarr) {newarr=[]}
        if (!arr[0]) {return newarr}
        if (Array.isArray(arr[0])) {
          newarr.push(copyArray(arr[0],[]))
        } else if (typeof arr[0]==="object" && arr[0]!==null && Object.keys(arr[0]).length>0) {
          newarr.push(copyObject(arr[0],Object.keys(arr[0]),{}))
        } else {
          newarr.push(arr[0]);
        }
        return copyArray(arr.slice(1,arr.length),newarr);
      }

      function copyObject(obj,keys,newobj) {
        if (!keys) {keys=Object.keys(obj)}
        if (!newobj) {newobj={}}
        if (!keys[0]) {return newobj}
        if (Array.isArray(obj[keys[0]])) {
         if (keys[0]!=="attendance") {
            newobj[keys[0]]=copyArray(obj[keys[0]],[]);
          } else {
            newobj[keys[0]]=obj[keys[0]].slice(0);
          }
        } else if (typeof obj[keys[0]]==="object" && obj[keys[0]]!==null && Object.keys(obj[keys[0]]).length>0) {
          newobj[keys[0]]=copyObject(obj[keys[0]],Object.keys(obj[keys[0]]),{});
        } else {
          newobj[keys[0]] = obj[keys[0]];
        }
        return copyObject(obj,keys.slice(1,keys.length),newobj);
      }
      
      
//////// Archive Event Functions ////////////////////////////////       
       function createDbnTable(data) {
         console.log(data);
         var parent = htmlElement({tag: "div", className: 'dbn-table-container', id: "dbn-table-container-"+data.id, style: "width: 100%; display: flex; padding-bottom: 15px;"})
         var table = htmlElement({tag: "div", className: "dbn-table", style: "display: flex; width: 84%; justify-content: space-around;"});
         //create the first three (static) columns
         var col1 = htmlElement({tag: "div", className: "dbn-table-column"});
         col1.appendChild(htmlElement({tag: "div", innerHTML: "Session #", className: "header"}));
         col1.appendChild(htmlElement({tag: "div", innerHTML: "DBN", className: "header"}));
         var col2 = htmlElement({tag: "div", className: "dbn-table-column"});
         col2.appendChild(htmlElement({tag:"div",innerHTML:"All",className: "header"}));
         col2.appendChild(htmlElement({tag: "div", innerHTML: "Registered", className: "header"}));
         var col3 = htmlElement({tag: "div", className: "dbn-table-column"});
         col3.appendChild(htmlElement({tag:"div",innerHTML:"All",className: "header"}));
         col3.appendChild(htmlElement({tag: "div", innerHTML: "Attendance %", className: "header"}));
         var dbns = data.attendanceInfo.dbns;
         for (var i=0; i<dbns.length; i++) {
           col1.appendChild(htmlElement({tag: "div", innerHTML: dbns[i].dbn}));
           col2.appendChild(htmlElement({tag: "div", innerHTML: dbns[i].registered}));
           col3.appendChild(htmlElement({tag: "div", innerHTML: Number(Number(dbns[i].atRate)*100).toFixed(0)+"%"}));
         }
         table.appendChild(col1);
         table.appendChild(col2);
         table.appendChild(col3);
         parent.appendChild(table);
         // create the raw attendance number columns. Each col after the first has a width of 0, so won't display
         for (var j=1; j<=data.countDates;j++) {
           if (j===1) {
             var col = htmlElement({tag: "div", className: "dbn-table-column displayed-attn-col", id: "attn-col-"+data.id+"-"+j});
           } else {
             var col = htmlElement({tag: "div", className: "dbn-table-column overflow", id: "attn-col-"+data.id+"-"+j});
           }
           col.appendChild(htmlElement({tag: "div", innerHTML: j, className: "header"}));
           col.appendChild(htmlElement({tag: "div", innerHTML: "Attended", className: "header"}));
           for (var k=0;k<dbns.length;k++) {
             col.appendChild(htmlElement({tag: "div", innerHTML: dbns[k].attendance[Number(j)-1]}));
           }
           table.appendChild(col);
         }
         // create the arrow to display the next raw attn col, if available
         var arrowContainer = htmlElement({tag: "div", className: "arrow-container", style: "display: flex; width: 15%; justify-content: space-between; align-items: center;"});
         var arrowFunction = displayArrowFunction(data.countDates,data.eventId);
         arrowContainer.appendChild(htmlElement({tag: "div", className: "triangle-left triangle", id: "triangle-left-"+data.id, onclick: function(e) {arrowFunction(e.target)}, "data-eventid": data.id, "data-countdates": data.countDates}));
         if (data.countDates>1) {
           arrowContainer.appendChild(htmlElement({tag: "div", className: "triangle-right-active", id:"triangle-right-"+data.id, onclick: function(e) {arrowFunction(e.target)}, "data-eventid": data.id, "data-countdates": data.countDates}));
         } else {
           arrowContainer.appendChild(htmlElement({tag: "div", className: "triangle-right", id:"triangle-right-"+data.id, onclick: function(e) {arrowFunction(e.target)}, "data-eventid": data.id, "data-countdates": data.countDates}));
         }
         parent.appendChild(arrowContainer);
         console.log("dbn table ",parent);
         return parent;
      }


    function htmlElement(obj,parent) {
    if (obj.tag) {
      var element = document.createElement(obj.tag);
    } else {
      var element = document.createElement("DIV");
    }
    var keys = Object.keys(obj);
    keys.forEach(function(key) {
      if (key==="tag") {return}
      if (key.indexOf("data-")!==-1) {
        element.setAttribute(key,obj[key])
      } else if (key==="eventListener") {
        element.addEventListener(obj[key].event, obj[key].function)
      }
      else {element[key]=obj[key]}
    });
    if (parent) {
      parent.appendChild(element);
    } else {
      return element;
    }
  }

      var displayArrowFunction = function(countDates,eventId) {
        var currentCol = 1;
        return function(button) {
          // if the button is greyed out
          if (button.className.indexOf("active")===-1) {return;}
          // If the button isn't greyed out
          document.getElementById("attn-col-"+button.dataset.eventid+"-"+currentCol).className="dbn-table-column overflow";
          // if this is the next button
          if (button.className==="triangle-right-active") {
            currentCol++;
            document.getElementById("attn-col-"+button.dataset.eventid+"-"+currentCol).className="dbn-table-column displayed-attn-col";
            document.getElementById("triangle-left-"+button.dataset.eventid).className = "triangle-left-active";
            if (currentCol.toString()===button.dataset.countdates.toString()) {
              button.className = "triangle-right";
            }
          }
          // if this is the prev button
          else if (button.className==="triangle-left-active") {
            currentCol--;
            document.getElementById("attn-col-"+button.dataset.eventid+"-"+currentCol).className="dbn-table-column displayed-attn-col";
            document.getElementById("triangle-right-"+button.dataset.eventid).className = "triangle-right-active";
            if (currentCol===1) {
              button.className="triangle-left";
            }
        }
        }
      }
      
      function showDbnTable(buttonElement,eventid) {
         //var eventIndex = archiveEventData.event_id_indexes.indexOf(buttonElement.dataset.id);
         if (filters.districts_attending==="") {
           var event = allEventData.events.filter(function(el) {return el.id===eventid})[0];
         } else {
           var event = filteredEvents.filter(function(el) {return el.id===eventid})[0];
         }
         var dbnContainer = document.getElementById("dbn-container-"+eventid);
         if (dbnContainer.style.display==="none") {
           console.log("dbn container not displayed");
           dbnContainer.style.display="flex";
           console.log(event);
           console.log(document.getElementById("dbn-container-"+eventid));
           if (!document.getElementById("dbn-table-container-"+eventid)) {
             console.log("creating a new dbn table");
             dbnContainer.appendChild(createDbnTable(event));
           }
           buttonElement.innerHTML = "Hide Attendance Table";
         } else {
           dbnContainer.style.display = "none";
           buttonElement.innerHTML = "Show Attendance Table";
         }
      }
      
      function copyEvent(eventId) {
        document.getElementById("event-details").style.visibility="hidden"
        document.getElementById("main-spinner").style.display=""
        document.getElementById("main-spinner-msg").innerHTML="Copying your event. Please wait for confirmation"
        var withSuccess = google.script.run.withSuccessHandler(function() {
          document.getElementById("spinner-loader").style.visibility="hidden";
          document.getElementById("main-spinner-msg").innerHTML="<div class='alert alert-success' role='alert'>A duplicate event was created. You need to refresh the page to view it.</div><br><button class='btn btn-secondary' onclick='restore()'>OK</button>";
        });
        var withFailure = withSuccess.withFailureHandler(function(error) {
          document.getElementById("spinner-loader").style.visibility="hidden";
          document.getElementById("main-spinner-msg").innerHTML="<span class='badge badge-dark' style='margin-right: 25px;'>Duplication failed.</span><button class='btn btn-secondary' onclick='restore()'>OK</button>";
          console.log(error);
        });
        withFailure.duplicateEvent(eventId,instance);
      }
      
      function setContent(el) {
        document.getElementById("content").setAttribute("value",el.innerHTML);
        document.getElementById("content").value=el.innerHTML;
        console.log(document.getElementById("content").value);
        filterTable(document.getElementById("content"));
      }
      
      function filterContentList(el) {
        var contentList = document.getElementById("content-list");
        if (el.value==="") {
          filterTable(el);
          setTimeout(function() {contentList.style.display="none"},350)
        }
        var items = contentList.getElementsByTagName("LI");
        console.log("element value = "+el.value);
        for (var i=0; i<items.length; i++) {
          if (el.value==="" || items[i].innerHTML.toLowerCase().indexOf(el.value.toLowerCase())!==-1) {
            items[i].style.display="";
          } else if (items[i].innerHTML.toLowerCase().indexOf(el.value.toLowerCase())===-1) {
            items[i].style.display="none";
          }
        }
      }