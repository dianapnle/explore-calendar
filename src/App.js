import { useState, useEffect } from "react";
import CalendarEvent from "./CalendarEvent";
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./app-calendar.css"

const localizer = dayjsLocalizer(dayjs)


export default function App() {
  const [selectedView, setSelectedView] = useState("month");  // Default to "month" view
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [menuEventId, setMenuEventId] = useState(null); // Stores ID of the currently open menu
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [advisorEmail, setAdvisorEmail] = useState("");
  const [advisorId, setAdvisorId] = useState("");


//   async function testDates() {
//     let testDateCriteria = `Start_Date >= '05/01/2025'`;

//     let testFilteredRequest = {
//       app_name: "tpi-suitcase",
//       report_name: "All_Payment_Reminders",
//       field_config: "custom",
//       fields: "Reminder_Title,Payment_Due_Date",
//       criteria:"Reservation.Advisor==4200337000001100487",
//       max_records: 200
//   };

//     try {
//         let testFilteredResponse = await ZOHO.CREATOR.DATA.getRecords(testFilteredRequest);


//         if (testFilteredResponse && Array.isArray(testFilteredResponse.data) && testFilteredResponse.data.length > 0) {
//             console.log(`Testing Date Filter: ${testDateCriteria}`);
//             console.log(`Filtered Response:`, testFilteredResponse);
            

//             return testFilteredResponse.data;
//         } else {
//             console.error(`No test records found for ${testFilteredRequest.report_name}. Response:`, testFilteredResponse);
//             return [];
//         }
//     } catch (error) {
//         console.error(`Test API Request Failed for ${testFilteredRequest.report_name}:`, error);
//         return [];
//     }
// }

// testDates();


// async function getAllAdvisors() {
//   try {
//       let requestData = {
//           app_name: "tpi-suitcase",
//           report_name: "All_Advisors"
//       };

//       let response = await ZOHO.CREATOR.DATA.getRecords(requestData);
//       console.log("🔍 All Advisors Data:", response);
//   } catch (error) {
//       console.error("⚠️ Error fetching advisors:", error);
//   }
// }

// getAllAdvisors();


// async function because needs to wait for async API calls to fetch datain batches due to pagination

async function fetchRecordsFromReport(formName, fromDate, toDate) {
  let allRecords = [];
  let cursor = null; // tracks pagination
  const maxRecords = 200; // maximum allowed per API request



  //grab the email of logged user on zoho creator

  let emailId = await getEmail(); 
  setAdvisorEmail(emailId)
  if (!emailId) {
      console.error("Error: emailId is undefined. Cannot proceed with API calls.");
      return []; // Stop execution if emailId is not retrieved
  }

  //make API call to get the advisor ID associated to logged in user
  let advisorId = await getAdvisorIdByEmail(emailId);
  setAdvisorId(advisorId)

  console.log("Advisor Id", advisorId); 


   // Define the correct date fields for each report
   const startDateFields = {
      "All_Reservation_Important_Dates": "Start_Date",
    //   "All_Customer_Important_Dates": "Date_field",
      "All_Tasks": "Date_field",
    //   "All_Customer_Loyalty_Programs": "Card_Expiry",
    //   "All_Customer_Passport_Information": "Expiry_Date",
    //   "All_Customer_Trusted_Traveler_Programs": "Expiry_Date",
    //   "All_Customer_Driver_s_Licenses": "Expiry_Date"
    };

    const endDateFields = {
      "All_Reservation_Important_Dates": null,
    //   "All_Customer_Important_Dates": null,
      "All_Tasks": "Date_field",
    //   "All_Customer_Loyalty_Programs": null,
    //   "All_Customer_Passport_Information": null,
    //   "All_Customer_Trusted_Traveler_Programs": null,
    //   "All_Customer_Driver_s_Licenses": null
  };


    const advisorFields = {
      "All_Reservation_Important_Dates": null,
    //   "All_Customer_Important_Dates": "Primary_Advisor",
      "All_Tasks": "Advisor",
    //   "All_Customer_Passport_Information": "Advisor",
    //   "All_Customer_Loyalty_Programs": "Advisor",
    //   "All_Customer_Passport_Information": "Advisor",
    //   "All_Customer_Trusted_Traveler_Programs": "Advisor",
    //   "All_Customer_Driver_s_Licenses": "Advisor"
    }


  // for loop to fetch data in multiple requests until there are no more records left
  do {

    if (formName !== "All_Payment_Reminders") {
      if (!(formName in startDateFields)) {
        console.error(`startDateFields is missing a mapping for ${formName}`);
      }
      if (!(formName in endDateFields)) {
        console.error(`endDateFields is missing a mapping for ${formName}`);
      }
      if (!(formName in advisorFields)) {
        console.error(`advisorFields is missing a mapping for ${formName}`);
      }
  
      // Stop execution only if the formName is NOT All_Payment_Reminders
      if (
        startDateFields[formName] === undefined ||
        endDateFields[formName] === undefined ||
        advisorFields[formName] === undefined
      ) {
        console.error(`🚨 Missing field mapping for ${formName}. Skipping request.`);
        return [];
      }
    }


    let requestData;

    if (formName === "All_Payment_Reminders") {
      let paymentCriteria = `(Reservation.Advisor == 4200337000001100487 || Customer.Advisor == 4200337000001100487) 
        && (Payment_Due_Date >= '${fromDate}' && Payment_Due_Date <= '${toDate}')`;

      requestData = {
        app_name: "tpi-suitcase",
        report_name: formName,
        field_config: "custom",
        fields: "Reminder_Title,Payment_Due_Date",
        criteria: paymentCriteria,
        max_records: maxRecords,
      };
     } else {

    let dateCriteria = `${startDateFields[formName]} >= '${fromDate}'`;

    if (endDateFields[formName]) { 
        dateCriteria += ` && ${endDateFields[formName]} <= '${toDate}'`;
    }


    let advisorCriteria = advisorFields[formName] ? `&& ${advisorFields[formName]} == 4200337000001161005` : "";
    // let advisorCriteria = advisorFields[formName] ? `&& ${advisorFields[formName]} == ${advisorId}` : "";

    let criteria = `${dateCriteria} ${advisorCriteria}`.trim();


    // console.log(`Constructed criteria for ${formName}:`, criteria);

    requestData = {
        app_name: "tpi-suitcase",
        report_name: formName,
        criteria: criteria,
        max_records: maxRecords,
        ...(cursor && { record_cursor: cursor })
      }
    };

    let response = null;

    try {
      response = await ZOHO.CREATOR.DATA.getRecords(requestData);

      // console.log(`Checking available fields for ${formName}:`);
      // console.log(`Available Fields:`, response?.data?.length > 0 ? Object.keys(response.data[0]) : "No Data");

      if (!response || !response.data) {
          console.warn(`API Response is missing 'data' for ${formName}:`, response);
          break; // Exit loop if data is missing
      }

      if (!Array.isArray(response.data) || response.data.length === 0) {
          console.warn(`No records found for ${formName}.`);
          break; // Exit loop if no records
      }

      console.log(`Fetched ${response.data.length} records from ${formName}`);

      // Normalize date fields before returning
      let processedRecords = response.data.map(record => ({
          ...record,
          start: normalizeDateTime(record, formName, "start"),
          end: normalizeDateTime(record, formName, "end")
      }));

      allRecords = [...allRecords, ...processedRecords];
  } catch (error) {
      console.error(`API Request Failed for ${formName}:`, error);
      break; // Prevent further API calls if one fails
  }

    cursor = response?.record_cursor ?? null; // Update cursor for the next batch, if available

} while (cursor);

  // returns a promise that resolve when all records are fetched
  return allRecords;
}


//get logged in user's email
async function getEmail() {
  try {
      let response = await ZOHO.CREATOR.UTIL.getInitParams();
      if (!response || !response.loginUser) {
          throw new Error("getEmail() failed: loginUser is undefined");
      }
      console.log("Retrieved email:", response.loginUser); 
      return response.loginUser; 
  } catch (error) {
      console.error("Error fetching email:", error);
      return null; // Prevents crashing but ensures API calls wait
  }
}

//get the advisor ID from logged user's email
async function getAdvisorIdByEmail(email) {

  let emailString = String(email).trim();
  let criteria = `Email == "${emailString}"`;

  try {
      let requestData = {
          app_name: "tpi-suitcase",
          report_name: "All_Advisors", 
          criteria: criteria, 
      };


      let response = await ZOHO.CREATOR.DATA.getRecords(requestData);

      // console.log("Zoho Response in the advisor by email:", response); 

      if (response && response.data && response.data.length > 0) {
          console.log("Advisor Found:", response.data[0]);
          return response.data[0].ID; 
      } else {
          console.error(`No advisor found for email: ${email}`);
          return null;
      }
  } catch (error) {
      console.error("Error fetching Advisor ID:", error);
      return null;
  }
}


// Fetch records from multiple reports in parallel
async function fetchAllReportsData(fromDate, toDate) {
  const reportNames = [
      "All_Reservation_Important_Dates",
    //   "All_Customer_Important_Dates",
      "All_Tasks",
      "All_Payment_Reminders"
    //   "All_Customer_Loyalty_Programs",
    //   "All_Customer_Passport_Information",
    //   "All_Customer_Trusted_Traveler_Programs",
    //   // "All_Payment_Reminders",
    //   "All_Customer_Driver_s_Licenses"
  ];


  const formNameMappings = {
    "All_Reservation_Important_Dates": "Add_Reservation",
    // "All_Customer_Important_Dates": "Customer_Important_Dates",
    "All_Tasks": "Add_Tasks",
    "All_Payment_Reminders": "Payment_Reminders"
    // "All_Customer_Loyalty_Programs" : "Customer_Loyalty_Programs",
    // "All_Customer_Passport_Information" : "Customer_Passport_Information",
    // "All_Customer_Trusted_Traveler_Programs" : "Customer_Trusted_Traveler_Programs",
    // // "All_Payment_Reminders": "Payment_Reminders",
    // "All_Customer_Driver_s_Licenses" : "Customer_Driver_s_Licenses"
};

  try {
      const allData = await Promise.all(
          reportNames.map(async (report) => {
              try {
                  const records = await fetchRecordsFromReport(report, fromDate, toDate);


                  const originalReport = report; // Store original report name
                  let apiReportName = report; // Variable for API calls


                  // If no records are found, return an empty array instead of throwing an error
                  if (!records || records.length === 0) {
                      console.warn(`No records found for ${report}`);
                      return [];
                  }

                  return records.map(record => {
                      let startTime = record.Start_Time ? ` | ${record.Start_Time}` : "";
                      let endTime = record.End_Time ? ` - ${record.End_Time}` : "";
                      let timeDisplay = startTime || endTime ? `${startTime}${endTime}` : ""; 

                      let statusDisplay = (report === "All_Tasks" && record.Status) 
                      ? `[Status: ${record.Status}]` 
                      : "";

                    //   if (report === "All_Reservation_Important_Dates") {
                    //     console.log("🔍 Checking Reservation & Date_Type:", record);
                    //     title = record.Reservation && record.Date_Type 
                    //         ? `Reservation ID: ${record.Reservation.ID} ${record.Date_Type}`
                    //         : "No Title (Missing Data)";
                    // }


                    let customerName = record.Customer || "Unknown Customer";

                    // "All_Customer_Loyalty_Programs" and "All_Customer_Passport_Information"
                    let title = record.Reservation_Title || record.Title || null;

                  //   if (originalReport === "All_Payment_Reminders") {
                  //     console.log("🔍 Checking All_Payment_Reminders Record:", record);
                      
                  //     if (record["Reminder_Title"]) {
                  //         title = record["Reminder_Title"];
                  //     } else {
                  //         console.warn(`⚠️ Reminder_Title is missing for record ID: ${record.ID}`);
                  //     }
                  // }
                  
                    if (!title) {

                        if (originalReport === "All_Reservation_Important_Dates") {
                            // console.log(record.Reservation?.ID, record.Date_Type);
                            let reservationId = record.Reservation?.ID || "Unknown";
                            let dateType = record.Date_Type ? record.Date_Type : "Unknown Date Type"; 
                            title = `${dateType} - Reservation ID: ${reservationId}`;
                        } else if (originalReport === "All_Customer_Loyalty_Programs" && record["Card_Expiry"]) {
                            title = `${customerName}'s Loyalty Card Expiry Date`;
                        } else if (originalReport === "All_Customer_Passport_Information" && record["Expiry_Date"]) {
                            title = `${customerName}'s Passport Expiry Date`;
                        } else if (originalReport === "All_Customer_Trusted_Traveler_Programs" && record["Expiry_Date"]) {
                            title = `${customerName}'s Trusted Traveler Program Expiry Date`;
                        } else if (originalReport === "All_Customer_Driver_s_Licenses" && record["Expiry_Date"]) {
                            title = `${customerName}'s Driver's License Expiry Date`;
                        } else if (originalReport === "All_Tasks" && record.Title) {
                            title = `Task: ${record.Title} ${statusDisplay}`;
                        } else if (originalReport === "All_Payment_Reminders" && record["Reminder_Title"]) {
                          title = `${record.Reminder_Title} - ID: ${record.ID}`;
                        }
                    }

                    if (!title) {
                        title = `No Title (ID: ${record.ID || "Unknown"})`;
                    }

                    const recordId = (originalReport === "All_Reservation_Important_Dates" && record.Reservation?.ID) 
                    ? record.Reservation.ID  // Use Reservation.ID for reservations otherwise, use the record.ID
                    : record.ID;

                     let formName = formNameMappings[originalReport] || originalReport; // Fallback to report name if not mapped
                      if (report === "All_Reservation_Important_Dates") {
                            apiReportName = "ADMIN_All_Reservations";  // Override specifically for this case
                        }
                      const eventUrl = `https://creatorapp.zoho.com/travelplanners/tpi-suitcase#Form:${formName}?recLinkID=${recordId}&viewLinkName=${apiReportName}`;

                      
                      const result = {
                          title: `${title} ${timeDisplay} ${statusDisplay}`,
                          start: record.start,
                          end: record.end, 
                          ID: `${record.ID}||${report}`,
                          url: eventUrl 
                      };

                      return result;
                  });
              } catch (err) {
                  console.error(`Error fetching data from ${report}:`, err);
                  return []; 
              }
          })
      );

      return allData.flat(); 
  } catch (error) {
      console.error("Error fetching reports:", error);
      return [];
  }
}

const normalizeDateTime = (record, report_name, type) => {
  let dateField, timeField;

  switch (report_name) {
      case "All_Reservation_Important_Dates":
            dateField = record[`${type === "start" ? "Start_Date" : "Start_Date"}`];
            timeField = null; 
            break;

    //   case "All_Customer_Important_Dates":
    //       dateField = record["Date"];
    //       timeField = null; 
    //       break;

      case "All_Tasks":
          dateField = record[`${type === "start" ? "Date_field" : "Date_field"}`];
          timeField = record[`${type === "start" ? "Start_Time" : "End_Time"}`] || null
          break;

      case "All_Payment_Reminders":
          dateField = record["Payment_Due_Date"]; 
          timeField = null;
          break;

    //   case "All_Customer_Passport_Information":
    //       dateField = record["Expiry_Date"]; 
    //       timeField = null;
    //       break;

    //   case "All_Customer_Trusted_Traveler_Program":
    //       dateField = record["Expiry_Date"]; 
    //       timeField = null;
    //       break;

    //   case "All_Customer_Driver_s_Licenses":
    //       dateField = record["Expiry_Date"]; 
    //       timeField = null;
    //       break;

      default:
          console.warn(`Unknown report: ${report_name}`);
          return new Date();
  }


  if (!dateField) {
    console.error(`Missing date field for ${report_name} record:`, record);
    console.log(`Available Fields:`, Object.keys(record)); // Show all keys in record
    return null; // Return null if dateField is missing
}

  // If time is missing, default to "00:00 AM" (midnight)
  timeField = timeField || "00:00 AM";

  // Format and convert to Date object
  let formattedDate = dayjs(`${dateField} ${timeField}`, "MM/DD/YYYY hh:mm A").toDate();

  if (isNaN(formattedDate.getTime())) {
      console.error(`Invalid Date Parsed for ${report_name}:`, { dateField, timeField });
      return null;
  }

  return formattedDate;

};



// load and update calendar events based on user navigation of month
const loadCalendarData = async (date) => {

  const fromDate = dayjs(date).startOf("month").format("MM/DD/YYYY"); // e.g., "02/01/2025"
  const toDate = dayjs(date).endOf("month").format("MM/DD/YYYY"); // e.g., "02/28/2025"


  
  // await ensures all data is fetched
  let records = await fetchAllReportsData(
      fromDate,
      toDate
  );

  // console.log("Fetched records:", records)

  // maps the fetched records into an event format for react-big-calendar
  setEvents(records.map(record => ({
      title: record.title ? record.title : `No Title (ID: ${record.ID})`,
      start: record.start,
      end: record.end,
      id: record.ID,
      url: record.url 
  })));
};

// ensures data is loaded when component mounts
useEffect(() => {
  loadCalendarData(new Date());
}, []);


//  **Handle right-click event**
const handleRightClick = (e, eventId) => {
  e.preventDefault();
  e.stopPropagation();

  if (menuEventId === eventId) {
    setMenuEventId(null); // Close if clicking the same event again
  } else {
    setMenuEventId(eventId);
    setMenuPosition({ x: e.pageX, y: e.pageY });
  }
};

// **Close menu when clicking anywhere else**
const handleCloseMenu = () => {
  setMenuEventId(null);
};


  //https://creatorapp.zoho.com/travelplanners/tpi-suitcase#Form:<form_name>?recLinkID=<customer_id>&viewLinkName=<report_name>
  //https://creatorapp.zoho.com/travelplanners/tpi-suitcase#Form:Add_Tasks_Reminders?recLinkID=4200337000125932003&viewLinkName=All_Tasks_Reminders
  //https://creatorapp.zoho.com/travelplanners/tpi-suitcase#Form:Reservation_Important_Dates?recLinkID=4200337000083859661&viewLinkName=All_Reservation_Important_Dates
  //https://creatorapp.zoho.com/travelplanners/tpi-suitcase#Form:Customer_Important_Dates?recLinkID=4200337000125932003&viewLinkName=All_Customer_Important_Dates
  //https://creatorapp.zoho.com/travelplanners/tpi-suitcase#Form:Add_Reservation?recLinkID=4200337000083859661&viewLinkName=ADMIN_All_Reservations




const eventStyleGetter = (event, start, end, isSelected) => {
  let backgroundColor = "#81D4F4"; // Default blue color

  let reportName = event.id?.split("||")[1] || "Unknown Report";


  switch (reportName) {
      case "All_Reservation_Important_Dates":
          backgroundColor = "#f57c00"; // Orange
          break;
      case "All_Payment_Reminders":
          backgroundColor = "#388e3c"; // Green
          break;
      case "All_Tasks":
          backgroundColor = "#3174ad"; // Dark blue
          break;
      // case "EQUIPMENT_Reservations":
      //     backgroundColor = "#d32f2f"; // Red
      //     break;
      // case "EVENT_Schedules":
      //     backgroundColor = "#7b1fa2"; // Purple
      //     break;
      // case "HOTEL_RoomBookings":
      //     backgroundColor = "#c2185b"; // Pink
      //     break;
      // case "TRANSPORT_Requests":
      //     backgroundColor = "#00796b"; // Teal
      //     break;
      // case "MEETING_Rooms":
      //     backgroundColor = "#ff9800"; // Amber
      //     break;
      // default:
      //     backgroundColor = "#616161"; // Default gray
  }

  return {
      style: {
          backgroundColor: backgroundColor,
          color: "white",
          borderRadius: "5px",
          border: "none",
          padding: "5px",
          overflow: "hidden", // Prevents text from overflowing
          whiteSpace: "nowrap", // Prevents breaking text
          textOverflow: "ellipsis", // Adds "..." if text is too long
          maxWidth: "100%",
          opacity: 0.7
      },
      report_name: reportName
  };
};



return (
  <div className="Calendar">
      <div className="advisor-info">
        <h5>Welcome <span>{advisorEmail || "Loading..."}</span> </h5>
        <h5>(Advisor ID: <span>{advisorId || "Loading..."})</span></h5>
      </div>
    
    <Calendar
      localizer={localizer}
      defaultDate={new Date()}
      defaultView="month"
      events={events}
      style={{ height: "100vh" }}
      popup={true} // enables popup for extra events
      showMultiDayTimes={true}
      onNavigate={(date) => {
        setCurrentDate(date);
        loadCalendarData(date);
      }}
      eventPropGetter={eventStyleGetter}
      onShowMore={(events, date) => {
        console.log(`Navigating to day view for ${date}`);
        setSelectedView("day"); // switch to "day" view
        setCurrentDate(date); // update date
      }}
      view={selectedView} 
      date={currentDate} 
      onView={(view) => setSelectedView(view)}
      components={{
        event: (props) =>
          props.event ? (
            <CalendarEvent
              {...props}
              onRightClick={handleRightClick}
              isActive={menuEventId === props.event.id}
              menuPosition={menuPosition}
              onClose={handleCloseMenu}
            />
          ) : null,
      }}
    />
  </div>
);

}

