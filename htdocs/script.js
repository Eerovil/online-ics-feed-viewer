const mapping = {
  dtstart: "start",
  dtend: "end",
  summary: "title",
};

const value_type_mapping = {
  "date-time": (input) => {
    if (input.substr(-3) === "T::") {
      return input.substr(0, input.length - 3);
    }
    return input;
  },
};

function load_ics(ics_data) {
  const parsed = ICAL.parse(ics_data);
  const events = parsed[2].map(([type, event_fields]) => {
    if (type !== "vevent") return;
    return event_fields.reduce((event, field) => {
      const [original_key, _, type, original_value] = field;
      const key =
        original_key in mapping ? mapping[original_key] : original_key;
      const value =
        type in value_type_mapping
          ? value_type_mapping[type](original_value)
          : original_value;
      event[key] = value;
      return event;
    }, {});
  });
  $("#calendar").fullCalendar("removeEventSources");
  $("#calendar").fullCalendar("addEventSource", events);
}

function fetch_ics_feed(url) {
  $.get(url, (res) => load_ics(res));
}

$(document).ready(function () {
  $("#calendar").fullCalendar({
    header: {
      left: "prev,next today",
      center: "title",
      right: "month,agendaWeek,agendaDay,listMonth",
    },
    navLinks: true,
    editable: false,
    minTime: "0:00:00",
    maxTime: "24:00:00",
    firstDay: 1,
    nowIndicator: true,
    slotLabelFormat: "HH:mm",
    eventTimeFormat: "HH:mm",
  });
  const url_feed = URIHash.get("feed");
  const url_title = URIHash.get("title");
  console.log({
    url_feed,
    url_title,
  });
  if (url_title) {
    $("h1").text(url_title);
  }
  if (url_feed) {
    url = url_feed;
    console.log(`Load ${url}`);
    $("#share input")[0].checked = true;
    fetch_ics_feed(url);
    $("#eventsource").val(url);
  }
  $("#fetch").click(function () {
    const url = $("#eventsource").val();
    fetch_ics_feed(url);
  });
  let match,
  pl = /\+/g,  // Regex for replacing addition symbol with a space
  search = /([^&=]+)=?([^&]*)/g,
  decode = function (s) {
      return decodeURIComponent(s.replace(pl, " "));
  },
  query = window.location.search.substring(1),
  urlParams = {};

  while (match = search.exec(query)) {
    if (decode(match[1]) in urlParams) {
        if (!Array.isArray(urlParams[decode(match[1])])) {
            urlParams[decode(match[1])] = [urlParams[decode(match[1])]];
        }
        urlParams[decode(match[1])].push(decode(match[2]));
    } else {
        urlParams[decode(match[1])] = decode(match[2]);
    }
  }
  const ics_list = Array.isArray(urlParams.ics) ? urlParams.ics : [urlParams.ics];
  console.log('ics_list: ', ics_list);
  for (let url of ics_list || []) {
    fetch_ics_feed(url);
  }
});
