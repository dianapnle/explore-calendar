import React from "react";
import "./CalendarEvent.css";

const CalendarEvent = ({ event, onRightClick, isActive, menuPosition, onClose }) => {
  // console.log("Event received by CalendarEvent:", event);

  // let reportName = event.id?.split("||")[1] || "Unknown Report";

  // Handle clicking "Edit" to open URL
  const handleEditClick = () => {
    if (event.url) {
      window.open(event.url, "_blank", "noopener,noreferrer");
    }
    onClose(); // Close menu after clicking
  };

  return (
    <div
      onContextMenu={(e) => onRightClick(e, event.id)}
      className="calendar-event"
      title={event.title}
    >
      {event.title}

      {isActive && (
        <div
          className="context-menu show"
          style={{ top: `${menuPosition.y}px`, left: `${menuPosition.x}px`, position: "fixed" }}
        >
          <button onClick={handleEditClick}>Edit</button>
        </div>
      )}
    </div>
  );
};

export default CalendarEvent;



