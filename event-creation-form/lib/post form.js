function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }


function gettimezone() {
  var timeZone = Session.getScriptTimeZone();
  Logger.log(timeZone);
  Logger.log(new Date("Tue Jun 11 2019"));
  var formattedDate = Utilities.formatDate(new Date("Tue Jun 11 2019"), "GMT+4:00", "EEE MMM d yyyy");
  Logger.log(formattedDate);
}

function postForm(form,instance) {
  var prefix = boMap[instance].prefix;
  var ss = SpreadsheetApp.openById(props[prefix+"_database_id"]);
  var s = ss.getSheetByName("event creation form responses");
  var idSheet = ss.getSheetByName("ids");
  Logger.log(form);  
  /* 1) declare all necessary variables */
  var emailError;
  var calError;
  var numSessions = 0
  var allDates = [];
  var location = "";
  form.sessions.forEach(function(session) {
    if (session.date) {
      numSessions++;
      var formattedDate = Utilities.formatDate(new Date(session.date), "GMT+4:00", "EEE MMM d yyyy");
      allDates.push(formattedDate);
      if (location==="") {
        location=session.location;
      } else if (location!==session.location && location!=="Various Locations") {
        location = "Various Locations";
      }
    }
  });
  var allFacs = form.facilitators.filter(function(fac){return fac.name!==""}).map(function(fac) {return fac.name});
  var facEmails = form.facilitators.filter(function(fac){return fac.email!==""}).map(function(fac) {return fac.email});
  var eventCreator = Session.getActiveUser().getEmail();
  var startTime = new Date(2019,1, 1, Number(form.sessions[0].start_time.toString().slice(0,2)),Number(form.sessions[0].start_time.toString().slice(3,5)),0,0);
  var endTime = new Date(2019,1, 1, Number(form.sessions[0].end_time.toString().slice(0,2)),Number(form.sessions[0].end_time.toString().slice(3,5)),0,0);
  var duration = ((endTime-startTime)/(1000*60*60)).toFixed(1);
  var id = getId(form.division,idSheet,instance);
  var times = timeObj[form.sessions[0].start_time]+" - "+timeObj[form.sessions[0].end_time];
  times = times.replace(/:00 AM/g," AM").replace(/:00 PM/g," PM");
  var regForm = "https://script.google.com/a/strongschools.nyc/macros/s/AKfycbz13TA6TRLjXeWWS4UzoZp0Si7VH0DV8Qjhco5ZG2FHe2y7j-Y/exec?"+"id="+id+"&instance="+encodeURIComponent(instance);
  var editLink = "https://script.google.com/a/strongschools.nyc/macros/s/AKfycbyNuZDlNWQ-SOtdwZ3bXGFaLk0cg7WHVC9LCXUbOmOcCPxU1yiV/exec?id="+id+"&edit=facilitatoredit&instance="+encodeURIComponent(instance);
  var eventPage = "https://script.google.com/macros/s/AKfycbz4AthfjpkN8d_pttRsnKfYnsQp_Fal9N5O4tHpQX6Q-Hm58oo/exec?instance="+encodeURIComponent(instance)+"&id="+id
  var eventDataObj = {"title":form.title,"id":id,"location":location,"dates":allDates.join(", "),
                      "times":times,"start_time": form.sessions[0].start_time,
                      "description":form.description,"ctle":form.ctle,"facilitators":allFacs, "end_time": form.sessions[0].end_time,
                      "regUrl":regForm,"facEmails":facEmails,"otherInfo":form["other_info"],"public":form.public,
                      "waitlist":form.waitlist,"maxParticipants":form.max,"reg_text": "Click Here to Register",
                      "doc_structure":form.doc_structure,"duration": duration,"eventCreator": eventCreator,"edit_form":editLink}
  var flyerObj = createCustomRegFlyer(eventDataObj,false,instance); //the docId is false bc this flyer is being created for the first time
  eventDataObj["regFlyer"] = flyerObj.url;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  
  /* 2) Push variables to the Event Sheet in the correct order */
  //timestamp, creator, title, description, new, public, max
  var row = [new Date(),eventCreator,form.title,form.description,"new",form.public,form.max];
  //facilitators
  form.facilitators.forEach(function(fac) {row.push(fac.name); row.push(fac.email)});
  //audience, grade band, division, content area, start time, end time, location,allow non doe
  row.push(form.audience.join(", "),form["grade-level"],form.division,form.subject.join(", "),timeObj[form.sessions[0].start_time],timeObj[form.sessions[0].end_time],location,form["allow_non_doe"]);
  //dates 1 - 11
  form.sessions.forEach(function(session) {
    if (session.date) {
      var formattedDate = Utilities.formatDate(new Date(session.date), "GMT+4:00", "EEE MMM d yyyy");
      row.push(formattedDate)
    } else {
      row.push("")
    } 
  });
  //ctle, funding, resource folder, other info, display_audience, extra, framework, guskey, district, support, extra,waitlist, waitlist size, feedback schedule,extra,extra,extra,email reminder,extra x4
  row.push(form.ctle,form.funding,form.resource_folder,form.other_info,form.display_audience,"",form.framework.join(", "),form.guskey.join(", "),JSON.stringify(form.districts),form.support.join(", "),"",form.waitlist,form.wl_size,form.feedback,"","","","");
  //id,full title,reg url,duration,extra,event page,division,extra
  row.push(id,id+"-"+form.title,regForm,duration,"",eventPage,props[prefix+"_"+directorEmails[form.division]],"")
  //session objects 1-11
  form.sessions.forEach(function(session) {if (session!== "") {
      session.date=Utilities.formatDate(new Date(session.date), "GMT+4:00", "MM/dd/yyyy")
      row.push(JSON.stringify(session))
    } else {
      row.push("")
    }
  });
  //all dates, all facs, times, extra, edit link, extra, extra, flyer url, edit date, flyer id, flyer structure, extra, last date, extra,waitlis, num sessions,registrants,feedback received, archived, last reminder sent, attn track rate
  row.push(allDates.join(", "),allFacs.join(", "),times,
           "",editLink,"",flyerObj.url,new Date(),flyerObj.id,
           flyerObj.doc_structure,"",form.sessions[numSessions-1].date,
           form.feedback,"","=countifs('form registrations'!S:S,INDIRECT(\"R[0]C[-33]\",FALSE),'form registrations'!BL:BL,\"Waitlist\")",
           numSessions,"=countifs('form registrations'!S:S,INDIRECT(\"R[0]C[-35]\",FALSE),'form registrations'!BL:BL,\"<>Waitlist\",'form registrations'!BL:BL,\"<>excess\")",
           "=countif('Feedback Form Responses'!B:B,INDIRECT(\"R[0]C[-35]\",FALSE))",
           "","","=iferror(sumifs('form registrations'!BH:BH,'form registrations'!S:S,INDIRECT(\"R[0]C[-39]\",FALSE),'form registrations'!BL:BL,\"<>Waitlist\",'form registrations'!BL:BL,\"<>excess\")/(INDIRECT(\"R[0]C[-5]\",FALSE)*INDIRECT(\"R[0]C[-4]\",FALSE)),\"no registrants\")","");
    facEmails.push(eventCreator);
    saveUserPermissions(facEmails, instance);
  try {
    var calId = createCalendarEvent(eventDataObj,instance);
    row.push(calId);
  } catch(error) {calError=error; row.push(error);} finally {}
  try {
    sendConfirmation(eventDataObj,false,instance);
    row.push("sent");
  } catch(error) {
    emailError = error;
    row.push(error);
  } finally {}
  try {
    Logger.log("appending row");
    s.appendRow(row);
    if (!emailError && !calError) {
      return {"msg": "Your event was created successfully.",
              "reg_link": regForm, "edit_link":editLink, "reg_flyer": flyerObj.url, "event_page": "", "event_id": id};
    } else {
      if (calError && emailError) {
        MailApp.sendEmail(props[prefix+"_dm_email"], "Calendar error in event creation", Session.getActiveUser().getEmail()+" experienced the following error: "+calError+" when trying to add the event, "+form.title+" to your PL calendar.", {noReply: true});
        MailApp.sendEmail(props[prefix+"_dm_email"], "Email confirmation error in event creation", Session.getActiveUser().getEmail()+"experienced the following error: "+emailError+" when trying to add the event, "+form.title, {noReply: true});
        return {"msg": "Your event was created successfully. But the following errors occured:<br><br>(1) Couldn't create a calendar event. If you need to create one, email your data manager.<br>(2) Couldn't send an email confirmation: "+emailError,
                "reg_link": regForm, "edit_link":editLink, "reg_flyer": flyerObj.url, "event_page": "", "event_id": id};
      }
      if (calError && !emailError) {
        MailApp.sendEmail(props[prefix+"_dm_email"], "Calendar error in event creation", Session.getActiveUser().getEmail()+" experienced the following error: "+calError+" when trying to add the event, "+form.title+" to your PL calendar.", {noReply: true});
        return {"msg": "Your event was created successfully. But the following errors occured:<br><br>(1) Couldn't create a calendar event. If you need to create one, email your data manager.",
              "reg_link": regForm, "edit_link":editLink, "reg_flyer": flyerObj.url, "event_page": "", "event_id": id};
      }
      if (emailError && !calError) {
        MailApp.sendEmail(props[prefix+"_dm_email"], "Email confirmation error in event creation", Session.getActiveUser().getEmail()+" experienced the following error: "+emailError+" when trying to add the event, "+form.title, {noReply: true});
        return {"msg": "Your event was created successfully. But the following errors occured:<br><br>(1) Couldn't send an email confirmation: "+emailError,
              "reg_link": regForm, "edit_link":editLink, "reg_flyer": flyerObj.url, "event_page": "", "event_id": id};
      }
    }
  } catch(error) {return error;}
}

