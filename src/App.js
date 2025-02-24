import { useState, useEffect } from "react";

import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dayjsLocalizer(dayjs)


export default function App() {
  const [events, setEvents] = useState([]);



// const START_KEYS = ["Pickup_Date", "Embark_Date", "Start_Date", "Departure_Date", "Check_in_Date", "Trip_Start_Date"];
// const END_KEYS = ["End_Date", "Dropoff_Date", "Disembark_Date", "Return_Date", "Check_out_Date", "Trip_End_Date"]
// const TITLES = ["Reservation_Title", "Reservation"]
// function unpackData(resp) {
//    let start = null;
//    let end = null;
//    let title = null;
//    for(const key of START_KEYS) {
//       if(key in resp){
//         start = resp[key];
//         break;
//       }
//    }


//    for(const key of END_KEYS) {
//     if(key in resp){
//       end = resp[key];
//       break;
//     }
//  }

//  for(const key of TITLES) {
//   if(key in resp){
//     title = resp[key];
//     break;
//   }
// }

//   let res = {
//     title: title,
//     start: new Date(start),
//     end: new Date(end)
//   }

//   setEvents(...events, res)

// }



  var configs = [
    {
      app_name: "tpi-suitcase",
      report_name: "ADMIN_All_Reservations"  
    }, 
    // {
    //   app_name: "tpi-suitcase",
    //   report_name: "All_Reservation_Important_Dates",
    // },
    // {
    //   app_name: "tpi-suitcase",
    //   report_name: "Important_Dates_Report",
    // },
    // {
    //   app_name: "tpi-suitcase",
    //   report_name: "ADMIN_Reminders_Calendar",
    // },
    // {
    //   app_name: "tpi-suitcase",
    //   report_name: "All_Tasks_Reminders",
    // },
    // {
    //   app_name: "tpi-suitcase",
    //   report_name: "All_Tasks_Reminders",
    // }
    
  ]



  useEffect(() => {
    var config = {
      app_name: "tpi-suitcase",  
      report_name: "ADMIN_All_Reservations"  
  };

  // Using ZOHO.CREATOR.DATA.getRecords to fetch data
  ZOHO.CREATOR.DATA.getRecords(config).then(function(response) {
    
    if (response && response.data && response.data.length > 0) {
      const filteredData = response.data.map(({ Reservation_Title, Start_Date, End_Date }) => ({
          title: Reservation_Title,
          start: new Date(Start_Date), // Assuming you need start_date as "start"
          end: new Date(End_Date)      // Assuming you need end_date as "end"
      }));
  
      console.log('Filtered Records:', response.data);
      setEvents(filteredData); // Update state so calendar receives data
  }

  }).catch(function(error) {
      console.error('Error retrieving records:', error);
  });
   
}, []);


 const handleEventClick = (event) => {
    console.log("Event clicked:", event);

    // Open reservation details page (update URL as needed)
    window.open(`/reservations/${event.reservationId}`, "_blank");

    // OR: Open customer details (if needed)
    // window.open(`/customers/${event.customerId}`, "_blank");
 }

  
  return (
      <div className="Calendar">
          <Calendar
              localizer={localizer}
              defaultDate={new Date()}
              defaultView="month"
              events={events}
              style={{ height: "100vh" }}
              onSelectEvent={handleEventClick}
            
          />
      </div>
  );
}

