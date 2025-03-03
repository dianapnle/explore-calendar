import { useState, useEffect } from "react";
import CalendarEvent from "./CalendarEvent";
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./app-calendar.css"

const localizer = dayjsLocalizer(dayjs)


export default function App() {
  const [events, setEvents] = useState([]);



//   async function testDates() {
//     let testDateCriteria = `Start_Date >= '05/01/2025'`;

//     let testFilteredRequest = {
//         app_name: "tpi-suitcase",
//         report_name: "All_Reservation_Important_Dates",
//         criteria: testDateCriteria,
//         max_records: 5
//     };

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



// async function because needs to wait for async API calls to fetch datain batches due to pagination

async function fetchRecordsFromReport(formName, fromDate, toDate) {
  let allRecords = [];
  let cursor = null; // tracks pagination
  const maxRecords = 200; // maximum allowed per API request


   // Define the correct date fields for each report
   const startDateFields = {
      "All_Reservation_Important_Dates": "Start_Date",
    //   "All_Customer_Important_Dates": "Date_field",
      "All_Tasks_Reminders": "Date_field",
    //   "All_Customer_Loyalty_Programs": "Card_Expiry",
    //   "All_Customer_Passport_Information": "Expiry_Date",
    //   "All_Customer_Trusted_Traveler_Programs": "Expiry_Date",
    //   "All_Customer_Driver_s_Licenses": "Expiry_Date"
    };

    const endDateFields = {
      "All_Reservation_Important_Dates": null,
    //   "All_Customer_Important_Dates": null,
      "All_Tasks_Reminders": "Date_field",
    //   "All_Customer_Loyalty_Programs": null,
    //   "All_Customer_Passport_Information": null,
    //   "All_Customer_Trusted_Traveler_Programs": null,
    //   "All_Customer_Driver_s_Licenses": null
  };


    const advisorFields = {
      "All_Reservation_Important_Dates": null,
    //   "All_Customer_Important_Dates": "Primary_Advisor",
      "All_Tasks_Reminders": "Advisor",
    //   "All_Customer_Passport_Information": "Advisor",
    //   "All_Customer_Loyalty_Programs": "Advisor",
    //   "All_Customer_Passport_Information": "Advisor",
    //   "All_Customer_Trusted_Traveler_Programs": "Advisor",
    //   "All_Customer_Driver_s_Licenses": "Advisor"
    }


  // for loop to fetch data in multiple requests until there are no more records left
  do {

    if (!(formName in startDateFields)) {
      console.error(`startDateFields is missing a mapping for ${formName}`);
    }
    if (!(formName in endDateFields)) {
        console.error(`endDateFields is missing a mapping for ${formName}`);
    }
    if (!(formName in advisorFields)) {
        console.error(`advisorFields is missing a mapping for ${formName}`);
    }
    
    // Stop execution only if one of them is truly undefined
    if (
        startDateFields[formName] === undefined ||
        endDateFields[formName] === undefined ||
        advisorFields[formName] === undefined
    ) {
        console.error(`Missing field mapping for ${formName}. Check startDateFields, endDateFields, and advisorFields.`);
        return [];
    }


    //IDS: 4200337000001161005 for all_tasks_reminders
    //IDS: 4200337000001094383 for ?

    let dateCriteria = `${startDateFields[formName]} >= '${fromDate}'`;

    if (endDateFields[formName]) { 
        dateCriteria += ` && ${endDateFields[formName]} <= '${toDate}'`;
    }

    let advisorCriteria = advisorFields[formName] ? `&& ${advisorFields[formName]} == 4200337000001161005` : "";


    let criteria = `${dateCriteria} ${advisorCriteria}`.trim();


    // console.log(`Constructed criteria for ${formName}:`, criteria);

    let requestData = {
        app_name: "tpi-suitcase",
        report_name: formName,
        criteria: criteria,
        max_records: maxRecords,
        ...(cursor && { record_cursor: cursor })
    };

    let response = null;

    try {
      response = await ZOHO.CREATOR.DATA.getRecords(requestData);

      console.log(`Checking available fields for ${formName}:`);
      console.log(`Available Fields:`, response?.data?.length > 0 ? Object.keys(response.data[0]) : "No Data");

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



// Fetch records from multiple reports in parallel
async function fetchAllReportsData(fromDate, toDate) {
  const reportNames = [
      "All_Reservation_Important_Dates",
    //   "All_Customer_Important_Dates",
      "All_Tasks_Reminders",
    //   "All_Customer_Loyalty_Programs",
    //   "All_Customer_Passport_Information",
    //   "All_Customer_Trusted_Traveler_Programs",
    //   // "All_Payment_Reminders",
    //   "All_Customer_Driver_s_Licenses"
  ];


  const formNameMappings = {
    "All_Reservation_Important_Dates": "Add_Reservation",
    // "All_Customer_Important_Dates": "Customer_Important_Dates",
    "All_Tasks_Reminders": "Add_Tasks_Reminders",
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

                      let statusDisplay = (report === "All_Tasks_Reminders" && record.Status) 
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


                    if (!title) {

                        if (originalReport === "All_Reservation_Important_Dates") {
                            console.log(record.Reservation?.ID, record.Date_Type);
                            let reservationId = record.Reservation?.ID || "Unknown";
                            let dateType = record.Date_Type ? record.Date_Type : "Unknown Date Type"; 
                            title = `Reservation ID: ${reservationId} - ${dateType}`;
                        } else if (originalReport === "All_Customer_Loyalty_Programs" && record["Card_Expiry"]) {
                            title = `${customerName}'s Loyalty Card Expiry Date`;
                        } else if (originalReport === "All_Customer_Passport_Information" && record["Expiry_Date"]) {
                            title = `${customerName}'s Passport Expiry Date`;
                        } else if (originalReport === "All_Customer_Trusted_Traveler_Programs" && record["Expiry_Date"]) {
                            title = `${customerName}'s Trusted Traveler Program Expiry Date`;
                        } else if (originalReport === "All_Customer_Driver_s_Licenses" && record["Expiry_Date"]) {
                            title = `${customerName}'s Driver's License Expiry Date`;
                        } else if (originalReport === "All_Tasks_Reminders" && record.Title) {
                            title = `Task: ${record.Title} ${statusDisplay}`;
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

                      
                      return {
                          title: `${title} ${timeDisplay} ${statusDisplay}`,
                          start: record.start,
                          end: record.end, 
                          ID: record.ID,
                          report_name: report,
                          url: eventUrl 
                      };
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

      case "All_Tasks_Reminders":
          dateField = record[`${type === "start" ? "Date_field" : "Date_field"}`];
          timeField = record[`${type === "start" ? "Start_Time" : "End_Time"}`] || null
          break;

    //   case "All_Customer_Loyalty_Programs":
    //       dateField = record["Card_Expiry"]; 
    //       timeField = null;
    //       break;

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

  console.log("Fetched records:", records)

  // maps the fetched records into an event format for react-big-calendar
  setEvents(records.map(record => ({
        title: record.title ? record.title : `No Title (ID: ${record.ID})`,
      start: record.start,
      end: record.end,
      reservationId: record.ID,
      url: record.url 
  })));
};

// ensures data is loaded when component mounts
useEffect(() => {
  loadCalendarData(new Date());
}, []);

  //https://creatorapp.zoho.com/travelplanners/tpi-suitcase#Form:<form_name>?recLinkID=<customer_id>&viewLinkName=<report_name>
  //https://creatorapp.zoho.com/travelplanners/tpi-suitcase#Form:Add_Tasks_Reminders?recLinkID=4200337000125932003&viewLinkName=All_Tasks_Reminders
  //https://creatorapp.zoho.com/travelplanners/tpi-suitcase#Form:Reservation_Important_Dates?recLinkID=4200337000083859661&viewLinkName=All_Reservation_Important_Dates
  //https://creatorapp.zoho.com/travelplanners/tpi-suitcase#Form:Customer_Important_Dates?recLinkID=4200337000125932003&viewLinkName=All_Customer_Important_Dates
  //https://creatorapp.zoho.com/travelplanners/tpi-suitcase#Form:Add_Reservation?recLinkID=4200337000083859661&viewLinkName=ADMIN_All_Reservations

const eventStyleGetter = (event, start, end, isSelected) => {
  let backgroundColor = "#81D4F4"; // Default blue color

  switch (event.reportName) {
      case "All_Reservation_Important_Dates":
          backgroundColor = "#f57c00"; // Orange
          break;
      case "All_Customer_Important_Dates":
          backgroundColor = "#388e3c"; // Green
          break;
      case "All_Tasks_Reminders":
          backgroundColor = "#81D4F4"; // Dark blue
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
          backgroundColor: backgroundColor + "! important",
          color: "white",
          borderRadius: "5px",
          border: "none",
          padding: "5px",
          overflow: "hidden", // Prevents text from overflowing
          whiteSpace: "nowrap", // Prevents breaking text
          textOverflow: "ellipsis", // Adds "..." if text is too long
          maxWidth: "100%",
          opacity: 0.7
      }
  };
};


  return (
    <div className="Calendar">
        <Calendar
            localizer={localizer}
            defaultDate={new Date()}
            defaultView="month"
            events={events}
            style={{ height: "100vh" }}
            onNavigate={(date) => loadCalendarData(date)} // fetch data on month change
            eventPropGetter={eventStyleGetter} 
            components={{
              event: CalendarEvent 
            }}
        />
    </div>
);
}