var saveUserPermissions = function saveUserPermissions(users, bco) {
  var ss = new Spreadsheet('1gnL2-wUXBJuGdh8wv1QhQyKsU8Jit4cO7_4m-FYlFDo');
  users.forEach(function (user) {
    var userRow = ss.matchRow('Sheet1', user, 0);
    if (!userRow) {
      ss.sheets.Sheet1.appendRow([user, bco]);
    }
  });
};


var Spreadsheet =
/*#__PURE__*/
function () {
  "use strict";

  function Spreadsheet(id, sheetNamesArray) {
    var _this = this;

    _classCallCheck(this, Spreadsheet);

    this.ss = SpreadsheetApp.openById(id);
    this.sheets = {};
    this.data = {};

    if (sheetNamesArray) {
      sheetNamesArray.forEach(function (sheetName) {
        _this.sheets[sheetName] = _this.ss.getSheetByName(sheetName);
        _this.data[sheetName] = _this.sheets[sheetName].getDataRange().getValues();
      });
    } else {
      this.ss.getSheets().forEach(function (sheet) {
        _this.sheets[sheet.getName()] = sheet;
        _this.data[sheet.getName()] = sheet.getDataRange().getValues();
      });
    }
  }

  _createClass(Spreadsheet, [{
    key: "matchRow",
    value: function matchRow(sheetName, criterion, columnIndex, callback) {
      for (var i = 0; i < this.data[sheetName].length; i++) {
        if (this.data[sheetName][i][columnIndex] === criterion) {
          if (callback) callback(Number(i) + 1);
          return {
            row_number: Number(i) + 1,
            row_data: this.data[sheetName][i]
          };
        }
      }
    }
  }, {
    key: "matchRows",
    value: function matchRows(sheetName, criterion, columnIndex, callback) {
      var rows = [];

      for (var i = this.data[sheetName].length - 1; i >= 1; i--) {
        if (this.data[sheetName][i][columnIndex] === criterion) {
          if (callback) callback(Number(i) + 1);
          rows.push({
            row_number: Number(i) + 1,
            row_data: this.data[sheetName][i]
          });
        }
      }

      return rows;
    }
  }]);

  return Spreadsheet;
}();
