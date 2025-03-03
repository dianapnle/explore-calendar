import React from "react";
import { useState, useEffect } from "react";
import "./CalendarEvent.css"

const CalendarEvent = ({ event }) => {

  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    // const handleClick = (e) => {
    // e.preventDefault();
    // e.nativeEvent.stopImmediatePropagation();
    //   if (event.url) {
    //     window.open(event.url, "_blank", "noopener,noreferrer"); 
    //   }  else {
    //     console.warn("No URL found for this event:", event);
    // }

    // };
      // Handle clicking "Edit" to open URL
    const handleEditClick = () => {
          if (event.url) {
              window.open(event.url, "_blank", "noopener,noreferrer"); // Opens in new tab
          }
          setShowMenu(false); // Hide menu after clicking
      };

    // Handle right-click to show the menu
    const handleContextMenu = (e) => {
        e.preventDefault(); // Prevent default right-click behavior
        e.nativeEvent.stopImmediatePropagation();
        e.stopPropagation();
        console.log("Right-click detected at:", e.clientX, e.clientY);
  
        setMenuPosition({ x: e.pageX, y: e.pageY });
        // setShowMenu(true);
        setShowMenu((prev) => {

          return true;
        });

    };


    useEffect(() => {
      const handleClickOutside = () => {
          setShowMenu(false);
      };
      document.addEventListener("click", handleClickOutside);
      return () => {
          document.removeEventListener("click", handleClickOutside);
      };
    }, []);
  
    
    return (
      <div 
        onContextMenu={handleContextMenu}
        className="calendar-event"
        style={{
          cursor: "pointer", 
          textDecoration: "none",
          color: "white",
          display: "block",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          backgroundColor: "#3174ad", 
          padding: "5px",
          borderRadius: "5px",
        }}
        title={event.title} 
      >
        {event.title}
        {showMenu && (
                <div 
                    className="context-menu"
                    style={{
                        position: "fixed",
                        top: `${menuPosition.y}px`,
                        left: `${menuPosition.x}px`,
                        background: "#fff",
                        border: "1px solid #ccc",
                        borderRadius: "5px",
                        padding: "5px",
                        boxShadow: "2px 2px 5px rgba(0,0,0,0.2)",
                        zIndex: 9999
                    }}
                >
                    <button 
                        onClick={handleEditClick} 
                        style={{
                            background: "#3174ad",
                            color: "white",
                            border: "none",
                            padding: "5px",
                            cursor: "pointer",
                            width: "100%"
                        }}
                    >
                        Edit
                    </button>
                </div>
            )}
      </div>
    );
  };
  

export default CalendarEvent; 